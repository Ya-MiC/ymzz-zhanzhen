// MIT. Real offline task against the portable app's bundled server/core. Never prints auth token.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
const origin=process.env.YMZZ_SMOKE_ORIGIN,token=process.env.YMZZ_SMOKE_TOKEN;
async function call(path,body){const r=await fetch(origin+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const b=await r.json();assert(r.ok,JSON.stringify(b));return b;}
assert((await fetch(origin)).ok);await call('onboarding',{nickname:'Windows 第一位用戶'});
for(const id of ['skills','dispatch','audit','memory'])await call('plugins',{id,enabled:true,consent:true});
const task=await call('tasks',{title:'請使用 find-skills 技能檢查本機文件',input:'Windows portable task\n湛箴 evidence'});
await call('claim',{id:task.id});const result=await call('run',{id:task.id});assert.equal(result.state,'review');assert.equal(result.result.engine,'ymzz-core/integrity');assert(result.result.gate_passed);
await call('review',{id:task.id,accepted:true});await call('remember',{id:task.id,text:'Confirmed offline Windows evidence',consent:true});
const e=await call('evidence?id='+task.id);assert.equal(e.valid,true);assert(e.events.some(e=>e.kind==='dispatch'&&e.payload.skill?.id==='find-skills'));
const state=await call('state');assert.equal(state.memory.length,1);assert.equal(state.tasks.find(t=>t.id===task.id).state,'done');
mkdirSync('dist/smoke',{recursive:true});writeFileSync('dist/smoke/offline-evidence.json',JSON.stringify({task:result,chain:e,assertions:{guiServer:true,offline:true,liveModelInference:false}},null,2));console.log('INSTALLED_OFFLINE_TASK_OK: '+result.result.row_hash);
