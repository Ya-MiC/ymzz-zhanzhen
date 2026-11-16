"""inline adapter：直接由 CLI 參數組事件。"""

from __future__ import annotations

from datetime import datetime, timezone


def build_event(text: str, thinking: str | None = None,
                conversation_id: str = "inline", turn_id: str = "0") -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return {
        "conversation_id": conversation_id or "inline",
        "turn_id": turn_id or "0",
        "ts": now,
        "user_text": text or "",
        "thinking": (thinking or "").strip() or None,
    }
