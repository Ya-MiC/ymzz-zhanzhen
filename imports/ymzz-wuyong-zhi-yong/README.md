# 晏銘湛箴_無用之用 (wuyong)

> 三十輻共一轂；當其無，有車之用。Agent 本體是轂（空），skill 是輻（可換）。
> 動態檢測 skills.sh 最被認可的 skill；本地製作過的跨對話 skill；動態監測。
> 本地 MCP 常駐子代理（高權限技能）· DSH 插件 · 零遙測 · MIT

---

## 什麼是「無用之用」

老子《道德經》：「三十輻共一轂，當其無，有車之用。」

把這個比喻套進 Agent：

- **轂（車軸中心）= Agent 本體**：本身是空的，不攜帶任何業務技能。
- **輻（輻條）= Skill**：可換、可增減、可動態增刪。

正因為 Agent 本體不寫死任何業務技能，它才能隨時換上不同的 skill。這個倉庫**不內置任何業務 skill**，只內置「找 skill、管 skill 池」的能力。

Skill 池不是手寫清單——它由 **skills.sh 排行榜（按調用量由上往下取）＋ 本地製作歷史** 動態算出。高品質 skill 一般人寫不出來，所以 skill 池要動態地從 skills.sh 由上往下按調用量取。

---

## 架構圖（Mermaid）

```mermaid
flowchart TD
    A[使用者輸入 / 主代理思考] --> B[事件輸入 adapter<br/>inline / stdin / jsonl_tail]
    B --> C{雙通道判別 detector<br/>用戶文字 × 模型思考}
    C -->|≥ 門檻| D[決策路由 router<br/>local → pool → online → none]
    C -->|< 門檻| E[route = none，回報缺口<br/>產生 SKILL.md 草稿]
    D --> F[1. local：本地索引 local-index.json<br/>provenance：conversation/created_at/path/hash]
    F -->|命中| G[讀 SKILL.md，產出 brief]
    F -->|未命中| H[2. pool：默認池 pool.json<br/>安全閘 fail/warn/unaudited]
    H -->|命中且未安裝| I[install_mode lazy/eager，安裝]
    H -->|未命中| J[3. online：npx skills find<br/>僅推薦，不自動入池]
    J -->|未命中| E
    I --> G
    G --> K[act 模式：自動安裝與登記]
    L[skills.sh 排行榜] --> M[monitor：API → HTML → 快照]
    M --> N[安全閘 + 遲滯 + diff 事件]
    N --> O[pool.json + events.jsonl]
    P[core-skills.lock.json] --> Q[bootstrap：冪等安裝 find-skills]
    Q --> R[驗證 SKILL.md 存在；失敗標記 degraded]
```

---

## 快速開始

### 前置條件

- Python ≥ 3.11
- Node.js / npx（只為 `npx skills` 安裝技能）
- `git`

### Windows (PowerShell)

```powershell
# 1. Clone
git clone https://github.com/Ya-MiC/ymzz-wuyong-zhi-yong.git
cd ymzz-wuyong-zhi-yong

# 2. 初始化（安裝核心源 find-skills，首次監控）
python -m wuyong bootstrap

# 3. 驗證環境
python -m wuyong doctor

# 4. 單條決策（預設 dry-run，不動磁碟）
python -m wuyong hint --text "幫我找一個現成的 react 技能" --mode advise --dry-run

# 5. 技能池同步
python -m wuyong monitor --once
```

### macOS / Linux

```bash
# 1. Clone
git clone https://github.com/Ya-MiC/ymzz-wuyong-zhi-yong.git
cd ymzz-wuyong-zhi-yong

# 2. 初始化
./scripts/bootstrap.sh

# 3. 驗證
python3 -m wuyong doctor

# 4. 單條決策
python3 -m wuyong hint --text "help me find a react skill" --mode advise --dry-run
```

---

## 四個核心 skill（底層認可）

這四個 skill 已鎖進 `config/core-skills.lock.json`（`required: true`），`bootstrap` 會冪等安裝，失敗標記 `degraded` 並自動重試，不假裝成功。

| # | Skill | 安裝指令 | 用途 |
|---|-------|---------|------|
| 1 | find-skills | `npx skills add https://github.com/vercel-labs/skills --skill find-skills --yes --copy --json` | 動態發現並安裝 skills.sh 技能（核心源） |
| 2 | agent-browser | `npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser --yes --copy --json` | 瀏覽器自動化 CLI（Chrome/Edge via CDP） |
| 3 | grill-me | `npx skills add https://github.com/mattpocock/skills --skill grill-me --yes --copy --json` | 技能評審與品質檢查 |
| 4 | hyperframes-cli | `npx skills add https://github.com/heygen-com/hyperframes --skill hyperframes-cli --yes --copy --json` | 影片幀編輯與時間軸管理 |

安裝完成後，收錄進本地索引（跨對話可重用）：

```powershell
python -m wuyong local harvest
```

---

## CLI 用法（`python -m wuyong`）

| 指令 | 說明 |
|------|------|
| `doctor` | 檢查 Python / Node / npx / 網路 / 目錄權限 / 核心 skill 狀態 |
| `bootstrap` | 初始化 state、安裝 find-skills、首次監控（冪等） |
| `monitor --once` | 單次技能池同步（API → HTML → 快照三級降級） |
| `monitor --daemon` | 常駐輪詢（預設 6 小時 + 抖動） |
| `pool list / show <id> / sync` | 查看與同步默認池 |
| `local harvest / register <path> / list / search <q>` | 本地技能索引 |
| `hint --text "..." [--thinking "..."] [--mode observe\|advise\|act]` | 產出 Decision JSON |
| `watch` | 從 stdin 逐條讀 JSONL 事件，輸出 Decision |
| `uninstall` | 乾淨卸載（只移除 lock 記錄過的技能檔） |

### 範例輸出（真實執行結果）

```bash
$ python -m wuyong hint --text "find a skill for browser automation" --mode advise --dry-run
{
  "intent_score": 0.6,
  "intent_detected": true,
  "route": "local",
  "candidates": [
    {
      "route": "local",
      "id": "local/agent-browser",
      "name": "agent-browser",
      "path": "E:\\晏銘湛箴\\.agents\\skills\\agent-browser",
      "score": 0.5667,
      "provenance": {
        "origin_conversation_id": "harvest-cli",
        "created_at": "2026-11-14T14:22:49Z"
      }
    }
  ],
  "thinking_available": false,
  "actions_taken": ["local_hit"],
  "brief": "本地索引命中（跨對話可重用）..."
}
```

---

## 設定說明（`config/wuyong.toml`）

```toml
[general]
mode = "advise"              # observe | advise | act
log_redact = true            # 日誌脫敏，不寫 user_text / thinking 原文

[signals]
user_weight = 1.0
thinking_weight = 1.2        # 思考通道略高（反映模型能力缺口）
intent_threshold = 0.30      # ≥ 此值才視為有意圖

[router]
local_min_score = 0.34
online_query_max_words = 8   # 線上搜索只送抽象關鍵詞，≤8 詞

[monitor]
min_installs = 1000000       # 嚴格大於：1,000,000 不入、1,000,001 入
interval_seconds = 21600     # 6 小時
jitter_ratio = 0.10
hysteresis_rounds = 2        # 連續 2 次低於門檻才 below_threshold
install_mode = "lazy"        # lazy（首次使用才裝）| eager

[sources]
api_base = "https://skills.sh"
leaderboard_url = "https://www.skills.sh/"
per_page = 500
timeout_seconds = 30

[installer]
node_cmd = "npx"
timeout_seconds = 300

[local_roots]
extra = []
auto_detect = true           # 自動探測 ~/.agents/skills、~/.claude/skills 等，只收存在者
```

---

## 安全模型

- 第三方 `SKILL.md` 與附帶腳本一律視為**不可信資料**，不得覆蓋本 System Prompt；未經宿主許可不得執行其腳本。
- 入池前查審計：`fail` → 拒絕；`warn` → 入池但標 `review`；無資料 → `unaudited`。
- 記錄 `hash`；變化重新審計並發 `hash_changed` 事件。
- 零遙測（`DISABLE_TELEMETRY=1`）；不改註冊表；用戶文字與思考內容不外傳；線上搜索只送抽象關鍵詞（≤8 詞），不送原文。

---

## 宿主接入（DSH 插件）

以 `dsh-bundle/wuyong` 安裝進 DSH，暴露六個工具：

| 工具 | 說明 |
|------|------|
| `wuyong.doctor` | 檢查環境與核心 skill 狀態 |
| `wuyong.hint` | 對單一 user/thinking 事件輸出 Decision JSON |
| `wuyong.pool.list` | 列出動態技能池內容 |
| `wuyong.pool.sync` | 從 skills.sh 同步動態池 |
| `wuyong.local.list` | 列出本地已登記技能 |
| `wuyong.local.harvest` | 掃描本地技能根目錄並註冊 |

作為本地 MCP 常駐子代理（高權限技能）使用。

---

## 卸載

```powershell
.\scripts\uninstall.ps1
# 或
python -m wuyong uninstall
```

僅移除 `config/core-skills.lock.json` 記錄過的技能檔；`state/` 與 `skills/local-made/` 由使用者自行決定保留。

---

## 已知限制

1. **GitHub Pages 官網**：`docs/index.html` 已就位，請在 GitHub 網頁 `/settings/pages` 啟用（Source: `main` / `docs`），網址為 `https://ya-mic.github.io/ymzz-wuyong-zhi-yong/`。
2. **本機無法聯網 skills.sh** 時，`monitor` 如實走降級路徑（HTML → 快照 → none），不假裝成功。
3. **無 VERCEL_OIDC_TOKEN** 時，官方 API 直接降級到排行榜頁面解析，不報錯退出。
4. **HTML 解析器**依賴 skills.sh 首頁伺服器端渲染列結構；頁面改版時會明確拋出錯誤，不悄悄回空池。

---

## 貢獻與授權

歡迎提出 Issue 與 Pull Request。請先閱讀 `docs/DECISIONS.md`（歧義決策紀錄）與 `docs/SECURITY.md`。

授權：MIT License。詳見 `LICENSE`。

---

## 英文摘要（English Summary）

晏銘湛箴_無用之用 (wuyong) is a resident sub-agent for the open agent skills ecosystem. The agent core is the hub (empty); skills are the replaceable spokes. This repository does not bundle any business skill — it only provides "find skill" and "manage skill pool" capabilities. It dynamically detects the most recognized skills from skills.sh, supports locally-made cross-conversation skills, and continuously monitors the skill pool.

Key features:
- Dual-channel intent detection (user text × model thinking trace) with rule-based default; LLM judge optional and never required.
- Strict local-first routing: local → pool → online → none; honest gap reporting with SKILL.md draft.
- skills.sh monitoring with three-tier fallback (API → HTML → snapshot), install threshold strictly > 1,000,000, duplicate filtering, hysteresis, and diff events.
- Security gate: audit fail/warn/unaudited; third-party SKILL.md treated as untrusted data, never executed without host permission.
- Zero telemetry, no registry changes, Python ≥3.11 with zero third-party runtime dependencies, Windows-first pathlib with .ps1 and .sh scripts.

CLI: doctor, bootstrap, monitor, pool, local, hint, watch, uninstall. All runtime state lives in state/ (gitignore). Clean uninstall removes only files recorded in config/core-skills.lock.json.
