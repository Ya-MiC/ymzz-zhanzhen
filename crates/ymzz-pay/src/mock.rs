//! mock.rs — MockPay：本地與測試用，頁面有「模擬支付成功」按鈕。
//! PAY_MODE=mock 且 APP_ENV=production 時，服務端必須拒絕啟動。

use ymzz_core::model::{Order, OrderStatus};
use crate::PayError;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// MockPay 記憶體內訂單狀態
#[derive(Clone, Default)]
pub struct MockPay {
    orders: Arc<Mutex<HashMap<String, OrderStatus>>>,
}

impl MockPay {
    pub fn new() -> Self {
        Self::default()
    }

    /// 模擬支付成功（測試 / 前端按鈕呼叫）
    pub fn simulate_success(&self, trade_no: &str) -> Result<(), PayError> {
        let mut orders = self.orders.lock().unwrap();
        match orders.get_mut(trade_no) {
            Some(status) => {
                *status = OrderStatus::Paid;
                Ok(())
            }
            None => Err(PayError::OrderNotFound(trade_no.to_string())),
        }
    }
}

impl super::PayProvider for MockPay {
    fn name(&self) -> &'static str {
        "MockPay"
    }

    fn create_order(&self, order: &Order) -> Result<String, PayError> {
        let trade_no = format!("MOCK_{}", Uuid::new_v4().to_string().replace('-', ""));
        let mut orders = self.orders.lock().unwrap();
        orders.insert(trade_no.clone(), OrderStatus::Created);
        let _ = order;
        Ok(format!("http://127.0.0.1/pay/mock?trade_no={}", trade_no))
    }

    fn query_order(&self, trade_no: &str) -> Result<OrderStatus, PayError> {
        let orders = self.orders.lock().unwrap();
        match orders.get(trade_no) {
            Some(s) => Ok(*s),
            None => Err(PayError::OrderNotFound(trade_no.to_string())),
        }
    }

    fn verify_notify(&self, _payload: &[u8], _signature: &str) -> Result<bool, PayError> {
        Ok(true)
    }

    fn refund(&self, _trade_no: &str) -> Result<bool, PayError> {
        Ok(true)
    }
}

/// 生產環境下禁止 mock：啟動時檢查
pub fn assert_not_mock_in_production(pay_mode: &str, app_env: &str) -> Result<(), PayError> {
    if pay_mode == "mock" && app_env == "production" {
        return Err(PayError::Internal(
            "PAY_MODE=mock 且 APP_ENV=production 時，服務端必須拒絕啟動".to_string(),
        ));
    }
    Ok(())
}
