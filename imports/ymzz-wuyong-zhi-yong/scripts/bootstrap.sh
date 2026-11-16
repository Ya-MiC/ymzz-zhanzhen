#!/usr/bin/env bash
set -euo pipefail

# 晏銘湛箴_無用之用 (wuyong) — POSIX shell 安裝腳本
# 冪等：state/、core-skill find-skills、首次監控同步。
# 需求：Python ≥3.11、Node.js (npx)。

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

PYTHON="${WUYONG_PYTHON:-python}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
    for cand in python python3 py; do
        if command -v "$cand" >/dev/null 2>&1; then
            ver=$("$cand" --version 2>&1 | head -1 || true)
            if [[ "$ver" =~ Python[[:space:]]+([0-9]+)\.([0-9]+) ]]; then
                if (( ${BASH_REMATCH[1]} > 3 )) || { (( ${BASH_REMATCH[1]} == 3 )) && (( ${BASH_REMATCH[2]} >= 11 )); }; then
                    PYTHON="$cand"; break
                fi
            fi
        fi
    done
fi
if ! command -v "$PYTHON" >/dev/null 2>&1; then
    echo "ERROR: 找不到 Python 3.11+ (請設定 WUYONG_PYTHON 或把 python 放 PATH)" >&2
    exit 1
fi

NODE_OK=0
if command -v node >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
    NODE_OK=1
else
    echo "WARNING: 未找到 Node.js / npx：find-skills 將標記 degraded，之後自動重試。" >&2
fi

echo "wuyong bootstrap 開始：根目錄=$ROOT  python=$PYTHON"

"$PYTHON" -m pip install --upgrade pip >/dev/null 2>&1 || true
"$PYTHON" -m pip install -e . >/dev/null 2>&1 || true

echo "執行：python -m wuyong bootstrap"
"$PYTHON" -m wuyong bootstrap

echo "執行：python -m wuyong doctor"
"$PYTHON" -m wuyong doctor
