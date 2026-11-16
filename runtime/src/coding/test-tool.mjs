// MIT. Fixed, read-only Node test command, explicit consent required. Node permissions are NOT a sandbox.
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';import path from 'node:path';import {assert} from '../store.mjs';import {redact} from './workspace.mjs';
export async function runTest(workspace,file,{signal,timeout=3000,maxOutput=16384,node=process.execPath}={}){
 assert(/(?:^|\/)[\p{L}\p{N}_ .-]+\.test\.mjs$/u.test(file),'TEST_FILE_REQUIRED');workspace.read(file);const files=workspace.files();
 const args=['--permission',...files.map(f=>'--allow-fs-read='+workspace.resolve(f)),'--disable-proto=throw','--test-reporter=tap',workspace.resolve(file)];
 const env={TZ:'Asia/Seoul',LANG:'C.UTF-8',NODE_NO_WARNINGS:'1'};for(const k of ['SystemRoot','SYSTEMROOT','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
 return await new Promise((resolve,reject)=>{let output='',bytes=0,reason='';const child=spawn(node,args,{cwd:workspace.root,env,shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});const kill=why=>{reason=why;child.kill();};const timer=setTimeout(()=>kill('timeout'),timeout);const abort=()=>kill('cancelled');signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{bytes+=chunk.length;if(bytes>maxOutput){kill('output-limit');return;}output+=chunk.toString('utf8');});
  child.once('error',e=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(new Error('TEST_START_FAILED'));});child.once('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve({passed:code===0&&!reason&&/# tests [1-9][0-9]*\b/.test(output)&&/# fail 0\b/.test(output),exitCode:code,reason:reason||'exited',output:redact(output).split(pathToFileURL(workspace.root).href).join('[workspace]').split(workspace.root).join('[workspace]').slice(0,12000),command:['bundled-node','--permission',file],networkIsolation:false});});
 });
}
