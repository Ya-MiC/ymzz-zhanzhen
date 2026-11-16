import test from 'node:test';import assert from 'node:assert/strict';
import worker,{canonical,verifyNotification,signedPageOrder} from '../../integrations/alipay-sandbox/worker.mjs';
const enc=new TextEncoder();const pem=(type,b)=>`-----BEGIN ${type}-----\n${Buffer.from(b).toString('base64')}\n-----END ${type}-----`;
async function fixture(){const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const env={MODE:'sandbox',APP_ID:'synthetic_app',SELLER_ID:'synthetic_seller',NOTIFY_URL:'https://example.invalid/notify',ALIPAY_PUBLIC_KEY:pem('PUBLIC KEY',await crypto.subtle.exportKey('spki',keys.publicKey)),MERCHANT_PRIVATE_KEY:pem('PRIVATE KEY',await crypto.subtle.exportKey('pkcs8',keys.privateKey))};
 const order={id:'synthetic_order',amount:'1.00',subject:'offline test only',state:'pending'};const params={app_id:env.APP_ID,seller_id:env.SELLER_ID,out_trade_no:order.id,total_amount:order.amount,trade_status:'TRADE_SUCCESS',trade_no:'synthetic_trade',sign_type:'RSA2'};
 params.sign=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,enc.encode(canonical(params)))).toString('base64');return {env,order,params,resign:async patch=>{const p={...params,...patch};p.sign=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,enc.encode(canonical(p)))).toString('base64');return p;}};}
test('sandbox notification: real RSA2 verification, identity + amount + order checks',async()=>{const{env,order,params,resign}=await fixture();assert.equal((await verifyNotification(params,order,env)).state,'paid');
 for(const patch of [{total_amount:'2.00'},{seller_id:'other'},{app_id:'other'},{out_trade_no:'other'},{trade_status:'WAIT_BUYER_PAY'}])await assert.rejects(async()=>verifyNotification(await resign(patch),order,env),/MISMATCH|NOT_PAID/);
 await assert.rejects(()=>verifyNotification(params,{...order,amount:'2.00'},env),/MISMATCH/);await assert.rejects(()=>verifyNotification(params,order,{...env,MODE:'live'}),/SANDBOX_ONLY/);
});
test('signed sandbox page order contains server-owned fields, never live gateway',async()=>{const{env,order}=await fixture();const url=new URL(await signedPageOrder(order,env));assert.equal(url.hostname,'openapi-sandbox.dl.alipaydev.com');assert.equal(url.searchParams.get('method'),'alipay.trade.page.pay');assert.equal(JSON.parse(url.searchParams.get('biz_content')).total_amount,'1.00');assert(url.searchParams.get('sign'));
 await assert.rejects(()=>signedPageOrder({...order,amount:'0.00'},env));await assert.rejects(()=>signedPageOrder(order,{...env,MODE:'live'}));
});
test('notification replay idempotent only for same trade number',async()=>{const{env,order,params}=await fixture();assert.equal((await verifyNotification(params,{...order,state:'paid',trade_no:params.trade_no},env)).idempotent,true);await assert.rejects(()=>verifyNotification(params,{...order,state:'paid',trade_no:'another'},env),/REPLAY/);});

test('callback rejects chunked oversized bodies and duplicate fields before touching D1',async()=>{
 let touched=0,cancelled=false;const env={MODE:'sandbox',ORDERS:{prepare(){touched++;throw Error('must not reach D1');}}};
 const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(16385));},cancel(){cancelled=true;}});
 let r=await worker.fetch(new Request('https://example.invalid/notify',{method:'POST',body,duplex:'half'}),env);assert.equal(r.status,400);assert(cancelled);
 r=await worker.fetch(new Request('https://example.invalid/notify',{method:'POST',body:'out_trade_no=x&out_trade_no=y'}),env);assert.equal(r.status,400);assert.equal(touched,0);
});
test('callback handler verifies signed fields then performs amount-bound D1 compare-and-set (mock binding)',async()=>{
 const{env,order,params,resign}=await fixture();let writes=0;
 env.ORDERS={prepare(sql){return {bind(...args){return {async first(){return order;},async run(){assert(sql.includes("AND state='pending' AND amount=?"));assert.deepEqual(args,[params.trade_no,order.id,order.amount]);writes++;return {meta:{changes:1}};}};}};}};
 const notify=p=>worker.fetch(new Request('https://example.invalid/notify',{method:'POST',body:new URLSearchParams(p)}),env);
 let r=await notify(params);assert.equal(r.status,200);assert.equal(await r.text(),'success');assert.equal(writes,1);
 r=await notify(await resign({total_amount:'2.00'}));assert.equal(r.status,400);assert.equal(writes,1);
});
