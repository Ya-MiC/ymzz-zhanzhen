# 晏銘湛箴：完整 DSH 衍生應用（主產品）

<img src="../../runtime/ui/brand/icon-128.png" width="96" alt="使用者提供的湛箴原圖衍生尺寸">

這裡是完整官方 **DeepSeek Harness**，不是只抽 Cordis，也不是重新做一個 Tauri 外殼。原有 `apps/cli`、`apps/web`、`apps/desktop`（Electron）、`apps/desktop-host` 與全部上游套件一起建置。舊 `runtime/`、`runtime-desktop/` 和原始審計／React／Rust 工作區只增不減，保留為相容模組，不拿舊 Windows 成果冒充本產品。

## 真實來源／建置

- 官方來源：https://github.com/deepseek-ai/deepseek-harness
- 固定 SHA：`39163dd30f703a79079e2d2446545cff3c453738`，原版 `0.2.2-rc.3`。
- [`upstream/`](upstream/)：完整 **21,632** 追蹤檔，含 dotfiles、13 個 Git symlink；每個 Git blob／mode／SHA256 見 [`upstream.lock.json`](upstream.lock.json)。Windows 依原版 `.gitattributes` 將 `.cmd` 實體化為 CRLF，校驗時還原成 Git canonical LF；Git symlink 的文字替代只在建置副本安全實體化。不含 `.git`、未追蹤資料或歷史 Git 物件；並沒有聲稱搬入整個歷史資料庫。
- 原始來源不修改。`scripts/prepare.mjs` 驗證所有來源位元組，才在忽略的 `.worktree/` 建立可重現衍生副本。新增真正的 `@yanming/dsh-zhanzhen` production workspace package，408 個 workspace（原版 407）。
- 原版 MIT／THIRD_PARTY_NOTICES 原樣保留。新程式 MIT；使用者圖標不是重新授權為 MIT。
- 需要完整 **Node.js 24.9+ SDK**（含開發 headers；已驗證 24.22.1）與 **pnpm 11.28.5**。只使用產品資料夾，不改 bot 全域技能／`~/.agents`。

```sh
cd applications/dsh
pnpm install:upstream  # frozen lockfile、--ignore-scripts；不執行外部技能 CLI
pnpm build            # 真正官方完整八個 artifacts 建置閘
pnpm start            # 真正 pnpm dsh web；本機 URL 由官方 launcher 輸出
# 或在 build 完成後：pnpm dev --skip-build
# Windows：pnpm package:windows（官方 Electron --dir --unsigned；絕不發布）
```

`pnpm desktop` 為原生 Electron 開發入口；以 `--ignore-scripts` 安裝後，Electron binary 必須另外依原版經審查的安裝流程準備，不能把「尚未下載 binary」說成能啟動。上游完整建置 8 個閘已實際通過；開發 watch 中的編譯器亦固定在上游自己的 TypeScript，不會誤用外層舊專案 5.6。

不要同時執行 build 與 dev watchers。這是上游明文限制，不是讓兩個流程競寫產物。

## 已實際接進完整 DSH 的插件

`plugins/zhanzhen/index.mjs` 透過原版 Loader 啟動，正式 production assembly 會自動載入，不依賴一個另開的示範 shell：

- 原版 `ctx.agents.create` → 真正 `@deepseek-ai/dsh-agent-loop`。
- 原版 `ctx.llm.registerAdapter` → **明確標示 deterministic fake transport** 的離線示例。沒有模型推論，沒有 live／付費／NIM 呼叫。
- 原版 `ctx.tools.register` 註冊 `ymzz_read`、`ymzz_patch`、`ymzz_test`；官方 ApprovalService 的每次 asked／decided 與原生 session 事件照常持久化。
- 六個人工核准：讀程式、讀測試、錯誤修改、執行真實失敗測試、根據失敗修復、真實測試通過。最後才是人類差異驗收／還原／明確記憶。
- 私有產品 JSON 任務、寫入前日誌、證據雜湊鏈；重啟不自行執行未完成任務。整個受管工作區 hash snapshot 保護測試後驗收；不可悄悄改測試再宣稱原 gate 仍有效。
- 九項固定來源技能以 checksum 驗證後進入真正 `ctx.skills`；不自動執行它們的 CLI。
- 正式 `webserver/index-inject` 擴充完整 React App，加入暱稱引導、任務／驗證閘、原圖品牌與四套溫潤主題。原版對話、設定、外掛管理、模型編輯與資料夾選擇器保留。原版 UI 是 MIT React 元件，不引入不明授權 UI 模板。

啟動後先填暱稱。按「用完整 DSH Agent Loop 執行離線修復示例」，逐次審查工具提案，最後驗收或還原。回到原版工作區後，可用原生「設定 → 模型 → 自訂模型 API」設定 OpenAI 相容本機服務、模型與認證；這是原版真實 provider adapter，不是假串接。**未設定 provider 不代表已有可用模型**；本次沒有驗證使用者的實際模型／帳號。

## 證據與界線

- [`evidence/full-dsh-web-task.json`](evidence/full-dsh-web-task.json)：真正完整 DSH Web host、原生 Agent Loop、真實 Node 測試與人工 gate 的 API 整合證據。可重跑 `scripts/smoke-web.py --launch-log <這次自己啟動的官方輸出檔>`；不要將其中一次性本機 token 提交 Git。
- `pnpm test`：7 項來源／資源／封裝契約檢查；不拿靜態 contract tests 冒充 GUI 或模型推論。
- [Windows workflow](../../.github/workflows/full-dsh.yml)：原版 Electron Windows directory packaging，再以 Windows UIAutomation 操作**真正打包的完整應用**（不是瀏覽器腳本），在中文／空白 portable 路徑驗證暱稱、原生插件、任務、失敗→修復→通過、驗收／記憶與還原。**目前尚未以成功 CI 證據宣稱此完整 DSH Windows 包完成。**
- 舊 Windows Tauri artifact 仍在根 README 歷史段，但不是這裡的完整 DSH 下載。

自有三個受管工具有工作區界線、路徑／symlink／hardlink／秘密樣式限制、檔案 hash 衝突檢查、16 工具／8 次寫入上限、Node 測試 3 秒／16 KiB 輸出上限。這**不是 OS 沙盒或網路隔離**，也不是所有第三方 DSH 外掛的安全隔離；外掛是受信任 Node 程式。原版一般模型工作階段使用原版 DSH 權限機制，不能把示例的限制誤說成整個原版任意工具都已被本插件重新隔離。

## Windows／授權：實際阻擋，不冒充完成

完整 production graph 與先前 386 筆的相容層是不同事情：[`full-production-license-report.json`](evidence/full-production-license-report.json) 實際遍歷 Linux CLI＋Desktop Host 的 **664** 個 production／resolved-peer package。沒有把開發期的 LGPL eslint 或未進核心 closure 的 Claude SDK 當成已分發。

但是 `@deepseek-ai/dsh-attachment-local` → `sharp` → `@img/sharp-libvips-linux-x64@1.3.4` 的實際 license 為 **LGPL-3.0-or-later**。Windows 預編譯 sharp 也攜帶 native image engine，不能因 wrapper 寫 Apache-2.0 就宣稱二進位全是 MIT。這不等於 LGPL 禁止商用，而是與本次嚴格的 permissive／無 GPL-family 風險分發政策有衝突，尚未完成替代或逐項合規批准。官方安裝資料：https://sharp.pixelplumbing.com/install/ 。LibreOffice kit 的 MPL-2.0 也有獨立 notices／source 義務，未改標 MIT。

**因此 CI 允許內部建置／測試完整 EXE，但在 runtime license gate 清除前禁止上傳 EXE／portable artifact。** 只上傳不含應用程式二進位的測試證據。不能偷移除 image DLL、假裝上游影像功能還完整，也不能用「全部 MIT」掩蓋此問題。

衍生 Windows 使用上游 `package:desktop:win:x64:dir --unsigned`，不跑 NSIS、不註冊 `dsh://`、不修改自動啟動或自訂 registry persistence。產品資料與 cache 留在 portable 旁的 `湛箴資料/`；退出後可備份／移除整個資料夾。Electron 自帶 Chromium，**不是舊 Tauri 包的 WebView2 依賴**。作業系統／防毒／SmartScreen 可能自行寫入系統資料，不承諾「Windows 永遠零 registry 寫入」。尚未簽章。

## 保留但尚未完成的主產品整合

完整 Loop 來源、wuyong／wuwong／官網、REA MCP 本機分析模式、Office `registerFileViewer`、Archify、taskboard、現代 Web 與所有指定連結仍在[根覆蓋表](../../docs/integration/COVERAGE.md)及原始 imports。它們沒有被刪掉，但**不能把完整來源 snapshot／舊相容 adapter／本機記憶 JSON 說成已把每個上游 App 的完整功能變成 DSH 插件**。一般選定使用者專案的新增有界工具工作流、完整記憶中樞同步、REA 工具、Office viewer 和多端發行仍需進一步接線與驗收。原始審計工作區可照原指令運行，未聲稱已全部進入本 Electron distribution。

支付寶由使用者自行接入，既有手動／sandbox 程式僅保留，不擴展、不收款。Cloudflare Pages `product` 環境只允許 `main` 的既有保護問題不修改、不繞過；不改網域、route 或服務設定。

產品家族連結：
- https://ya-mic.github.io/ymzz-loop/
- https://bingce.yanmingx0215.filegear-sg.me/#onboarding
- https://ya-mic.github.io/yanming-official-website/
- https://ya-mic.github.io/ymzz-wuyong-zhi-yong/
- https://ya-mic.github.io/ymzz-wuwong-ji-wung/

## English

The primary product is now the **complete official DeepSeek Harness application** (Electron + Web + CLI + Desktop Host), pinned at `39163dd30f703a79079e2d2446545cff3c453738`, not a Cordis-only standalone runtime. All 21,632 tracked upstream files, original licenses and notices remain immutable; a separate reproducible build copy adds a genuine production DSH plugin. Original repository features and previous experiments are preserved additively.

The real upstream agent loop, tool registry, approval service and skills registry execute an explicitly fake-model coding fixture using real file changes and failing/passing Node tests. No live model, paid inference, payment or merchant setup was performed. Native upstream model configuration and workspace navigation remain available; a configured provider is not proof of a working model.

Full upstream artifact compilation passed all eight gates. Full Windows qualification uses upstream unsigned directory packaging and native UIAutomation; no successful full-DSH Windows delivery is claimed without its actual result. The strict license gate currently blocks runtime distribution because of the native sharp/libvips LGPL engine. It does not pretend that commercial LGPL is MIT, silently drop functionality, or reuse the old Tauri success as full-DSH proof. See the production license report and workflow. Payment belongs to the user; no release, deployment, protected settings or upstream repository was changed.
