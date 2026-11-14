# 晏銘湛箴 — Web 伺服器映像（ymzz-server）
FROM rust:1.82-bookworm AS builder
WORKDIR /app
COPY . .
RUN cargo build --release --bin ymzz-server

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/ymzz-server /usr/local/bin/ymzz-server
ENV PAY_MODE=mock APP_ENV=production SERVER_PORT=8080
EXPOSE 8080
ENTRYPOINT ["ymzz-server"]
