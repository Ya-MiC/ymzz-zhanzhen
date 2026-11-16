# 紅隊審查報告 — RED_REPORT.md

審查對象：藍隊階段 1 `04-research/STACK.md`
紅隊立場：來自起草者 Claude 的獨立判斷，非藍隊武器。裁判為使用者。
使用者已選定目標（2026-10-30）：長期品牌資產，非快速現金流。

---

## Steelman（藍隊方案最強版本）

Tauri 2 + Rust + Vue 3 + TypeScript 單殼多模組，本地優先、零收集、MIT，四套溫潤色票，44px 熱區，依賴皆可商用。成立前提：(1) Tauri 2 手機端（特別是 iOS）足夠成熟；(2) sidecar 僅桌面可用，手機 Python 功能可被 Rust/ONNX 替代；(3) 一個人能維護 Rust+Vue 双打包鏈；(4) 開源專案可接受暫時無程式碼簽名帶來的 SmartScreen 警告。

---

## 攻擊發現（Top 15，分級排序）

### R-01 [S0 阻斷] Tauri 2 iOS/Android 成熟度未驗證，可能直接阻斷多平台目標
- 攻擊對象：STACK.md 層 A 推薦「Tauri 2 多平台」；Q1 表格將 iOS/Android 標記「有條件」，但未查證 Tauri 2 官方最新穩定版與手機支援狀態。
- 攻擊：Tauri 2 的行動端支援（特別是 iOS WKWebView 整合、觸控手勢、側邊欄、安全區）長期落後於桌面。若 iOS/Android 不成熟，「同一套產品多平台」核心承諾會 collapse。
- 證據：需上 https://tauri.app 與 GitHub releases 核實 Tauri 2 最新穩定版號與手機支援成熟度；目前 STACK.md 全數標 [未驗證]。
- 影響／可能性／可逆性：高｜高｜高（換 Electron/Capacitor 可逆，但會推翻 Tauri 決定）
- 證偽測試：上 tauri.app/docs 與 github.com/tauri-apps/tauri releases，找出 Tauri 2 手機（iOS/Android）正式支援聲明與範例；若找不到正式文件，則此項成立。
- 最低成本修正：先確認 Tauri 2 手機成熟度；若不足，將 iOS/Android 改為「後續階段」，階段 1 只保證 Windows/macOS/Linux 桌面。
- 若不修：後續發現手機做不出，已投入的 Vue/Tauri 代碼需重構，浪費數月。

### R-02 [S1 嚴重] sidecar Python 僅桌面可用，手機 Python 方案未落地，與「同一套產品」衝突
- 攻擊對象：STACK.md Q1 sidecar 段落與層 C 推薦「改寫成 Rust / ONNX / 手機不上 Python」。
- 攻擊：sidecar 僅桌面可用是 Tauri 事實。若手機上需要 Python（例如 OCR、JS 混淆），改寫成 Rust 成本極高；ONNX 僅適用 ML 推論，不適用通用腳本。「手機只上不需要 Python 的工具」會縮減手機版功能，與「同一套產品多平台」不一致。
- 證據：Tauri 2 sidecar 外掛文件（externalBin 僅桌面）；已知限制見 STACK.md。
- 影響／可能性／可逆性：中｜高｜中（可改範圍，但會減少手機功能）
- 證偽測試：列出手機版需要 Python 的具體功能（如 Paddle OCR 本地部署、JS 混淆），檢查是否有 Rust 等價實作；若無，此項成立。
- 最低成本修正：明確界定手機版功能子集（只上不需要 Python 的工具），桌面保留 Python sidecar；在 AGENTS.md 寫明此限制。
- 若不修：手機版與桌面版功能不對等，使用者困惑，品牌「統一外殼」承諾受損。

### R-03 [S1 嚴重] 一個人維護 Rust + Vue 雙打包鏈成本過高，與「一個人開發」現實不符
- 攻擊對象：STACK.md 全表推薦 Rust + Vue；Q2 列出多種語言與打包鏈。
- 攻擊：使用者自述「工程經驗有限」，一個人維護 Rust（後端 + sidecar）+ Vue（前端）+ Tauri IPC 型別同步（tauri-specta/ts-rs）的雙打包鏈，成本極高。紅隊立場：目標本身不改，但需評估是否一人可維持。
- 證據：STACK.md 層 B、C、D、K；D-003 已暫定 Tauri 2 + Rust + Vue。
- 影響／可能性／可逆性：高｜中｜低（可減少語言，但會改變技術棧）
- 證偽測試：估算一人每週可投入開發時數；若少於 20 小時，Rust+Vue 雙棧難以持續。
- 最低成本修正：評估是否可減少為單一語言（例如全部 Rust + Dioxus/Slint，或全部 TypeScript + Electron/Wails）；或明確接受「外包部分模組」。
- 若不修：一人無法維持，項目停滯，品牌資產無法累積。

### R-04 [S1 嚴重] 程式碼簽名與公證成本與開源專案現實不符，SmartScreen 會阻擋使用者
- 攻擊對象：STACK.md 層 Q「程式碼簽名與公證的成本與流程」，D-010 等待決定。
- 攻擊：Windows EV 代碼簽名憑證貴（每年數百美元），macOS Apple Developer ID $99/年 + notarization。開源專案若不簽名，Windows SmartScreen 會顯示「Windows 保護了你的電腦」，使用者不敢安裝，直接損害「信任」核心價值。
- 證據：STACK.md 層 Q；常見開源桌面軟體皆面臨此問題。
- 影響／可能性／可逆性：高｜中｜中（可用自我簽名，但 SmartScreen 仍會警告）
- 證偽測試：嘗試用未簽名的 Tauri 安裝包在 Windows 上安裝，觀察 SmartScreen 行為；查詢 EV 代碼簽名憑證價格。
- 最低成本修正：階段 1 採「可攜版（portable）」（無安裝程式，較少觸發 SmartScreen）；延後簽名至有預算後；在下載頁明說「未簽名，請自行驗證」。
- 若不修：使用者安裝時被 SmartScreen 阻擋，信任承諾破滅。

### R-05 [S1 嚴重] 四色上限與原色不得更動，可能不足以做出完整產品（語意色缺失）
- 攻擊對象：STACK.md 層 E、J；CONSTRAINTS.md「四套色票的原色不得更動」；palettes.md 已知缺口 D-010（無 danger/success/warning/info 語意色）。
- 攻擊：四色（bg/surface/raised/accent）加上 ink/on-accent，無法表達錯誤、成功、警告等語意；D-010 已標「待決定」。若強行加色，違反原色不得更動；若不加，產品缺乏語意反饋，違反大廠介面九關。
- 證據：palettes.md 第 24-27 行「已知缺口（待決定 D-010）」；CONSTRAINTS.md 第 13 行。
- 影響／可能性／可逆性：中｜高｜中（可加衍生語意色層，但需使用者決定）
- 證偽測試：在實際介面中嘗試用四色表達「錯誤／成功／警告」，檢查對比度與可辨認度；若無法，此項成立。
- 最低成本修正：先確認 D-010（是否允許加語意色與狀態色層，不計入四色）；若允許，以 ink/衍生深階代表語意，不改原色。
- 若不修：產品無法表達錯誤狀態，違反「每個頁面都要設計非理想狀態」原則。

### R-06 [S2 中等] WebView 與瀏覽器 CSS 特性差異，會直接影響動效與觸控設計
- 攻擊對象：STACK.md Q1 WebView 差異表；OKLCH、View Transitions、backdrop-filter 等。
- 攻擊：Windows WebView2、macOS/iOS WKWebView、Linux WebKitGTK、Android System WebView 對 OKLCH、color-mix、backdrop-filter、View Transitions 支援不一。溫潤設計系統大量依賴 CSS 變數與 OKLCH，若某 WebView 不支援，視覺會崩壞。
- 證據：STACK.md Q1 表格；Can I Use（需現查）。
- 影響／可能性／可逆性：中｜中｜低（可用 CSS fallback）
- 證偽測試：在各 WebView 上測試 OKLCH 与 hex fallback；確認 `color-mix` 是否廣泛支援。
- 最低成本修正：設定 browserslist 基線，為不支援 OKLCH 的 WebView 提供 hex 降級；View Transitions 視為純增強，不作為核心。
- 若不修：部分平台視覺與設計系統不符，破壞「品牌統一」。

### R-07 [S2 中等] 零收集前提下，無法得知使用者與崩潰，信任與品質難以平衡
- 攻擊對象：STACK.md 層 M、S；INTENT.md「不收集資料」。
- 攻擊：不收集任何資料意味著無法知道崩潰率、使用頻率、哪個功能壞了。與「信任」核心價值並行，但品質難以改進；層 S 僅提「本地日誌、崩潰報告匯出（使用者自行決定）」，依賴使用者主動，回收率低。
- 證據：STACK.md 層 M、S；CONSTRAINTS.md「不收集資料」。
- 影響／可能性／可逆性：中｜低｜中（可加「崩潰報告匯出」由使用者手動觸發）
- 證偽測試：檢查是否有本地崩潰日誌路徑；是否有「匯出崩潰報告」按鈕。
- 最低成本修正：在設定頁加入「匯出本地日誌／崩潰報告」手動按鈕，使用者決定是否送出；說明不自動上傳。
- 若不修：崩潰無法被發現，品質無法迭代，長期信任受損。

### R-08 [S2 中等] 依賴授權合規自動化需核實字體與圖標，容易遺漏
- 攻擊對象：STACK.md 層 J、P。
- 攻擊：cargo-deny / license-checker 能檢 Rust/npm 依賴，但字體（Noto Sans TC、LXGW WenKai、Pretendard）與圖標（Lucide、Tabler、Iconoir）的授權不一定被這些工具覆蓋；需逐一查證 LICENSE 檔。
- 證據：STACK.md 層 J、P；CONSTRAINTS.md「依賴只收寬鬆授權」。
- 影響／可能性／可逆性：中｜中｜低（可補檢字體圖標授權）
- 證偽測試：逐一查證 Noto Sans TC、LXGW WenKai、Pretendard、Lucide、Tabler、Iconoir 的 LICENSE 檔；若任一非 MIT/Apache-2.0/BSD/ISC，此項成立。
- 最低成本修正：在 RESOURCES.csv 補充字體與圖標授權欄位；CI 加入字體圖標授權檢查腳本。
- 若不修：可能誤用非可商用字體，引發訴訟風險，違反「授權乾淨」不可妥協。

### R-09 [S2 中等] 審美憲章難以 100% 機器執行，AI 可能每次重新造輪子
- 攻擊對象：STACK.md 層 E、R；立場十六「行為底座與品牌皮膚分離」。
- 攻擊：stylelint/ESLint 可禁止 token 外 hex 與間距，但審美憲章中的「溫潤」、「留白與層次」、「動效性格」難以機器化；AI 代理每次仍可能重新解釋，導致不一致。
- 證據：總述.md 第 30 條「審美不是裝飾」；層 E 提「讓審美憲章變成可執行的檢查」。
- 影響／可能性／可逆性：低｜中｜低（可建立元件樣本庫與 AGENTS.md 規範）
- 證偽測試：讓 AI 代理依 AGENTS.md 實作一個按鈕，與設計系統比較；若不一致，此項成立。
- 最低成本修正：建立 `05-code/` 元件樣本庫（Storybook/Histoire），每個元件附「允許與不允許」案例；AGENTS.md 寫明查核清單。
- 若不修：每個新頁面視覺不同，品牌資產稀釋。

### R-10 [S3 小] 本地儲存結構與「檔案結構整齊」需明確規範
- 攻擊對象：STACK.md 層 L；INTENT.md「檔案結構整齊」。
- 攻擊：SQLite 檔案放置路徑、tauri-plugin-store 儲存位置、使用者資料夾（AppData）未明確定義，可能導致卸載後殘留，違反「乾淨卸載」。
- 證據：STACK.md 層 L；CONSTRAINTS.md「乾淨安裝、乾淨卸載」。
- 影響／可能性／可逆性：低｜低｜低（可定義檔案結構規範）
- 證偽測試：安裝後執行，檢查 %APPDATA%、%LOCALAPPDATA% 殘留；卸載後掃描。
- 最低成本修正：在 AGENTS.md 定義檔案結構規範（資料放 %LOCALAPPDATA%/<app>，設定用 tauri-plugin-store，卸載腳本清理）。
- 若不修：卸載後殘留檔案，違反「乾淨卸載」承諾。

### R-11 [S3 小] tauri-driver 在 macOS 不支援，手機端測試缺失
- 攻擊對象：STACK.md 層 N。
- 攻擊：tauri-driver 官方不支援 macOS；手機端測試需要實機。自動化測試覆蓋不足。
- 證據：STACK.md 層 N「tauri-driver（macOS 不支援，請核實）」。
- 影響／可能性／可逆性：低｜低｜低（可用 Playwright 替代桌面，實機測試手機）
- 證偽測試：查證 tauri-driver 官方文件 macOS 支援狀態。
- 最低成本修正：桌面用 Playwright，手機用實機或模擬器（模擬器不算無障礙驗收，需標註）。
- 若不修：macOS 與手機端自動化測試缺失，品質風險。

### R-12 [S3 小] GitHub Actions macOS runner 分鐘數限制，iOS/macOS CI 成本高
- 攻擊對象：STACK.md 層 O。
- 攻擊：iOS/macOS 建置需 macOS runner，GitHub Actions macOS 分鐘數有限，開源專案容易超額。
- 證據：STACK.md 層 O；GitHub Actions 定價頁面（需現查）。
- 影響／可能性／可逆性：低｜低｜低（可限制 iOS 建置頻率）
- 證偽測試：查詢 GitHub Actions macOS runner 分鐘數配額。
- 最低成本修正：iOS/macOS 建置僅在 Release 時觸發，或使用自建 macOS runner；標準 PR 僅跑 Windows/Linux。
- 若不修：CI 分鐘數耗盡，建置中斷。

### R-13 [S3 小] View Transitions API 不支援於大部分 WebView，不應作為核心動效
- 攻擊對象：STACK.md 層 H。
- 攻擊：View Transitions API 僅新版瀏覽器支援，Tauri 的 WebView 多為舊版，不可作為核心動效方案。
- 證據：STACK.md 層 H；Can I Use（需現查）。
- 影響／可能性／可逆性：低｜低｜低（改用 @vueuse/motion + CSS）
- 證偽測試：在 Tauri WebView 上測試 View Transitions；若不支援，此項成立。
- 最低成本修正：層 H 推薦改為 @vueuse/motion + CSS 為主，View Transitions 為純增強。
- 若不修：部分平台動效失效，視覺不一致。

### R-14 [S3 小] 一頁結構的風險欄多標 [未驗證]，需現查才能進入階段 2
- 攻擊對象：STACK.md 全表「驗證標記」欄位。
- 攻擊：絕大部分事實標 [未驗證]，需上官方文件與 GitHub releases 現查；若查出不符（如 Tauri 2 版本號錯誤），階段 1 結論需修正。
- 證據：STACK.md 所有 [未驗證] 標記。
- 影響／可能性／可逆性：低｜中｜低（現查後修正）
- 證偽測試：逐一查證 Tauri 2 最新穩定版、各依賴版本、授權。
- 最低成本修正：階段 2 進行現查，標註 [已驗證] 或 [二手]，附來源與日期。
- 若不修：STACK.md 結論可能建立在錯誤事實上。

### R-15 [S3 小] 無障礙目標 WCAG 2.2 AA 缺乏自動化測量工具（axe-core 是 MPL-2.0）
- 攻擊對象：STACK.md 層 N；CONSTRAINTS.md「無障礙目標 WCAG 2.2 AA」。
- 攻擊：axe-core 授權 MPL-2.0（檔案級 copyleft），CONSTRAINTS.md 排除 GPL/AGPL 但未明排除 MPL-2.0；且自動化無障礙測試不等於實機 NVDA/VoiceOver 測試。
- 證據：STACK.md 層 N「axe-core 為 MPL-2.0，請標註」；CONSTRAINTS.md 第 15 行「無障礙目標 WCAG 2.2 AA 建議」。
- 影響／可能性／可逆性：低｜低｜低（可標註 MPL-2.0，或改用其他工具）
- 證偽測試：確認 axe-core LICENSE；若使用，在 RESOURCES.csv 標註 MPL-2.0 風險。
- 最低成本修正：在 RESOURCES.csv 明標 axe-core MPL-2.0；補加 NVDA/VoiceOver 手動測試紀錄。
- 若不修：無障礙合規狀態不明，WCAG 2.2 AA 宣稱無法驗證。

---

## 證偽測試總覽

| 編號 | 證偽測試（做什麼、看到什麼就表示紅隊錯了） |
|------|------------------------------------------|
| R-01 | tauri.app 官方文件明確寫出 iOS/Android 正式支援 Tauri 2，且有可運行範例 |
| R-02 | 手機版所有核心功能（OCR、JS 混淆等）都有 Rust 等價實作，且在手機上運行正常 |
| R-03 | 一人每週可投入 ≥20 小時開發，且 Rust+Vue 雙棧已有可運行骨架 |
| R-04 | 未簽名 Tauri 安裝包在 Windows 上不觸發 SmartScreen，或可獲得免費程式碼簽名 |
| R-05 | 四色 + ink/on-accent 能表達錯誤/成功/警告，且對比度達 WCAG AA，使用者接受 |
| R-06 | 各 WebView（WebView2/WKWebView/WebKitGTK/System WebView）均支援 OKLCH 且視覺一致 |
| R-07 | 本地崩潰日誌能被自動收集並分析，無需使用者手動匯出 |
| R-08 | 所有字體與圖標的 LICENSE 均為 MIT/Apache-2.0/BSD/ISC |
| R-09 | AI 代理依 AGENTS.md 實作的元件與設計系統 100% 一致，無需人工修正 |
| R-10 | 卸載後 %APPDATA%/%LOCALAPPDATA% 無殘留檔案 |
| R-11 | tauri-driver 支援 macOS，或 Playwright 能完整替代桌面自動化測試 |
| R-12 | GitHub Actions macOS runner 分鐘數足夠支援每次 PR 建置 iOS/macOS |
| R-13 | View Transitions API 在 Tauri WebView 上穩定支援，可作為核心動效 |
| R-14 | 所有 [未驗證] 事實經現查後皆正確，無需修正 STACK.md 結論 |
| R-15 | WCAG 2.2 AA 可透過自動化工具（非 MPL-2.0）完全驗證，無需手動測試 |

---

## 決策清單（不超過 7 項，交由使用者裁決）

| # | 問題 | 紅隊推薦 | 一句理由 |
|---|------|----------|----------|
| D-1 | Tauri 2 手機（iOS/Android）是否納入階段 1 範圍？ | 否，僅桌面（Windows/macOS/Linux），手機為後續階段 | 避免 Tauri 手機不成熟阻斷整個項目 |
| D-2 | 手機版 Python 功能怎麼辦？ | 改寫成 Rust 或 ONNX；手機只上不需要 Python 的工具 | sidecar 僅桌面可用，手機 Python 成本過高 |
| D-3 | 安裝包策略以什麼為主？ | 可攜版（portable）為主 | 最接近「零痕跡、乾淨卸載」，避免 SmartScreen |
| D-4 | 是否接受暫時無程式碼簽名？ | 接受，階段 1 用可攜版 + 明說未簽名 | 開源專案簽名成本高，信任可透過其他方式建立 |
| D-5 | 四色是否允許加語意色與狀態色層（不計入四色）？ | 允許，以 ink/衍生深階代表 | 產品需表達錯誤/成功/警告，原色不變 |
| D-6 | 技術棧是否確認 Tauri 2 + Rust + Vue 3？ | 確認，但評估一人維護成本 | 使用者已選定，但紅隊提醒成本風險 |
| D-7 | 動效庫以什麼為主？ | @vueuse/motion + CSS 為主，View Transitions 為純增強 | WebView 支援不一，GSAP 授權需細讀 |

---

> 裁判（使用者）：請逐項回應 D-1 至 D-7（接受／部分接受／駁回，並附理由）。紅隊與藍隊最多三回合，剩餘爭議彙整為不超過 7 項的決策清單寫入 `00-intent/DECISIONS.md`。
