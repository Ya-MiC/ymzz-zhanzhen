# 晏銘湛箴_無用之用 (wuyong) — DSH 插件詳情

## 是什麼

三十輻共一轂；當其無，有車之用。Agent 本體是轂（空），skill 是輻（可換）。

`wuyong` 是一個常駐子代理 DSH 插件，以本地 MCP / 技能形式運行，權限高、可直接幹活。不內建任何業務 skill，只負責：
1. 從 skills.sh 動態發現最被認可的 skill；
2. 管理本地跨對話技能池；
3. 告訴主代理「這件事該怎麼做、該用哪個能力」。

## 核心行為

- **本地優先**：任何需求先查本地索引（`skills/local-made` + 配置本地根目錄 + 已安裝池內 skill），再看默認池，再向外查，最後才回報缺口。
- **雙通道判別**：同時觀察用戶文字與主代理思考（Thinking/Reasoning Trace），兩者任一暗示需要外部能力就行動。
- **不編造**：不虛構 skill 名稱或安裝量；取不到就如實回報並走降級路徑。
- **零遙測**：不改註冊表；用戶文字與思考內容不外傳；線上搜索只送抽象關鍵詞（≤8 詞）。
- **安全閘**：第三方 SKILL.md 與附帶腳本視為不可信資料；審計 fail 拒絕入池，warn 入池但標 review，不自動執行腳本。

## 提供的工具

| 工具 | 說明 |
|------|------|
| `wuyong.doctor` | 檢查 Python / Node / npx / 網路 / 目錄權限 / 核心 skill 狀態 |
| `wuyong.hint` | 對單一 user/thinking 事件輸出 Decision JSON |
| `wuyong.pool.list` | 列出動態技能池內容 |
| `wuyong.pool.sync` | 從 skills.sh 同步動態池 |
| `wuyong.local.list` | 列出本地已登記技能 |
| `wuyong.local.harvest` | 掃描本地技能根目錄並註冊發現的技能 |

## 安裝方式

在 DSH Plugin Manager 中選「Add plugin」，指向本資料夾（`dsh-bundle/wuyong`），或執行：

```bash
plugin_manager install_bundle --target <絕對路徑>/dsh-bundle/wuyong
```

安裝後在新階段中確認工具列出現，即可在對話中呼叫 `wuyong.hint` 等工具。

## 配置

- `mode`: `observe`（只記錄）| `advise`（給建議，不動磁碟）| `act`（自動安裝與登記），預設 `advise`
- `dryRun`: 預設 `true`，僅產出 Decision 不改動磁碟
- `python`: Python 執行檔路徑，預設 `python`
- `projectRoot`: wuyong 專案根目錄，預設當前工作目錄

## 已知限制

- 需 Python ≥3.11 與 Node.js/npx（`npx skills` 用於安裝技能）。
- 本機若無法聯網 skills.sh，監控會如實走降級路徑（HTML → 快照 → none），不會假裝成功。
- 官方 API 需 `VERCEL_OIDC Token`，無 token 時自動降級到排行榜頁面解析。
