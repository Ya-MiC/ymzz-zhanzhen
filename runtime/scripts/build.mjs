// MIT. Bundle only the audited official DSH Cordis/Cosmokit kernel. No remote plugins.
import {build} from 'esbuild';
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..');
await build({entryPoints:[resolve(root,'runtime/src/server.mjs')],outfile:resolve(root,'runtime/dist/server.mjs'),bundle:true,platform:'node',format:'esm',target:'node24',sourcemap:true,tsconfigRaw:{compilerOptions:{target:'ES2023'}},
 alias:{'@deepseek-ai/cordis':resolve(root,'imports/deepseek-harness/vendor/cordis/src/index.ts'),'@deepseek-ai/cosmokit':resolve(root,'imports/deepseek-harness/vendor/cosmokit/src/index.ts')},metafile:true}).then(r=>writeFileSync(resolve(root,'runtime/dist/bundle-inputs.json'),JSON.stringify(r.metafile,null,2)));
cpSync(resolve(root,'runtime/ui'),resolve(root,'runtime/dist/ui'),{recursive:true});
cpSync(resolve(root,'imports/ymzz-wenrun-design-skill/assets/tokens/tokens.css'),resolve(root,'runtime/dist/ui/tokens.css'));
cpSync(resolve(root,'runtime/pool'),resolve(root,'runtime/dist/pool'),{recursive:true});
cpSync(resolve(root,'core-skills.lock.json'),resolve(root,'runtime/dist/core-skills.lock.json'));
// Actual module data, not an unpinned download at application startup.
for(const module of ['ymzz-wuyong-zhi-yong','ymzz-wuwong-ji-wung']) {
 mkdirSync(resolve(root,'runtime/dist/modules',module),{recursive:true});
 for(const f of ['LICENSE','README.md','SKILL.md'])cpSync(resolve(root,'imports',module,f),resolve(root,'runtime/dist/modules',module,f));
}
// JS dispatch consumes the upstream's pinned rule tables as data; never executes Python/installer.
for(const f of ['rules_en.py','rules_zh.py'])cpSync(resolve(root,'imports/ymzz-wuyong-zhi-yong/src/wuyong/signals',f),resolve(root,'runtime/dist/modules/ymzz-wuyong-zhi-yong',f));
// Existing app remains available in the same window when built.
try{cpSync(resolve(root,'apps/ui/dist'),resolve(root,'runtime/dist/ui/legacy'),{recursive:true});const f=resolve(root,'runtime/dist/ui/legacy/index.html');writeFileSync(f,readFileSync(f,'utf8').replaceAll('/assets/','/legacy/assets/'));}catch{}
// Exact upstream MIT notices accompany executable code.
mkdirSync(resolve(root,'runtime/dist/licenses'),{recursive:true});
for(const [slug,file] of [['deepseek-harness','LICENSE'],['deepseek-harness','vendor/cordis/LICENSE'],['deepseek-harness','vendor/cosmokit/LICENSE'],['ymzz-loop/product','LICENSE'],['ymzz-wenrun-design-skill','LICENSE']])
 cpSync(resolve(root,'imports',slug,file),resolve(root,'runtime/dist/licenses',slug.replaceAll('/','-')+'-'+file.replaceAll('/','-')));
console.log('Built DSH-derived plugin kernel + local runtime (no telemetry plugins).');

const ruleScript=`import ast,json,sys
from pathlib import Path
r=[]
for f in sys.argv[1:]:
 tree=ast.parse(Path(f).read_text())
 for n in tree.body:
  if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='USER_RULES' for t in n.targets): r.extend(ast.literal_eval(n.value))
print(json.dumps(r,ensure_ascii=False))
`;
const python=process.platform==='win32'?'python':'python3';
const rules=JSON.parse(execFileSync(python,['-c',ruleScript,...['rules_en.py','rules_zh.py'].map(f=>resolve(root,'imports/ymzz-wuyong-zhi-yong/src/wuyong/signals',f))],{encoding:'utf8'}));
const unsupported=[];for(const r of rules)try{new RegExp(r.pattern.replaceAll('(?i)',''),'iu');}catch{unsupported.push(r.id);}
if(unsupported.length)throw new Error('Unsupported rule patterns: '+unsupported.join(','));
writeFileSync(resolve(root,'runtime/dist/modules/ymzz-wuyong-zhi-yong/rules.json'),JSON.stringify(rules,null,2));
