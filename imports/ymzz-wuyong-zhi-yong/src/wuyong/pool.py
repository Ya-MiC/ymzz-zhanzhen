"""默認 skill 池：由 skills.sh 排行榜動態算出的派生物（不是手寫清單）。

池記錄：{id, source, installs, installs_at, first_seen, last_seen, audit, hash,
        status: active|review|below_threshold, installed, below_streak}
本地自製 skill 不在池裡（在 local_index），結構上保證「永不被自動刪除」。
"""

from __future__ import annotations

import json
import time
from pathlib import Path

from . import security
from .monitor import diff as diff_mod
from .monitor import skills_sh


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z"


class Pool:
    def __init__(self, cfg, auditor=None):
        self.cfg = cfg
        self.path: Path = cfg.pool_path
        self.events_path: Path = cfg.events_path
        # auditor: Callable[[skill_id], str] → pass|warn|fail|unaudited（測試可注入）
        self.auditor = auditor
        self.entries: dict[str, dict] = {}
        self.load()

    # ---- 持久化 ----
    def load(self) -> None:
        if self.path.is_file():
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
                self.entries = {e["id"]: e for e in data.get("entries", [])}
            except (json.JSONDecodeError, KeyError, OSError):
                self.entries = {}

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"version": 1, "updated_at": _now(),
                   "entries": sorted(self.entries.values(), key=lambda e: e["id"])}
        self.path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---- 查詢 ----
    def get(self, skill_id: str) -> dict | None:
        return self.entries.get(skill_id)

    def list(self, include_below: bool = True) -> list[dict]:
        out = []
        for e in sorted(self.entries.values(), key=lambda x: -(x.get("installs") or 0)):
            if not include_below and e.get("status") == "below_threshold":
                continue
            out.append(e)
        return out

    def search(self, query: str, min_score: float = 0.34, top_k: int = 5) -> list[tuple[dict, float]]:
        from .registry.local_index import tokenize, _score_entry
        q_tokens = tokenize(query)
        if not q_tokens:
            return []
        hits = []
        for e in self.entries.values():
            pseudo = {"name": e.get("name", ""), "tags": e.get("tags") or [], "description": e.get("source", "")}
            score = _score_entry(query.lower().strip(), q_tokens, pseudo)
            if score >= min_score:
                hits.append((e, round(score, 4)))
        hits.sort(key=lambda x: x[1], reverse=True)
        return hits[:top_k]

    def mark_installed(self, skill_id: str, path: str) -> None:
        e = self.entries.get(skill_id)
        if e:
            e["installed"] = True
            e["installed_path"] = path
            self.save()

    # ---- 同步 ----
    def audit_one(self, skill_id: str, token: str | None = None) -> tuple[str, list[dict] | None]:
        """取得單一 skill 審計狀態。優先用注入的 auditor（測試），否則打 API（無 token → unaudited）。"""
        if self.auditor is not None:
            return self.auditor(skill_id), None
        audits, err = skills_sh.fetch_audit(skill_id, self.cfg, token)
        return security.summarize_audits(audits), audits

    def sync(self, leaderboard_entries: list[dict], token: str | None = None,
             check_hash: bool = False) -> dict:
        """把排行榜套進池：安全閘 + 遲滯 + diff 事件。回傳摘要。"""
        now = _now()
        min_installs = self.cfg.monitor.min_installs
        hysteresis = self.cfg.monitor.hysteresis_rounds
        old_snapshot = {k: dict(v) for k, v in self.entries.items()}
        incoming: dict[str, dict] = {}
        rejected: list[dict] = []
        new_ids = set()

        for item in leaderboard_entries:
            sid = item.get("id")
            if not sid:
                continue
            if int(item.get("installs") or 0) <= min_installs:
                continue  # 嚴格大於門檻：1,000,000 不入、1,000,001 入
            new_ids.add(sid)
            incoming[sid] = item

        for sid, item in incoming.items():
            prev = self.entries.get(sid)
            if prev is None:
                audit_status, audits = self.audit_one(sid, token)
                allowed, status_label = security.gate(audit_status)
                if not allowed:
                    rejected.append({"id": sid, "audit": audit_status})
                    continue
                self.entries[sid] = {
                    "id": sid,
                    "source": item.get("source"),
                    "name": item.get("name") or item.get("slug"),
                    "slug": item.get("slug"),
                    "installs": int(item.get("installs") or 0),
                    "installs_at": now,
                    "first_seen": now,
                    "last_seen": now,
                    "audit": {"status": audit_status,
                              "providers": audits or [],
                              "checked_at": now},
                    "hash": item.get("hash"),
                    "status": status_label,
                    "installed": False,
                    "below_streak": 0,
                    "install_mode": self.cfg.monitor.install_mode,
                    "url": item.get("url"),
                }
            else:
                prev["installs"] = int(item.get("installs") or prev.get("installs") or 0)
                prev["installs_at"] = now
                prev["last_seen"] = now
                prev["below_streak"] = 0
                if prev.get("status") == "below_threshold":
                    prev["status"] = "active"  # 重新過門檻（事件由 diff 記為 entered）
                if check_hash and token:
                    h = skills_sh.fetch_detail_hash(sid, self.cfg, token)
                    if h:
                        prev["hash"] = h

        # 不在新榜上的（僅池內條目；本地自製不在池裡，結構上不可能被刪）
        for sid in list(self.entries.keys()):
            if sid in new_ids:
                continue
            e = self.entries[sid]
            e["below_streak"] = int(e.get("below_streak") or 0) + 1
            if e["below_streak"] >= hysteresis and e.get("status") != "below_threshold":
                e["status"] = "below_threshold"

        events = diff_mod.diff_entries(old_snapshot, self.entries)
        for rid in rejected:
            events.append({"type": "audit_rejected", "id": rid["id"], "audit": rid["audit"]})
        written = diff_mod.append_events(self.events_path, events, extra={"origin": "pool.sync"})
        self.save()
        return {"added": sum(1 for e in events if e["type"] == "entered"),
                "left": sum(1 for e in events if e["type"] == "left"),
                "installs_changed": sum(1 for e in events if e["type"] == "installs_changed"),
                "hash_changed": sum(1 for e in events if e["type"] == "hash_changed"),
                "audit_rejected": len(rejected),
                "events_written": written,
                "pool_size": len(self.entries)}
