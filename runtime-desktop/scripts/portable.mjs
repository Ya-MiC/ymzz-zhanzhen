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
