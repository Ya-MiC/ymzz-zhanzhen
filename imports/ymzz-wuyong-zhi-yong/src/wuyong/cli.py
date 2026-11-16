"""CLI：python -m wuyong <subcommand> [options]

零第三方依賴（只用 argparse/tomllib/urllib/pathlib）；Node 只為 npx skills。
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path

from . import __version__, __display_name__, __author__
from .config import Config, load_config, ensure_state_dirs, find_project_root
from .registry.local_index import LocalIndex, sha256_file
from .registry.harvest import list_scripts
from .pool import Pool
from .monitor import skills_sh
from .router import route_event
from .installer import verify_core, ensure_core, build_add_cmd, install_skill, find_skill_md
from .sources import inline_src, stdin_src, jsonl_tail
from .daemon import run_watch, run_monitor_once, build_router_context


def _print(obj) -> None:
    print(json.dumps(obj, ensure_ascii=False, indent=2), flush=True)


def _load_context(cfg: Config, dry_run: bool = True):
    index = LocalIndex(cfg.index_path, roots_provider=lambda: cfg.local_skill_roots())
    pool = Pool(cfg)
    npx_available = bool(shutil.which(cfg.installer.node_cmd) or
                         shutil.which(f"{cfg.installer.node_cmd}.cmd"))
    token = os.environ.get("VERCEL_OIDC_TOKEN", "").strip() or None
    return index, pool, npx_available, token


# ----------------------------- subcommands -----------------------------

def cmd_doctor(args: argparse.Namespace, cfg: Config) -> int:
    """檢查 Python / Node / npx / 網路 / 目錄權限 / 核心 skill 狀態。"""
    report = {
        "project": str(cfg.root),
        "python": sys.version.split()[0],
        "python_ok": sys.version_info >= (3, 11),
        "node_cmd": cfg.installer.node_cmd,
        "node_found": bool(shutil.which(cfg.installer.node_cmd) or
                           shutil.which(f"{cfg.installer.node_cmd}.cmd")),
        "npx_add_sample": build_add_cmd(cfg, "https://github.com/vercel-labs/skills",
                                        "find-skills"),
        "token_present": bool(os.environ.get("VERCEL_OIDC_TOKEN", "").strip()),
        "state_dir": str(cfg.state_dir),
        "state_writable": False,
        "core_skills": {},
        "checks": [],
    }
    state = cfg.state_dir
    try:
        state.mkdir(parents=True, exist_ok=True)
        probe = state / ".doctor_probe"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
        report["state_writable"] = True
    except OSError as exc:
        report["checks"].append(f"state_dir not writable: {exc}")

    # 網路（只探 HEAD / 短超時，不抓內容）
    try:
        import urllib.request
        req = urllib.request.Request("https://skills.sh/", headers={"User-Agent": "wuyong/doctor"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            report["network_ok"] = resp.status < 400
    except Exception as exc:
        report["network_ok"] = False
        report["network_error"] = str(exc)[:120]

    try:
        lock_path = cfg.core_lock_path
        lock = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.is_file() else {}
        report["core_skills"] = verify_core(cfg, lock)
    except Exception as exc:
        report["checks"].append(f"core lock check failed: {exc}")
    _print(report)
    return 0 if report["state_writable"] else 1


def cmd_bootstrap(args: argparse.Namespace, cfg: Config) -> int:
    """初始化 state、安裝 find-skills、首次 monitor（冪等）。"""
    ensure_state_dirs(cfg)
    ensure_state_dirs(cfg)  # 再跑一次證明冪等
    (cfg.skills_local_made_dir / ".gitkeep").parent.mkdir(parents=True, exist_ok=True)
    gk = cfg.skills_local_made_dir / ".gitkeep"
    if not gk.exists():
        gk.write_text("", encoding="utf-8")

    lock_path = cfg.core_lock_path
    lock = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.is_file() else {"skills": []}

    state_path = cfg.bootstrap_state_path
    already = {}
    if state_path.is_file():
        try:
            already = json.loads(state_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            already = {}

    npx_ok = bool(shutil.which(cfg.installer.node_cmd) or
                  shutil.which(f"{cfg.installer.node_cmd}.cmd"))
    token = os.environ.get("VERCEL_OIDC_TOKEN", "").strip() or None

    result: dict = {
        "state_dirs_created": [str(p) for p in ensure_state_dirs(cfg)],
        "node_found": npx_ok,
        "core": {},
        "monitor": None,
        "degraded": [],
    }

    for sk in lock.get("skills", []):
        name = sk["name"]
        md = find_skill_md(cfg.root, name)
        if md is not None:
            result["core"][name] = {"state": "already_installed", "path": str(md)}
            result["actions_taken"] = result.get("actions_taken", [])
            result["actions_taken"].append(f"skip {name} (already installed)")
            continue
        if not npx_ok:
            result["core"][name] = {"state": "degraded",
                                    "reason": "缺少 npx / Node.js，無法安裝；bootstrap 完成後會自動重試"}
            result["degraded"].append(name)
            continue
        res = install_skill(cfg, sk["package_url"], name, dry_run=False)
        if res.get("ok"):
            result["core"][name] = {"state": "installed_now", "path": res.get("path")}
        else:
            result["core"][name] = {"state": "degraded", "reason": res.get("reason")}
            result["degraded"].append(name)

    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    # 首次 monitor（--once，沒有 token 會自動降級到 HTML；HTML 失敗再快照）
    try:
        summary = run_monitor_once(cfg, fixture_html=None, check_hash=False)
        result["monitor"] = summary
    except Exception as exc:
        result["monitor"] = {"error": str(exc)[:200]}

    _print(result)
    return 0 if not result["degraded"] else 0  # degraded 不是失敗，退碼 0 讓後續可重試


def cmd_monitor(args: argparse.Namespace, cfg: Config) -> int:
    ensure_state_dirs(cfg)
    if getattr(args, "daemon", False):
        from .daemon import cmd_daemon_monitor
        return cmd_daemon_monitor(args, cfg)
    fixture_html = None
    if args.fixture:
        fixture_html = Path(args.fixture).read_text(encoding="utf-8")
    summary = run_monitor_once(cfg, fixture_html=fixture_html,
                               check_hash=args.check_hash)
    _print(summary)
    return 0


def cmd_daemon_monitor(args: argparse.Namespace, cfg: Config) -> int:
    ensure_state_dirs(cfg)
    interval = args.interval or cfg.monitor.interval_seconds
    print(f"[wuyong] monitor daemon 啟動：interval={interval}s (Ctrl+C 停止)", flush=True)
    try:
        while True:
            try:
                summary = run_monitor_once(cfg)
                print("[wuyong] sync", json.dumps(summary, ensure_ascii=False), flush=True)
            except Exception as exc:
                print(f"[wuyong] sync 失敗：{exc}", flush=True)
            jitter = interval * cfg.monitor.jitter_ratio
            time.sleep(interval + random.uniform(-jitter, jitter))
    except KeyboardInterrupt:
        print("[wuyong] 已停止", flush=True)
        return 0


def cmd_pool(args: argparse.Namespace, cfg: Config) -> int:
    index, pool, npx_available, token = _load_context(cfg)
    if args.pool_op == "list":
        _print({"pool": pool.list(include_below=True), "count": len(pool.entries)})
    elif args.pool_op == "show":
        e = pool.get(args.id)
        if not e:
            print(json.dumps({"error": f"pool 不存在 id={args.id}"}, ensure_ascii=False))
            return 1
        _print(e)
    elif args.pool_op == "sync":
        entries, meta = skills_sh.collect(cfg, token=token)
        summary = pool.sync(entries, token=token)
        summary["leaderboard_meta"] = meta
        summary["leaderboard_count"] = len(entries)
        pool.save()
        skills_sh.save_snapshot(cfg, entries, meta)
        _print(summary)
    return 0


def cmd_local(args: argparse.Namespace, cfg: Config) -> int:
    index = LocalIndex(cfg.index_path, roots_provider=lambda: cfg.local_skill_roots())
    if args.local_op == "list":
        _print({"index": index.all(), "count": len(index.entries)})
    elif args.local_op == "search":
        hits = index.search(args.q, min_score=cfg.router.local_min_score, top_k=10)
        _print({"query": args.q,
                "results": [{"id": e["id"], "name": e.get("name"), "path": e.get("path"),
                             "score": s, "origin": e.get("origin")} for e, s in hits]})
    elif args.local_op == "harvest":
        regs = index.scan_roots(conversation_id="harvest-cli")
        index.save()
        _print({"registered": regs, "count": len(regs)})
    elif args.local_op == "register":
        md_path = Path(args.path)
        conv = args.conversation or "register-cli"
        entry = index.register_file_path(md_path, conversation_id=conv, origin="external")
        index.save()
        if entry:
            _print({"registered": entry})
        else:
            print(json.dumps({"error": f"{args.path} 不是含 SKILL.md 的 skill 目錄"},
                             ensure_ascii=False))
            return 1
    return 0


def cmd_hint(args: argparse.Namespace, cfg: Config) -> int:
    """雙通道判別 + 路由，輸出 Decision JSON。"""
    index, pool, npx_available, token = _load_context(cfg)
    evt = inline_src.build_event(args.text, args.thinking,
                                 conversation_id=args.conversation or "inline",
                                 turn_id="1")
    dec = route_event(evt, cfg, pool=pool, index=index,
                      npx_available=npx_available, token=token,
                      mode=args.mode or cfg.mode, dry_run=args.dry_run)
    _print(dec)
    return 0


def cmd_watch(args: argparse.Namespace, cfg: Config) -> int:
    source = "stdin" if not args.file else "file"
    run_watch(cfg, source=source, file_path=args.file,
              dry_run=args.dry_run, mode=args.mode or cfg.mode)
    return 0


def cmd_uninstall(args: argparse.Namespace, cfg: Config) -> int:
    """乾淨卸載：只移除 lock 記錄過的東西；state/ 不動（使用者資料）。"""
    lock_path = cfg.core_lock_path
    lock = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.is_file() else {"skills": []}
    removed = []
    for sk in lock.get("skills", []):
        md = find_skill_md(cfg.root, sk["name"])
        if md is not None:
            # 只移除技能檔案（不亂刪使用者的 .agents / .claude 等）
            p = Path(md)
            if p.exists():
                p.unlink()
                removed.append(str(p))
    _print({"removed": removed, "note": "state/ 與 skills/local-made/ 未動，請自行決定是否保留。"})
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="wuyong", description=__display_name__)
    p.add_argument("--version", action="version", version=f"{__display_name__} {__version__}")
    sub = p.add_subparsers(dest="command", required=True)

    def add_common(sp):
        sp.add_argument("--root", default=None, help="專案根目錄（預設自動偵測）")

    sp = sub.add_parser("doctor", help="檢查環境與核心 skill 狀態")
    add_common(sp); sp.set_defaults(func=cmd_doctor)

    sp = sub.add_parser("bootstrap", help="初始化 state、安裝 find-skills、首次 monitor（冪等）")
    add_common(sp); sp.set_defaults(func=cmd_bootstrap)

    sp = sub.add_parser("monitor", help="技能池同步：--once 單次 / --daemon 常駐")
    add_common(sp)
    sp.add_argument("--once", action="store_true")
    sp.add_argument("--daemon", action="store_true")
    sp.add_argument("--interval", type=int, default=None)
    sp.add_argument("--fixture", default=None, help="使用 HTML fixture 測試解析器（不聯網）")
    sp.add_argument("--check-hash", action="store_true",
                    help="同步時抓 detail API hash（需 token）")
    sp.set_defaults(func=cmd_monitor)

    sp = sub.add_parser("pool", help="默認池操作")
    add_common(sp)
    sp.add_argument("pool_op", choices=["list", "show", "sync"])
    sp.add_argument("id", nargs="?")
    sp.set_defaults(func=cmd_pool)

    sp = sub.add_parser("local", help="本地索引操作")
    add_common(sp)
    sp.add_argument("local_op", choices=["list", "search", "harvest", "register"])
    sp.add_argument("q", nargs="?")
    sp.add_argument("path", nargs="?")
    sp.add_argument("--conversation", default=None)
    sp.set_defaults(func=cmd_local)

    sp = sub.add_parser("hint", help="單條事件決策 → Decision JSON")
    add_common(sp)
    sp.add_argument("--text", required=True)
    sp.add_argument("--thinking", default=None)
    sp.add_argument("--conversation", default="inline")
    sp.add_argument("--mode", choices=["observe", "advise", "act"], default=None)
    sp.add_argument("--dry-run", action="store_true", default=True)
    sp.set_defaults(func=cmd_hint)

    sp = sub.add_parser("watch", help="常駐：從 stdin 或 JSONL 檔逐條輸出 Decision")
    add_common(sp)
    sp.add_argument("--file", default=None)
    sp.add_argument("--mode", choices=["observe", "advise", "act"], default=None)
    sp.add_argument("--dry-run", action="store_true", default=True)
    sp.set_defaults(func=cmd_watch)

    sp = sub.add_parser("uninstall", help="乾淨卸載（只移除 lock 記錄過的技能檔）")
    add_common(sp)
    sp.set_defaults(func=cmd_uninstall)

    return p


def main(argv: list[str] | None = None) -> int:
    cfg = load_config()
    parser = build_parser()
    args = parser.parse_args(argv)
    # --root 覆寫
    if getattr(args, "root", None):
        cfg = load_config(Path(args.root))
    return args.func(args, cfg) if hasattr(args, "func") else 1


if __name__ == "__main__":
    raise SystemExit(main())
