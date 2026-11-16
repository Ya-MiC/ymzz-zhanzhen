"""jsonl_tail adapter：監看 JSONL 檔，只吐新增行（Windows 安全，pathlib + 輪詢）。"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Iterator


def tail_file(path: Path, poll_seconds: float = 0.5) -> Iterator[dict]:
    """持續 tail 一個 JSONL 檔。檔案不存在則等待出現；偵測到截斷（縮小）就重頭讀。"""
    p = Path(path)
    offset = 0
    while True:
        try:
            if not p.is_file():
                offset = 0
                time.sleep(poll_seconds)
                continue
            size = p.stat().st_size
            if size < offset:  # 被截斷/輪替
                offset = 0
            if size == offset:
                time.sleep(poll_seconds)
                continue
            with open(p, "r", encoding="utf-8", errors="replace") as fh:
                fh.seek(offset)
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                        if isinstance(obj, dict):
                            yield obj
                    except json.JSONDecodeError:
                        continue
                offset = fh.tell()
        except OSError:
            time.sleep(poll_seconds)
