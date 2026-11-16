# 藍隊回應 — BLUE_RESPONSE.md

回應對象：`04-research/RED_REPORT.md`（紅隊階段 1 攻擊）
藍隊立場：執行使用者願景與 `03-tasks/blue-brief-techstack.md`。裁判為使用者。

---

## 回應格式

每條：接受 / 部分接受 / 駁回（附證據） + 修正措施（若有）

---

### R-01 Tauri 2 iOS/Android 成熟度未驗證

**藍隊：部分接受**

Tauri 2 行動端支援確實比桌面晚，但 STACK.md 已將 iOS/Android 標記「有條件」與 [未驗證]，並非斷言一定可行。紅隊擔心「同一套產品多平台」會 collapse，藍隊同意此風險。

**修正措施**：階段 1 僅保證 Windows/macOS/Linux 桌面；iOS/Android 列為「後續階段（G2 關卡）」，在確認 Tauri 2 行動端成熟度後再決定是否納入。對應 D-1。

**證據**：STACK.md 層 A 最大風險已寫「Tauri 手機（iOS/Android）成熟度低於桌面」；Q1 表格 iOS/Android 為「有條件」。

---

### R-02 sidecar Python 僅桌面可用，手機 Python 方案未落地

**藍隊：接受**

sidecar 僅桌面可用是 Tauri 事實。藍隊同意「手機只上不需要 Python 的工具」，桌面保留 Python sidecar。

**修正措施**：在 AGENTS.md 寫明此限制；手機版功能子集僅包含不需要 Python 的工具；桌面保留 Paddle OCR 本地部署、JS 混淆等 Python sidecar 功能。對應 D-2。

**證據**：STACK.md Q1 sidecar 段落；層 C 已比較 Rust/PyO3/Chaquopy/ONNX/手機不上 Python。

---

### R-03 一個人維護 Rust + Vue 雙打包鏈成本過高

**藍隊：部分接受**

使用者自述工程經驗有限，一人維護 Rust+Vue 雙棧確實成本高。但使用者已於 2026-10-30 選定 Tauri 2 + Rust + Vue（D-003 暫定）。藍隊不反對技術棧，但同意需評估一人可維持性。

**修正措施**：在階段 1 結論中加入「一人維護成本評估」；若發現無法維持，減少為單一語言（全部 Rust 或全部 TypeScript）。對應 D-6、D-7。

**證據**：STACK.md 一頁結構層 A~C；INTENT.md「工程經驗有限」。

---

### R-04 程式碼簽名與公證成本，SmartScreen 阻擋使用者

**藍隊：接受**

Windows EV 代碼簽名貴、macOS Apple Developer $99/年，開源專案負擔重。未簽名安裝包會觸發 SmartScreen，損害「信任」核心價值。

**修正措施**：階段 1 採「可攜版（portable）」（無安裝程式，較少觸發 SmartScreen）；延後簽名至有預算後；在下載頁/ README 明說「未簽名，請自行驗證」。對應 D-3、D-4。

**證據**：STACK.md 層 Q；CONSTRAINTS.md「乾淨安裝、乾淨卸載」。

---

### R-05 四色上限與原色不得更動，語意色缺失

**藍隊：部分接受**

四色確實無法表達 danger/success/warning/info。但原色不得更動是使用者堅持（CONSTRAINts.md）。語意色可用 ink/衍生深階表示，不計入四色。

**修正措施**：確認 D-010（是否允許加語意色與狀態色層）；若允許，以 ink/衍生深階代表語意，不改原色。對應 D-5。

**證據**：palettes.md 第 24-27 行「已知缺口（待決定 D-010）」；CONSTRAINTS.md 第 13 行。

---

### R-06 WebView 與瀏覽器 CSS 特性差異

**藍隊：接受**

各 WebView 對 OKLCH、color-mix、backdrop-filter、View Transitions 支援不一。藍隊同意設定 browserslist 基線，提供 hex 降級，View Transitions 視為純增強。

**修正措施**：在層 E 加入 CSS 降級策略；層 H 將 View Transitions 標註為「純增強，不作為核心」。對應 R-13 併同處理。

**證據**：STACK.md Q1 WebView 差異表；層 E、H。

---

### R-07 零收集前提下，無法得知使用者與崩潰

**藍隊：部分接受**

不收集資料是核心原則，但品質難以改進。藍隊同意加入「崩潰報告匯出」由使用者手動觸發，不自動上傳。

**修正措施**：在設定頁加入「匯出本地日誌／崩潰報告」手動按鈕，使用者決定是否送出；說明不自動上傳。對應層 S。

**證據**：STACK.md 層 M、S；CONSTRAINTS.md「不收集資料」。

---

### R-08 依賴授權合規自動化需核實字體與圖標

**藍隊：接受**

cargo-deny / license-checker 不一定覆蓋字體與圖標授權；需逐一查證 LICENSE 檔。

**修正措施**：在 RESOURCES.csv 補充字體與圖標授權欄位；CI 加入字體圖標授權檢查腳本。對應層 J、P。

**證據**：STACK.md 層 J、P；CONSTRAINTS.md「依賴只收寬鬆授權」。

---

### R-09 審美憲章難以 100% 機器執行

**藍隊：接受**

stylelint/ESLint 可禁止 token 外 hex 與間距，但「溫潤」、「留白與層次」難以機器化。藍隊同意建立元件樣本庫與 AGENTS.md 規範。

**修正措施**：建立 `05-code/` 元件樣本庫，每個元件附「允許與不允許」案例；AGENTS.md 寫明查核清單。對應立場十六。

**證據**：STACK.md 層 E、R；總述.md 第 30 條。

---

### R-10 本地儲存結構與「檔案結構整齊」需明確規範

**藍隊：接受**

SQLite 檔案放置路徑、tauri-plugin-store 儲存位置未明確定義，可能導致卸載後殘留。

**修正措施**：在 AGENTS.md 定義檔案結構規範（資料放 %LOCALAPPDATA%/<app>，設定用 tauri-plugin-store，卸載腳本清理）。對應層 L。

**證據**：STACK.md 層 L；INTENT.md「檔案結構整齊」。

---

### R-11 tauri-driver 在 macOS 不支援，手機端測試缺失

**藍隊：接受**

tauri-driver 官方不支援 macOS；手機端測試需要實機。藍隊同意桌面用 Playwright，手機用實機或模擬器（模擬器不算無障礙驗收，需標註）。

**修正措施**：層 N 註明「桌面：Playwright；macOS 不支援 tauri-driver；手機：實機/模擬器，標註限制」。對應層 N。

**證據**：STACK.md 層 N。

---

### R-12 GitHub Actions macOS runner 分鐘數限制

**藍隊：接受**

iOS/macOS 建置需 macOS runner，分鐘數有限，開源專案容易超額。

**修正措施**：iOS/macOS 建置僅在 Release 時觸發，標準 PR 僅跑 Windows/Linux；或使用自建 macOS runner。對應層 O。

**證據**：STACK.md 層 O。

---

### R-13 View Transitions API 不支援於大部分 WebView

**藍隊：接受**

View Transitions API 僅新版瀏覽器支援，不可作為核心動效。藍隊同意改用 @vueuse/motion + CSS 為主。

**修正措施**：層 H 推薦改為 @vueuse/motion + CSS 為主，View Transitions 為純增強。對應層 H、R-06。

**證據**：STACK.md 層 H。

---

### R-14 一頁結構的風險欄多標 [未驗證]

**藍隊：接受**

絕大部分事實標 [未驗證]，需現查。階段 2 將逐層詳查並補上 RESOURCES.csv 與 VERIFY_LOG.md。

**修正措施**：階段 2 進行現查，標註 [已驗證] 或 [二手]，附來源與日期。對應層。

**證據**：STACK.md 所有 [未驗證] 標記。

---

### R-15 無障礙目標 WCAG 2.2 AA 缺乏自動化測量工具（axe-core MPL-2.0）

**藍隊：部分接受**

axe-core 是 MPL-2.0，CONSTRAINTS.md 未明排除 MPL-2.0；自動化測試不等於實機 NVDA/VoiceOver 測試。

**修正措施**：在 RESOURCES.csv 明標 axe-core MPL-2.0 風險；補加 NVDA/VoiceOver 手動測試紀錄。對應層 N。

**證據**：STACK.md 層 N；CONSTRAINTS.md 第 15 行。

---

## 對 D-1 至 D-7 決策清單的藍隊立場

| # | 問題 | 藍隊立場 | 理由 |
|---|------|----------|------|
| D-1 | Tauri 2 手機納入階段 1？ | 接受紅隊推薦（否） | 避免手機不成熟阻斷項目 |
| D-2 | 手機版 Python 怎麼辦？ | 接受 | sidecar 僅桌面，手機 ONNX/Rust |
| D-3 | 安裝包以什麼為主？ | 接受（可攜版） | 零痕跡，避免 SmartScreen |
| D-4 | 接受暫時無簽名？ | 接受 | 開源成本高，信任可透過其他方式建立 |
| D-5 | 四色允許加語意色層？ | 接受 | 產品需表達語意，原色不變 |
| D-6 | 確認 Tauri 2 + Rust + Vue 3？ | 確認 | 使用者已選定，但評估一人成本 |
| D-7 | 動效庫以什麼為主？ | 接受（@vueuse/motion + CSS） | WebView 支援不一 |

---

## 待使用者裁決

請確認 D-1 至 D-7 是否接受。若全部接受，紅藍對抗階段 1 結束，藍隊進入階段 2（逐層詳查 + RESOURCES.csv + VERIFY_LOG.md），並將 D-1 至 D-7 結論寫入 `00-intent/DECISIONS.md`。

若有任何項目不接受，請說明，紅隊與藍隊最多再進行兩回合。
