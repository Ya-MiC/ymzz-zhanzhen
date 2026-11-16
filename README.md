# 晏銘湛箴_湛箴（ymzz-zhanzhen）

**我的本機 VibeCoding 智能體：三十輻共一轂，Skill 是可換的輻。**

> 首個可執行整合切片，並非完整產品交付。原有程式碼／功能／頁面／連結全部保留。新碼 MIT；第三方維持原授權。

- **真的會運作**：DSH 官方 MIT Cordis 插件內核 → 明確權限 → 無用之用規則調度 → 鎖定技能池 → Rust 文件驗證 → SQLite 任務與證據鏈 → 人工驗收 → 確認後記憶。
- **先離線驗證，再談智能**：17 項新 runtime/支付測試、4 項新 Rust gate 測試與原倉庫回歸；離線文件任務不冒稱模型推論。四套溫潤配色、暱稱先行、檔案選擇器、48px 熱區。
- **Windows**：[構建與可執行 smoke](https://github.com/Ya-MiC/ymzz-zhanzhen/actions/workflows/zhanzhen-runtime.yml) 只有真 GUI/core 離線任務成功才產生 portable ZIP；初始提交時尚待 CI，不拿 YAML 冒充成功。不是 MSI，不會偷偷安裝 Node/Python。尚無這個新 runtime 的手機發行包。
- **有界限的 DSH 衍生**：已核實 [官方原碼](https://github.com/deepseek-ai/deepseek-harness)，本切片實際編譯其 Cordis/Cosmokit，不假裝移植了完整 DSH Agent Loop。
- **來源完整可追**：Loop `product` 318 檔＋獨立 `main` 103 檔，另外保留三個模組；[逐檔來源 SHA、排除清單](docs/integration/sources.lock.json)。原目標實際是 Rust/React，不是規格所述 FastAPI/Vue。
- **支付不作假**：本機靜態收款碼 GUI＋可選 Alipay sandbox 簽名 adapter；無假 QR、無前端 paid 權威、無真實交易、無費率零元承諾。

### 你可以直接驗收

[操作與誠實狀態、Windows 驗收、已完成／未完成（繁中 → English）](docs/integration/README.md) · [全部要求覆蓋表與完整原連結](docs/integration/COVERAGE.md) · [九技能鎖檔](core-skills.lock.json) · [授權掃描](docs/integration/dependency-licenses.json) · [支付官方依據](docs/integration/PAYMENTS.md)

[稟冊引導／下載](https://bingce.yanmingx0215.filegear-sg.me/#onboarding) · [每日復盤與設定教學](https://ya-mic.github.io/ymzz-loop/) · [官網](https://ya-mic.github.io/yanming-official-website/) · [無用之用](https://ya-mic.github.io/ymzz-wuyong-zhi-yong/) · [無無即無](https://ya-mic.github.io/ymzz-wuwong-ji-wung/)

外部 Pages 的 `product` 分支部署仍被既有環境保護規則擋住；本次沒有修改規則、網域或路由，未假稱跨站反向入口已全部部署。Office 參考插件為 AGPL，只研究公開介面，不納入 MIT runtime；官網缺 LICENSE，僅原碼存檔不打包。

### English

A runnable first vertical slice of a local-first, DSH-kernel-derived plugin agent runtime, not merely a redesigned site. It preserves all original target files plus pinned source snapshots, and executes a deterministic offline task with real Rust evidence, human acceptance and explicit memory consent. This is **not** a completed autonomous coding agent, live model test, production payment system, or already-verified multi-platform release. See the linked README for exact executable proof, Windows CI/artifacts, source hashes and remaining gaps. No releases/packages are published here.

---

## 原 README（完整保留）

# 晏銘湛箴 — README

晏銘湛箴 — 支付寶 PAYATHON 2026 · Vibe Pay 參賽作品。

把人說過的話當作「潑出去的水」，用量化分數、標籤、來源索引為每一句做注解，再與 AI 的輸出和思維鏈做星雲匹配。

## 品牌（第 1 節，逐字不得動）
- 名稱：晏銘湛箴
- 簡介：無無即無，zhanranchangji（清靜經原文）

## 技術棧
Rust + Tauri v2 + React 18 + TypeScript + Vite + pnpm

## 階段
P0 腳手架 → P1 核心與 Web 本地版 → P2 星雲 + 紅藍 + MockPay 閉環 + Web 公網 → P3 真實 Vibe Pay + 桌面三平台 → P4 手機與收尾 → P5 凍結

## 授權
程式碼 MIT；設計系統參考 ymzz-wenrun-design-skill（MIT）。
