#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

PYTHON="${WUYONG_PYTHON:-python}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
    echo "ERROR: 找不到 python" >&2; exit 1
fi

echo "wuyong uninstall：只移除 lock 記錄過的核心 skill；state/ 與 local-made/ 保留。"
"$PYTHON" -m wuyong uninstall
