# DSH（標準專案目錄結構）說明

本專案採用以下目錄標準（DSH = DeepSeek Harness 標準專案目錄結構）。每個目錄的職責如下：

```
ymzz-wuyong-zhi-yong/
├── README.md         # 專案說明（繁體中文為主，尾附英文摘要）
├── LICENSE           # MIT
├── CHANGELOG.md      # 變更紀錄
├── AGENTS.md         # 給 AI 代理的快速入門與常用指令
├── pyproject.toml    # Python 套件元資料與 CLI 入口 (wuyong = wuyong.cli:main)
├── .gitignore        # 排除 state/、skills/core/、skills/pool/、__pycache__ 等
│
├── config/           # 靜態設定（入 git）
│   ├── wuyong.toml           # 門檻、輪詢間隔、本地根目錄、mode、權重、install_mode、日誌脫敏
│   └── core-skills.lock.json # 核心源鎖定（find-skills required:true、審計狀態）
│
├── prompts/          # 系統提示與接入說明（入 git）
│   ├── system_prompt.md      # 常駐子代理 System Prompt（繁體中文，含鐵律）
│   └── host_integration.md   # 宿主通用接入方式（不編造具體框架 API）
│
├── skills/           # 技能檔案（runtime 生成，不入 git，除 local-made/.gitkeep）
│   ├── core/         # 核心技能（find-skills 等）安裝位置
│   ├── pool/         # 默認池內已安裝技能（runtime 生成，gitignore）
│   └── local-made/   # 本地自製技能（跨對話共用，provenance 記錄於 state/local-index.json）
│
├── src/wuyong/       # Python 套件原始碼（零第三方運行時依賴）
│   ├── __init__.py   # 套件元資料
│   ├── __main__.py   # python -m wuyong 入口
│   ├── cli.py        # CLI：doctor / bootstrap / monitor / pool / local / hint / watch / uninstall
│   ├── config.py     # 設定載入（tomllib）、專案根定位、路徑屬性
│   ├── daemon.py     # 常駐：watch(stdin/file)、monitor daemon 輪詢
│   ├── router.py     # 決策路由 local → pool → online → none，產出 Decision JSON
│   ├── installer.py  # npx skills add 包裝（--copy --json --yes，dry_run，不假裝成功）
│   ├── pool.py       # 默認池：安全閘、遲滯、diff 事件、mark_installed
│   ├── security.py   # 審計摘要、入池閘門、靜態掃描、抽象關鍵詞、雜湊
│   ├── signals/      # 雙通道即時判別
│   │   ├── detector.py   # 用戶文字 × 思考通道，加權合併，可選 LLM 判官
│   │   ├── rules_zh.py   # 中文規則
│   │   └── rules_en.py   # 英文規則
│   ├── sources/      # 事件輸入 adapter
│   │   ├── inline_src.py # CLI 參數組事件
│   │   ├── stdin_src.py  # stdin JSONL
│   │   └── jsonl_tail.py # 監看 JSONL 檔（Windows 安全）
│   ├── registry/     # 本地 skill 索引與收錄
│   │   ├── local_index.py  # 跨對話索引、provenance、詞法相似度
│   │   └── harvest.py      # SKILL.md frontmatter 解析、腳本列表、草稿模板
│   └── monitor/      # skills.sh 監控
│       ├── skills_sh.py    # 三級降級：API → HTML → 快照
│       ├── parse_html.py   # 排行榜 HTML 解析（stdlib html.parser，失敗明確報錯）
│       └── diff.py         # entered / left / installs_changed / hash_changed
│
├── scripts/          # 平台腳本（.ps1 與 .sh 對應）
│   ├── bootstrap.ps1 / bootstrap.sh
│   ├── monitor.ps1 / monitor.sh
│   └── uninstall.ps1 / uninstall.sh
│
├── state/            # 運行時狀態（gitignore，不入 git）
│   ├── local-index.json      # 本地 skill 索引（跨對話共用）
│   ├── pool.json             # 默認池記錄
│   ├── events.jsonl          # diff 事件日誌
│   ├── leaderboard-snapshot.json  # skills.sh 快照（降級備援）
│   └── bootstrap.json        # bootstrap 結果
│
├── tests/            # 單元測試（pytest，預設不跑 integration）
│   └── fixtures/     # 測試資料：leaderboard.html、api_page*.json、audit_*.json 等
│
├── docs/             # 文檔
│   ├── ARCHITECTURE.md   # 架構設計
│   ├── WHY.md            # 為什麼做（專案動機）
│   ├── SECURITY.md       # 安全模型
│   ├── DSH.md            # 本檔（目錄標準說明）
│   └── DECISIONS.md      # 歧義決策紀錄
│
└── .github/workflows/
    └── ci.yml            # GitHub Actions：Windows + Linux 單元測試
```

## 路徑原則（Windows 優先）

- 全程使用 `pathlib`，不依賴 bash。
- 本地 skill 根目錄只收錄 `Path.exists()` 驗證過的，不假設常見位置（Claude Code、Codex、Cursor、`.agents` 等）一定存在。
- 所有運行時狀態置於 `state/`，提供乾淨卸載（只移除 `config/core-skills.lock.json` 記錄過的技能檔；`state/` 與 `skills/local-made/` 由使用者自行決定保留）。

## 若用戶另附 DSH 規範文件

以該文檔為準；本 `docs/DSH.md` 僅為預設方案。
