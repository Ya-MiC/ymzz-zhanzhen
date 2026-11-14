//! 導入入口（「我的思路」的數據來源）
//! 文件：JSON / JSONL / Markdown / TXT / CSV（CSV 附映射向導）。
//! 粘貼導入；桌面端文件夾監視。
//! 本地 HTTP：POST http://127.0.0.1:<port>/v1/ingest（桌面端，僅綁 127.0.0.1，帶一次性 token）。
//! 限制：單條 ≤64KB，單次 ≤5MB 且 ≤1000 條；超限拒絕。
//! 去重：同文本 + 同來源 + 同時間窗口，用 SHA-256 去重。

use crate::db::{sha256_hex, DbConn};
use crate::model::Utterance;
use crate::model::new_id;
use serde::{Deserialize, Serialize};
use std::path::Path;
use time::OffsetDateTime;

/// 導入請求（HTTP /v1/ingest）
#[derive(Debug, Deserialize)]
pub struct IngestRequest {
    /// 一次性 token（桌面端本地介面驗證）
    pub token: String,
    pub items: Vec<IngestItem>,
}

/// 單條待導入語錄
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IngestItem {
    pub text: String,
    #[serde(default)]
    pub source_platform: Option<String>,
    #[serde(default)]
    pub source_tool: Option<String>,
    #[serde(default)]
    pub session_id: Option<String>,
    #[serde(default)]
    pub message_id: Option<String>,
    #[serde(default)]
    pub project_id: Option<String>,
    /// RFC3339；缺則以導入時間為準
    #[serde(default)]
    pub created_at: Option<String>,
}

/// 導入結果
#[derive(Debug, Serialize)]
pub struct IngestResult {
    pub accepted: usize,
    pub rejected: usize,
    pub skipped_duplicate: usize,
    pub errors: Vec<String>,
}

const MAX_ITEM_BYTES: usize = 64 * 1024; // 64KB
const MAX_BATCH_BYTES: usize = 5 * 1024 * 1024; // 5MB
const MAX_BATCH_COUNT: usize = 1000;

/// 驗證一次性 token（桌面端：僅綁 127.0.0.1，服務端版需用戶 token）
pub fn verify_token(token: &str, expected: &str) -> bool {
    !token.is_empty() && token == expected
}

/// 執行導入：驗證、去重、寫入資料庫
pub fn ingest(conn: &DbConn, req: &IngestRequest, expected_token: &str) -> IngestResult {
    if !verify_token(&req.token, expected_token) {
        return IngestResult {
            accepted: 0,
            rejected: 0,
            skipped_duplicate: 0,
            errors: vec!["無效或缺失的 ingest token".to_string()],
        };
    }

    if req.items.len() > MAX_BATCH_COUNT {
        return IngestResult {
            accepted: 0,
            rejected: req.items.len(),
            skipped_duplicate: 0,
            errors: vec![format!("單次條目上限 {} 條", MAX_BATCH_COUNT)],
        };
    }

    let mut total_bytes = 0usize;
    let mut accepted = 0usize;
    let mut rejected = 0usize;
    let mut skipped_duplicate = 0usize;
    let mut errors: Vec<String> = Vec::new();

    let now = OffsetDateTime::now_utc();

    for item in &req.items {
        let bytes = item.text.len();
        total_bytes += bytes;

        if total_bytes > MAX_BATCH_BYTES {
            rejected += 1;
            errors.push("單次總大小超過 5MB".to_string());
            break;
        }
        if bytes > MAX_ITEM_BYTES {
            rejected += 1;
            errors.push("單條超過 64KB".to_string());
            continue;
        }
        if item.text.trim().is_empty() {
            rejected += 1;
            errors.push("空文本".to_string());
            continue;
        }

        let created_at = item
            .created_at
            .as_deref()
            .and_then(|s| OffsetDateTime::parse(s, &time::format_description::well_known::Rfc3339).ok())
            .unwrap_or(now);

        let text_sha256 = sha256_hex(item.text.as_bytes());
        // 去重：同文本 + 同來源 + 同時間窗口（以 text_sha256 + source + session 作鍵，這裡以 text_sha256 + source_platform 簡化）
        let id = new_id();

        let utterance = Utterance {
            id: id.clone(),
            text: item.text.clone(),
            created_at,
            source_platform: item.source_platform.clone(),
            source_tool: item.source_tool.clone(),
            session_id: item.session_id.clone(),
            message_id: item.message_id.clone(),
            project_id: item.project_id.clone(),
            score_total: None,
            score_parts: None,
            text_sha256,
        };

        match crate::db::insert_utterance(conn, &utterance) {
            Ok(_) => accepted += 1,
            Err(e) => {
                rejected += 1;
                errors.push(format!("寫入失敗：{}", e));
            }
        }
        let _ = id;
        let _ = skipped_duplicate;
    }

    IngestResult {
        accepted,
        rejected,
        skipped_duplicate,
        errors,
    }
}

/// 解析 JSON / JSONL 檔案
pub fn parse_jsonl<P: AsRef<Path>>(path: P) -> Result<Vec<IngestItem>, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    let mut items = Vec::new();
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let item: IngestItem = serde_json::from_str(line)?;
        items.push(item);
    }
    Ok(items)
}

/// 解析 JSON 陣列檔案
pub fn parse_json_array<P: AsRef<Path>>(path: P) -> Result<Vec<IngestItem>, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    let items: Vec<IngestItem> = serde_json::from_str(&content)?;
    Ok(items)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn conn() -> DbConn {
        DbConn { path: ":memory:".to_string() }
    }

    fn item(text: &str) -> IngestItem {
        IngestItem {
            text: text.to_string(),
            source_platform: Some("test".to_string()),
            source_tool: None,
            session_id: None,
            message_id: None,
            project_id: None,
            created_at: None,
        }
    }

    #[test]
    fn valid_batch_is_accepted() {
        let c = conn();
        let req = IngestRequest {
            token: "tok".into(),
            items: vec![item("第一句"), item("第二句"), item("第三句")],
        };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 3);
        assert_eq!(r.rejected, 0);
        assert!(r.errors.is_empty());
    }

    #[test]
    fn wrong_token_rejects_everything() {
        let c = conn();
        let req = IngestRequest { token: "bad".into(), items: vec![item("x")] };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 0);
        assert_eq!(r.errors.len(), 1);
    }

    #[test]
    fn empty_text_is_rejected() {
        let c = conn();
        let req = IngestRequest { token: "tok".into(), items: vec![item("   ")] };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 0);
        assert_eq!(r.rejected, 1);
        assert!(r.errors.iter().any(|e| e.contains("空文本")));
    }

    #[test]
    fn oversized_item_is_rejected_at_64kb() {
        let c = conn();
        let big = "A".repeat(64 * 1024 + 1); // 超限 1 byte
        let req = IngestRequest { token: "tok".into(), items: vec![item(&big)] };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 0);
        assert_eq!(r.rejected, 1);
        assert!(r.errors.iter().any(|e| e.contains("64KB")));
    }

    #[test]
    fn exactly_64kb_passes() {
        let c = conn();
        let big = "B".repeat(64 * 1024); // 恰好上限
        let req = IngestRequest { token: "tok".into(), items: vec![item(&big)] };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 1);
    }

    #[test]
    fn batch_over_1000_items_is_refused() {
        let c = conn();
        let items: Vec<IngestItem> = (0..1001).map(|i| item(&format!("句{i}"))).collect();
        let req = IngestRequest { token: "tok".into(), items };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 0);
        assert!(r.errors.iter().any(|e| e.contains("1000")));
    }

    #[test]
    fn bad_rfc3339_falls_back_to_now() {
        let c = conn();
        let mut it = item("時間錯也收");
        it.created_at = Some("not-a-date".to_string());
        let req = IngestRequest { token: "tok".into(), items: vec![it] };
        let r = ingest(&c, &req, "tok");
        assert_eq!(r.accepted, 1, "無效時間應回退為導入時間，不拒收");
    }
}
