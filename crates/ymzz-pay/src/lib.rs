//! ymzz-pay — 支付抽象層
//! 定義 PayProvider trait，實現 MockPay 與 VibePay（待官方文檔）。

pub mod entitlement;
pub mod mock;
pub mod orders;
pub mod provider;
pub mod vibepay;

use ymzz_core::model::{Entitlement, Order, OrderStatus};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PayError {
    #[error("未配置（等待 Vibe Pay 官方接入文檔）")]
    NotConfigured,
    #[error("訂單不存在：{0}")]
    OrderNotFound(String),
    #[error("金額不一致：訂單 {0} 期望 {1} 分，收到 {2} 分")]
    AmountMismatch(String, i64, i64),
    #[error("簽名驗證失敗")]
    InvalidSignature,
    #[error("冪等衝突：交易號已存在")]
    IdempotencyConflict,
    #[error("內部錯誤：{0}")]
    Internal(String),
}

/// 支付提供者 trait
pub trait PayProvider: Send + Sync {
    fn name(&self) -> &'static str;
    /// 創建訂單，返回支付鏈接/二維碼
    fn create_order(&self, order: &Order) -> Result<String, PayError>;
    /// 查詢訂單狀態
    fn query_order(&self, trade_no: &str) -> Result<OrderStatus, PayError>;
    /// 驗證異步通知簽名
    fn verify_notify(&self, payload: &[u8], signature: &str) -> Result<bool, PayError>;
    /// 退款
    fn refund(&self, trade_no: &str) -> Result<bool, PayError>;
}
