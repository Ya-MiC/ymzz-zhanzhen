//! ymzz-redblue — 紅藍對抗自動防禦與安全審計
//! 紅方只能攻擊本地實例（127.0.0.1 或測試進程），代碼裡硬編碼拒絕任何非本機地址。

pub mod blue_team;
pub mod red_team;
pub mod report;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum RedBlueError {
    #[error("非本地地址禁止：{0}")]
    NonLocal(String),
    #[error("內部錯誤：{0}")]
    Internal(String),
}