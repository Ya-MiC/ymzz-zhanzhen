# 晏銘湛箴_無用之用 (wuyong)

- 顯示名稱：晏銘湛箴_無用之用
- Python 套件：`wuyong`（入口 `python -m wuyong`）
- 作者：晏銘湛箴 (Ya-MiC)；License：MIT
- 語言：README / System Prompt / docs 繁體中文；程式碼與 CLI 英文；README 尾附 10 行英文摘要

## 快速開始（Windows）
```powershell
# 1. 確認環境
python --version        # 需 ≥3.11
npx --version           # Node，只為 npx skills

# 2. 安裝本套件（可選；或直接從 src 跑）
python -m pip install -e .

# 3. 初始化 + 安裝核心源 find-skills + 首次監控
.\scripts\bootstrap.ps1

# 4. 驗證
python -m wuyong doctor
python -m wuyong hint --text "幫我找一個現成的 react 技能" --mode act --dry-run
```

## 常用指令
| 指令 | 說明 |
|------|------|
| `python -m wuyong doctor` | 檢查 Python / Node / npx / 網路 / 目錄權限 / 核心 skill |
| `python -m wuyong bootstrap` | 初始化 state、安裝 find-skills、首次 monitor（冪等） |
| `python -m wuyong monitor --once` | 單次技能池同步（沒 token 自動降級到 HTML） |
| `python -m wuyong pool list / show <id> / sync` | 檢視/同步默認池 |
| `python -m wuyong local harvest / register <path> / list / search <q>` | 本地索引 |
| `python -m wuyong hint --text "..." [--thinking "..."] [--mode observe|advise|act]` | 產出 Decision JSON |
| `python -m wuyong watch` | 常駐，從 stdin 讀 JSONL 事件，逐條輸出 Decision |
| `python -m wuyong uninstall` | 乾淨卸載（只移除 lock 記錄過的技能檔） |

## 測試
```powershell
python -m pip install pytest
pytest -q                # 單元測試（不聯網）
pytest -m integration    # 需真實聯網（手動，預設不跑）
```

## 注意
- `state/`（含 `pool.json`、`events.jsonl`、`leaderboard-snapshot.json`）是運行時狀態，**不入 git**。
- `skills/pool/`、`skills/core/` 由 `npx skills` 安裝，不入 git；`config/core-skills.lock.json` 記錄來源。
- 零遙測；不改註冊表；用戶文字與思考內容絕不外傳。
