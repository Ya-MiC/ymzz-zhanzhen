# 歧義決策紀錄（晏銘湛箴_無用之用）

本檔記錄需求有歧義時所採取的**最保守合理方案**，不中途停下來詢問。

## D1：合併分數公式（雙通道）

**歧義**：用戶文字與模型思考兩個通道分數如何合併？

**決定**：單通道時 `score × 該通道權重`；雙通道時加權平均 + 一致性加成 `0.05 × min(u, t)`（兩通道同時命中代表訊號更強），上限 1.0。LLM 判官若注入，取 `max(規則分, 判官分)`，絕不下降規則層結果。

**依據**：保守起見，不讓可選的 LLM 判官覆蓋規則層；一致性加成小且上限封住，避免誤報。

## D2：cookies / 本地技能根目錄不存在時

**歧義**：Claude Code、Codex、Cursor、`.agents` 等常見位置未必存在，應如何處理？

**決定**：只收錄 `Path.exists()` 驗證過的目錄；不存在者靜略過，由 `doctor` 回報。不建立不存在的目錄，不假設任何位置。

## D3：安裝量門檻邊界

**歧義**：1,000,000 剛好等於門檻是否入池？

**決定**：**嚴格大於** 1,000,000。1,000,000 不入、1,000,001 入。測試以此為邊界。

## D4：技能池內技能離開榜單時

**歧義**：安裝量低於門檻時，應立即移出還是遲滯？

**決定**：遲滯。連續 2 次檢測低於門檻才標記 `below_threshold`；再連續 2 次仍低於門檻才從池中標記為 left（diff 事件）。本地自製 skill 永不自動刪除。

## D5：核心源安裝失敗

**歧義**：離線或缺 npx 時，bootstrap 是否報錯中止？

**決定**：不報錯中止。標記 `degraded` 並寫入 `state/bootstrap.json`，之後自動重試；不得假裝成功。退碼仍為 0，讓後續指令可重試。

## D6：技能池快照降級

**歧義**：API 無 token 且 HTML 解析失敗時，回傳空池還是錯誤？

**決定**：如實回報 `source: none` 並記錄 `api_degraded_reason` / `html_degraded_reason`；若有舊快照則以 `stale: true` 降級使用。不得悄悄回傳空池。

## D7：CLI 輸出與 dry-run

**歧義**：`hint` / `watch` 預設是否改動磁碟？

**決定**：預設 `dry-run=True`（只產出 Decision JSON，不改動磁碟）。`--mode act` 且不 `--dry-run` 才執行安裝與登記。

## D8：Python 套件安裝方式

**歧義**：`python -m wuyong` 需不需 `pip install`？

**決定**：支援 `pip install -e .`，但不強制；可直接設定 `PYTHONPATH=src` 執行 `python -m wuyong`，降低安裝門檻。

## D9：Git 儲存內容

**歧義**：`skills/pool/`、`skills/core/`、`state/` 是否入 git？

**決定**：全部不入 git（gitignore）。只入 git：原始碼、設定、lock 檔、prompts、docs、tests、scripts、CI。`skills/local-made/` 預設不入 git（使用者資料），如需版本化刪除 `.gitignore` 對應兩行。
