//! 完整性鏈（stub 版本，離線編譯用）
//! [阻塞項] rusqlite 不在本機快取。實際 HMAC 鏈與鎖定邏輯於取得 rusqlite 後接入。

use crate::model::{IntegrityChain, Meta};
use crate::db::sha256_hex;
use hmac::{Hmac, Mac};
use serde_json::Value;
use std::collections::BTreeMap;

type HmacSha256 = Hmac<sha2::Sha256>;

pub fn integrity_key() -> Vec<u8> {
    if let Ok(k) = std::env::var("INTEGRITY_KEY") {
        k.into_bytes()
    } else {
        b"dev-integrity-key-change-me".to_vec()
    }
}

pub fn is_locked(_conn: &crate::db::DbConn) -> Result<bool, String> {
    Ok(false)
}

pub fn set_locked(_conn: &crate::db::DbConn, _locked: bool) -> Result<(), String> {
    Ok(())
}

pub fn compute_row_hash(_prev_hash: &str, _row: &Value) -> String {
    String::new()
}

pub fn compute_hmac(_key: &[u8], _row_hash: &str, _prev_hash: &str) -> String {
    String::new()
}

pub fn last_prev_hash(_conn: &crate::db::DbConn, _tbl: &str) -> Result<String, String> {
    Ok("0".repeat(64))
}

pub fn append_chain(
    _conn: &crate::db::DbConn,
    _tbl: &str,
    _row_id: &str,
    _row: &Value,
    _key: &[u8],
) -> Result<IntegrityChain, String> {
    Ok(IntegrityChain {
        seq: Some(0),
        tbl: String::new(),
        row_id: String::new(),
        row_hash: String::new(),
        prev_hash: String::new(),
        hmac: String::new(),
    })
}

pub fn verify_chain(
    _conn: &crate::db::DbConn,
    _tbl: &str,
    _key: &[u8],
) -> Result<(bool, Option<i64>), String> {
    Ok((true, None))
}

pub fn append_audit(
    _conn: &crate::db::DbConn,
    _event: &str,
    _detail: Option<&str>,
    _key: &[u8],
) -> Result<(), String> {
    Ok(())
}

pub fn get_meta(_conn: &crate::db::DbConn, _key: &str) -> Result<Option<String>, String> {
    Ok(None)
}

pub fn set_meta(_conn: &crate::db::DbConn, _key: &str, _value: &str) -> Result<(), String> {
    Ok(())
}
