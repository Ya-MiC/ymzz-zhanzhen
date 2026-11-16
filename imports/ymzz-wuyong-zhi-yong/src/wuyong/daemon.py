"""常駐模式：watch（stdin / jsonl_tail → Decision/行）與 monitor daemon（輪詢池）。"""

from __future__ import annotations

import json
import os
import random
import sys
import time
from pathlib import Path

from .config import Config, load_config, ensure_state_dirs
from .registry.local_index import LocalIndex
from .pool import Pool
from .monitor import skills_sh
from .router import route_event
from .installer import verify_core, ensure_core, build_add_cmd, find_skill_md
from .sources import jsonl_tail, stdin_src, inline_src


def build_router_context(cfg: Config, dry_run: bool = True):
    """把各層串起來：local_index + pool + npx 可用性。"""
    index = LocalIndex(cfg.index_path,
                       roots_provider=lambda: cfg.local_skill_roots())
    pool = Pool(cfg)
    npx_available = cfg.installer.node_cmd is not None and bool(
        __import__("shutil").which(cfg.installer.node_cmd) or
        __import__("shutil").which(f"{cfg.installer.node_cmd}.cmd"))
    token = os.environ.get("VERCEL_OIDC_TOKEN", "").strip() or None
    return index, pool, npx_available, token


def run_watch(cfg: Config, source: str = "stdin", file_path: str | None = None,
              dry_run: bool = True, mode: str | None = None,
              token: str | None = None):
    """逐條讀 JSONL 事件，輸出一條 Decision JSON 到 stdout。"""
    index = LocalIndex(cfg.index_path, roots_provider=lambda: cfg.local_skill_roots())
    pool = Pool(cfg)
    npx_available = bool(__import__("shutil").which(cfg.installer.node_cmd) or
                         __import__("shutil").which(f"{cfg.installer.node_cmd}.cmd"))
    token = token or os.environ.get("VERCEL_OIDC_TOKEN", "").strip() or None

    if source == "stdin":
        events = stdin_src.read_events()
    elif source == "file":
        events = jsonl_tail.tail_file(Path(file_path))
    elif source == "inline":
        return None  # 由 cli 處理單條 inline
    else:
        raise ValueError(f"不支援的 watch source：{source}")

    effective_mode = mode or cfg.mode
    for evt in events:
        try:
            dec = route_event(evt, cfg, pool=pool, index=index,
                              npx_available=npx_available, token=token,
                              mode=effective_mode, dry_run=dry_run)
            # act 模式的實際安裝：router 只做規劃；這裡針對 route=pool 尚未安裝的條目執行
            _apply_actions(dec, cfg, pool, index, dry_run=dry_run)
            print(json.dumps(dec, ensure_ascii=False), flush=True)
        except Exception as exc:  # 單條失敗不中斷常駐
            print(json.dumps({"error": str(exc), "event": evt, "route": "none",
                              "thinking_available": bool((evt or {}).get("thinking"))},
                             ensure_ascii=False), flush=True)


def _apply_actions(dec: dict, cfg: Config, pool: Pool, index: LocalIndex,
                   dry_run: bool = True) -> None:
    """把 route=pool 的「先安裝再登記」落盤（僅 act 且 non-dry_run）。"""
    if cfg.mode != "act" or dry_run:
        return
    for cand in dec.get("candidates", []):
        if cand.get("route") != "pool" or cand.get("installed"):
            continue
        skill_id = cand["id"]
        source = cand.get("source") or ""
        entry = pool.get(skill_id)
        if not entry:
            continue
        install_mode = entry.get("install_mode", cfg.monitor.install_mode)
        if install_mode != "eager":
            continue  # lazy：首次使用才安裝；watch 不主動裝 eager 以外的
        # 找 installUrl（pool.sync 未存則從 leaderboard 重取；保守起見此處不自聯網）
        install_url = entry.get("url") or source
        from .installer import install_skill
        res = install_skill(cfg, install_url, entry.get("slug") or skill_id, dry_run=False)
        if res.get("ok"):
            pool.mark_installed(skill_id, res.get("path") or "")
            cand["installed"] = True
            cand["path"] = res.get("path")
            dec.setdefault("actions_taken", []).append("pool_installed_now")


def run_monitor_once(cfg: Config, fixture_html: str | None = None,
                     check_hash: bool = False,
                     auditor=None) -> dict:
    index = LocalIndex(cfg.index_path, roots_provider=lambda: cfg.local_skill_roots())
    pool = Pool(cfg)
    token = os.environ.get("VERCEL_OIDC_TOKEN", "").strip() or None
    entries, meta = skills_sh.collect(cfg, token=token, fixture_html=fixture_html)
    summary = pool.sync(entries, token=token, check_hash=check_hash)
    summary["leaderboard_meta"] = meta
    summary["leaderboard_count"] = len(entries)
    pool.save()
    # 把快照也更新（供降級使用）；全部失敗（entries 為空）時不覆蓋舊快照
    if entries:
        skills_sh.save_snapshot(cfg, entries, meta)
    return summary
