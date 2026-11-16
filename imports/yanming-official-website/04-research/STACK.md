# STACK.md — 晏銘湛箴 技術棧全面盤點（藍隊階段 1）

來源：`03-tasks/blue-brief-techstack.md`、使用者願景（INTENT.md、CONSTRAINTS.md）、設計系統（01-brand/）

**狀態**：階段 1 結論草案，等待使用者確認後進入階段 2。

---

## 一頁結論（每層一行：推薦 / 備選 / 最大風險）

| 層級 | 推薦方案 | 備選 | 最大風險 | 驗證標記 |
|------|----------|------|----------|----------|
| A 應用殼與架構 | Tauri 2 + Cargo workspace + pnpm workspace monorepo；單殼 + 多模組 | Electron、Capacitor | Tauri 手機（iOS/Android）成熟度低於桌面；iOS 建置需 macOS + Xcode | [未驗證] |
| B Rust 層 | tokio + reqwest + rusqlite/sqlx；Tauri 官方插件（store/sql/fs/updater/haptics/notification/deep-link/single-instance/window-state） | Wails、Dioxus、Slint | Rust 與 Vue 的 IPC 型別同步維護成本 | [未驗證] |
| C Python 層 | 改寫成 Rust 或 PyO3 嵌入；手機版不上 Python 需要的工具 | FastAPI 本地 HTTP、Nuitka、Chaquopy | sidecar 僅桌面可用，手機無法啟動 Python 子進程 | [未驗證] |
| D 前端 | Vue 3 + Vite + TypeScript + Pinia + Vue Router + VueUse | Nuxt | WebView 與瀏覽器差異（OKLCH、View Transitions 等） | [未驗證] |
| E 樣式 | CSS 變數優先 + Tailwind 4 (@theme)；stylelint/ESLint 禁止 token 外 hex 與間距 | UnoCSS、純 CSS | 審美憲章難以 100% 機器執行 | [未驗證] |
| F 元件與無障礙 | Reka UI（Vue 版）或 shadcn-vue；完全自訂「溫潤」外觀 | Ionic Vue、Konsta UI | 缺乏 Vue 成熟的無障礙元件庫；需自行補 ARIA/焦點 | [未驗證] |
| G 覆蓋層與回饋 | Floating UI + vue-sonner + vaul-vue + driver.js + PhotoSwipe；逐一查證授權 | Naive UI、PrimeVue | intro.js 等 AGPL 必須排除 | [未驗證] |
| H 動效 | @vueuse/motion + View Transitions API + CSS；emilkowalski/skills 作為動效審查規則 | Lottie/dotLottie、GSAP（需細讀商用條款） | GSAP 自訂授權可能不符可商用要求 | [未驗證] |
| I 觸控與手感 | 視覺 16px / 熱區 44px；連續熱區無死區；tauri-plugin-haptics | — | 各平台觸覺差異；需「可關閉」設計 | [未驗證] |
| J 圖標與字體 | Lucide / Tabler / Iconoir（需查授權）；Noto Sans TC / LXGW WenKai / Pretendard（需確認 CJK 子集化） | — | CJK 字體體積大，載入策略關鍵 | [未驗證] |
| K IPC 與型別共享 | tauri-specta + ts-rs | — | Rust 型別與 TS 型別漂移 | [未驗證] |
| L 儲存與同步 | 本地 SQLite + tauri-plugin-store；不做雲端；評估 CRDT/檔案同步 | — | 「不收集資料」與未來同步需求的張力 | [未驗證] |
| M 安全與隱私 | Tauri capabilities 權限最小化 + CSP + 隔離模式 + 預設拒絕網路 | — | 本地 loopback 服務需綁 127.0.0.1 + 隨機埠 + 驗證 token | [未驗證] |
| N 測試 | Rust 單元 + Vitest + Playwright + axe-core（MPL-2.0，需標註） | tauri-driver（macOS 不支援，需核實） | 手機端測試成本高 | [未驗證] |
| O CI/CD | tauri-apps/tauri-action 矩陣（Windows/macOS/Linux/Android/iOS） | GitHub Releases | iOS/macOS 建置需 macOS 主機；Apple Developer 年費 | [未驗證] |
| P 授權合規自動化 | cargo-deny + cargo-about + license-checker；CI 失敗條件寫死 GPL/AGPL/Commons Clause/CC-NC | — | 字體與圖標授權易被忽略 | [未驗證] |
| Q 發布與分發 | GitHub Releases；winget / Homebrew cask / Flathub / Google Play / App Store | Microsoft Store / Mac App Store（沙盒限制） | 程式碼簽名與公證成本；開源專案免費簽名方案有限 | [未驗證] |
| R 文件與品牌 | VitePress 白皮書站 + README 規範 + AGENTS.md + SKILL.md | — | 代理能否按審美憲章工作需持續調校 | [未驗證] |
| S 可觀測性 | 本地日誌 + 崩潰報告匯出（使用者自行決定是否送出） | — | 零上傳前提下偵測困難 | [未驗證] |

---

## Q1. 能不能用 Tauri 把同一套產品封裝成多個平台版本？

### 平台支援成熟度（逐項）

| 平台 | 成熟度 | 安裝包格式 | 程式碼簽名與公證 | 驗證標記 |
|------|--------|------------|------------------|----------|
| Windows | 可以 | NSIS / MSI（tauri-action 預設 NSIS） | Windows 簽名（EV 代碼簽名憑證較貴；開源可用無簽名或自我簽名，但會觸發 SmartScreen） | [未驗證] |
| macOS | 可以 | dmg | Apple Developer ID + notarization（需 $99/年 Apple Developer 計畫） | [未驗證] |
| Linux | 可以 | deb / rpm / AppImage | 較少強制簽名，視發行版而定 | [未驗證] |
| Android | 有條件 | APK / AAB | Android keystore；Google Play 簽名 | [未驗證] |
| iOS | 有條件 | IPA | Apple Developer ID（$99/年）；iOS 建置**僅限 macOS + Xcode** | [未驗證] |

**Tauri 最新穩定版**：[未驗證]（需上官方文件與 GitHub releases 核實，標註日期）

### 建置主機要求

- Windows：可在 Windows 上建置 Windows、Android
- macOS：可在 macOS 上建置 macOS、iOS（需 Xcode）、Android
- Linux：可在 Linux 上建置 Linux
- iOS 必須在 macOS 上建置 → CI 方案需納入 macOS runner（GitHub Actions macOS runner 可用，但分鐘數有限）

### WebView 差異與 CSS 特性支援

| 特性 | Windows (WebView2) | macOS/iOS (WKWebView) | Linux (WebKitGTK) | Android (System WebView) | 建議 |
|------|--------------------|----------------------|-------------------|--------------------------|------|
| OKLCH | 支援（Windows 11 近期版） | 支援 | 部分 | 部分 | 設定 browserslist 基線，備用 hex fallback |
| color-mix | 支援 | 支援 | 部分 | 部分 | 同上 |
| backdrop-filter | 支援 | 支援 | 有限 | 有限 | 謹慎使用，提供 fallback |
| View Transitions API | 新版支援 | 新版支援 | 不支援 | 不支援 | 視為純增強，不作為核心 |
| dvh / safe-area | 支援 | 支援（iOS 安全區） | 支援 | 支援 | 需設定 viewport 與 env() |
| overscroll | 支援 | 支援 | 支援 | 支援 | — |
| Pointer Events | 支援 | 支援 | 支援 | 支援 | — |

**替代渲染方案**：CEF runtime 可消除 WebView 差異，但會大幅增加體積，與 Tauri 輕量哲學不符，建議**否決**，改用 CSS fallback 策略。

### sidecar（externalBin）只在桌面可用？

**屬實**。Tauri sidecar 僅在桌面（Windows/macOS/Linux）可用，手機（Android/iOS）無法啟動 Python 子進程。

手機版 Python 功能的方案比較：

| 方案 | 可行性 | 優點 | 缺點 |
|------|--------|------|------|
| 改寫成 Rust | 高 | 與 Tauri 同語言，體積小，手機皆可用 | 重寫成本高 |
| PyO3 嵌入 | 中 | Rust 呼叫 Python | 手機仍難打包 Python 執行環境 |
| Chaquopy（Android） | 低（僅 Android） | Android 支援 Python | iOS 不支援，授權需查 |
| BeeWare/Briefcase | 中 | 跨平台 Python | 與 Tauri 整合複雜，體積大 |
| 模型轉 ONNX + Rust ort | 高 | 手機皆可用，無 Python 依賴 | 僅適用 ML 推論，不適用通用腳本 |
| 手機版只上不需要 Python 的工具 | 高 | 最簡單，符合本地優先 | 功能受限 |

**推薦**：優先「改寫成 Rust」或「模型轉 ONNX + Rust ort」；手機版只上不需要 Python 的工具。Python 僅在桌面 sidecar 使用。

### 乾淨安裝／卸載與「不改註冊表」

Windows 安裝程式通常會寫解除安裝登錄項。評估：

| 方案 | 零痕跡程度 | 缺點 |
|------|------------|------|
| 可攜版（portable） | 最高（無安裝程式，解壓即用） | 無自動更新、無檔案關聯、無開始選單 |
| 每使用者安裝（per-user NSIS） | 中 | 仍會寫 HKCU 解除安裝項、WebView2 使用者資料夾 |
| WebView2 使用者資料夾 | 無法避免 | WebView2 會在 %LOCALAPPDATA% 寫資料 |

**推薦**：主推「可攜版」作為最接近零痕跡的做法；提供 per-user NSIS 作為選項；明寫無法避免的例外（WebView2 使用者資料夾、Windows 解除安裝登錄項）。

### 自動更新（updater）

- 桌面可用，需簽章金鑰與靜態 endpoint
- 不收集資料：updater 僅檢查版本號，不上傳使用者數據；可使用 GitHub Releases API（公開，不需認證）
- 手機走商店更新（Google Play / App Store），限制較多

### 一個殼 + 多個工具模組 vs 每個工具獨立 Tauri 應用

**推薦：一個殼 + 多個工具模組（共用設計系統與 Rust 核心）**

理由：符合「大平台是視覺統一外殼，小而精每個工具只解決一個小問題」的哲學；體積更小、更新更簡單、維護成本低。

取捨：
- 一個殼 + 多模組：優點是視覺統一、共用核心、更新統一；缺點是單一殼崩潰影響所有工具
- 每個工具獨立：優點是隔離性好；缺點是體積大、維護多套、視覺易分歧

---

## Q2. rust + python + vue + js 之外，還有哪些重要的東西？

見第 4 節分層清單，每一層都有結論（見上表）。

---

## 需要使用者決定的事（最多 7 項）

1. **技術棧確認**：是否確認 Tauri 2 + Rust + Vue 3 + TypeScript？（D-003 已暫定，需確認）
2. **手機版 Python 策略**：是改寫成 Rust、ONNX，還是手機版不上 Python 工具？（需決定）
3. **安裝包策略**：以可攜版為主，還是 per-user NSIS 為主？（需決定）
4. **單殼 vs 多應用**：確認採「一個殼 + 多個工具模組」？（建議採用）
5. **iOS/macOS CI**：GitHub Actions macOS runner 分鐘數有限，是否接受？（需決定）
6. **程式碼簽名**：開源專案是否接受暫時無簽名（SmartScreen 警告）或自我簽名？（需決定）
7. **動效庫授權**：GSAP 需細讀商用條款，是否接受，還是改用 @vueuse/motion + CSS？（需決定）

---

> 以上事實標記 [未驗證] 者，需上官方文件與 GitHub releases 現查後標註 [已驗證] 或 [二手]。階段 2 將逐層詳查並補上 RESOURCES.csv 與 VERIFY_LOG.md。
