# 編碼工作區：執行與安全邊界

新程式在 `runtime/src/coding/`，透過真實 DSH Cordis 插件 `coding` 註冊；沒有修改上游樹。`workspace.mjs` 是路徑／檔案工具，`test-tool.mjs` 是固定 Node 命令，`agent.mjs` 是持久、有界、逐批審查的 planner/tool/gate/review 狀態機，`fixture.mjs` 是明確離線的假模型 HTTP transport。

## 實際流程

- 原生 Windows `IFileOpenDialog` 選資料夾；API 不接受瀏覽器直接提交任意絕對根路徑。開發瀏覽器模式可用 app 自建示例，不提供假檔案選擇器。
- 自己的專案需明確選資料夾並同意本機模型可見範圍；未設定／未授權 provider 不建立模型任務。HTTP adapter 只接受 loopback、拒絕 URL 帳密／query／fragment／redirect，不內附模型。
- 模型必須回傳受驗證的 JSON `read/write/patch/test` 提案。任意 shell／install／delete／額外工具欄位均拒絕；不執行模型文字。
- 每批有 UUID 與完整 hash，read/write consent 與 test-code consent 分開。測試可讀檔案與版本另列，外部改動後拒絕執行；新提案不沿用舊授權。
- 寫入前須已閱讀與 hash 符合，patch 必須精確且只匹配一次。不能穿越、絕對路徑、UNC／磁碟／裝置路徑、symlink/junction/hardlink、隱藏／憑證／研究私料目錄；沒有刪除既有檔案工具。
- 固定 bundled Node + `--permission --test-reporter=tap selected.test.mjs`。直接啟動已核准的 node:test 檔案，不用 shell；只給允許檔案的 read 權限，不授予 write/child-process/workers/addons/WASI/inspector；清除使用者金鑰環境。3 秒／16 KiB 輸出上限，零測試不判通過。
- 錯誤輸出先限量及遮罩，再作下一輪資料；只有 fresh 通過測試且有修改才到人工 diff review。最多 6 輪、16 tools、8 writes；越界停止，不無限自修正。
- Baseline／寫入 journal／提案留在本機 SQLite；重啟不自動繼續。驗收前可還原，僅當前 hash 未被他人改動；本任務新建檔案會在明確還原時移除。已驗收後不提供靜默反悔覆寫；需新任務或自行版本控制。
- Evidence 只記相對路徑、hash、授權、gate 狀態與固定命令，不記原始 provider prompt／程式全文／測試輸出。回滾所需原文保存在本機 task config，並非雲端；記憶只在驗收後再次同意才寫入。

## 不是沙盒／沒有保證的部分

Node permission model 不是惡意程式隔離邊界，沒有網路封鎖；測試可能進行網路操作或偽造輸出，必須信任並審查其程式碼。路徑工具不聲稱能對抗有相同 OS 帳號寫入權限的惡意競態。SHA 鏈不是對完整資料庫管理者的不可偽造證明。祕密形狀遮罩不是通用 secret scanner。

此版不執行 npm install／完整任意專案 build、不執行任意 Python/Rust shell、不內附 LLM、不驗證真模型品質，不是完整上游 DSH agent-loop。可編輯支援的文字檔，但 gate 暫時只支援小型無外部依賴 JS/node:test 專案。GUI 原生選擇、任務、對話、權限、差異、模型設定、記憶、原版 UI 與家族導覽並存。

## 驗證

本地 39 項 runtime/provider/原支付回歸測試通過，其中新增 19 項 coding／adversarial checks；Rust 28、原 UI 21。Windows workflow 實際啟動完整 portable、原生資料夾選擇器，GUI 建示例／逐批核准／真失敗→修正→通過／驗收記憶，以及第二個任務還原；CI 結果與下載以主 README 更新的成功產物為準。

官方 Node 權限語義：https://nodejs.org/docs/latest-v24.x/api/cli.html#--allow-fs-read 。Lucide ISC 五個原始 SVG 的 commit/hash/license 位於 `docs/integration/ui-components.lock.json`。新碼 MIT，原授權保持。Windows 新增的直接 `windows 0.62.2` API 依賴原已在 lock 中（MIT OR Apache-2.0）；resolved 掃描 386 筆、0 blocked，實際 notice 收集 254 packages。產品圖標原圖及 PNG/ICO 衍生來源另鎖，不冒稱他人美術改成 MIT。

English: This is a real bounded coding tool loop, not a security sandbox. Local model inference remains untested here; the demo fake transport is explicit. Windows executable proof must pass before the artifact is presented as usable.
