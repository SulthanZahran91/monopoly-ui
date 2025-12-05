use axum::{
    routing::{get, post},
    Router,
    Json,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use backend::room::manager::RoomManager;
use backend::ws::handler::ws_handler;
use serde::Deserialize;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Deserialize, Debug)]
struct LogEntry {
    level: String,
    message: String,
    timestamp: String,
    data: Option<serde_json::Value>,
}

async fn logs_handler(Json(entry): Json<LogEntry>) {
    let log_msg = format!("Frontend Log [{}]: {} - {} {:?}", entry.timestamp, entry.level, entry.message, entry.data);
    match entry.level.as_str() {
        "error" => tracing::error!("{}", log_msg),
        "warn" => tracing::warn!("{}", log_msg),
        _ => tracing::info!("{}", log_msg),
    }
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    let file_appender = tracing_appender::rolling::daily("logs", "monopoly.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().with_writer(std::io::stdout))
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking).with_ansi(false))
        .init();

    // Initialize shared state
    let room_manager = Arc::new(RoomManager::new());

    // Build our application with a route
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/api/logs", post(logs_handler))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(room_manager);

    // Run it
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
