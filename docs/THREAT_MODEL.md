# 晏銘湛箴 — 威脅模型 (THREAT_MODEL.md)
# 如實寫出已知限制。

## 已知限制
- 攻擊者若同時取得數據庫與 HMAC 密鑰（INTEGRITY_KEY），可以重寫哈希鏈，偽造完整性證明。此為本設計固有限制，無法僅靠本地密鑰防禦。
- 桌面端數據全在本機 SQLite，未加密靜態資料；若裝置本身被入侵，資料可能外洩。
- MockPay 僅供本地與測試；生產環境必須切換為真實 Vibe Pay，否則 PAY_MODE=mock + APP_ENV=production 會拒絕啟動。
- Vibe Pay 接口在官方文檔公開前未實現；此期間僅提供 MockPay 閉環。

## 防禦措施
- 完整性鏈：每行寫入 row_hash = SHA-256(prev_hash ‖ 規範化 JSON)，HMAC-SHA256(密鑰, row_hash ‖ prev_hash)
- 「湛然常寂」鎖定：校驗不通過即寫介面 423，僅保留讀取、導出、驗證
- 匿名用戶：128 位隨機 token，HttpOnly Cookie，不收集郵箱/手機
- 權益點單次使用：UPDATE ... WHERE id=? AND used=0，影響行數必須為 1
- 支付簽名：常數時間比較；以渠道交易號做唯一約束實現冪等
- Rhai 沙箱：max_operations 100000、max_call_levels 16、字串上限 64KB、無文件/網絡/時間函數、單次 ≤200ms
