# 支付接入：實測與未實測分開

## 官方依據（2026-11-16，首爾時間核讀公開文件）

- https://opendoc.alipay.com/open/02ivbm — `alipay.trade.page.pay` 是**服務端簽名後的頁面跳轉**；RSA2、out_trade_no、total_amount、notify_url、`FAST_INSTANT_TRADE_PAY`。
- https://ideservice.alipay.com/cms/site/0iztfv — 電腦網站支付產品：標準單筆 **0.6%**、簽約與網站／備案等條件；需驗簽、核對 app_id／訂單／金額，再處理成功狀態；不能信任同步跳轉。
- https://aipay.alipay.com/article/4087 — 0.6% 是成功交易服務費；實際以商戶協議與帳單為準。
- https://opendocs.alipay.com/open/llms-full.txt — 官方產品索引；不把 App/手機網站/當面付不同產品的費率混作一個承諾。

靜態圖片免「我們的伺服器」，不等於支付寶免手續費、免准入、免合規。實際使用個人碼／商業碼與簽約類別需依官方規則；這裡沒有替使用者開商戶、報名、購買或測真交易。

## 已實作

- GUI 用檔案選擇器設定**使用者自行提供**的 PNG/JPEG，存在本機 SQLite。不外傳、不從私密檔案搜碼；未設定則顯示未設定。
- 靜態收款只顯示，不自動判 paid，不自動解鎖；微信碼沒有實際提供，UI 不生成假的微信碼。
- `integrations/alipay-sandbox/worker.mjs`：可選純服務端 RSA2 sandbox adapter；固定沙盒 host，無 public client-priced create-order endpoint；商戶私鑰只從 Worker bindings 讀取，沒有任何真 key。
- callback：真 WebCrypto RSA2 驗簽，檢查 app_id、seller_id、order id、精確兩位小數字串金額、成功狀態，重放需相同 trade_no，D1 compare-and-set 更新；前端 paid 無權威。
- 真 RSA2 合成金鑰離線測試：簽名／金額／身份錯誤、非沙盒、非法訂單、重放與不同交易號。

## 沒完成／沒有部署

沒有真收款碼、商戶資格／簽約、正式 app_id、merchant/alipay keys，沒有雲端部署、D1 建立、真沙盒交易、真生產交易。動態支付仍需信任的訂單建立者、保護端點、sandbox 實帳端到端、對帳、退款、交易查詢與狀態恢復。**不是可立即用於生產的收款服務**。
