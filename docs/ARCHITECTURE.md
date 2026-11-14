# 晏銘湛箴 — 架構綜述 (ARCHITECTURE.md)

## 技術棧
- Rust（edition 2021，Cargo workspace）+ TypeScript 5
- ymzz-core：rusqlite（bundled）、serde、sha2、hmac、rhai、thiserror、uuid、time
- ymzz-server：axum + tokio + tower-http
- ymzz-pay / ymzz-redblue：獨立 crate
- 前端 apps/ui：React 18 + TypeScript + Vite + pnpm；zustand；d3-force + Canvas 2D；@tanstack/react-virtual；i18next
- 桌面/手機 apps/desktop：Tauri v2
- Web：PWA（manifest + service worker）

## 目錄結構
見施工令第 4 節。

## 資料流
- 語錄 → SQLite（本機）→ 標籤 → 評分 → 星雲匹配
- AI 注解 → LLM（OpenAI 相容）→ 付費權益點單次消耗
- 完整性鏈：每行 HMAC，啟動與每晚全鏈校驗，失敗進入「湛然常寂」鎖定
