# 晏銘湛箴 (Yanming Zhanzhen)

> 本地優先的結構化第二大腦與原生插件智能體
> Local-First Structured Second Brain & Native Plugin AI Agent

**晏銘湛箴** — 把人與 AI 說過的話當作「潑出去的水」，用量化分數、標籤、來源索引為每一句做注解，再與 AI 的輸出和思維鏈做星雲匹配。

---

## 這是什麼？(What is this?)

這不是傳統商業企劃書，而是一份 **產品發佈說明頁（Product Landing Page）＋ 誠實工程路線圖（Engineering Roadmap & Release Gate Spec）**，在開源圈被稱為 **「Build in Public（公開建造）」** 與 **「Honest Release（誠實發佈）」**。

核心承諾：**承認圖靈機的有限性，將確定性發揮到極致。** 當代大語言模型（LLM）本質上依然運行在圖靈機的離散符號切分（Tokenization）、有限狀態轉移與上下文窗口（KV Cache）的物理邊界之內。我們不製造「模型擁有無限記憶」的虛假幻覺，而是把圖靈機最優秀的本質能力發揮到極致——符號結構化、模式匹配、語義分類打標、確定性模板映射。

---

## 三欄面板架構 (Three-Panel Layout)

```
+-------------------------------------------------------------------+
|  左側導航欄 (Left Sidebar)        中心對話區 (Center Chat)     右側工作區 (Right Workspace) |
|  - 代碼/文件導航                  - 1 對 1 AI 對話              - Obsidian 級標籤化筆記     |
|  - DSH / Codex / Claude 連接      - 即時串流輸出                - 多星雲圖 / 等高線圖譜     |
|  - 技能池 (Skills)                  - 對話歷史跨會話檢索          - 本地文件瀏覽器              |
+-------------------------------------------------------------------+
```

| 面板 | 職責 | 參考產品 |
|------|------|----------|
| **左側導航欄** | 代碼、文件、技能導航；DSH / Codex / Claude Code 連接 | Codex / Claude Code / DSH |
| **中心對話區** | 1 對 1 AI 對話，即時串流，跨會話標籤化留存 | 飛書 Chat-to-Doc |
| **右側工作區** | Obsidian 級標籤化筆記，多星雲圖 / 等高線圖譜，本地文件瀏覽 | Obsidian / ymz-atlas / dashi-taskboard |

---

## 核心哲學 (Core Philosophy)

### 1. 承認「圖靈機的有限性」

我們完全承認當代大語言模型依然受限於圖靈機的離散符號切分、有限狀態轉移與上下文窗口的物理極限。我們**不試圖**突破圖靈機的數學邊界，而是要**把圖靈機最優秀的本質能力發揮到極致**：

- **符號結構化與模式匹配**：將非結構化的自然語言瞬間拆解為高密度知識節點
- **確定性模板映射**：拒絕傳統 AI 會議工具的冗長流水帳，讓每次對話在結束瞬間自動映射為結構嚴謹、標籤完備的本地知識資產

### 2. 「三十輻共一轂」的極簡工程克制

基於 **DeepSeek Harness (DSH)** 構建，嚴格遵循**「不重寫 runtime，不改原生元件位置，一切皆是插件」**：

- **轂 (Core Runtime)**：保持上游核心純淨穩定，隨時無痛同步底層演進
- **輻 (Native Plugins & Skills)**：所有視覺、主題、本地記憶中樞、自動化工作流均透過標準原生插件插槽掛載

### 3. 本地優先 (Local-First) 與 Proton 級別純淨美學

- **零遙測、無第三方追蹤器、無強制雲端綁定**
- **數據主權歸於本地**：對話、思考與記憶以開放純文本 (Markdown) 留存在自己的硬碟
- **溫潤克制的視覺美學**：借鑑 Proton Docs 的極簡純淨質感，提供「雲箋、陶土」等低干擾主題

---

## 技術棧 (Tech Stack)

| 層級 | 技術 | 說明 |
|------|------|------|
| **桌面殼層** | Tauri v2 + Rust | 跨平台 (Windows / macOS Apple Silicon / Linux) |
| **前端界面** | React 18 + TypeScript + Vite | 右側工作區與星雲圖譜 |
| **核心內核** | DeepSeek Harness (DSH) Cordis/Cosmokit | 原生插件架構，不重寫 runtime |
| **本地儲存** | SQLite + Markdown + Obsidian 雙向鏈接 | Local-First，可被 Claude Code / Codex 讀寫 |
| **包管理** | pnpm | 前端依賴 |
| **構建打包** | Rust cargo + Tauri builder | 可執行檔 + ZIP 發佈 |
| **CI/CD** | GitHub Actions | 動態更新、每日 Release、版本鎖定 |
| **支付** | Alipay (PAYATHON 2026 Vibe Pay) | 本地靜態收款碼 + Sandbox 簽名 adapter |

---

## 整合的倉庫與技能 (Integrated Repos & Skills)

本倉庫整合以下家族產品與技能：

| 倉庫 | 用途 | 鏈接 |
|------|------|------|
| `ymzz-zhanzhen` | 主倉庫，本產品源碼 | [GitHub](https://github.com/Ya-MiC/ymzz-zhanzhen) |
| `ymzz` | DSH 基礎 (fork 自 deepseek-harness) | [GitHub](https://github.com/Ya-MiC/ymzz) |
| `ymzz-loop` | 每日復盤模板 + Notion 同步 | [GitHub](https://github.com/Ya-MiC/ymzz-loop) |
| `ymzz-wuyong-zhi-yong` | skills.sh 飆升榜提示詞 + 本地 MCP | [GitHub](https://github.com/Ya-MiC/ymzz-wuyong-zhi-yong) |
| `ymzz-wuwong-ji-wung` | 背景緘默標籤 MCP | [GitHub](https://github.com/Ya-MiC/ymzz-wuwong-ji-wung) |
| `ymzz-wenrun-design-skill` | 溫潤設計系統視覺識別 | [GitHub](https://github.com/Ya-MiC/ymzz-wenrun-design-skill) |
| `ymz-atlas` | 星雲圖 / 樹圖 / 等高線 | [GitHub](https://github.com/Ya-MiC/ymz-atlas) |
| `yanming-official-website` | 官網與品牌白皮書 | [GitHub](https://github.com/Ya-MiC/yanming-official-website) |
| `dsh` | 中央技能與規範庫 | [GitHub](https://github.com/Ya-MiC/dsh) |

### 參考技能與項目

- [GoogleChrome / modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) — Web 最佳實踐
- [chuspeeism / dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard) — 任務看板
- [morluto / rea](https://github.com/morluto/rea) — REA 架構參考
- [storytold](https://github.com/storytold) — 星雲圖與可視化
- [skills.sh](https://skills.sh/) — 技能發現與安裝 (`npx skills use`)

---

## REA 逆向架構 (REA Reverse-Engineering Architecture)

基於 **Resources-Events-Agents (資源-事件-參與者)** 本體論模型，對 AI 對話進行逆向拆解：

```
對話輸入 → Events (關鍵決策事件 / 靈感轉折點 / 待辦行動)
           ↓
    Resources (Notion/Obsidian 結構化模板 + YAML Frontmatter + 多維標籤)
           ↓
    Agents (本地知識庫寫入 + Claude Code / Codex 二次讀寫)
           ↓
    本地 Markdown + Obsidian 雙向鏈接 + 多星雲圖譜
```

---

## 快速開始 (Quick Start)

### 前置需求

- **Rust** 1.82+ (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **Node.js** 18+ 與 **pnpm** (`npm install -g pnpm`)
- **Tauri v2** 建構工具鏈
- **WebView2** (Windows) 或 **WebKitGTK** (Linux)

### 安裝與運行

```bash
# 克隆倉庫
git clone https://github.com/Ya-MiC/ymzz-zhanzhen.git
cd ymzz-zhanzhen

# 安裝前端依賴
pnpm install

# 構建 Rust 後端
cargo build --release

# 啟動開發模式
pnpm tauri dev

# 構建生產版本
pnpm tauri build
```

### Windows 用戶

下載 x64 portable ZIP (無需安裝 Node/Python，需既有 WebView2)：
- 查看 [GitHub Releases](https://github.com/Ya-MiC/ymzz-zhanzhen/releases)
- 或從 [CI Artifacts](https://github.com/Ya-MiC/ymzz-zhanzhen/actions) 下載最新構建

---

## 路線圖 (Roadmap)

| 階段 | 目標 | 狀態 |
|------|------|------|
| **P0** | 腳手架與基礎結構 | ✅ 完成 |
| **P1** | 核心與 Web 本地版 | ✅ 完成 (Windows CI 通過) |
| **P2** | 星雲 + 紅藍 + MockPay 閉環 + Web 公網 | 🔄 進行中 |
| **P3** | 真實 Vibe Pay + 桌面三平台 | 📋 規劃中 |
| **P4** | 手機與收尾 | 📋 規劃中 |
| **P5** | 凍結 | 📋 規劃中 |

---

## GitHub 專案管理

本專案使用 GitHub 的標準工作流：

- **Issues**：待辦事項與問題追蹤 (代辦清單)
- **Milestones**：階段性版本目標 (如 P2 星雲閉環)
- **PR (Pull Request)**：功能代碼合併至主分支
- **GitHub Projects**：看板視圖 (Todo / In Progress / Done)

新手建議：避免設定死板 DDL，改用 Milestone 劃分版本階段。

---

## 支付 (Alipay / 支付寶)

本項目參加 **支付寶 PAYATHON 2026 Vibe Pay**。本機靜態收款碼 GUI + 可選 Alipay sandbox 簽名 adapter。無假 QR、無前端付費權威、無真實交易承諾。

詳見 `docs/integration/PAYMENTS.md`。

---

## 授權 (License)

- **程式碼**：MIT
- **設計系統**：參考 `ymzz-wenrun-design-skill` (MIT)
- **第三方**：維持原授權，詳見 `THIRD-PARTY.md`

---

## 關於作者

**晏銘湛箴 (Yanming Zhanzhen)** — 本地優先智能體開發者，DSH 插件生態建設者。

- 官網：https://ya-mic.github.io/yanming-official-website/
- 無用之用：https://ya-mic.github.io/ymzz-wuyong-zhi-yong/
- 無無即無：https://ya-mic.github.io/ymzz-wuwong-ji-wung/
- 每日復盤：https://ya-mic.github.io/ymzz-loop/

---

> 「承認圖靈機的有限性，將確定性發揮到極致。」—— 晏銘湛箴
