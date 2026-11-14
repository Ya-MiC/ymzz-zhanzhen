//! 資料模型（SQLite；Web 版同表）
//! 所有 SQL 一律參數綁定；遷移用帶版本號的文件。

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

/// 語錄（人類說過的話）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Utterance {
    pub id: String,
    pub text: String,
    pub created_at: OffsetDateTime,
    pub source_platform: Option<String>,
    pub source_tool: Option<String>,
    pub session_id: Option<String>,
    pub message_id: Option<String>,
    pub project_id: Option<String>,
    pub score_total: Option<i32>,
    pub score_parts: Option<String>, // JSON
    pub text_sha256: String,
}

/// 標籤
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
}

/// 語錄－標籤關聯
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtteranceTag {
    pub utterance_id: String,
    pub tag_id: i64,
    pub origin: TagOrigin, // 'auto' | 'manual'
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TagOrigin {
    Auto,
    Manual,
}

/// AI 輸出元數據
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiOutput {
    pub id: Option<i64>,
    pub model: String,
    pub vendor: String,
    pub tools: Option<String>, // JSON
    pub kv_cache_tag: Option<String>,
    pub session_id: Option<String>,
    pub created_at: Option<OffsetDateTime>,
    pub content: String,
    pub thinking_trace: Option<String>, // 只存來源提供的，絕不合成
    pub keywords: Option<String>,       // JSON
}

/// 語錄與 AI 輸出的匹配邊
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub utterance_id: String,
    pub ai_output_id: i64,
    pub weight: f64,
    pub reason: Option<String>, // JSON
}

/// 項目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<i64>,
    pub name: String,
    pub created_at: Option<OffsetDateTime>,
}

/// 項目檔案
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectFile {
    pub id: Option<i64>,
    pub project_id: i64,
    pub path_or_name: String,
    pub added_at: Option<OffsetDateTime>,
}

/// 訂單
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Option<i64>,
    pub user_id: String,
    pub amount_fen: i64,
    pub currency: String,
    pub status: OrderStatus,
    pub provider: String,
    pub provider_trade_no: Option<String>, // UNIQUE
    pub created_at: Option<OffsetDateTime>,
    pub paid_at: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    Created,
    Pending,
    Paid,
    Fulfilled,
    Expired,
    Failed,
    Refunded,
}

/// 權益點（單次使用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entitlement {
    pub id: Option<i64>,
    pub order_id: i64,
    pub user_id: String,
    pub used: bool,
    pub used_at: Option<OffsetDateTime>,
}

/// 完整性鏈行
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrityChain {
    pub seq: Option<i64>,
    pub tbl: String,
    pub row_id: String,
    pub row_hash: String,
    pub prev_hash: String,
    pub hmac: String,
}

/// 審計日誌
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub seq: Option<i64>,
    pub ts: Option<OffsetDateTime>,
    pub event: String,
    pub detail: Option<String>,
    pub prev_hash: String,
    pub hash: String,
}

/// 元資料鍵值（locked 標誌、schema_version 等）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Meta {
    pub key: String,
    pub value: String,
}

/// 新建 UUID 字串
pub fn new_id() -> String {
    Uuid::new_v4().to_string()
}
