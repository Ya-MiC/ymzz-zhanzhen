// MIT. Assemble the directory that is zipped for Windows. Never creates installer/registry entries.
import {cpSync,mkdirSync,copyFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'dist/zhanzhen-portable');mkdirSync(out,{recursive:true});
const exe=process.platform==='win32'?'.exe':'';
copyFileSync(resolve(root,'runtime-desktop/target/release/ymzz-zhanzhen-desktop'+exe),join(out,'ymzz-zhanzhen'+exe));
copyFileSync(process.execPath,join(out,'node'+exe));cpSync(resolve(root,'runtime/dist'),join(out,'runtime'),{recursive:true});
copyFileSync(resolve(root,'LICENSE'),join(out,'LICENSE'));
// setup-node ships the upstream Node license with third-party notices. Fail closed without it.
const nodeLicense=[resolve(process.execPath,'../LICENSE'),resolve(process.execPath,'../../LICENSE'),resolve(root,'runtime-desktop/node-LICENSE')].find(existsSync);
if(!nodeLicense)throw new Error('NODE_LICENSE_REQUIRED');copyFileSync(nodeLicense,join(out,'NODE-LICENSE'));
writeFileSync(join(out,'開始使用.txt'),'湛箴本機智能體（首個垂直切片）\n解壓整個 ZIP，雙擊 ymzz-zhanzhen.exe。無需 Node/Python 安裝。\n需要現有 WebView2；本套件不會下載或安裝 WebView2，也不宣稱底層瀏覽器零寫入。\n資料在同資料夾 data；關閉後刪除整個可攜資料夾即移除應用及本機資料。\n此 ZIP 不是 MSI/NSIS 安裝器；一般安裝器會修改 Windows 註冊表，因此本版不生成。\n預設離線、無遙測；本機模型由你自行啟動並確認 opt-in。\n');
console.log(out);

writeFileSync(join(out,'開始編碼.txt'),'湛箴 · 本機編碼工作區\n1. 解壓整包、雙擊 ymzz-zhanzhen.exe；需要已安裝 WebView2。\n2. 暱稱引導後啟用編碼工作區。可先按「建立離線程式修復示例」：它是假模型，但檔案修改、失敗／修正／單元測試都是真的。\n3. 每批先審查工具；有測試時另確認信任程式碼。通過後檢查差異，可驗收或還原；記憶另行確認。\n4. 使用自己的專案：在模型設定啟用本機連線、填 Ollama／LM Studio 相容 base URL 與模型名稱，再用原生選擇器選資料夾。模型必須能返回 JSON 工具提案；未內附模型，未測付費／雲端推論。\n5. 首版只支援小型文字專案及 .test.mjs/node:test；每檔 32 KiB、64 檔、6 輪／16 工具、測試 3 秒。測試不是 OS／網路沙盒，只執行你信任的程式。\n6. 支付寶由你自行接入；既有手動碼功能僅保留，不代辦商戶或付款。\n資料留在同目錄 data，關閉後刪除整包即可移除應用資料；無自訂註冊表持久化。Windows／WebView2 本身仍可能有系統快取與登錄操作。\n');
