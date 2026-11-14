//! 完整性鏈核心（離線可測版本）
//!
//! 規則（施工令第 8 節）：
//! - row_hash = SHA-256(prev_hash ‖ 規範化 JSON)，規範化 = 鍵排序後緊湊序列化
//! - hmac = HMAC-SHA256(密鑰, row_hash ‖ prev_hash)
//! - 校驗不通過即進入「湛然常寂」鎖定：寫介面 423，僅保留讀取、導出、驗證
//!
//! rusqlite 未就位（離線快取不足，列阻塞項），持久層以 `MemoryChain` 提供
//! 與未來 SQLite 版相同的 append/verify 語義；rusqlite 就位後把儲存換掉即可，
//! 密碼學核心不動。

use crate::db::sha256_hex;
use hmac::{Hmac, Mac};
use serde_json::Value;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// 創世 prev_hash：全零 64 字元
pub const GENESIS: &str = "0000000000000000000000000000000000000000000000000000000000000000";

/// 取得 HMAC 密鑰（桌面端存系統鑰匙串 keyring；服務端來自環境變量 INTEGRITY_KEY）
pub fn integrity_key() -> Vec<u8> {
    if let Ok(k) = std::env::var("INTEGRITY_KEY") {
        if !k.is_empty() {
            return k.into_bytes();
        }
    }
    // 開發缺省；生產必須由環境變量或鑰匙串提供，否則鏈無法對抗持有庫文件者
    b"dev-integrity-key-change-me".to_vec()
}

/// 規範化 JSON：物件鍵遞迴排序、緊湊序列化（與 BTreeMap 序一致）
pub fn canonical_json(value: &Value) -> String {
    match value {
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let inner: Vec<String> = keys
                .iter()
                .map(|k| {
                    format!(
                        "{}:{}",
                        serde_json::to_string(k).unwrap_or_else(|_| "\"\"".into()),
                        canonical_json(&map[*k])
                    )
                })
                .collect();
            format!("{{{}}}", inner.join(","))
        }
        Value::Array(items) => {
            let inner: Vec<String> = items.iter().map(canonical_json).collect();
            format!("[{}]", inner.join(","))
        }
        other => other.to_string(),
    }
}

/// row_hash = SHA-256(prev_hash ‖ 規範化 JSON)
pub fn compute_row_hash(prev_hash: &str, row: &Value) -> String {
    let input = format!("{}{}", prev_hash, canonical_json(row));
    sha256_hex(input.as_bytes())
}

/// hmac = HMAC-SHA256(密鑰, row_hash ‖ prev_hash)
pub fn compute_hmac(key: &[u8], row_hash: &str, prev_hash: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC 接受任意長度密鑰");
    mac.update(format!("{}{}", row_hash, prev_hash).as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

/// 鏈上的一節
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChainEntry {
    pub seq: u64,
    pub tbl: String,
    pub row_id: String,
    pub row_hash: String,
    pub prev_hash: String,
    pub hmac: String,
}

/// 記憶體完整性鏈：與未來 SQLite 版相同的 append/verify 語義
#[derive(Debug, Default)]
pub struct MemoryChain {
    entries: Vec<ChainEntry>,
}

impl MemoryChain {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn last_hash(&self) -> String {
        self.entries
            .last()
            .map(|e| e.row_hash.clone())
            .unwrap_or_else(|| GENESIS.to_string())
    }

    /// 追加一節：計算 row_hash 與 hmac，seq 自增
    pub fn append(&mut self, tbl: &str, row_id: &str, row: &Value, key: &[u8]) -> ChainEntry {
        let prev_hash = self.last_hash();
        let row_hash = compute_row_hash(&prev_hash, row);
        let hmac = compute_hmac(key, &row_hash, &prev_hash);
        let entry = ChainEntry {
            seq: self.entries.len() as u64 + 1,
            tbl: tbl.to_string(),
            row_id: row_id.to_string(),
            row_hash,
            prev_hash,
            hmac,
        };
        self.entries.push(entry.clone());
        entry
    }

    /// 全鏈校驗：回傳 (通過, 第一個失敗的 seq)
    /// 檢查三件事：hmac 正確、prev_hash 鏈接、row_hash 可由鏈上前值重算
    pub fn verify(&self, rows: Option<&[Value]>, key: &[u8]) -> (bool, Option<u64>) {
        let mut prev = GENESIS.to_string();
        for (idx, entry) in self.entries.iter().enumerate() {
            // 1. hmac 必須匹配（防未持密鑰者改任何欄位）
            let expect_hmac = compute_hmac(key, &entry.row_hash, &entry.prev_hash);
            if expect_hmac != entry.hmac {
                return (false, Some(entry.seq));
            }
            // 2. prev_hash 必須鏈接上一節
            if entry.prev_hash != prev {
                return (false, Some(entry.seq));
            }
            // 3. 若提供原始行，row_hash 必須可重算（防改行後同步重算鏈——僅持庫不持鑰者會在此被 hmac 攔下；同時持兩者者無解，見 THREAT_MODEL）
            if let Some(rows) = rows {
                if let Some(row) = rows.get(idx) {
                    let expect = compute_row_hash(&entry.prev_hash, row);
                    if expect != entry.row_hash {
                        return (false, Some(entry.seq));
                    }
                }
            }
            prev = entry.row_hash.clone();
        }
        (true, None)
    }

    pub fn entries(&self) -> &[ChainEntry] {
        &self.entries
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const KEY: &[u8] = b"test-integrity-key";

    #[test]
    fn row_hash_is_deterministic_and_order_insensitive() {
        let a = json!({"b": 1, "a": 2});
        let b = json!({"a": 2, "b": 1});
        assert_eq!(compute_row_hash(GENESIS, &a), compute_row_hash(GENESIS, &b));
        // 前值不同則雜湊不同
        assert_ne!(compute_row_hash("aa", &a), compute_row_hash("bb", &a));
    }

    #[test]
    fn hmac_depends_on_key_and_hashes() {
        let row = json!({"k": "v"});
        let rh = compute_row_hash(GENESIS, &row);
        let h1 = compute_hmac(KEY, &rh, GENESIS);
        let h2 = compute_hmac(b"other-key", &rh, GENESIS);
        assert_ne!(h1, h2);
        assert_eq!(h1, compute_hmac(KEY, &rh, GENESIS));
    }

    #[test]
    fn chain_append_and_verify_pass() {
        let mut chain = MemoryChain::new();
        for i in 0..5 {
            chain.append("utterances", &format!("u{i}"), &json!({"i": i, "text": "語錄"}), KEY);
        }
        assert_eq!(chain.len(), 5);
        let (ok, failed) = chain.verify(None, KEY);
        assert!(ok, "完整鏈必須通過，失敗於 {failed:?}");
    }

    #[test]
    fn tampered_hmac_is_detected() {
        let mut chain = MemoryChain::new();
        chain.append("utterances", "u1", &json!({"i": 1}), KEY);
        chain.append("utterances", "u2", &json!({"i": 2}), KEY);
        // 篡改第 2 節的 hmac
        chain.entries[1].hmac = "0".repeat(64);
        let (ok, failed) = chain.verify(None, KEY);
        assert!(!ok);
        assert_eq!(failed, Some(2));
    }

    #[test]
    fn tampered_row_is_detected_by_recalc() {
        let rows = vec![json!({"i": 1}), json!({"i": 2})];
        let mut chain = MemoryChain::new();
        chain.append("utterances", "u1", &rows[0], KEY);
        chain.append("utterances", "u2", &rows[1], KEY);
        // 攻擊者直接改庫行（不持鑰也改不了鏈；這裡模擬同時改行與鏈的場景中 row 重算攔截）
        let tampered = vec![json!({"i": 1}), json!({"i": 999})];
        let (ok, failed) = chain.verify(Some(&tampered), KEY);
        assert!(!ok, "行被改而鏈未重算必須被抓到");
        assert_eq!(failed, Some(2));
        let _ = rows;
    }

    #[test]
    fn wrong_key_fails_everywhere() {
        let mut chain = MemoryChain::new();
        chain.append("utterances", "u1", &json!({"i": 1}), KEY);
        let (ok, failed) = chain.verify(None, b"wrong-key");
        assert!(!ok);
        assert_eq!(failed, Some(1));
    }

    #[test]
    fn genesis_hash_is_sixty_four_zeros() {
        assert_eq!(GENESIS.len(), 64);
        assert!(GENESIS.chars().all(|c| c == '0'));
    }
}
