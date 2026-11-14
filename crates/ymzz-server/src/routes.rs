//! routes.rs — HTTP 路由定義（stub 階段，P1 後續接線）

use axum::routing::{get, post};
use axum::Router;
use axum::Json;
use serde_json::json;

pub fn router() -> Router {
    Router::new()
        .route("/v1/health", get(health_handler))
        .route("/v1/utterances", get(list_utterances_handler))
        .route("/v1/ingest", post(ingest_handler))
        .route("/v1/ai/annotate", post(annotate_handler))
        .route("/v1/pay/create", post(pay_create_handler))
        .route("/v1/pay/notify", post(pay_notify_handler))
        .route("/v1/pay/query/:trade_no", get(pay_query_handler))
}

async fn health_handler() -> Json<serde_json::Value> {
    Json(json!({"status": "ok"}))
}

async fn list_utterances_handler() -> Json<serde_json::Value> {
    Json(json!({"items": []}))
}

async fn ingest_handler() -> Json<serde_json::Value> {
    Json(json!({"error": "ingest not wired yet"}))
}

async fn annotate_handler() -> Json<serde_json::Value> {
    Json(json!({"error": "annotate not wired yet"}))
}

async fn pay_create_handler() -> Json<serde_json::Value> {
    Json(json!({"error": "pay create not wired yet"}))
}

async fn pay_notify_handler() -> Json<serde_json::Value> {
    Json(json!({"error": "pay notify not wired yet"}))
}

async fn pay_query_handler() -> Json<serde_json::Value> {
    Json(json!({"error": "pay query not wired yet"}))
}
