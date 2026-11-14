//! entitlement.rs — 權益點單次使用：SQLite 事務內 UPDATE entitlements SET used=1 WHERE id=? AND used=0，
//! 影響行數必須為 1 才可調用 LLM；LLM 失敗則回滾權益點。

use ymzz_core::model::Entitlement;
use crate::PayError;

#[derive(Clone, Default)]
pub struct EntitlementStore {
    entitlements: std::collections::HashMap<i64, Entitlement>,
    next_id: i64,
}

impl EntitlementStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn issue(&mut self, order_id: i64, user_id: &str) -> i64 {
        let id = self.next_id;
        self.next_id += 1;
        self.entitlements.insert(
            id,
            Entitlement {
                id: Some(id),
                order_id,
                user_id: user_id.to_string(),
                used: false,
                used_at: None,
            },
        );
        id
    }

    /// 單次使用：影響行數必須為 1 才可調用 LLM
    pub fn consume(&mut self, id: i64) -> Result<bool, PayError> {
        match self.entitlements.get_mut(&id) {
            Some(e) if !e.used => {
                e.used = true;
                e.used_at = Some(time::OffsetDateTime::now_utc());
                Ok(true)
            }
            Some(_) => Err(PayError::Internal("權益點已被使用（雙花）".to_string())),
            None => Err(PayError::Internal("權益點不存在".to_string())),
        }
    }
}
