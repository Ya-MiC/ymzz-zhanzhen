# t167u 完整覆蓋與資源索引（不刪原連結）

|原規格|本切片證據|尚待完成|
|---|---|---|
|〇 只增不減|原檔保留，namespaced imports + SHA manifest，沒有 upstream 寫入|後續整合亦不可覆寫存檔|
|〇 溫潤|原 tokens byte-identical，四主題、48px、指定 easing|各實機三引擎複測|
|〇 本地優先|SQLite、loopback auth/Host/Origin、零應用遙測、可攜 ZIP|WebView2/OS 行為不作無證絕對保證|
|〇 MIT 商用|自有新碼 MIT，逐原授權保留，解析依賴掃描|官網 missing LICENSE、Office AGPL 僅參考|
|一 目標與原管道|原 core/pay/redblue/server/UI 全保留，真 integrity 接入|實際目標沒有 FastAPI/Vue OCR 總帳，不能宣稱已有|
|二 loop 全量|product 318+main 103 tracked 全樹，含 dotfiles|不是所有歷史 objects；全部功能未統一 GUI|
|二 三模組|wuyong 79/wuwong 19/官網9 原檔；規則調度+確認記憶實際運作|官網缺授權不捆綁；原 wuwong 是 skeleton|
|三 審美與 Web|設計與 guidance 原文已讀；原生 forms/dialog、語意標籤、焦點、RWD|完整裝置 a11y/效能驗收|
|四 Harness|官方網站確認 upstream，MIT Cordis/Cosmokit 真載入|完整上游 agent-loop、終端/任意工具與模型任務|
|四 REA|研究本地分析/MCP structured evidence，保留正確角色|尚未捆綁或接分析引擎；不是 T3|
|四 Office|AGPL 檢出；僅公開 registerFileViewer 介面研究|乾淨預覽引擎；不複製 AGPL|
|四 Archify|研究 SVG/原子驗證/compare receipts；新家族圖可導航|未接 archify compare|
|四 taskboard|認領/執行/待驗收/使用者確認後完成實際 SQLite 狀態機|跨進程樂觀版本與完整 DSH task API|
|五 全九技能|產品專用 pool、真 SHA/checksum/license lock、GUI 可讀|腳本/圖片/字體附件隔離，有記錄；非全執行環境|
|六 展示雙入口|GUI 同一產品家族索引|外部 Pages 反向部署受既有環境規則阻擋|
|七 Alipay|靜態碼 GUI+服務端 sandbox adapter+RSA2 離線測試|真碼/商戶/憑證/官方交易/退款對帳；微信未提供|
|八 部署|新增 GitHub Actions Windows portable+真離線任務 smoke；無需新付費|未動 CF routes/domains/Pages protection，未發正式版|
|九 定位與首用戶|暱稱先行、插件能力為輻、本機人工驗收|完整自由 VibeCoding Agent 與多端發行|
|十 全鏈接|如下全部保留|不能將有連結等同功能完成|

## 所有來源

- 目標：https://github.com/Ya-MiC/ymzz-zhanzhen
- 全量：https://github.com/Ya-MiC/ymzz-loop
- 調度：https://github.com/Ya-MiC/ymzz-wuyong-zhi-yong
- 記憶：https://github.com/Ya-MiC/ymzz-wuwong-ji-wung
- 官網：https://github.com/Ya-MiC/yanming-official-website
- 唯一審美權威：https://github.com/Ya-MiC/ymzz-wenrun-design-skill
- Web：https://github.com/GoogleChrome/modern-web-guidance
- 任務板：https://github.com/chuspeeism/dashi-taskboard
- **REA 本地逆向分析 MCP，不是 T3 Code**：https://github.com/morluto/rea
- Office 插件公開介面研究（AGPL，不複製）：https://github.com/HuanLinOTO/dsh-plugin-better-sidebar-plugin-office
- 圖表：https://github.com/tt-a1i/archify
- Harness：https://deepseek.com/harness/
- 已核實官方 upstream：https://github.com/deepseek-ai/deepseek-harness

## 展示／官網互索引

- https://ya-mic.github.io/ymzz-loop/
- https://bingce.yanmingx0215.filegear-sg.me/#onboarding
- https://ya-mic.github.io/yanming-official-website/
- https://ya-mic.github.io/ymzz-wuyong-zhi-yong/
- https://ya-mic.github.io/ymzz-wuwong-ji-wung/

新 GUI 的「產品家族」和全域 footer 均能找到這些連結。這一 PR 不修改其他來源倉庫或保護規則，故沒有假稱所有外部頁面都新增了反向跳轉。

## Skills 原來源連結（完整保留）

- https://www.skills.sh/vercel-labs/skills/find-skills
- https://www.skills.sh/vercel-labs/agent-browser/agent-browser
- https://www.skills.sh/mattpocock/skills/grill-me
- https://www.skills.sh/heygen-com/hyperframes/hyperframes-cli
- https://www.skills.sh/heygen-com/hyperframes/hyperframes
- https://github.com/pbakaus/impeccable
- https://github.com/Nutlope/hallmark
- https://github.com/Leonxlnx/taste-skill

## 參考研究與授權邊界

`references.lock.json` 記錄全部研究來源 commit/license/採用模式。Office AGPL 不複製；REA 主程式 MIT 但可呼叫的 IDA/JEB/其他分析工具不隨本產品散布；Archify Apache-2.0 不冒稱 MIT。完整上游 DSH 有 telemetry packages，我們只取 MIT 內核且 bundle-inputs 可檢查，沒有複製或啟用 telemetry。

Modern Web Guidance：讀取固定來源的 `forms` 與 `accessibility`，採用「Server-side validation is for Security」「Prefer HTML elements and attributes to ARIA」等具體規則。離線研究，不執行未審查的 npx 安裝命令。
