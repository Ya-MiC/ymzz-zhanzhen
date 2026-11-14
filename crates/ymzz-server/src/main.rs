//! ymzz-server — axum HTTP 伺服器（Web 版後端）
//! 匿名用戶：服務端簽發隨機 128 位 token，存 HttpOnly Cookie。

mod auth;
mod llm;
mod routes;

use axum::Router;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new().merge(routes::router()).layer(
        tower_http::cors::CorsLayer::permissive(),
    );

    let port: u16 = std::env::var("SERVER_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    println!("ymzz-server 監聽 http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
