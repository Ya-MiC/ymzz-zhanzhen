// MIT. Genuine OpenAI-compatible LOCAL adapter. No cloud endpoints in this first slice.
import {assert} from './store.mjs';
export function validateProvider(config){
 assert(config&&typeof config.baseUrl==='string'&&typeof config.model==='string'&&config.model.trim()&&config.model.length<=200,'PROVIDER_INVALID');
 const u=new URL(config.baseUrl);
 assert(['http:','https:'].includes(u.protocol)&&['127.0.0.1','[::1]','localhost'].includes(u.hostname)&&!u.username&&!u.password&&!u.search&&!u.hash,'LOCAL_PROVIDER_ONLY');
 assert(config.optIn===true,'PROVIDER_OPT_IN_REQUIRED');return {baseUrl:u.href.replace(/\/$/,''),model:config.model,optIn:true};
}
export async function infer(config,prompt,{fetchImpl=fetch,apiKey='',signal,maxTokens=1024}={}){
 assert(Number.isInteger(maxTokens)&&maxTokens>0&&maxTokens<=4096,'TOKEN_LIMIT_INVALID');const c=validateProvider(config);assert(typeof prompt==='string'&&prompt.length<=32000,'PROMPT_TOO_LARGE');
 const r=await fetchImpl(c.baseUrl+'/chat/completions',{method:'POST',redirect:'error',signal:signal||AbortSignal.timeout(30_000),headers:{'content-type':'application/json',...(apiKey?{authorization:'Bearer '+apiKey}:{})},body:JSON.stringify({model:c.model,messages:[{role:'user',content:prompt}],stream:false,max_tokens:maxTokens})});
 assert(r.ok,'PROVIDER_HTTP_ERROR');
 // Streaming byte cap prevents an untrusted local provider exhausting memory.
 const reader=r.body.getReader();let chunks=[],total=0;while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>1_048_576){await reader.cancel();throw new Error('PROVIDER_RESPONSE_TOO_LARGE');}chunks.push(Buffer.from(value));}
 const value=JSON.parse(Buffer.concat(chunks).toString());const text=value.choices?.[0]?.message?.content;
 assert(typeof text==='string','PROVIDER_RESPONSE_INVALID');return {text,mode:'local-model',model:c.model};
}
