# 湛箴：首個可執行整合切片（繁體中文）

這不是另一次改網站，也不是只增加審計頁面。新程式在 `runtime/`，新桌面殼在 `runtime-desktop/`：**真正的插件生命週期 + 明確授權 + 本機 SQLite 任務／記憶 + Rust 驗證核心 + 人工驗收**。

## 先看事實，不把規格當作現況

- 目標 `master` 的基線 `dc5e806` 實際是 **Rust + Tauri 2 stub + React/TypeScript**，不是提示詞所描述的 FastAPI/Vue OCR→總帳平台。原有 92 個 tracked 檔案全部保留；並未刪除或替換一個「既有 FastAPI 管道」。原 `ymzz-core/pay/redblue/server` 和原 UI 仍在原路徑。
- 官方 https://deepseek.com/harness/ **確實連到** https://github.com/deepseek-ai/deepseek-harness 。本次固定 `39163dd30f703a79079e2d2446545cff3c453738`，MIT，實際編譯並執行其 `vendor/cordis/src` 和 `vendor/cosmokit/src`。不是借 DSH 名稱的虛構 fork。
- 誠實邊界：這是 **DSH 插件內核衍生版**，不是完整 DSH 發行版；上游 `dsh-agent-loop`、終端、任意插件安裝器、瀏覽器控制、遙測模組均未捆綁。自有固定離線任務迴圈不冒稱已運行上游完整 LLM Agent。
- 「無無即無」上游目前還是 skeleton/TODO，沒有可以直接呼叫的 CRUD 實作。本次在保留其原碼／SKILL 合約下，新增同角色的 SQLite 記憶 adapter，只有使用者驗收及再次同意的片段可以留存。

## 現在可以跑什麼

1. 第一次畫面填暱稱（尚未綁定手機，預設「用戶」，不虛構手機尾號）。
2. 在插件頁逐一確認 skills／dispatch／audit／memory 權限。
3. 建立任務：使用內附合成文字，或用檔案選擇器選 `.txt/.md/.csv`；不輸入路徑、不掃整碟。
4. 「認領」→「執行並通過驗證閘」：真 DSH Cordis 插件生命週期；真 Wuyong 固定規則表；真載入並檢查鎖定技能；真呼叫 Rust `ymzz-core/integrity`；最多兩次閘門檢查。
5. 狀態到 **待驗收**，不自動標成完成。使用者確認後到 done；再按「確認記住」才寫入記憶。
6. 看可逐筆核對的 SHA-256 雜湊鏈。空輸入失敗、重複認領、錯誤狀態、證據遭更改、未授權記憶都會被拒絕。
7. 四套溫潤主題、48px 命中、鍵盤焦點、原生 dialog、Ctrl/Cmd+K、空／錯誤／離線提示、側欄與麵包屑。
8. 可選本機 OpenAI 相容 provider，需分別啟用插件、設定 opt-in、按發送。只接受 loopback，不跑付費雲端／NIM，也沒有本次成功模型推論的宣稱。

**固定離線文字盤點不是 OCR、語義理解、任意程式碼任務、完整遞迴自修正或模型推論。** 本次最小自修正只處理 BOM/換行與空輸入的有界重試，詳見測試。

## 本機開發（Node 24.22.1，Rust；不需要 Python 常駐）

```sh
cargo test --workspace --locked
cargo build -p ymzz-runtime-core --locked
npm ci --ignore-scripts --prefix runtime
npm run build --prefix runtime
npm test --prefix runtime
# 明確指定一個自己的本機資料夾；終端會輸出含當次驗證 fragment 的本機網址。
YMZZ_DATA_DIR="$PWD/.local-data" YMZZ_CORE_EXECUTABLE="$PWD/target/debug/ymzz-runtime-core" YMZZ_TZ=Asia/Seoul node runtime/dist/server.mjs
```

程式內沒有自動下載／自動安裝第三方技能腳本。Python 只在構建時透過 AST 解析上游規則（不執行來源程式）；執行時已帶入固定 JSON。

原 UI：`pnpm install --frozen-lockfile --ignore-scripts && pnpm --dir apps/ui test && pnpm --dir apps/ui build`；先 build 原 UI 再 build runtime，才能從「既有核心」頁開啟原 UI。原後端 server 不會偷偷啟動；目前只有其完整性 API 實際接入新任務。

## Windows 驗收與下載的誠實標準

`.github/workflows/zhanzhen-runtime.yml` 在 `windows-latest`：
- 構建真正 Tauri exe，帶入 Node 可執行檔、runtime、pool、規則資料、原 UI、授權。
- 複製到**含空白與中文字元的新目錄**再執行，不依賴工作目錄或系統 Node/Python。
- 檢查原生 GUI 視窗、保存 onboarding 截圖；對**此已啟動 App 的 bundled core**完成認領→Rust 執行→驗收→記憶與證據驗證。
- 只有 smoke 通過才輸出 `zhanzhen-windows-x64-portable` artifact；`zhanzhen-windows-proof` 含截圖與真離線任務證據。不是 release，不公開發布。

**只有實際 CI 綠燈與產物存在才算 Windows 證據，不把 YAML 當成已驗收。** 首次整合提交時 Windows 執行尚待 CI；當前本機 Linux 通過不等於 Windows 已正常。未提供 macOS/Linux/iOS/Android 新 runtime 發行包。

為滿足「不改註冊表」，首版是完整 ZIP 解壓即用，**不生成 MSI／NSIS**（這些正常安裝器通常需要寫註冊表）。應用本身無自啟動、服務、登錄檔操作。Windows 需已有 WebView2；本套件不會私自下載它，亦不保證 Windows／WebView2 底層永無登錄檔或快取操作。關閉後刪除可攜資料夾即移除應用資料；不要只移動 exe。

## 全量來源與只增不減

每個來源的 commit、原路徑、Git blob、檔案 mode、SHA-256、逐項排除原因都在 [sources.lock.json](sources.lock.json)。

|來源|固定 SHA|保留|
|---|---|---|
|ymzz-loop product|92a4a299a9b89084026af460770afed85c13f6bc|318 tracked 檔，含 dotfiles|
|ymzz-loop main|217341a7d1643859af681f6a4e93c36e5ece8496|103 tracked 檔，另存完整樹，保住 main-only 頁面|
|無用之用|299791e9e442e92eecca534ffd31847e50ad846b|79 檔，調度接入固定規則|
|無無即無|5358dbe6c64f3f55cb300ad8ee8d42225c9ff645|19 檔；新增記憶 adapter|
|官網|b9f6da3e2490b347abd209d8653dbc9048185fd4|9 檔作來源存檔，不捆綁進 runtime|
|溫潤|d33fb4bae0af86d30891c273103a9659552a926a|67 檔 + 1 個 symlink 排除記錄|
|官方 DSH|39163dd30f703a79079e2d2446545cff3c453738|28 檔，明確僅內核提取|

這不是保留所有 Git objects/歷史提交的 mirror；`.git`、未跟蹤檔案、私密匯出、憑證與研究私料不會匯入。Loop 兩個 HEAD 的 tracked 檔案本次 421/421 已複製，**不表示所有來源零排除**。溫潤的 `.cursor/skills/ymzz-wenrun-design` symlink 不作實體複製；完整 SKILL 本身已在來源樹。所有原倉庫保持不變；不在匯入快照裡改導覽而破壞原檔。

## 技能池：真實內容、鎖定與限制

[core-skills.lock.json](../../core-skills.lock.json) 固定 9 個真實上游、commit、license、逐檔 checksum。產品 UI 可載入與讀取；不改 Grok Bot 的全域技能或 shared config。

- find-skills — vercel-labs/skills（MIT）
- agent-browser — vercel-labs/agent-browser（Apache-2.0；解析真實 entrypoint）
- grill-me — mattpocock/skills 的 `skills/productivity/grill-me`（MIT）
- hyperframes-cli、hyperframes — heygen-com/hyperframes（Apache-2.0）
- modern-web-guidance — GoogleChrome/modern-web-guidance（Apache-2.0）
- impeccable — pbakaus/impeccable（Apache-2.0；並非單純「代碼認證」）
- hallmark — Nutlope/hallmark（MIT；實際為設計技能，不虛構品質認證機構）
- taste-skill — Leonxlnx/taste-skill；frontmatter 名稱 design-taste-frontend（MIT）

指令與 Markdown 附件已安裝。**非指令資產、程式腳本、圖片／字體等被隔離且逐檔記錄**，未完整安裝這些技能的可執行依賴。沒有執行 `npx skills add`／外部腳本／agent-browser，也沒有 HeyGen 付費呼叫。其他設計技能不可覆蓋溫潤。當前技能是可探索與驗 checksum 的唯讀指引，並未自動獲得 shell／網路權限。

## 安全與授權邊界

- 新碼 MIT；上游原 LICENSE/NOTICE 不變。[dependency-licenses.json](dependency-licenses.json) 為實際解析的 Rust Windows 依賴與新 npm build lock 掃描，不是只看頂層標籤。
- DSH 本次只用 MIT 的 Cordis/Cosmokit；不引入其遙測、完整 CLI、LLM、開發工具 LGPL sonarjs。REA 等分析引擎不捆綁 Ghidra／IDA／JEB／GPL 工具。
- **Office 參考插件實際為 AGPL-3.0**，只保留連結與公開介面研究，未複製／安裝／散布其程式碼；不改成 MIT。Office 真預覽仍待乾淨引擎。
- 官網沒有根 LICENSE；使用者要求保留的 9 檔僅存檔，不隨可執行 runtime 散布或重標 MIT；欲將其資產正式發行，需權利人補授權。
- SQLite 雜湊鏈可檢查資料變更，**不是對擁有本機資料庫完整寫權者的不可偽造證明**。
- 只 bind 127.0.0.1；每次啟動隨機 bearer；拒絕不匹配 Host／Origin；不發 auth cookies；token 用 fragment bootstrap，避免 HTTP request/query log。
- 插件只接已審查內建實作；Cordis 同 process 不等於不可信程式安全沙盒。未授權第三方腳本不會執行。

## 支付

[PAYMENTS.md](PAYMENTS.md)：靜態本機 Alipay 圖片設定可用，無自動已付；沒有使用者提供的碼時不顯示假的碼；微信碼未提供所以不展示。可選 Worker sandbox 簽名 adapter 與真 RSA2 離線測試已新增，**未部署、未入駐、未收款**，不表示生產支付閉環完成。

## 還沒完成（不藏在結案報告）

- 完整 DSH agent-loop、自由 VibeCoding、多步模型／工具推理、任意插件隔離與簽署安裝、MCP 真分析引擎。
- 原稟冊 UI/全部 v0.21.1 功能（每日復盤、600 天章節、Notion/Sheets/Git/飛書、T3、OCR、檔案搬動／復原）**來源全部保留，但未全部接進新桌面 runtime**；不能把整棵原碼匯入等同完整功能整合。
- Office 真預覽、Archify compare 等互動圖；新 runtime 多端發行；Windows 真人端驗收。
- 支付商戶憑證／靜態收款碼（由使用者自行在 GUI 提供）、官方沙盒／生產交易驗證、對帳／退款全生命週期。
- 真正兩個外部網站與官網的全部互相入口部署：新 GUI 已同一產品家族索引，現有來源不改；Loop Pages 受 product 分支環境保護規則阻擋，未越權修改規則；不改網域／路由／設定。
- npm/PyPI 原 package 來源保留未發布；本次未新增公開 release。

# English

This is a runnable first vertical slice, not a completed autonomous agent or a site redesign. It executes the official MIT DSH Cordis/Cosmokit plugin kernel at a pinned commit, new permission-gated YMZZ plugins, local SQLite tasks and confirmed memory, pinned Wuyong dispatch rules, and the existing Rust integrity core. A real deterministic task follows create → claim → run → gate → human review → explicitly confirmed memory. It is not live model inference.

All original target files remain, and both unrelated ymzz-loop branch-head trees are preserved with file hashes. The actual target is Rust/React, not the FastAPI/Vue system described in the request. Wuwong is an upstream skeleton; its implemented memory adapter is new. See the full gap list above, exact source and skill locks, Windows CI proof requirements, license boundaries, and payment limitations. Windows portability is only claimed after the executable smoke and artifacts succeed; no release, merge, purchase, protection-rule change, or real payment is performed by this integration.
