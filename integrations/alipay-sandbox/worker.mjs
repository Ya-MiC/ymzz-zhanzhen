// MIT. Optional server-only sandbox adapter. Never deployed or called by default.
// Keys are Worker bindings, never browser fields, logs, repo files, or bundled secrets.
const encoder=new TextEncoder();
export function canonical(params){return Object.entries(params).filter(([k,v])=>k!=='sign'&&k!=='sign_type'&&v!==''&&v!=null).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('&');}
function bytes(pem){return Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g,'')),c=>c.charCodeAt(0));}
function requireValue(ok,code){if(!ok)throw new Error(code);}
export async function verifyNotification(params,order,env){
 requireValue(env.MODE==='sandbox','SANDBOX_ONLY');requireValue(params.sign_type==='RSA2'&&typeof params.sign==='string','RSA2_REQUIRED');
 const key=await crypto.subtle.importKey('spki',bytes(env.ALIPAY_PUBLIC_KEY),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Uint8Array.from(atob(params.sign),c=>c.charCodeAt(0)),encoder.encode(canonical(params)));
 requireValue(ok,'INVALID_SIGNATURE');
 requireValue(order&&params.app_id===env.APP_ID&&params.seller_id===env.SELLER_ID&&params.out_trade_no===order.id&&params.total_amount===order.amount&&/^\d+\.\d{2}$/.test(order.amount),'ORDER_IDENTITY_OR_AMOUNT_MISMATCH');
 requireValue(['TRADE_SUCCESS','TRADE_FINISHED'].includes(params.trade_status)&&typeof params.trade_no==='string'&&params.trade_no.length>0,'NOT_PAID');
 requireValue(order.state==='pending'||(order.state==='paid'&&order.trade_no===params.trade_no),'ORDER_REPLAY_MISMATCH');
 return {state:'paid',trade_no:params.trade_no,idempotent:order.state==='paid'};
}
export async function signedPageOrder(order,env,now=new Date()){
 requireValue(env.MODE==='sandbox','SANDBOX_ONLY');requireValue(order&&/^[a-zA-Z0-9_]{1,64}$/.test(order.id)&&/^\d+\.\d{2}$/.test(order.amount)&&Number(order.amount)>0&&Number(order.amount)<=100000000,'ORDER_INVALID');
 requireValue(typeof order.subject==='string'&&order.subject.length>0&&order.subject.length<=128,'SUBJECT_INVALID');
 const notify=new URL(env.NOTIFY_URL);requireValue(notify.protocol==='https:','HTTPS_NOTIFY_REQUIRED');
 // Alipay request signing INCLUDES sign_type (callback verification excludes it).
 const params={app_id:env.APP_ID,method:'alipay.trade.page.pay',format:'JSON',charset:'utf-8',sign_type:'RSA2',timestamp:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now),version:'1.0',notify_url:notify.href,biz_content:JSON.stringify({out_trade_no:order.id,total_amount:order.amount,subject:order.subject,product_code:'FAST_INSTANT_TRADE_PAY'})};
 const key=await crypto.subtle.importKey('pkcs8',bytes(env.MERCHANT_PRIVATE_KEY),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const content=Object.entries(params).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('&');
 const sig=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,encoder.encode(content)));params.sign=btoa(String.fromCharCode(...sig));
 return 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?'+new URLSearchParams(params);
}
// Bound actual streamed bytes, including requests that omit Content-Length.
async function readBoundedNotification(request){
 const reader=request.body?.getReader();requireValue(reader,'BODY_REQUIRED');let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel('notification too large');throw new Error('REQUEST_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
 const joined=new Uint8Array(size);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
 return new TextDecoder('utf-8',{fatal:true}).decode(joined);
}
export default {
 async fetch(request,env){
  // No public create-order endpoint: a trusted server records priced orders and invokes signedPageOrder.
  const url=new URL(request.url);if(url.pathname!=='/notify'||request.method!=='POST')return new Response('Not found',{status:404});
  try{
   requireValue(env.MODE==='sandbox'&&Number(request.headers.get('content-length')||0)<=16384,'SANDBOX_ONLY');
   const text=await readBoundedNotification(request);const form=new URLSearchParams(text);const params=Object.fromEntries(form);
   requireValue([...form.keys()].length===Object.keys(params).length,'DUPLICATE_PARAMETERS');
   const order=await env.ORDERS.prepare('SELECT * FROM alipay_orders WHERE id=?').bind(params.out_trade_no).first();
   const result=await verifyNotification(params,order,env);
   const changed=await env.ORDERS.prepare("UPDATE alipay_orders SET state='paid',trade_no=? WHERE id=? AND state='pending' AND amount=?").bind(result.trade_no,order.id,order.amount).run();
   requireValue(result.idempotent||changed.meta.changes===1,'ORDER_RACE_REJECTED');return new Response('success');
  }catch{return new Response('failure',{status:400});}
 }
};
