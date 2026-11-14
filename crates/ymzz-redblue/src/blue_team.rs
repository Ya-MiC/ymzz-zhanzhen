//! 藍方防禦（stub 版本，離線編譯用）

use ymzz_core::db::DbConn;
use ymzz_core::model::Utterance;
use serde_json::Value;

pub fn sanitize_input(text: &str) -> Result<String, String> {
    if text.len() > 64 * 1024 {
        return Err("單條超過 64KB 上限".to_string());
    }
    Ok(text.to_string())
}

pub fn guarded_write(
    _conn: &DbConn,
    _tbl: &str,
    _row_id: &str,
    _row: &Value,
    _key: &[u8],
) -> Result<(), String> {
    Ok(())
}

pub fn verify_and_maybe_lock(
    _conn: &DbConn,
    _tbl: &str,
    _key: &[u8],
) -> Result<bool, String> {
    Ok(true)
}

pub fn read_locked(_conn: &DbConn) -> Result<bool, String> {
    Ok(false)
}

pub fn unlock(
    _conn: &DbConn,
    _recovery_key: &str,
    _key: &[u8],
) -> Result<(), String> {
    Ok(())
}
