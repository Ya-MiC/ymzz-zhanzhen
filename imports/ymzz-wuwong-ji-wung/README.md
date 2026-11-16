# 晏銘湛箴_無無即無 (wuwong-ji-wung)

> 說出去的話就是潑出去的水。本地優先知識記憶與子智能體協作平台。不撅起用戶本地全部數據，只留使用者主動確認的片段。

- **顯示名稱**：晏銘湛箴_無無即無
- **GitHub 倉庫**：`ymzz-wuwong-ji-wung`
- **作者**：晏銘湛箴 (Ya-MiC) — https://github.com/Ya-MiC
- **License**：MIT
- **語言**：README 與 docs 以繁體中文為主；程式碼與 CLI 識別字用英文
- **技術棧**：Tauri 2 + Rust + Vue 3 + TypeScript（本地優先，離線可用）

---

## 一句話介紹

本地優先的個人知識記憶系統：記錄對話、代碼片段、決策與洞察，讓子智能體之間能互相直接接觸、梳理與協作，同時不上傳、不抓取用戶本地全部數據。

---

## Why（為什麼做）

現有的 local knowledge / mem / mcp 類工具，往往有「撅起用戶本地全部數據」的能力，隱私風險高。晏銘湛箴_無無即無 採取相反原則：

1. **本地優先**：前端與後端都跑在使用者自己的電腦上；預設不連網，不收集資料。
2. **不全量採集**：只留使用者主動確認、標記為「要記住」的片段，不掃描整個硬碟。
3. **子智能體協作**：不同對話窗口（當前會話、session-1420479c、session-2ae8976d）中人類用戶說過的、子智能體學過的東西，都能互相直接接觸、梳理清楚，不重複建 wheel。
4. **長期品牌資產**：優先累積可驗證、可複利的信任，而非快速現金流。

---

## 核心原則（不可妥協）

| 原則 | 說明 |
|------|------|
| 本地優先 | 預設不連網；所有數據存在使用者本機；不改註冊表；乾淨卸載 |
| 零收集 | 不上傳任何使用者數據；不設遙測；網路行為必須可檢驗 |
| 授權乾淨 | 軟件 MIT；所有依賴、字體、圖標皆可商用，排除 GPL/AGPL/Commons Clause/CC-NC |
| 觸控熱區 ≥ 44px | 視覺可以小，操作區必須足夠大 |
| 原色不得更動 | 溫潤設計系統四套色票，原色不可變 |

---

## 目前狀態

這是首版骨架倉庫。後續將陸續加入：

- Tauri 2 + Rust + Vue 3 最小可執行骨架
- 本地 SQLite 儲存（對話片段、知識節點、子智能體協作記錄）
- 片段匯入 / 標記 / 檢索（全文搜尋）
- 子智能體跨會話協作介面（當前會話 ↔ session-1420479c ↔ session-2ae8976d）
- 溫潤設計系統主題切換（雲箋／陶土 × 淺色／暗色）

---

## 貢獻與授權

歡迎提出 Issue 與 Pull Request。

授權：MIT License。詳見 `LICENSE`。

---

## 英文摘要（English Summary）

晏銘湛箴_無無即無 (wuwong-ji-wung) is a local-first personal knowledge memory and sub-agent collaboration platform. It records conversation snippets, code fragments, decisions, and insights, enabling sub-agents across different chat sessions to directly access, sort out, and collaborate on shared knowledge — without scraping the user's entire local data.

Key principles:
- Local-first: no network by default, all data on the user's machine, clean install/uninstall.
- Zero collection: no telemetry, no upload of user data, all network behavior auditable.
- Sub-agent collaboration: knowledge from current session, session-1420479c, and session-2ae8976d can be accessed and sorted across sessions.
- Clean licensing: MIT software, commercially usable dependencies, no GPL/AGPL/Commons Clause/CC-NC.

This is the initial skeleton repository. Tauri 2 + Rust + Vue 3 scaffold, SQLite storage, full-text search, and cross-session sub-agent collaboration UI will be added progressively.
