//! ymzz-core — 晏銘湛箴 Rust 核心（本機 SQLite 優先）
//!
//! 提供品牌常量、資料模型、資料庫、完整性鏈、導入、標籤、評分、星雲與價格模組。

pub mod brand;
pub mod db;
pub mod integrity;
pub mod ingest;
pub mod model;
pub mod nebula;
pub mod pricing;
pub mod scoring;
pub mod tagger;
