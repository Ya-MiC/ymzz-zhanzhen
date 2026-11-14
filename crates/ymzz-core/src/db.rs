//! SQLite 資料庫介面（stub 版本，離線編譯用）
//! [阻塞項] rusqlite 不在本機快取，需網路取得。此處以 std 僅保留介面簽章，
//! 實際資料庫操作於取得 rusqlite 後接入。

use crate::model::{
    AiOutput, AuditLog, Entitlement, IntegrityChain, Link, Meta, Order, OrderStatus, Project,
    ProjectFile, Tag, TagOrigin, Utterance, UtteranceTag,
};
use crate::model::new_id;
use std::path::Path;

/// 開啟（或建立）資料庫並執行遷移（stub：回傳記憶體內連線）
pub struct DbConn {
    pub path: String,
}

pub fn open_db<P: AsRef<Path>>(_path: P) -> Result<DbConn, String> {
    Ok(DbConn { path: _path.as_ref().to_string_lossy().to_string() })
}

/// SHA-256 雜湊字串（純 Rust 實作，不依賴 external crate；這裡呼叫 sha2 crate）
pub fn sha256_hex(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

/// 插入語錄（stub）
pub fn insert_utterance(_conn: &DbConn, _u: &Utterance) -> Result<(), String> {
    Ok(())
}

/// 取得語錄列表（stub）
pub fn list_utterances(_conn: &DbConn, _limit: i64, _offset: i64) -> Result<Vec<Utterance>, String> {
    Ok(Vec::new())
}

/// 插入標籤並回傳 id（stub）
pub fn insert_tag(_conn: &DbConn, _tag: &Tag) -> Result<i64, String> {
    Ok(0)
}

/// 關聯語錄與標籤（stub）
pub fn attach_tag(
    _conn: &DbConn,
    _utterance_id: &str,
    _tag_id: i64,
    _origin: TagOrigin,
) -> Result<(), String> {
    Ok(())
}

/// 插入 AI 輸出（stub）
pub fn insert_ai_output(_conn: &DbConn, _out: &AiOutput) -> Result<i64, String> {
    Ok(0)
}

/// 建立匹配邊（stub）
pub fn insert_link(_conn: &DbConn, _link: &Link) -> Result<(), String> {
    Ok(())
}

/// 插入訂單（stub）
pub fn insert_order(_conn: &DbConn, _order: &Order) -> Result<i64, String> {
    Ok(0)
}

/// 權益點單次使用（stub）
pub fn consume_entitlement(_conn: &DbConn, _entitlement_id: i64) -> Result<bool, String> {
    Ok(false)
}
