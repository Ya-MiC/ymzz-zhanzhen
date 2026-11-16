#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

PYTHON="${WUYONG_PYTHON:-python}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
    echo "ERROR: 找不到 python" >&2; exit 1
fi

ONCE=0; DAEMON=0; INTERVAL=""; FIXTURE=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --once) ONCE=1; shift ;;
        --daemon) DAEMON=1; shift ;;
        --interval=*) INTERVAL="${1#--interval=}"; shift ;;
        --fixture=*) FIXTURE="${1#--fixture=}"; shift ;;
        *) echo "WARNING: 未知參數：$1" >&2; shift ;;
    esac
done

CMD=("$PYTHON" -m wuyong monitor)
(( ONCE )) && CMD+=(--once)
[[ -n "$FIXTURE" ]] && CMD+=(--fixture="$FIXTURE")
(( DAEMON )) && CMD+=(--daemon)
[[ -n "$INTERVAL" ]] && CMD+=(--interval="$INTERVAL")

"${CMD[@]}"
