import test from 'node:test';import assert from 'node:assert/strict';import {infer} from '../src/provider.mjs';
test('real local provider protocol adapter with injected offline transport, not paid inference',async()=>{
 let called=0;
 const result=await infer({baseUrl:'http://127.0.0.1:11434/v1',model:'synthetic-local-model',optIn:true},'synthetic test prompt',{fetchImpl:async(url,options)=>{
  called++;assert.equal(url,'http://127.0.0.1:11434/v1/chat/completions');assert.equal(options.redirect,'error');const b=JSON.parse(options.body);assert.equal(b.model,'synthetic-local-model');assert.equal(b.messages[0].content,'synthetic test prompt');return new Response(JSON.stringify({choices:[{message:{content:'synthetic fixture, not model output'}}]}));
 }});assert.equal(called,1);assert.equal(result.mode,'local-model');assert.equal(result.text,'synthetic fixture, not model output');
});
