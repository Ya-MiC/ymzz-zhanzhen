"""安裝器：npx skills add 包裝（--copy --json --yes，永不互動、永不假裝成功）。

已驗證的 CLI 事實（2026-11-14，`npx skills --help` 實測）：
  add <package> 支援 -s/--skill、-y/--yes、--copy、--json、-l/--list
  遙測：環境變數 DISABLE_TELEMETRY=1 可關閉（官方文檔 /docs/cli）
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

from .security import hash_file

# DSH 結構：核心技能安裝到 skills/core/<skill>/SKILL.md，優先在此找。
_CORE_SKILL_MD_CANDIDATE_ROOTS = ["skills/core", "skills", ".agents", ".claude", ".cursor", ".codex", "."]


def _resolve_node(node_cmd: str) -> str | None:
    """npx 在 Windows 是 npx.cmd——用 shutil.which（吃 PATHEXT）找到可執行檔。"""
    found = shutil.which(node_cmd) or shutil.which(f"{node_cmd}.cmd") or shutil.which(f"{node_cmd}.exe")
    return found


def build_add_cmd(cfg, package_url: str, skill: str) -> list[str]:
    node = _resolve_node(cfg.installer.node_cmd)
    if not node:
        node = cfg.installer.node_cmd
    return [node, "-y", "skills", "add", package_url,
            "--skill", skill, "--yes", "--copy", "--json"]


def _env() -> dict:
    env = dict(os.environ)
    env["DISABLE_TELEMETRY"] = "1"  # 零遙測紅線
    env.setdefault("CI", "1")       # 關閉互動提示
    return env


def find_skill_md(root: Path, skill_name: str, max_depth: int = 4) -> Path | None:
    """在專案常見安裝位置找 {skill_name}/SKILL.md（存在才回傳，不假設）。"""
    root = Path(root)
    seen: set[Path] = set()
    for base_name in _CORE_SKILL_MD_CANDIDATE_ROOTS:
        base = root / base_name
        if not base.is_dir() or base in seen:
            continue
        seen.add(base)
        try:
            for child in sorted(base.glob(f"**/{skill_name}/SKILL.md")):
                rel = child.relative_to(root)
                if len(rel.parts) <= max_depth + 2:
                    return child.resolve()
        except OSError:
            continue
    return None


def _parse_add_json(stdout: str) -> list[str]:
    """best-effort 解析 --json 輸出裡的安裝路徑。"""
    paths: list[str] = []
    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return paths
    def walk(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in ("path", "skillPath", "installedPath", "destination") and isinstance(v, str):
                    paths.append(v)
                else:
                    walk(v)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)
    walk(payload)
    return paths


def install_skill(cfg, package_url: str, skill: str, dry_run: bool = False) -> dict:
    """安裝單一 skill 到專案（cwd = 專案根）。dry_run 只回計畫不執行。"""
    cmd = build_add_cmd(cfg, package_url, skill)
    plan = {"ok": False, "dry_run": dry_run, "command": cmd, "cwd": str(cfg.root),
            "exit_code": None, "path": None, "reason": None, "stdout_excerpt": None}
    if dry_run:
        plan["ok"] = True
        plan["reason"] = "dry_run"
        return plan

    node = _resolve_node(cfg.installer.node_cmd)
    if not node:
        plan["reason"] = f"找不到 {cfg.installer.node_cmd}（Node.js 未安裝或不在 PATH）"
        return plan

    try:
        proc = subprocess.run(cmd, cwd=str(cfg.root), env=_env(),
                              capture_output=True, text=True,
                              timeout=cfg.installer.timeout_seconds)
    except subprocess.TimeoutExpired:
        plan["reason"] = f"安裝超時（>{cfg.installer.timeout_seconds}s）"
        return plan
    except OSError as exc:
        plan["reason"] = f"無法啟動安裝程序：{exc}"
        return plan

    plan["exit_code"] = proc.returncode
    plan["stdout_excerpt"] = (proc.stdout or "")[-800:]
    md = find_skill_md(cfg.root, skill)
    if md is not None:
        plan["ok"] = True
        plan["path"] = str(md)
        return plan

    # CLI 成功但找不到 SKILL.md → 解析 --json 輸出再試
    for p in _parse_add_json(proc.stdout or ""):
        cand = Path(p)
        if not cand.is_absolute():
            cand = cfg.root / cand
        if cand.name == "SKILL.md" and cand.is_file():
            plan["ok"] = True
            plan["path"] = str(cand)
            return plan
    plan["reason"] = (f"安裝命令結束（exit={proc.returncode}）但找不到 {skill}/SKILL.md；"
                      f"stderr={((proc.stderr or '')[-200:])}")
    return plan


def verify_core(cfg, lock: dict) -> dict:
    """驗證 lock 內核心 skill 是否已安裝（目錄與 SKILL.md 存在）。"""
    result: dict[str, dict] = {}
    for sk in lock.get("skills", []):
        name = sk["name"]
        md = find_skill_md(cfg.root, name)
        result[name] = {
            "id": sk.get("id"),
            "required": bool(sk.get("required")),
            "installed": md is not None,
            "path": str(md) if md else None,
            "hash": hash_file(md) if md else None,
        }
    return result


def ensure_core(cfg, lock: dict, dry_run: bool = False) -> dict:
    """冪等安裝核心源：已裝 → skip；未裝 → 裝；失敗 → degraded（如實記錄，之後重試）。"""
    status: dict[str, dict] = {}
    for sk in lock.get("skills", []):
        name = sk["name"]
        md = find_skill_md(cfg.root, name)
        if md is not None:
            status[name] = {"state": "already_installed", "path": str(md),
                            "hash": hash_file(md), "required": bool(sk.get("required"))}
            continue
        res = install_skill(cfg, sk["package_url"], name, dry_run=dry_run)
        if res.get("ok") and not dry_run:
            status[name] = {"state": "installed_now", "path": res.get("path"),
                            "hash": hash_file(Path(res["path"])) if res.get("path") else None,
                            "required": bool(sk.get("required"))}
        elif dry_run:
            status[name] = {"state": "dry_run", "command": res.get("command"),
                            "required": bool(sk.get("required"))}
        else:
            status[name] = {"state": "degraded", "reason": res.get("reason"),
                            "command": res.get("command"),
                            "required": bool(sk.get("required"))}
    return status
