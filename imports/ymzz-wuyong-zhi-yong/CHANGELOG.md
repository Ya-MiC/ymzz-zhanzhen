# 變更紀錄

## [0.1.0] — 2026-11-14
- 初始版本：晏銘湛箴_無用之用 (wuyong) 常駐子代理
- 雙通道即時判別（用戶文字 × 模型思考），三種事件 adapter（inline / stdin / jsonl_tail）
- 本地優先路由：local → pool → online → none；跨對話 local index + provenance
- skills.sh 三級降級監控（官方 API → 排行榜 HTML → 快照），4.4M / 24K / 1,234 解析
- 安裝量嚴格大於 1,000,000 入池；isDuplicate 過濾；連續 2 次遲滯；diff 事件 (entered / left / installs_changed / hash_changed)
- 安全閘：審計 fail/warn/unaudited；第三方 SKILL.md 不執行、不覆蓋 System Prompt
- CLI：doctor / bootstrap / monitor / pool / local / hint / watch / uninstall
- Windows 優先（pathlib + .ps1 與 .sh），零運行時第三方 Python 依賴
