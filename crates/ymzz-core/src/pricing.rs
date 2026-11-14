//! 價格模組：全部讀 config/pricing.toml，單位整數「分」，不得寫死。
//! 預設佔位值：annotate_pack_fen = 50、free_daily = 3，上線前由用戶修改。

use serde::Deserialize;
use std::path::Path;

#[derive(Debug, Clone, Deserialize)]
pub struct Pricing {
    pub annotate_pack_fen: i64,
    pub free_daily: i64,
    pub currency: String,
}

impl Pricing {
    /// 從檔案載入；找不到則回傳預設佔位（開發用），並標記未驗證
    pub fn load<P: AsRef<Path>>(path: P) -> Self {
        let content = std::fs::read_to_string(path).unwrap_or_else(|_| {
            eprintln!("[pricing] 未找到 pricing.toml，使用預設佔位值（上線前請由用戶修改）");
            r#"annotate_pack_fen = 50
free_daily = 3
currency = "CNY""#.to_string()
        });
        toml::from_str(&content).expect("pricing.toml 格式錯誤")
    }

    pub fn annotate_cost_fen(&self) -> i64 {
        self.annotate_pack_fen
    }

    pub fn free_daily_quota(&self) -> i64 {
        self.free_daily
    }
}

impl Default for Pricing {
    fn default() -> Self {
        Self {
            annotate_pack_fen: 50,
            free_daily: 3,
            currency: "CNY".to_string(),
        }
    }
}
