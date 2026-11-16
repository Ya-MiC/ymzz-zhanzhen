"""stdin adapter：從 stdin 逐行讀 JSONL 事件。"""

from __future__ import annotations

import json
import sys
from typing import Iterator


def read_events(stream=None) -> Iterator[dict]:
    """逐行解析 JSONL；壞行跳過並計數（不中斷常駐）。"""
    stream = stream or sys.stdin
    skipped = 0
    for line in stream:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                yield obj
            else:
                skipped += 1
        except json.JSONDecodeError:
            skipped += 1
    # 產生器結束；跳過數僅供測試/除錯參考
    _ = skipped
