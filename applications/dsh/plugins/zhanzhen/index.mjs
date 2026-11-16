// MIT. A real plugin loaded by the FULL official DSH application, not a second agent loop.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const ensure=(ok,code)=>{if(!ok)throw new Error(code)};
export const name='ymzz-zhanzhen';
export const inject=['agents','llm','tools','workingDirectory','skills','approval','webServer'];
export async function apply(ctx,config){
 const root=path.resolve(config.productRoot||path.join(import.meta.dirname,'product')),runtime=config.runtimeRoot&&path.resolve(config.runtimeRoot),data=path.resolve(config.dataDir||path.join(process.env.DSH_HOME||path.join(root,'.data'),'zhanzhen'));
 fs.mkdirSync(data,{recursive:true,mode:0o700});const statePath=path.join(data,'tasks.json');
 const saved=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{tasks:{},nickname:'',memory:[],events:[]};
 const handles=new Map(),pending=new Map();
 const snapshot=w=>Object.fromEntries(w.files().map(f=>[f,w.read(f).hash]));
 const persist=()=>{const temp=statePath+'.tmp';fs.writeFileSync(temp,JSON.stringify(saved),{mode:0o600});fs.renameSync(temp,statePath)};
 const event=(id,kind,payload)=>{const prev=saved.events.at(-1)?.hash||'0'.repeat(64),e={id,kind,payload,prev};saved.events.push({...e,hash:hash(e)});persist()};
 for(const task of Object.values(saved.tasks))if(['claimed','running','waiting-approval'].includes(task.state)){task.state='interrupted';task.error='重啟不會自動繼續。請驗收差異或還原。'}persist();
 const {Workspace}=await import(pathToFileURL(path.join(root,'runtime/src/coding/workspace.mjs')));
 const {runTest}=await import(pathToFileURL(path.join(root,'runtime/src/coding/test-tool.mjs')));
 const {exampleFiles}=await import(pathToFileURL(path.join(root,'runtime/src/coding/fixture.mjs')));
 const {LlmAdapter,createUserMessage}=await (runtime?import(pathToFileURL(path.join(runtime,'packages/llm/llm/lib/index.js'))):import('@deepseek-ai/dsh-llm'));
 const view=t=>({id:t.id,state:t.state,pendingWrite:!!t.pendingWrite,agentStatus:handles.get(t.id)?.agent.status||'idle',mode:t.mode,round:t.cursor||0,gates:t.gates||[],error:t.error||'',changed:Object.entries(t.changed||{}).map(([file,after])=>({path:file,before:t.baseline[file]?.text||'',after:after.text})),memory:!!saved.memory.find(m=>m.id===t.id)});
 function valid(){let prev='0'.repeat(64);return saved.events.every(e=>{const {hash:h,...body}=e;const ok=e.prev===prev&&hash(body)===h;prev=h;return ok})}
 function scope(exec){ensure(exec.agent,'OWNING_DSH_AGENT_REQUIRED');const t=saved.tasks[exec.agent.id];ensure(t,'YMZZ_TASK_REQUIRED');ensure(t.tools<16,'YMZZ_TOOL_LIMIT');ensure(t.root&&exec.agent.session.header.cwd===t.root,'WORKSPACE_CHANGED');t.tools++;return {t,w:new Workspace(t.root)}}
 function register(tool,properties,required,execute){ctx.tools.register({name:'ymzz_'+tool,description:'湛箴：'+tool+'，選定工作區、有界操作、逐次人工授權。',parameters:{type:'object',properties,required,additionalProperties:false},output:{schema:{type:'string'},render:(_a,v)=>[{type:'text',text:v}]},async execute(args,exec){const {t,w}=scope(exec);const result=await execute(args,exec,t,w);persist();return JSON.stringify(result)}})}
 register('read',{path:{type:'string'}},['path'],async(a,exec,t,w)=>{const f=w.read(a.path);t.read[a.path]=f;event(t.id,'read',{path:a.path,hash:f.hash});return {path:a.path,hash:f.hash,text:f.text}});
 register('patch',{path:{type:'string'},find:{type:'string'},replace:{type:'string'},expectedHash:{type:'string'}},['path','find','replace','expectedHash'],async(a,exec,t,w)=>{
  const before=w.read(a.path);ensure(t.read[a.path]?.hash===before.hash&&before.hash===a.expectedHash,'FILE_CONFLICT_OR_READ_REQUIRED');ensure(++t.writes<=8&&a.find&&before.text.split(a.find).length===2,'PATCH_REJECTED');
  t.baseline[a.path]??=before;const next=before.text.replace(a.find,()=>a.replace);t.pendingWrite={path:a.path,before:before.hash,after:hash(next),text:next};persist();const after=w.write(a.path,next,a.expectedHash);t.changed[a.path]=after;t.read[a.path]=after;t.revision++;delete t.pendingWrite;event(t.id,'patch',{path:a.path,before:before.hash,after:after.hash});return {path:a.path,hash:after.hash}
 });
 register('test',{path:{type:'string'}},['path'],async(a,exec,t,w)=>{ensure(a.path==='calculator.test.mjs'&&w.read(a.path).hash===hash(exampleFiles[a.path]),'FIXTURE_TEST_CHANGED');const before=snapshot(w),gate=await runTest(w,a.path,{signal:exec.signal,node:process.execPath});ensure(JSON.stringify(before)===JSON.stringify(snapshot(w)),'WORKSPACE_CHANGED_DURING_GATE');t.gateSnapshot=before;t.gates.push({passed:gate.passed,exitCode:gate.exitCode});t.gateRevision=t.revision;event(t.id,'gate',{passed:gate.passed,exitCode:gate.exitCode,outputHash:hash(gate.output)});return gate});
 // All approval decisions still traverse official DSH ApprovalService and its durable session events.
 ctx.on('tools/pre-execute',async(exec,next)=>saved.tasks[exec.agent?.id]&&exec.name.startsWith('ymzz_')?{kind:'ask',reason:'逐次核准湛箴工具；Node permission 不是 OS／網路沙盒。'}:next(),{prepend:true});
 ctx.on('approval/request',async(req,next)=>{
  const t=saved.tasks[req.agent.id];if(!t||t.mode!=='offline-fixture')return next();const id=randomUUID();t.state='waiting-approval';persist();
  return await new Promise(resolve=>{const settle=outcome=>{pending.delete(id);req.signal?.removeEventListener('abort',abort);t.state=outcome==='allowed-once'?'running':'interrupted';if(outcome!=='allowed-once'){t.error='TOOL_NOT_APPROVED';queueMicrotask(()=>req.agent.cancel())}persist();resolve(outcome)},abort=()=>settle('cancelled');pending.set(id,{id,task:t.id,tool:req.toolName,call:req.callId,reason:req.reason,settle});req.signal?.addEventListener('abort',abort,{once:true});if(req.signal?.aborted)abort()})
 },{prepend:true});
 class ExplicitFixture extends LlmAdapter{
  providerInfo(provider){return {id:provider,name:'湛箴離線假模型（非推論）'}}
  async listModels(){return []} // Only programmatically created synthetic demo sessions may use this transport.
  async *stream(options){
   options.signal?.throwIfAborted();const t=saved.tasks[options.model];ensure(t?.mode==='offline-fixture'&&handles.has(t.id),'FIXTURE_NOT_USER_PROJECT');ensure(t.cursor<24,'FIXTURE_LOOP_LIMIT');t.cursor++;const n=!t.read['calculator.mjs']?0:!t.read['calculator.test.mjs']?1:t.writes===0?2:t.gates.length===0?3:t.writes===1?4:t.gates.length===1?5:6;
   let tool,args;if(n===0||n===1){tool='ymzz_read';args={path:n===0?'calculator.mjs':'calculator.test.mjs'}}
   else if(n===2||n===4){if(n===4)ensure(t.gates.at(-1)?.passed===false,'FAILURE_FEEDBACK_REQUIRED');tool='ymzz_patch';args={path:'calculator.mjs',find:n===2?'a - b':'a * b',replace:n===2?'a * b':'a + b',expectedHash:t.read['calculator.mjs'].hash}}
   else if(n===3||n===5){tool='ymzz_test';args={path:'calculator.test.mjs'}}
   if(tool){const id=randomUUID(),argumentsJson=JSON.stringify(args);t.currentProposal={tool,args};persist();yield {type:'block-start',index:0,blockType:'tool-call'};yield {type:'tool-call-delta',index:0,id,name:tool,argumentsDelta:argumentsJson};yield {type:'block-end',index:0,block:{type:'tool-call',id,name:tool,arguments:argumentsJson}};yield {type:'usage',usage:{inputTokens:0,outputTokens:0}};yield {type:'finish',reason:{kind:'tool-calls'}}}
   else{ensure(t.gates.at(-1)?.passed&&t.gateRevision===t.revision,'FRESH_GATE_REQUIRED');const text='完整 DSH Agent Loop 已完成真實失敗→修正→測試通過；模型明確是假 transport，等待人工驗收。';yield {type:'block-start',index:0,blockType:'text'};yield {type:'text-delta',index:0,text};yield {type:'block-end',index:0,block:{type:'text',text}};yield {type:'finish',reason:{kind:'stop'}};t.state='review';event(t.id,'dsh-loop-completed',{gates:t.gates,revision:t.revision})}
  }
 }
 ctx.llm.registerAdapter(['ymzz-offline'],new ExplicitFixture());
 // Register the pinned product pool with the genuine DSH skill registry. Never touch ~/.agents.
 const lock=JSON.parse(fs.readFileSync(path.join(root,'core-skills.lock.json'),'utf8'));
 for(const s of lock.skills){const f=path.join(root,s.entrypoint),text=fs.readFileSync(f,'utf8'),expected=s.files.find(x=>s.entrypoint.endsWith(x.path))?.sha256;ensure(hash(text)===expected,'SKILL_CHECKSUM_MISMATCH');ctx.skills.register({name:s.id,description:'固定來源的產品技能：'+s.id,source:'bundled',content:text.replace(/^---[\s\S]*?---\s*/,''),provider:'ymzz-pinned-pool'})}
 async function demo(){ensure(saved.nickname,'NICKNAME_REQUIRED');const parent=path.join(data,'examples');fs.mkdirSync(parent,{recursive:true,mode:0o700});const directory=fs.mkdtempSync(path.join(parent,'湛箴 程式 '));for(const [f,text]of Object.entries(exampleFiles))fs.writeFileSync(path.join(directory,f),text,{flag:'wx',mode:0o600});
  const id=randomUUID(),t={id,root:directory,mode:'offline-fixture',state:'claimed',cursor:0,tools:0,writes:0,revision:0,gateRevision:-1,read:{},baseline:{},changed:{},gates:[]};saved.tasks[id]=t;persist();
  const handle=await ctx.agents.create({sessionId:id,meta:{cwd:directory},agentOptions:{provider:'ymzz-offline',model:id,maxTokens:1024},setup(agentCtx,agent){agentCtx.tools.restrict({allow:['ymzz_read','ymzz_patch','ymzz_test']});ctx.approval.setPolicy(agent,'ask')}});handles.set(id,handle);
  event(id,'dsh-agent-created',{engine:'@deepseek-ai/dsh-agent-loop',transport:'explicit deterministic fixture',liveInference:false});handle.agent.followup(createUserMessage({content:[{type:'text',text:'修正 add(2,3) 並以真實 node:test 驗證。此為明確的離線假模型示例。'}],source:{kind:'user'}}));void handle.agent.whenIdle().catch(()=>{t.state='failed';t.error='DSH_AGENT_FAILED';persist()});return {id}
 }
 const state=()=>({engine:'FULL official DeepSeek Harness',plugin:name,upstream:'39163dd30f703a79079e2d2446545cff3c453738',nickname:saved.nickname,skills:lock.skills.map(s=>s.id),tasks:Object.values(saved.tasks).map(view),pending:[...pending.values()].map(({settle,...p})=>({...p,proposal:saved.tasks[p.task]?.currentProposal})),evidenceValid:valid(),events:saved.events});
 const ui=fs.readFileSync(path.join(import.meta.dirname,'ui.js'),'utf8'),tokens=fs.readFileSync(path.join(root,'imports/ymzz-wenrun-design-skill/assets/tokens/tokens.css'),'utf8'),css=fs.readFileSync(path.join(import.meta.dirname,'wenrun.css'),'utf8');
 ctx.on('webserver/index-inject',table=>{table.push({kind:'global',name:'__YMZZ_DSH_BRAND__',value:'data:image/png;base64,'+fs.readFileSync(path.join(root,'runtime/ui/brand/icon-128.png')).toString('base64')},{kind:'style',text:tokens+'\n'+css},{kind:'script',placement:'body',text:ui})});
 ctx.effect(()=>ctx.webServer.register({kind:'prefix',path:'/ymzz',auth:'required',handler:async(req,res)=>{
  try{const url=new URL(req.url,'http://127.0.0.1');let out;
   if(req.method==='GET'&&url.pathname==='/ymzz/state')out=state();
   else{ensure(req.method==='POST'&&req.headers['x-ymzz-action']==='1'&&req.headers['sec-fetch-site']!=='cross-site','ACTION_REJECTED');let body='';for await(const b of req){body+=b;ensure(Buffer.byteLength(body)<=8192,'BODY_TOO_LARGE')}const input=JSON.parse(body||'{}');
    if(url.pathname==='/ymzz/profile'){ensure(typeof input.nickname==='string'&&input.nickname.trim()&&input.nickname.length<=60,'NICKNAME_INVALID');saved.nickname=input.nickname.trim();persist();out={ok:true}}
    else if(url.pathname==='/ymzz/demo')out=await demo();
    else if(url.pathname==='/ymzz/approval'){const p=pending.get(input.id);ensure(p&&typeof input.allow==='boolean','APPROVAL_NOT_PENDING');event(p.task,'human-tool-approval',{tool:p.tool,allowed:input.allow});p.settle(input.allow?'allowed-once':'rejected');out={ok:true}}
    else if(url.pathname==='/ymzz/review'){const t=saved.tasks[input.id];ensure(t&&input.consent===true&&['accept','rollback','remember'].includes(input.action),'REVIEW_REQUIRED');const w=new Workspace(t.root);ensure(!handles.get(t.id)||handles.get(t.id).agent.status==='idle','DSH_AGENT_NOT_IDLE');
     if(input.action==='remember'){ensure(t.state==='accepted','ACCEPT_FIRST');ensure(!saved.memory.some(m=>m.id===t.id),'ALREADY_REMEMBERED');saved.memory.push({id:t.id,text:'完整 DSH 測試通過，使用者明確驗收。'});event(t.id,'memory-confirmed',{});out={ok:true}}
     else{ensure(['review','interrupted','failed'].includes(t.state),'REVIEW_STATE_INVALID');if(t.pendingWrite){ensure(input.action==='rollback','PENDING_WRITE_REQUIRES_ROLLBACK');const p=t.pendingWrite,now=w.read(p.path);ensure([p.before,p.after].includes(now.hash),'EXTERNAL_CHANGE_CONFLICT');if(now.hash===p.after)t.changed[p.path]=now;delete t.pendingWrite;persist();}for(const [f,v]of Object.entries(t.changed))ensure(w.read(f).hash===v.hash,'EXTERNAL_CHANGE_CONFLICT');if(input.action==='accept'){ensure(t.gates.at(-1)?.passed&&t.gateRevision===t.revision,'FRESH_GATE_REQUIRED');ensure(JSON.stringify(snapshot(w))===JSON.stringify(t.gateSnapshot),'GATE_SNAPSHOT_CHANGED');t.state='accepted'}else{for(const [f,v]of Object.entries(t.changed))w.write(f,t.baseline[f].text,v.hash);t.state='rolled-back'}event(t.id,t.state,{files:Object.keys(t.changed)});out={ok:true}}
    }else throw new Error('NOT_FOUND');
   }
   res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(out));
  }catch(e){res.writeHead(400,{'content-type':'application/json'});res.end(JSON.stringify({error:/^[A-Z_]+$/.test(e.message)?e.message:'YMZZ_OPERATION_FAILED'}))}
 }}),'ymzz: authenticated routes');
 ctx.effect(()=>()=>{for(const p of pending.values())p.settle('cancelled');for(const h of handles.values())void h.dispose();persist()},'ymzz: owned DSH agents');
 ctx.provide('ymzzZhanzhen',{state,demo});
}
