//! vibepay.rs — VibePay（支付寶 Vibe Pay）。
//! 必須嚴格按支付寶官方 Vibe Pay 接入文檔實現。環境變量名按官方文檔，寫入 .env.example。
//! 拿不到文檔時，此文件只返回 PayError::NotConfigured，並列入阻塞項。嚴禁憑印象編造接口地址、字段或簽名算法。

use ymzz_core::model::{Order, OrderStatus};
use crate::PayError;
use std::collections::HashMap;

/// VibePay 提供者（待官方文檔）
pub struct VibePay {
    config: VibePayConfig,
}

#[derive(Clone, Default)]
pub struct VibePayConfig {
    pub app_id: Option<String>,
    pub private_key: Option<String>,
    pub public_cert: Option<String>,
    pub gateway_url: Option<String>,
}

impl VibePay {
    pub fn new() -> Self {
        Self {
            config: VibePayConfig::from_env(),
        }
    }
}

impl VibePayConfig {
    fn from_env() -> Self {
        Self {
            app_id: std::env::var("ALIPAY_APP_ID").ok(),
            private_key: std::env::var("ALIPAY_PRIVATE_KEY").ok(),
            public_cert: std::env::var("ALIPAY_PUBLIC_CERT").ok(),
            gateway_url: std::env::var("ALIPAY_GATEWAY_URL").ok(),
        }
    }

    pub fn is_configured(&self) -> bool {
        self.app_id.is_some() && self.private_key.is_some()
    }
}

impl super::PayProvider for VibePay {
    fn name(&self) -> &'static str {
        "VibePay"
    }

    fn create_order(&self, _order: &Order) -> Result<String, PayError> {
        if !self.config.is_configured() {
            return Err(PayError::NotConfigured);
        }
        // 實際須按官方 Vibe Pay 文檔構造請求；此處不編造任何接口地址或字段
        Err(PayError::NotConfigured)
    }

    fn query_order(&self, _trade_no: &str) -> Result<OrderStatus, PayError> {
        Err(PayError::NotConfigured)
    }

    fn verify_notify(&self, _payload: &[u8], _signature: &str) -> Result<bool, PayError> {
        Err(PayError::NotConfigured)
    }

    fn refund(&self, _trade_no: &str) -> Result<bool, PayError> {
        Err(PayError::NotConfigured)
    }
}
