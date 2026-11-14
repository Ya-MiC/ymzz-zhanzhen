//! orders.rs — 訂單狀態機：created → pending → paid → fulfilled；另有 expired、failed、refunded。

use ymzz_core::model::{Order, OrderStatus};
use crate::PayError;

#[derive(Clone, Default)]
pub struct OrderStore {
    // 簡化：記憶體內；實際以 SQLite 為準（見 crates/ymzz-core/src/db.rs）
    orders: std::collections::HashMap<String, Order>,
}

impl OrderStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&mut self, order: Order) {
        let key = order.id.map(|i| i.to_string()).unwrap_or_default();
        self.orders.insert(key, order);
    }

    pub fn get(&self, id: &str) -> Option<&Order> {
        self.orders.get(id)
    }

    /// 狀態轉換：created → pending → paid → fulfilled
    pub fn transition(&mut self, id: &str, to: OrderStatus) -> Result<(), PayError> {
        let order = self.orders.get_mut(id).ok_or_else(|| PayError::OrderNotFound(id.to_string()))?;
        let cur = order.status;
        let allowed = match cur {
            OrderStatus::Created => matches!(to, OrderStatus::Pending | OrderStatus::Expired | OrderStatus::Failed),
            OrderStatus::Pending => matches!(to, OrderStatus::Paid | OrderStatus::Expired | OrderStatus::Failed),
            OrderStatus::Paid => matches!(to, OrderStatus::Fulfilled | OrderStatus::Refunded),
            _ => false,
        };
        if !allowed {
            return Err(PayError::Internal(format!("不允許的狀態轉換 {:?} -> {:?}", cur, to)));
        }
        order.status = to;
        Ok(())
    }
}
