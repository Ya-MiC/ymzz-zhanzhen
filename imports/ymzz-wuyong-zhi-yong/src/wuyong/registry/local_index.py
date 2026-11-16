"""本地 skill 索引：跨對話命中能力的核心。

- 任何一次對話製作出的 skill，只要落盤並被 register-local / harvest 收錄，
  其他對話都能命中（索引在 state/，跨對話共用）。
- provenance：origin_conversation_id、created_at、path、hash。
- 匹配：stdlib 詞法相似度（中英文通用）；embedding 僅為可選 adapter，不在本層。
"""

from __future__ import annotations

import hashlib
import json
import re
import time
import unicodedata
from pathlib import Path

from ..registry.harvest import parse_frontmatter

_TOKEN_LATIN = re.compile(r"[a-z0-9]+")
_CJK = re.compile(r"[\u4e00-\u9fff]")

_NAME_W, _TAGS_W, _DESC_W = 2.0, 1.5, 1.0


def tokenize(text: str) -> list[str]:
    """中英文分詞：拉丁 = 單詞；CJK = 單字 + 雙字詞。"""
    text = unicodedata.normalize("NFKC", (text or "")).lower()
    tokens = _TOKEN_LATIN.findall(text)
    cjk = _CJK.findall(text)
    tokens.extend(cjk)
    tokens.extend(a + b for a, b in zip(cjk, cjk[1:]))
    return tokens


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


class LocalIndex:
    def __init__(self, index_path: Path, roots_provider=None):
        self.index_path = Path(index_path)
        self._roots_provider = roots_provider  # Callable[[], list[Path]]
        self.entries: dict[str, dict] = {}
        self.load()

    # ---- 持久化 ----
    def load(self) -> None:
        if self.index_path.is_file():
            try:
                data = json.loads(self.index_path.read_text(encoding="utf-8"))
                self.entries = {e["id"]: e for e in data.get("entries", [])}
            except (json.JSONDecodeError, KeyError, OSError):
                self.entries = {}

    def save(self) -> None:
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"version": 1, "updated_at": _now_iso(),
                   "entries": sorted(self.entries.values(), key=lambda e: e["id"])}
        self.index_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2),
                                   encoding="utf-8")

    # ---- 註冊 ----
    def register(self, skill_dir: Path, conversation_id: str = "unknown",
                 origin: str = "local-made", status: str = "ready") -> dict | None:
        """把一個含 SKILL.md 的目錄收錄進索引。回傳 entry；非 skill 目錄回 None。"""
        skill_dir = Path(skill_dir).resolve()
        md = skill_dir / "SKILL.md"
        if not skill_dir.is_dir() or not md.is_file():
            return None
        meta, _body = parse_frontmatter(md.read_text(encoding="utf-8", errors="replace"))
        name = (meta.get("name") or skill_dir.name).strip()
        entry_id = f"local/{skill_dir.name}"
        now = _now_iso()
        prev = self.entries.get(entry_id)
        entry = {
            "id": entry_id,
            "name": name,
            "description": (meta.get("description") or "").strip(),
            "tags": meta.get("tags") or [],
            "path": str(skill_dir),
            "hash": sha256_file(md),
            "origin": origin,  # local-made | external | pool-installed | core | draft
            "status": status,
            "origin_conversation_id": (prev or {}).get("origin_conversation_id", conversation_id),
            "created_at": (prev or {}).get("created_at", now),
            "registered_at": now,
        }
        if prev and prev.get("origin_conversation_id") not in (None, "unknown"):
            entry["origin_conversation_id"] = prev["origin_conversation_id"]
        self.entries[entry_id] = entry
        return entry

    def register_file_path(self, md_path: Path, conversation_id: str = "unknown",
                           origin: str = "external") -> dict | None:
        return self.register(Path(md_path).parent, conversation_id=conversation_id, origin=origin)

    def remove(self, entry_id: str) -> bool:
        return self.entries.pop(entry_id, None) is not None

    def get(self, entry_id: str) -> dict | None:
        return self.entries.get(entry_id)

    def all(self) -> list[dict]:
        return sorted(self.entries.values(), key=lambda e: (e["origin"], e["id"]))

    # ---- 搜索 ----
    def search(self, query: str, min_score: float = 0.34, top_k: int = 5) -> list[tuple[dict, float]]:
        q_tokens = tokenize(query)
        if not q_tokens:
            return []
        results: list[tuple[dict, float]] = []
        ql = unicodedata.normalize("NFKC", query).lower()
        for entry in self.entries.values():
            score = _score_entry(ql, q_tokens, entry)
            if score >= min_score:
                results.append((entry, round(score, 4)))
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def scan_roots(self, conversation_id: str = "harvest") -> list[dict]:
        """掃描所有配置的本地根目錄，收錄新發現的 skill。"""
        registered: list[dict] = []
        roots = self._roots_provider() if self._roots_provider else []
        for root in roots:
            if not Path(root).is_dir():
                continue
            try:
                children = sorted(Path(root).iterdir())
            except OSError:
                continue
            for child in children:
                if not child.is_dir():
                    continue
                if not (child / "SKILL.md").is_file():
                    continue
                origin = "local-made" if Path(child).resolve() in _resolve_roots(roots) and _is_local_made(child, roots) else "external"
                entry = self.register(child, conversation_id=conversation_id, origin=origin)
                if entry:
                    registered.append(entry)
        return registered


def _resolve_roots(roots) -> list[Path]:
    return [Path(r).resolve() for r in roots]


def _is_local_made(child: Path, roots) -> bool:
    """child 是否落在名為 local-made 的根目錄下。"""
    for r in roots:
        if Path(r).name == "local-made" and child.resolve().parent == Path(r).resolve():
            return True
    return False


def _score_entry(query_lower: str, q_tokens: list[str], entry: dict) -> float:
    """加權詞法相似度：name ×2、tags ×1.5、description ×1。回傳 0~1。"""
    doc: dict[str, float] = {}
    for tok in tokenize(entry.get("name", "")):
        doc[tok] = doc.get(tok, 0.0) + _NAME_W
    for tag in entry.get("tags") or []:
        for tok in tokenize(str(tag)):
            doc[tok] = doc.get(tok, 0.0) + _TAGS_W
    for tok in tokenize(entry.get("description", "")):
        doc[tok] = doc.get(tok, 0.0) + _DESC_W
    if not doc:
        return 0.0
    hit = sum(1.0 for t in q_tokens if t in doc) / max(1, len(q_tokens))
    name = unicodedata.normalize("NFKC", entry.get("name", "")).lower()
    sub = 1.0 if (ql_in := query_lower.strip()) and ql_in in name else 0.0
    return min(1.0, 0.85 * hit + 0.15 * sub)


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z"
