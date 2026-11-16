"""池 diff：entered / left / installs_changed / hash_changed（純函式，方便測試）。"""

from __future__ import annotations


def diff_entries(old: dict[str, dict], new: dict[str, dict]) -> list[dict]:
    """比較新舊池內容，回傳候選事件（left 的遲滯判定在 pool.py 做）。"""
    events: list[dict] = []
    for entry_id, entry in new.items():
        if entry_id not in old:
            events.append({"type": "entered", "id": entry_id, "installs": entry.get("installs")})
            continue
        prev = old[entry_id]
        if (entry.get("installs") is not None and prev.get("installs") is not None
                and entry["installs"] != prev["installs"]):
            events.append({"type": "installs_changed", "id": entry_id,
                           "from": prev.get("installs"), "to": entry.get("installs")})
        new_hash = entry.get("hash")
        old_hash = prev.get("hash")
        if new_hash and old_hash and new_hash != old_hash:
            events.append({"type": "hash_changed", "id": entry_id,
                           "from": old_hash[:12], "to": new_hash[:12]})
    for entry_id in old:
        if entry_id not in new:
            events.append({"type": "left", "id": entry_id,
                           "installs": old[entry_id].get("installs")})
    return events


def append_events(events_path, events: list[dict], extra: dict | None = None) -> int:
    """事件寫入 state/events.jsonl（JSONL，一行一事件）。"""
    import json
    import time
    if not events:
        return 0
    events_path.parent.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + "Z"
    with open(events_path, "a", encoding="utf-8") as fh:
        for ev in events:
            row = {"ts": ts, **(extra or {}), **ev}
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    return len(events)
