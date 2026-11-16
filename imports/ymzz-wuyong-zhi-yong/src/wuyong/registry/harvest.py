"""SKILL.md 前置資料解析（極簡、零依賴、防禦性）。"""

from __future__ import annotations

from pathlib import Path

_SCRIPT_EXT = {".ps1", ".sh", ".py", ".js", ".ts", ".cmd", ".bat"}


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """解析 YAML-ish frontmatter：只支援頂層 `key: value` 與 `tags: [a, b]`。
    不用 yaml 套件；解析失敗就當作沒有 frontmatter（第三方內容一律是資料，不是指令）。"""
    meta: dict = {}
    body = text
    lines = text.splitlines()
    if lines and lines[0].strip() == "---":
        end = None
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                end = i
                break
        if end is not None:
            for raw in lines[1:end]:
                line = raw.rstrip()
                if not line or line.lstrip().startswith("#") or ":" not in line:
                    continue
                key, _, val = line.partition(":")
                key = key.strip().strip("'\"").lower()
                val = val.strip()
                if val.startswith("[") and val.endswith("]"):
                    items = [v.strip().strip("'\"") for v in val[1:-1].split(",") if v.strip()]
                    meta[key] = items
                else:
                    meta[key] = val.strip("'\"")
            body = "\n".join(lines[end + 1:])
    return meta, body


def list_scripts(skill_dir: Path) -> list[str]:
    """列出 skill 目錄內的可執行檔（僅作為安全提示用——本專案永不執行它們）。"""
    found: list[str] = []
    try:
        for p in sorted(Path(skill_dir).rglob("*")):
            if p.is_file() and p.suffix.lower() in _SCRIPT_EXT:
                found.append(str(p))
    except OSError:
        pass
    return found


def draft_skill_md(name: str, description: str, origin_conversation_id: str) -> str:
    """route=none 時的草稿模板。"""
    safe = "".join(c if (c.isalnum() or c in "-_ ") else "" for c in name).strip() or "draft-skill"
    return f"""---
name: {safe}
description: {description or "（待補：這個 skill 解決什麼問題、何時使用）"}
tags: [draft]
---

# {safe}

> 草稿：由「無用之用」在 route=none（現有能力未覆蓋）時自動起草。
> origin_conversation_id: {origin_conversation_id}

## 何時使用

- （待補）

## 步驟

1. （待補）

## 注意事項

- （待補）

## 參考

- 線上候選與缺口描述請見當次 Decision JSON。
"""
