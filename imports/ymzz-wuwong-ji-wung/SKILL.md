---
name: wuwong-memory-collab
description: 本地優先知識記憶與子智能體協作，支援跨會話知識節點索引與梳理，不全量採集用戶本地數據。當用戶提到「知識記憶」「子智能體協作」「跨會話索引」「無無即無」時使用。
---

# 晏銘湛箴_無無即無 (wuwong-ji-wung) 技能

## 用途

本地優先的個人知識記憶系統：記錄對話、代碼片段、決策與洞察，讓子智能體之間能互相直接接觸、梳理與協作，同時不上傳、不抓取用戶本地全部數據。支援三個會話的子智能體互相直接接觸與梳理。

## Workflow

1. **知識節點建立**：每個節點包含 id、session、turn、content、tags、references、created_at、updated_at。
2. **跨會話索引**：當前會話、session-1420479c-b568-4b48-9c9a-266ad85c6e87、session-2ae8976d-65a8-46f8-b00b-ba098ee9fd8b 三個會話的知識節點互相可見。
3. **檢索與梳理**：全文檢索（FTS5）、標籤過濾、跨會話 `references` 關聯查詢，避免重複建 wheel。
4. **子智能體協作**：不同對話窗口中人類用戶說過的、子智能體學過的東西，全部能互相直接接觸和梳理清楚。

## Guardrails

- 預設不連網；所有數據存在使用者本機；不改註冊表；乾淨卸載。
- 不全量掃描本地檔案，只留使用者主動確認片段。
- 不收集資料，不上傳任何使用者數據，不設遙測。
- 軟件 MIT 授權；所有依賴皆可商用，排除 GPL/AGPL/Commons Clause/CC-NC。
- 觸控熱區 ≥ 44px；連續熱區無死區；溫潤設計系統四套色票原色不得更動。

## Resources

- `README.md` — 一句話介紹、Why、核心原則
- `AGENTS.md` — AI 代理協作規範
- `LICENSE` — MIT License
- `docs/SESSIONS.md` — 三個會話索引與協作原則
- `docs/ARCHITECTURE.md` — Tauri 2 + Rust + Vue 3 分層架構
- `docs/ROADMAP.md` — 四階段開發路線圖
