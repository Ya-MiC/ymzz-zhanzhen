# 宿主接入說明（通用）

本文件只描述通用接入方式。針對 OpenClaw、Hermes、pi、Claude Code 等具體框架，**不編造其 API**；請依各框架現行文檔調整。以下每種方式皆為「示例」，實際參數、欄位名、觸發時機請以該框架文檔為準。

## 接入方式 A：CLI hook（最簡單）

在宿主的對話/工具鉤子中呼叫：

```powershell
python -m wuyong hint --text "<使用者輸入>" --thinking "<模型思考>" --conversation "<對話 ID>" --mode act --dry-run
```

輸出為 `Decision` JSON，宿主可根據 `route` 與 `brief` 決定是否採納。

- `--dry-run`：只產出 Decision，不改動磁碟（建議先用此驗證）。
- 去掉 `--dry-run` 並在 `--mode act` 下：會自動安裝與登記。

## 接入方式 B：stdin JSONL（常駐串流）

讓宿主把每條對話事件寫成一行 JSONL，管線給 `watch`：

```powershell
Get-Content events.jsonl | python -m wuyong watch
```

或常駐 tail 檔：

```powershell
python -m wuyong watch --file C:\path\to\conversation-events.jsonl
```

`watch` 會逐條輸出一條 `Decision` JSON 到 stdout。

## 接入方式 C：載入 system_prompt.md 為子代理指令

在宿主框架中建立一個名為「無用之用」的常駐子代理，將 `prompts/system_prompt.md` 內容設為該子代理的系統指令；事件以 JSON 形式傳入，子代理回傳 `Decision` 與 brief。

## 注意事項（通用）

1. 事件欄位：`conversation_id`、`turn_id`、`ts`、`user_text`、`thinking`（可空）；缺欄位不得導致崩潰，缺 `thinking` 時輸出 `thinking_available: false`。
2. `state/` 與 `config/` 須可寫；`skills/local-made/` 為跨對話共用索引，不要刪除。
3. 不要把原始使用者文字或思考內容傳給任何外部服務；線上查詢只送 `security.abstract_query()` 產出的抽象關鍵詞（≤8 詞）。
4. 核心源 `find-skills` 必須先經 `wuyong bootstrap` 安裝，才能進行線上查詢。
