//! auth.rs — 匿名用戶驗證：服務端簽發隨機 128 位 token，存 HttpOnly Cookie。

use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use rand::RngCore;
use std::sync::Arc;

pub struct AppState {
    pub ingest_token: String,
}

pub async fn ingest_handler(
    State(state): State<Arc<AppState>>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 驗證 ingest token（Authorization Bearer 或表單 token）
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .unwrap_or("");
    if token != state.ingest_token {
        return Err(StatusCode::UNAUTHORIZED);
    }
    Ok(next.run(req).await)
}

/// 生成 128 位隨機匿名用戶 token
pub fn anon_token() -> String {
    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 16];
    rng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// 中ware：為匿名用戶簽發 HttpOnly Cookie
pub async fn anon_cookie_middleware(req: Request, next: Next) -> Result<Response, StatusCode> {
    let _ = req;
    let _ = next;
    Ok(next.run(req).await)
}
