import {codingUI} from './coding.js';
// MIT. No external dependencies, analytics, eval or untrusted innerHTML.
const $=s=>document.querySelector(s),root=$('#app'),dialog=$('#detail');
let token=new URLSearchParams(location.hash.slice(1)).get('token')||sessionStorage.getItem('ymzz-session')||'';
if(token){sessionStorage.setItem('ymzz-session',token);history.replaceState(null,'',location.pathname);}
let state,view='coding',filter='';
const names={coding:'編碼工作區',board:'工作台',plugins:'插件與權限',skills:'技能池',memory:'本機記憶',provider:'模型設定',audit:'既有核心',payment:'支持與收費',family:'產品家族'};
const labels={todo:'待開始',claimed:'已認領',running:'執行中',review:'待驗收',done:'已完成',failed:'未通過',rejected:'已退回'};
function h(tag,props={},...children){const e=document.createElement(tag);for(const[k,v]of Object.entries(props)){if(k.startsWith('on'))e.addEventListener(k.slice(2).toLowerCase(),v);else if(k==='class')e.className=v;else if(k==='value')e.value=v;else if(k==='checked')e.checked=v;else e.setAttribute(k,v);}for(const c of children.flat(Infinity)){if(c!==undefined&&c!==null)e.append(c instanceof Node?c:document.createTextNode(String(c)));}return e;}
const p=t=>h('p',{},t),button=(text,action,props={})=>h('button',{type:'button',onClick:()=>guard(action),...props},text),field=(text,input)=>h('div',{},h('label',{for:input.id},text),input);
function say(t){$('#status').textContent=t;}function fail(e){$('#error').textContent=({PLAN_JSON_INVALID:'本機模型沒有返回有效的 JSON 工具提案。請檢查模型是否支援指令／JSON 輸出；沒有執行新工具。',LOOP_LIMIT:'已到達安全迴圈上限，請檢查差異或還原，不會無限重試。',PATH_NOT_FOUND:'目錄或檔案不存在。首版只在已存在的目錄內新增檔案。',PROVIDER_NOT_CONFIGURED:'尚未設定本機模型，請先到模型設定。',NATIVE_PICKER_REQUIRES_DESKTOP:'資料夾選擇需要完整桌面 App。瀏覽器開發模式可以使用離線示例。',WORKSPACE_PICK_CANCELLED:'已取消選擇資料夾，沒有讀取或修改專案。',FILE_CONFLICT:'檔案已被其他程式修改。為保護你的內容，已拒絕覆蓋；請檢查差異。',TOOL_CONSENT_REQUIRED:'請先勾選此批工具授權。',TEST_EXECUTION_CONSENT_REQUIRED:'這批包含執行程式碼，請另外確認你信任測試。',DIFF_REVIEW_REQUIRED:'請先檢查並勾選差異驗收確認。',AUTH_REQUIRED:'本機連線已過期。請關閉後重新打開湛箴。',PLUGIN_DISABLED:'請先到「插件與權限」啟用所需的本機能力。',EMPTY_INPUT_GATE_FAILED:'文件沒有可驗證的內容，請選擇文字文件後重試。',LOCAL_PROVIDER_ONLY:'這版只連接你本機的模型，不能填入雲端 API。',EVIDENCE_TAMPERED:'證據鏈校驗失敗，已阻止執行與驗收。',PROVIDER_HTTP_ERROR:'模型尚未就緒。請確認本機服務和模型名稱。'})[e.message]||'未完成：'+e.message;$('#error').focus();}
async function guard(fn){$('#error').textContent='';try{await fn();}catch(e){fail(e);}}
async function api(path,data){const r=await fetch('/api/'+path,{method:data===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});const b=await r.json();if(!r.ok)throw new Error(b.error?.code||'REQUEST_FAILED');return b;}
async function refresh(){state=await api('state');render();}
async function mutate(path,b,message='已保存在這台裝置。'){await api(path,b);say(message);await refresh();}
function open(title,content){$('#detail-body').replaceChildren(h('h2',{id:'detail-title'},title),content);if(!dialog.open)dialog.showModal();}
$('#close-detail').onclick=()=>dialog.close();
function themes(){const box=h('fieldset',{},h('legend',{},'溫潤外觀'));const current=localStorage.getItem('wenrun-theme')||'cloud-light';
 for(const[id,label]of [['cloud-light','雲箋'],['cloud-dark','暮靄'],['earth-light','陶土'],['earth-dark','暮林']]){
  const input=h('input',{type:'radio',name:'theme',value:id,id:'theme-'+id,checked:current===id,onChange:()=>{localStorage.setItem('wenrun-theme',id);applyTheme(id);}});box.append(h('label',{class:'choice',for:input.id},input,label));}
 return box;}
function applyTheme(t){const[palette,mode]=t.split('-');document.documentElement.dataset.theme=mode;document.documentElement.dataset.palette=palette==='earth'&&mode==='dark'?'wood':palette;}
applyTheme(localStorage.getItem('wenrun-theme')||'cloud-light');
function onboarding(){const input=h('input',{id:'nickname',name:'nickname',value:'用戶',maxlength:60,required:'',autocomplete:'nickname'});
 root.replaceChildren(h('main',{class:'welcome'},h('img',{class:'mark',src:'/brand/icon-128.png',alt:'湛箴產品圖標'}),h('h1',{},'先從你的名字開始'),p('湛箴是你的本機智能體。資料留在裝置上，能力由你決定。'),h('form',{method:'post',action:'/api/onboarding',onSubmit:e=>{e.preventDefault();guard(()=>mutate('onboarding',{nickname:input.value},'歡迎。先選擇你願意啟用的能力。'));}},field('怎麼稱呼你？',input),h('small',{},'尚未綁定手機，不會虛構電話尾號。'),h('p',{},h('button',{type:'submit',class:'primary'},'進入我的工作台'))),themes(),h('small',{},'無需帳號 · 預設離線 · 不掃描整顆硬碟')));}
const links=[['湛箴 GitHub','https://github.com/Ya-MiC/ymzz-zhanzhen'],['每日復盤與設定教學','https://ya-mic.github.io/ymzz-loop/'],['稟冊 · 引導與下載','https://bingce.yanmingx0215.filegear-sg.me/#onboarding'],['晏銘湛箴官網','https://ya-mic.github.io/yanming-official-website/'],['無用之用','https://ya-mic.github.io/ymzz-wuyong-zhi-yong/'],['無無即無','https://ya-mic.github.io/ymzz-wuwong-ji-wung/']];
function familyNav(){return h('nav',{'aria-label':'同一產品家族'},links.map(([text,href])=>h('a',{href,rel:'noopener noreferrer'},text)));}
function render(){if(!state.profile)return onboarding();
 const nav=h('nav',{'aria-label':'主要導覽'},Object.entries(names).map(([id,title])=>button([h('img',{class:'nav-icon',src:'/icons/'+({coding:'code-xml',board:'list-checks',provider:'settings-2'}[id]||'message-square')+'.svg',alt:'','aria-hidden':'true'}),title],()=>{view=id;filter='';render();},{...(view===id?{'aria-current':'page'}:{})})));
 const main=h('main',{id:'content',tabindex:-1},h('nav',{class:'breadcrumb','aria-label':'麵包屑'},button('湛箴',()=>{view='board';render();}),h('span',{},'／ '+names[view])));
 root.replaceChildren(h('header',{},h('div',{},h('strong',{},'晏銘湛箴_湛箴'),h('span',{},'　 三十輻共一轂')),h('div',{class:'row'},h('span',{class:'pill'},'本機 · '+(state.integrity?'證據有效':'證據異常')),button(state.profile.nickname,()=>open('我的裝置',h('div',{},p('資料保存在本機應用資料夾；不收集、不遙測。'),themes()))))),h('div',{class:'shell'},h('aside',{},nav),main));
 main.append(h('h1',{},names[view]));
 const views={coding:codingApp.render,board,plugins,skills,memory,provider,audit,payment,family};views[view](main);
 main.append(h('footer',{},h('small',{},'本機插件核心源自官方 DeepSeek Harness 的 MIT Cordis。這不是完整 DSH 發行版；離線文件任務不等於模型推論。'),familyNav()));
}
function board(main){const needs=['skills','dispatch','audit'].filter(id=>!state.plugins.find(x=>x.id===id)?.enabled);
 main.append(h('div',{class:'hero'},h('h2',{},'把一件事，做成可驗證的結果。'),p('選一份文字文件，讓本機智能體認領、執行、驗證，再由你驗收。沒有模型費用，也沒有資料上傳。'),needs.length?button('先設定本機權限',()=>{view='plugins';render();},{class:'primary'}):button('建立第一個任務',newTask,{class:'primary'})));
 const search=h('input',{id:'task-search',type:'search',name:'q',value:filter,placeholder:'搜尋任務 · Ctrl / ⌘ K',onInput:e=>{filter=e.target.value;drawBoard();}});main.append(h('search',{},h('label',{for:'task-search'},'搜尋本機任務'),search));
 const area=h('div',{class:'board'});main.append(area,button('新增任務',newTask));
 function drawBoard(){area.replaceChildren();for(const[title,states]of [['待開始',['todo','claimed','running']],['待驗收',['review','failed']],['已完成',['done','rejected']]]){
  const list=state.tasks.filter(t=>states.includes(t.state)&&t.title.toLowerCase().includes(filter.toLowerCase()));const section=h('section',{},h('h2',{},title+' · '+list.length));
  if(!list.length)section.append(p('這裡暫時沒有任務。'));for(const t of list)section.append(button([t.title,'　',labels[t.state]],()=>taskDetail(t),{class:'task'}));area.append(section);
 }}drawBoard();}
function newTask(){const title=h('input',{id:'task-title',name:'title',value:'本機文件盤點 · find-skills',required:'',maxlength:160});const text=h('textarea',{id:'task-input',name:'input',maxlength:1048576,required:'',value:'晏銘湛箴：三十輻共一轂。\nKeep data local. Verify evidence before review.'});
 const file=h('input',{id:'document-file',name:'document',type:'file',accept:'.txt,.md,.csv',onChange:e=>guard(async()=>{const f=e.target.files[0];if(!f)return;if(f.size>1_048_576)throw new Error('FILE_TOO_LARGE');text.value=await f.text();say('已讀取你選擇的文件，尚未執行。');})});
 const form=h('form',{action:'/api/tasks',method:'post',onSubmit:e=>{e.preventDefault();guard(async()=>{await mutate('tasks',{title:title.value,input:text.value},'任務已建立，等待認領。');dialog.close();});}},field('任務名稱',title),field('選擇文件（不用輸入路徑）',file),field('只處理你提供的內容',text),h('button',{type:'submit',class:'primary'},'建立任務'));
 open('建立本機文件任務',form);}
async function taskDetail(t){const evidence=await api('evidence?id='+encodeURIComponent(t.id));const actions=h('div',{class:'row'});
 const act=(text,path,body)=>actions.append(button(text,async()=>{await mutate(path,body);await taskDetail(state.tasks.find(x=>x.id===t.id));},{class:'primary'}));
 if(t.state==='todo')act('交給本機智能體認領','claim',{id:t.id});
 if(t.state==='claimed')act('執行並通過驗證閘','run',{id:t.id});
 if(t.state==='review'){act('確認結果，通過驗收','review',{id:t.id,accepted:true});act('退回，不採用','review',{id:t.id,accepted:false});}
 if(t.state==='done')actions.append(button('確認記住這次結果',async()=>{await mutate('remember',{id:t.id,text:JSON.stringify(t.result),consent:true},'你確認的片段已留在本機記憶。');}));
 open(t.title,h('div',{},h('span',{class:'pill'},labels[t.state]),p('只會執行固定的 Rust 文件盤點，不會執行文件裡的指令。'),actions,h('h3',{},'結果'),h('pre',{},t.result?JSON.stringify(t.result,null,2):'尚未執行。'),h('h3',{},'可核對的證據鏈 · '+(evidence.valid?'有效':'異常')),h('pre',{},JSON.stringify(evidence.events,null,2))));}
function plugins(main){main.append(p('每個插件都需你確認權限。這版只接受內建、已審查的插件；不是任意 JavaScript 的安全沙盒。'));
 for(const pl of state.plugins)main.append(h('article',{class:'card'},h('h2',{},pl.title),p(pl.permissions.join(' · ')),h('span',{class:'pill'},pl.enabled?'已啟用':'未啟用'),button(pl.enabled?'停用':'確認這些權限並啟用',()=>mutate('plugins',{id:pl.id,enabled:!pl.enabled,consent:true}))));}
function skills(main){if(!state.skills.length)return main.append(p('請先啟用「技能池」插件。'));main.append(p('技能已固定來源、提交與 SHA-256。只讀指引，不會自動執行腳本；其他審美技能不得覆蓋溫潤 Token。'));
 const grid=h('div',{class:'grid'});for(const s of state.skills)grid.append(h('article',{class:'card'},h('h2',{},s.id),p(s.license+' · '+s.commit.slice(0,12)),h('small',{},s.excluded?'部分附件已隔離，詳見鎖檔。':'來源與校驗已鎖定。'),button('讀取已安裝技能',async()=>{const skill=await api('skill?id='+encodeURIComponent(s.id));open(s.id,h('pre',{},skill.text));})));main.append(grid);}
function memory(main){main.append(p('不會採集整顆硬碟。只有你通過驗收後按「確認記住」的片段會出現在這裡。'),h('div',{class:'grid'},state.memory.length?state.memory.map(m=>h('article',{class:'card'},h('h2',{},'已確認的片段'),p(new Date(m.created).toLocaleString('zh-TW',{timeZone:'Asia/Seoul'})+'（首爾時間）'),h('pre',{},m.text))):p('尚無確認的記憶。完成並驗收一個任務後，就能留存片段。')));}
function provider(main){if(!state.plugins.find(p=>p.id==='provider')?.enabled)main.append(button('啟用本機模型連線權限',()=>mutate('plugins',{id:'provider',enabled:true,consent:true})));main.append(p('這版只連本機 OpenAI 相容服務（例如 Ollama / LM Studio）。不預設模型、不啟動付費推論。API 金鑰不儲存，也不採集模型思考鏈。'));
 const endpoint=h('input',{id:'endpoint',name:'baseUrl',type:'url',value:state.provider?.baseUrl||'http://127.0.0.1:11434/v1',required:''}),model=h('input',{id:'model',name:'model',value:state.provider?.model||'',required:'',placeholder:'填入你已下載的本機模型名稱'});
 main.append(h('form',{action:'/api/provider',method:'post',onSubmit:e=>{e.preventDefault();guard(()=>mutate('provider',{baseUrl:endpoint.value,model:model.value,optIn:true}));}},field('本機服務網址',endpoint),field('模型名稱',model),h('button',{type:'submit'},'允許連接這台裝置上的模型')));
 const prompt=h('textarea',{id:'prompt',name:'prompt',maxlength:32000,value:'請用一句話介紹你自己。'});main.append(h('form',{action:'/api/infer',method:'post',onSubmit:e=>{e.preventDefault();guard(async()=>{say('正在等待本機模型（最長 30 秒）…');const out=await api('infer',{prompt:prompt.value,consent:true});say('本機模型已回應。');open('本機模型結果',h('pre',{},out.text));});}},field('送往本機模型的內容',prompt),h('button',{type:'submit'},'只發送這段內容到本機模型')));}
function audit(main){main.append(p('既有 Rust 量化、標籤、星雲與證據鏈程式原樣保留。新的本機文件任務已實際呼叫 ymzz-core 的完整性雜湊功能。'),h('div',{class:'card'},h('h2',{},'舊版工作區'),p('如果此構建包含原 UI，可在下方開啟。舊版 OCR／總帳服務並不存在於目前目標倉庫，未虛構成已完成。'),h('a',{href:'/legacy/index.html',rel:'noopener'},'開啟保留的原版 UI')),button('回到文件驗證任務',()=>{view='board';render();}));}
function payment(main){main.append(p('支付寶接入由你自行完成；此處僅保留既有本機手動設定，不作付款或商戶整合。'));main.append(p('靜態收款碼只展示，不會自動確認付款或解鎖權益。電腦網站支付通常單筆 0.6%，實際費率與資格以商戶簽約為準，不代表零手續費。'));
 if(state.payment?.image)main.append(h('img',{class:'qr',src:state.payment.image,alt:'你在此裝置上選擇的支付寶收款碼'}),p('由本機使用者提供；湛箴尚未驗證收款人身分。狀態：靜態展示，未確認付款。'));
 else main.append(h('div',{class:'card'},h('h2',{},'尚未設定收款碼'),p('沒有虛構的二維碼，也未建立任何商戶或交易。微信碼未提供，因此不展示。')));
 const file=h('input',{id:'qr-file',name:'qr',type:'file',accept:'image/png,image/jpeg'});main.append(h('form',{action:'/api/payment',method:'post',onSubmit:e=>{e.preventDefault();guard(async()=>{const f=file.files[0];if(!f)throw new Error('請選擇你自己的收款碼');if(f.size>1_000_000)throw new Error('FILE_TOO_LARGE');const r=new FileReader();const data=await new Promise((ok,no)=>{r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f);});await mutate('payment',{image:data});});}},field('從裝置選擇你的支付寶收款碼（PNG / JPEG，≤1 MB）',file),h('button',{type:'submit'},'只存到本機，展示收款碼')),h('a',{href:'https://opendoc.alipay.com/open/02ivbm',rel:'noopener noreferrer'},'支付寶官方接入文件'));}
function family(main){main.append(h('div',{class:'hero'},h('h2',{},'一個產品，不同入口。'),p('湛箴是智能體本體；稟冊是文件與復盤能力；無用之用負責技能調度；無無即無負責你確認的記憶。')),
 h('div',{class:'figure'},[['你','board'],['任務與驗證閘','board'],['技能與調度','skills'],['確認後的記憶','memory']].map(([t,v])=>button(t+' →',()=>{view=v;render();}))),p('既有 Pages 的 product 分支部署受環境保護規則阻擋，這裡不改規則，也不宣稱外部反向入口已全部上線。'),familyNav());}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();view='board';render();$('#task-search')?.focus();}});
const codingApp=codingUI({h,p,button,field,api,refresh,open,dialog,getState:()=>state,setView:v=>{view=v;render();}});
guard(refresh);
