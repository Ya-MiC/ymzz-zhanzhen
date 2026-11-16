// MIT. Use the FULL upstream application's supported pnpm entrypoints, not the legacy standalone runtime.
import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn,execFileSync} from 'node:child_process';
import './prepare.mjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),cwd=path.join(base,'.worktree'),data=path.join(base,'.data');
const [mode='web',...extra]=process.argv.slice(2),commands={install:['install','--frozen-lockfile','--ignore-scripts'],build:['run','build:artifacts'],dev:['run','dev:web','--patch',path.join(data,'zhanzhen.patch.yml'),'--no-open'],web:['dsh','web','--patch',path.join(data,'zhanzhen.patch.yml'),'--no-open'],desktop:['run','dev:desktop'],package:['run','package:desktop:win:x64:dir','--unsigned']};
if(!commands[mode])throw new Error('Expected install, build, dev, web, desktop or package');
const env={...process.env,COREPACK_HOME:process.env.COREPACK_HOME||path.join(base,'.cache/corepack'),YMZZ_DSH_DATA:path.join(data,'desktop'),DSH_HOME:path.join(data,'home'),DSH_AGENTS_HOME:path.join(data,'agents'),DSH_TELEMETRY_DISABLED:'1',DSH_CLIENT_TITLE:'湛箴_ymzz',DSH_GATE_CONCURRENCY:'1'};
for(const k of ['DEEPSEEK_API_KEY','DEEPSEEK_BASE_URL'])delete env[k];
if(mode!=='install')execFileSync(process.execPath,[path.join(base,'scripts/build-image-codec.mjs')],{env,stdio:'inherit'});
const child=spawn(process.platform==='win32'?'pnpm.cmd':'pnpm',[...commands[mode],...extra],{cwd,env,stdio:'inherit',shell:process.platform==='win32'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('error',()=>{console.error('需要完整 Node.js 24.9+ SDK 與 Corepack/pnpm。');process.exitCode=1});child.on('exit',code=>{process.exitCode=code??1});
