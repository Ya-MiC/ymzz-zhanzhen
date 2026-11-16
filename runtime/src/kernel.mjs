// MIT. Real DSH-derived Cordis kernel, with new trusted YMZZ plugins.
// This is NOT the entire upstream DSH LLM agent-loop or a JavaScript sandbox.
import {Context} from '@deepseek-ai/cordis';
import {readFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {assert,sha} from './store.mjs';
import {human} from '../../imports/ymzz-loop/product/scripts/time.mjs';
import {infer,validateProvider} from './provider.mjs';
import {createCodingAgent} from './coding/agent.mjs';
const definitions=[
 {id:'skills',title:'技能池',permissions:['pool.read']},
 {id:'dispatch',title:'無用之用 · 調度',permissions:['pool.read','rules.read']},
 {id:'memory',title:'無無即無 · 記憶',permissions:['memory.read','memory.write.confirmed']},
 {id:'audit',title:'Rust 核心 · 文件驗證',permissions:['task.read','core.execute.fixed']},
 {id:'coding',title:'編碼智能體 · 逐批授權',permissions:['workspace.selected.read-write','test.fixed-node.explicit-consent','provider.loopback.explicit-opt-in']},
 {id:'provider',title:'本機模型（預設停用）',permissions:['network.loopback.opt-in']},
];
export async function createKernel({store,root,coreExecutable,dataDir,workspacePicker,codingTransport}){
 const ctx=new Context(), mounted=new Map(), services=new Map();
 const lock=JSON.parse(readFileSync(resolve(root,'core-skills.lock.json'),'utf8'));
 const readPool=(id)=>{
  const s=lock.skills.find(x=>x.id===id);assert(s,'SKILL_NOT_FOUND');const entry=s.entrypoint.replace(/^runtime\//,'');const file=resolve(root,entry);
  assert(!relative(root,file).startsWith('..'),'SKILL_PATH_INVALID');const text=readFileSync(file,'utf8');
  const rec=s.files.find(x=>x.path===entry.slice(('pool/'+s.id+'/').length));assert(rec?.sha256===sha(text),'SKILL_CHECKSUM_MISMATCH');return {id:s.id,text,source:s.repository,commit:s.commit,license:s.license};
 };
 const expose=(id,api)=>({name:'ymzz-'+id,apply(pluginCtx){
  pluginCtx.provide('ymzz_'+id,api);
  pluginCtx.effect(()=>{services.set(id,api);return()=>{api.cancelAll?.();services.delete(id);};},'ymzz: bounded capabilities '+id);
 }});
 const requireService=id=>{assert(mounted.has(id)&&services.has(id),'PLUGIN_DISABLED');return services.get(id);};
 const api={
  skills:{list:()=>lock.skills.map(s=>({id:s.id,license:s.license,commit:s.commit,excluded:s.excluded})),load:readPool},
  dispatch:{route(text){
   // Pinned Wuyong rule data, not a link-only integration. No thinking-chain collection.
   const rules=JSON.parse(readFileSync(resolve(root,'modules/ymzz-wuyong-zhi-yong/rules.json'),'utf8'));
   const triggers=[];for(const r of rules){try{if(new RegExp(r.pattern.replaceAll('(?i)',''),'iu').test(text))triggers.push({id:r.id,score:r.score,hint:r.hint});}catch{/* unsupported Python regex is explicitly counted by build validation */}}
   const skills=requireService('skills');const candidates=skills.list().filter(s=>text.toLowerCase().includes(s.id));
   return {route:'local',source:'ymzz-wuyong-zhi-yong/signals',thinking_available:false,triggers,candidates,skill:candidates[0]?skills.load(candidates[0].id):null};
  }},
  memory:{list:q=>store.memories(q),remember:(id,text,consent)=>store.remember(id,text,consent),contract:()=>readFileSync(resolve(root,'modules/ymzz-wuwong-ji-wung/SKILL.md'),'utf8')},
  audit:{evaluate(text){
   assert(typeof coreExecutable==='string'&&coreExecutable,'RUST_CORE_NOT_BUNDLED');
   const r=spawnSync(coreExecutable,['--core'],{input:JSON.stringify({text}),encoding:'utf8',timeout:15000,maxBuffer:1_100_000,windowsHide:true,env:{...process.env,YMZZ_TELEMETRY:'0'}});
   assert(r.status===0,'RUST_CORE_FAILED');const result=JSON.parse(r.stdout);assert(result.engine==='ymzz-core/integrity','RUST_CORE_INVALID');return result;
  }},
  provider:{configure:c=>store.set('provider',validateProvider(c)),config:()=>store.get('provider'),infer:(prompt,opts)=>infer(store.get('provider'),prompt,opts)},
 };
 api.coding=createCodingAgent({store,dataDir,workspacePicker,permission:()=>requireService('coding'),providerAllowed:()=>requireService('provider'),providerTransport:codingTransport});
 async function enable(id,consent){assert(consent===true,'PLUGIN_PERMISSION_CONFIRMATION_REQUIRED');assert(definitions.some(p=>p.id===id),'UNKNOWN_PLUGIN');if(mounted.has(id))return;
  const fiber=await ctx.plugin(expose(id,api[id]));mounted.set(id,fiber);store.set('plugin:'+id,true);
 }
 async function disable(id){assert(mounted.has(id),'PLUGIN_DISABLED');await mounted.get(id).dispose();mounted.delete(id);store.set('plugin:'+id,false);}
 // Built-ins are same-process trusted code. Only confirmed grants load; arbitrary packages not evaluated.
 for(const d of definitions)if(store.get('plugin:'+d.id,false))await enable(d.id,true);
 return {
  ctx,enable,disable,require:requireService,
  plugins:()=>definitions.map(d=>({...d,enabled:mounted.has(d.id),implementation:'trusted built-in, lifecycle owned by official DSH Cordis'})),
  async run(id,owner){const task=store.task(id);assert(task.state==='claimed'&&task.owner===owner,'STATE_OR_OWNER_MISMATCH');assert(store.verify(),'EVIDENCE_TAMPERED');
   const dispatch=requireService('dispatch'),audit=requireService('audit');requireService('skills');
   store.transition(id,'claimed','running',owner);
   try{
    const decision=dispatch.route(task.title);store.event(id,'dispatch',{...decision,skill:decision.skill?{id:decision.skill.id,commit:decision.skill.commit,text_sha256:sha(decision.skill.text)}:null});
    let result;for(let attempt=1;attempt<=2;attempt++){
     // Bounded self-correction: normalize UTF-8 BOM/line endings and retry once after an empty-input gate.
     const input=attempt===1?task.input:task.input.replace(/^\uFEFF/,'').replaceAll('\r\n','\n').trim();
     result=audit.evaluate(input);store.event(id,'gate',{attempt,result});if(result.gate_passed)break;
    }
    assert(result.gate_passed,'EMPTY_INPUT_GATE_FAILED');
    return store.transition(id,'running','review',owner,{...result,mode:'deterministic-offline-not-model-inference',recorded:human()});
   }catch(e){store.transition(id,'running','failed',owner,{error:/^[A-Z_]+$/.test(e.message)?e.message:'TASK_EXECUTION_FAILED'});throw e;}
  },
  async close(){await ctx.fiber.dispose();mounted.clear();services.clear();}
 };
}
