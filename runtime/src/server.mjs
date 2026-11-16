// MIT. Loopback-only server with per-launch auth, origin/host gates, no external assets.
import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve,join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store,assert} from './store.mjs';
import {createKernel} from './kernel.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
export async function start({root=HERE,dataDir=process.env.YMZZ_DATA_DIR,coreExecutable=process.env.YMZZ_CORE_EXECUTABLE,port=0}={}){
 assert(dataDir,'DATA_DIR_REQUIRED');const store=new Store(join(dataDir,'zhanzhen.sqlite'));const kernel=await createKernel({store,root,coreExecutable});
 const token=randomBytes(32).toString('hex');let origin;
 const safeEqual=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
 const server=createServer(async(req,res)=>{
  const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"};
  const json=(status,value)=>{res.writeHead(status,{...headers,'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  try{
   assert(req.headers.host===new URL(origin).host,'HOST_FORBIDDEN');
   if(req.headers.origin)assert(req.headers.origin===origin,'ORIGIN_FORBIDDEN');
   const u=new URL(req.url,origin);
   // Bootstrap through URL fragment; JS exchanges token with an Authorization header. No cookies or URL logs.
   if(u.pathname.startsWith('/api/')){
    assert(safeEqual(req.headers.authorization,'Bearer '+token),'AUTH_REQUIRED');
    if(req.method==='GET'){
     if(u.pathname==='/api/state')return json(200,{profile:store.get('profile'),tasks:store.tasks(),plugins:kernel.plugins(),integrity:store.verify(),provider:store.get('provider'),payment:store.get('payment'),skills:kernel.plugins().find(p=>p.id==='skills').enabled?kernel.require('skills').list():[],memory:kernel.plugins().find(p=>p.id==='memory').enabled?kernel.require('memory').list(''):[]});
     if(u.pathname==='/api/skill')return json(200,kernel.require('skills').load(u.searchParams.get('id')));
     if(u.pathname==='/api/evidence')return json(200,{valid:store.verify(),events:store.evidence(u.searchParams.get('id'))});
     throw new Error('NOT_FOUND');
    }
    assert(req.method==='POST','METHOD_NOT_ALLOWED');assert((req.headers['content-type']||'').startsWith('application/json'),'JSON_REQUIRED');
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;assert(size<=1_500_000,'BODY_TOO_LARGE');chunks.push(chunk);}const b=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
    switch(u.pathname){
     case '/api/onboarding':assert(typeof b.nickname==='string'&&b.nickname.trim()&&b.nickname.length<=60,'NICKNAME_REQUIRED');store.set('profile',{nickname:b.nickname.trim()});return json(200,{saved:true});
     case '/api/plugins':if(b.enabled)await kernel.enable(b.id,b.consent);else await kernel.disable(b.id);return json(200,kernel.plugins());
     case '/api/tasks':return json(200,store.create(b.title,b.input));
     case '/api/claim':return json(200,store.claim(b.id,'local-agent'));
     case '/api/run':return json(200,await kernel.run(b.id,'local-agent'));
     case '/api/review':return json(200,store.review(b.id,b.accepted));
     case '/api/remember':return json(200,{id:kernel.require('memory').remember(b.id,b.text,b.consent)});
     case '/api/provider':kernel.require('provider').configure(b);return json(200,{saved:true});
     case '/api/infer':assert(b.consent===true,'INFERENCE_CONFIRMATION_REQUIRED');return json(200,await kernel.require('provider').infer(b.prompt));
     case '/api/payment':{
      // Only a user-selected local PNG/JPEG; no fabricated address or external image loads.
      assert(typeof b.image==='string'&&b.image.length<=1_400_000&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(b.image),'QR_IMAGE_INVALID');
      const bytes=Buffer.from(b.image.split(',')[1],'base64');const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;assert(png||jpg,'QR_IMAGE_INVALID');
      store.set('payment',{image:b.image,status:'static-not-auto-confirmed',provider:'alipay'});return json(200,{saved:true});
     }
     default:throw new Error('NOT_FOUND');
    }
   }
   assert(req.method==='GET','METHOD_NOT_ALLOWED');
   const path=decodeURIComponent(u.pathname);assert(!path.includes('..')&&!path.includes('\\')&&!path.includes('\0'),'PATH_FORBIDDEN');
   const file=join(root,'ui',path==='/'?'index.html':path);let body;try{body=readFileSync(file);}catch{return json(404,{error:{code:'NOT_FOUND'}});}
   res.writeHead(200,{...headers,'content-type':mime[extname(file)]||'application/octet-stream'});res.end(body);
  }catch(e){const code=/^[A-Z_]+$/.test(e.message)?e.message:'REQUEST_FAILED';json(['HOST_FORBIDDEN','ORIGIN_FORBIDDEN','AUTH_REQUIRED'].includes(code)?403:400,{error:{code}});}
 });
 server.headersTimeout=10000;server.requestTimeout=20000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});origin='http://127.0.0.1:'+server.address().port;
 return {server,store,kernel,origin,token,url:origin+'/#token='+token,async close(){await new Promise(r=>server.close(r));await kernel.close();store.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=await start();process.stdout.write(JSON.stringify({url:app.url})+'\n');
 // Tauri closes stdin when the host exits. No detached/background persistence.
 if(process.env.YMZZ_PARENT_PIPE==='1'){process.stdin.resume();process.stdin.on('end',async()=>{await app.close();process.exit(0);});}
 for(const s of ['SIGINT','SIGTERM'])process.on(s,async()=>{await app.close();process.exit(0);});
}
