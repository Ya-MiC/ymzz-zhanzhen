# 晏銘湛箴 — 支付說明 (PAYMENTS.md)

## 商業模型
- 免費：本地導入、標籤、手動與公式評分、星雲、導出。
- 付費：每次「AI 注解」包（≤20 條）。每個匿名用戶每日有免費額度。
- 價格全讀 config/pricing.toml，單位整數「分」，不得寫死。預設佔位值：annotate_pack_fen = 50、free_daily = 3。

## 流程
1. 客戶端請求 AI 注解 → 服務端檢查免費額度/有效權益；不足則創建訂單（金額取自 pricing.toml，客戶端傳來的金額一律忽略）→ 返回支付鏈接/二維碼。
2. 客戶端輪詢訂單狀態（桌面/手機用系統瀏覽器打開支付鏈接）。
3. 支付結果異步通知 POST /v1/pay/notify：驗簽（常數時間比較）；核對訂單號、金額、幣種與服務端記錄一致；以渠道交易號做唯一約束實現冪等；通過後訂單變 paid，發放 1 個權益點。
4. 權益點單次使用：SQLite 事務內 UPDATE entitlements SET used=1 WHERE id=? AND used=0，影響行數必須為 1 才可調用 LLM；LLM 失敗則回滾權益點。

## 訂單狀態機
created → pending → paid → fulfilled；另有 expired、failed、refunded。

## 支付提供者
- MockPay：本地與測試用，頁面有「模擬支付成功」按鈕。PAY_MODE=mock 且 APP_ENV=production 時，服務端必須拒絕啟動。
- VibePay：待支付寶官方 Vibe Pay 接入文檔公開後實現。環境變量名按官方文檔，寫入 .env.example。
