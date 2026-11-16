import {pinnedBytes} from './pinned-source.mjs';
// MIT. Reproducible derivative BUILD COPY. The complete pinned upstream remains immutable.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(base,'../..'),source=path.join(base,'upstream'),work=path.join(base,'.worktree'),data=path.join(base,'.data');
const brand=JSON.parse(fs.readFileSync(path.join(base,'branding.json'),'utf8'));
const lock=JSON.parse(fs.readFileSync(path.join(base,'upstream.lock.json'),'utf8'));
for(const f of lock.files)pinnedBytes(source,f);
if(!fs.existsSync(work))fs.cpSync(source,work,{recursive:true,verbatimSymlinks:true});fs.mkdirSync(data,{recursive:true});
// Windows Git may check symlinks out as their exact tracked link-text bytes. Reify ONLY in the build copy.
for(const f of lock.files.filter(f=>f.mode==='120000')){
 const dest=path.join(work,f.path),target=f.linkTarget,resolved=path.resolve(path.dirname(dest),target);
 if(path.isAbsolute(target)||!resolved.startsWith(work+path.sep))throw new Error('EXTERNAL_UPSTREAM_LINK');
 const st=fs.lstatSync(dest);if(st.isSymbolicLink()||st.isFile())fs.unlinkSync(dest);else if(st.isDirectory())fs.rmSync(dest,{recursive:true});else throw new Error('BUILD_LINK_TYPE_INVALID');
 try{const directory=fs.statSync(resolved).isDirectory();fs.symlinkSync(process.platform==='win32'&&directory?resolved:target,dest,directory?'junction':'file')}catch{fs.cpSync(resolved,dest,{recursive:true})}
}
const changes=[],texts=new Map();function edit(file,from,to,reason){const original=texts.get(file)??fs.readFileSync(path.join(source,file),'utf8');if(original.split(from).length!==2)throw new Error('PINNED_PATCH_NOT_UNIQUE: '+file);const next=original.replace(from,to);texts.set(file,next);fs.writeFileSync(path.join(work,file),next);changes.push({file,reason})}
edit('scripts/dev-web.ts',"spawnStage(supervisor, `tsc -b ${CLIENT_TYPE_PROGRAM} --watch`, 'tsc', [","spawnStage(supervisor, `tsc -b ${CLIENT_TYPE_PROGRAM} --watch`, process.execPath, [\n    join(repoRoot, 'node_modules/typescript/bin/tsc'),",'resolve pinned upstream TypeScript explicitly; do not inherit outer monorepo compiler');
edit('apps/desktop/scripts/pack-local-packages.ts',"import { parseArgs } from 'node:util'","import { parseArgs } from 'node:util'\nimport { execa } from 'execa'\nimport { pnpmInvocation } from '../../../scripts/pnpm-invocation.ts'",'use official pnpm tarball packer for the extra product plugin');
edit('apps/desktop/scripts/pack-local-packages.ts',"  const packed = await packFamilyMembers(root, releaseFamily('dsh'), destination, concurrency)","  const packed = await packFamilyMembers(root, releaseFamily('dsh'), destination, concurrency)\n  const ymzz = pnpmInvocation(['--dir', 'packages/ymzz/zhanzhen', 'pack', '--pack-destination', destination])\n  await execa(ymzz.command, ymzz.args, { cwd: root, stdio: 'inherit' })",'include genuine plugin in official private production package set; never publish it');
edit('apps/desktop/scripts/smoke-packaged-runtime.ts',"join(application, 'DeepSeek Harness.exe')","join(application, '湛箴_ymzz.exe')",'upstream packaged-runtime smoke must execute the actual branded Windows EXE, never a renamed wrapper or skipped smoke');
// Replace the one real runtime Sharp consumer, not its image functionality.
// Original code and dev fixtures stay in the immutable archive and build tree.
edit('packages/attachment/attachment-local/src/sharp.ts',"createLazyRequire<typeof sharp>('sharp', import.meta.url)","createLazyRequire<typeof sharp>('@yanming/dsh-image', import.meta.url)",'permissive image-rs/libwebp raster pipeline instead of LGPL libvips');
edit('packages/attachment/attachment-local/src/image.ts',"import { requireSharp } from './sharp.ts'","import { requireSharp } from './sharp.ts'\nimport { validateRaster } from '@yanming/dsh-image'",'explicit real full-raster validation API, not a fake raw-pixel result');
edit('packages/attachment/attachment-local/src/image.ts',"await image.raw().toBuffer()","await validateRaster(data)",'preserve complete raster decode at admission via real permissive helper');
const attachment=JSON.parse(fs.readFileSync(path.join(source,'packages/attachment/attachment-local/package.json'),'utf8'));
attachment.devDependencies.sharp=attachment.dependencies.sharp;delete attachment.dependencies.sharp;attachment.dependencies['@yanming/dsh-image']='workspace:*';
fs.writeFileSync(path.join(work,'packages/attachment/attachment-local/package.json'),JSON.stringify(attachment,null,2)+'\n');changes.push({file:'packages/attachment/attachment-local/package.json',reason:'Sharp retained development-only for original regression fixtures; real image adapter supplies production functionality'});
const imageRel='packages/ymzz/image-codec',imagePkg=path.join(work,imageRel),imageSrc=path.join(base,'image-codec');fs.mkdirSync(imagePkg,{recursive:true});
for(const [from,to]of [['adapter.cjs','index.cjs'],['index.d.ts','index.d.ts'],['LICENSE','LICENSE']])fs.copyFileSync(path.join(imageSrc,from),path.join(imagePkg,to));
if(fs.existsSync(path.join(imageSrc,'bin')))fs.cpSync(path.join(imageSrc,'bin'),path.join(imagePkg,'bin'),{recursive:true});
fs.writeFileSync(path.join(imagePkg,'tsdown.config.ts'),"import {defineConfig}from'tsdown';export default defineConfig({entry:['index.cjs'],outDir:'lib',format:['cjs'],clean:false})\n");
fs.writeFileSync(path.join(imagePkg,'package.json'),JSON.stringify({name:'@yanming/dsh-image',version:'0.1.0',private:true,type:'module',main:'index.cjs',types:'index.d.ts',license:'MIT',files:['index.cjs','index.d.ts','bin','LICENSE','THIRD_PARTY_NOTICES.txt','codec-sources.lock.json']},null,2)+'\n');
const importer=fs.readFileSync(path.join(source,'pnpm-lock.yaml'),'utf8').split('  packages/attachment/attachment-local:\n')[1].split('\n  packages/boot/app-boot:')[0];
const sharpLock="      sharp:\n        specifier: 0.35.5\n        version: 0.35.5(@types/node@22.20.1)\n";
const updatedImporter=importer.replace(sharpLock,"      '@yanming/dsh-image':\n        specifier: workspace:*\n        version: link:../../ymzz/image-codec\n")+sharpLock;
edit('pnpm-lock.yaml','  packages/attachment/attachment-local:\n'+importer,'  packages/attachment/attachment-local:\n'+updatedImporter,'pin real permissive production adapter and keep Sharp development fixture dependency');
edit('pnpm-lock.yaml','\npackages:\n',"\n  packages/ymzz/image-codec: {}\n\npackages:\n",'pin private image adapter workspace importer');
edit('apps/desktop/scripts/electron-builder-config.mjs',"const unpack = [","const unpack = ['**/node_modules/@yanming/dsh-image/bin/**/*',",'Rust raster helper must be a real physical executable outside ASAR');
edit('apps/desktop/scripts/pack-local-packages.ts',"  console.log(`desktop local pack: ${String(packed.length)} tarball(s) in ${destination}`)","  const image = pnpmInvocation(['--dir', 'packages/ymzz/image-codec', 'pack', '--pack-destination', destination])\n  await execa(image.command, image.args, { cwd: root, stdio: 'inherit' })\n  console.log(`desktop local pack: ${String(packed.length + 2)} tarball(s) in ${destination}`)",'include actual image helper and notices in official local runtime closure');
edit('apps/web/index.html','<title>DSH Local Build</title>','<title>湛箴_ymzz</title>','actual product document title');
edit('apps/web/index.html','type="image/svg+xml" href="/favicon-dark.svg"','type="image/png" href="/ymzz-product.png"','actual product dark favicon');
edit('apps/web/index.html','type="image/svg+xml" href="/favicon.svg"','type="image/png" href="/ymzz-product.png"','actual product light favicon');
fs.copyFileSync(path.join(product,'runtime/ui/brand/icon-128.png'),path.join(work,'apps/web/public/ymzz-product.png'));
edit('apps/desktop/src/main.ts',"  if (app.isPackaged || process.env.DSH_DESKTOP_DEV_APP === '1') app.setAsDefaultProtocolClient('dsh')","  // 湛箴 portable: no custom OS protocol/registry registration.",'no custom protocol registration');
edit('apps/desktop/src/main.ts',"import { join } from 'node:path'","import { dirname, join } from 'node:path'\nimport { mkdirSync } from 'node:fs'",'portable data-root helpers');
edit('apps/desktop/src/main.ts','let focusPrimaryWindow = (): void => {}',`// Product-owned data and skill pool only. Never reuse ~/.agents or ~/.dsh.
const productData = process.env.YMZZ_DSH_DATA || (app.isPackaged ? join(dirname(app.getPath('exe')), '湛箴資料') : join(process.cwd(), '.data', 'desktop'))
mkdirSync(productData, { recursive: true })
app.setPath('userData', productData)
process.env.DSH_HOME = join(app.getPath('userData'), 'dsh')
process.env.DSH_AGENTS_HOME = join(app.getPath('userData'), 'agents')
process.env.DSH_TELEMETRY_DISABLED = '1'
process.env.DSH_CLIENT_TITLE = '湛箴_ymzz'
let focusPrimaryWindow = (): void => {}`,'portable product-local profile and skill pool; telemetry disabled');
edit('apps/desktop/src/main.ts',"if (!enteredWorkspace && needsWelcome({ loggedIn: state.loggedIn, hasApiKey: state.hasApiKey }))", "if (!enteredWorkspace && process.env.YMZZ_REQUIRE_ACCOUNT_WELCOME === '1' && needsWelcome({ loggedIn: state.loggedIn, hasApiKey: state.hasApiKey }))",'nickname-first plugin onboarding, account welcome remains opt-in');
// Upstream unsigned macOS already omits the remote mandatory-update service. Apply
// that same offline/unsigned policy to our Windows portable derivative; no invented
// HTTPS endpoint, release credential, or update service is configured.
edit('apps/desktop/scripts/desktop-package-environment.mjs',"if (target.platform !== 'darwin' || !options.unsigned) resolveDesktopPolicyEnvironment(environment)","if (!options.unsigned) resolveDesktopPolicyEnvironment(environment)",'unsigned portable build has no mandatory remote update service; signed policy unchanged');
edit('apps/desktop/scripts/electron-builder-config.mjs',"const policy = packagesMacOS && unsigned ? undefined : resolveDesktopPolicyEnvironment(env)","const policy = unsigned ? undefined : resolveDesktopPolicyEnvironment(env)",'omit mandatory remote-update metadata for unsigned portable builds on Windows too');
edit('apps/desktop/scripts/electron-builder-config.mjs',"productName: 'DeepSeek Harness'","productName: '湛箴_ymzz'",'product branding');
edit('apps/desktop/scripts/electron-builder-config.mjs',"protocols: [{ name: 'DeepSeek Harness', schemes: ['dsh'] }]","protocols: []",'no distribution protocol association');
for(const [src,to]of [['runtime/ui/brand/icon-512.png','apps/desktop/resources/icon-windows.png'],['runtime-desktop/assets/product.ico','apps/desktop/resources/tray-windows.ico']]){fs.copyFileSync(path.join(product,src),path.join(work,to));changes.push({file:to,reason:'actual user supplied product icon'})}
// Display strings only; IDs, data paths, original source and original credits stay stable.
const nativeLocale=fs.readFileSync(path.join(source,'apps/desktop/src/locale.ts'),'utf8');
edit('apps/desktop/src/locale.ts',nativeLocale,nativeLocale.replaceAll('DeepSeek Harness',brand.displayName),'exact user product display name in native menus, quit/startup/update/About labels; immutable credits unchanged');
edit('apps/desktop/src/main.ts',"applicationName: 'DeepSeek Harness'","applicationName: '湛箴_ymzz'",'native About panel product display name');
edit('apps/desktop/src/main.ts','detail: formatDesktopMessage(locale.messages.aboutVersion, { version: app.getVersion() }),',"detail: "+JSON.stringify(brand.meaning+'\nBased on official DeepSeek Harness (MIT).\n')+" + formatDesktopMessage(locale.messages.aboutVersion, { version: app.getVersion() }),",'exact user About meaning plus original upstream attribution/version');
edit('apps/desktop/src/main.ts',"    if (!quitting) void mandatoryPolicy?.check('foreground-or-resume').catch((error: unknown) => { console.error(error) })\n    if (!quitting) void updateSchedule.check().catch((error: unknown) => { console.error(error) })","    // 湛箴_ymzz: reviewed updates are user-triggered only. No startup/focus/resume remote polling.", 'no unconsented background update polling; native manual update APIs retained');
// Carry the actual upstream MIT/copyright and original third-party notices into
// assembled binaries too, not merely the immutable source archive.
edit('apps/desktop/scripts/electron-builder-config.mjs',"    extraResources: [","    extraResources: [\n      { from: fileURLToPath(new URL('../../../LICENSE', import.meta.url)), to: 'licenses/deepseek-harness/LICENSE' },\n      { from: fileURLToPath(new URL('../../../THIRD_PARTY_NOTICES.md', import.meta.url)), to: 'licenses/deepseek-harness/THIRD_PARTY_NOTICES.md' },",'retain actual original DSH license/copyright and third-party notices inside portable app resources');
// A real production dependency of the FULL web-app bundle, carried by the official package closure.
const rel='packages/ymzz/zhanzhen',pkg=path.join(work,rel);fs.mkdirSync(pkg,{recursive:true});
for(const f of ['index.mjs','ui.js','wenrun.css','updates.mjs','maintainer-channel.json','client.mjs','client.d.mts'])fs.copyFileSync(path.join(base,'plugins/zhanzhen',f),path.join(pkg,f));
fs.writeFileSync(path.join(pkg,'package.json'),JSON.stringify({name:'@yanming/dsh-zhanzhen',version:'0.1.0',private:true,type:'module',main:'index.mjs',license:'MIT',exports:{'.':'./index.mjs','./client':{types:'./client.d.mts',default:'./lib/client.js'},'./package.json':'./package.json'},dsh:{client:{inject:['@deepseek-ai/dsh-client-ui-renderer','@deepseek-ai/dsh-client-ui-sidebar'],platform:'web'}},files:['index.mjs','ui.js','wenrun.css','updates.mjs','maintainer-channel.json','client.mjs','client.d.mts','lib','product','LICENSE'],dependencies:{'@deepseek-ai/dsh-llm':'workspace:*','@deepseek-ai/dsh-client-ui-renderer':'workspace:*','@deepseek-ai/dsh-client-ui-sidebar':'workspace:*',react:'18.3.1'}},null,2)+'\n');
fs.copyFileSync(path.join(product,'LICENSE'),path.join(pkg,'LICENSE'));
// Official clientBundle emits the REAL __ModuleLoader__ factory required by DSH; raw ESM is NOT a browser plugin bundle.
for(const entry of ['src/client/index.ts','lib/types/client/index.js']){const dest=path.join(pkg,entry);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(base,'plugins/zhanzhen/client.mjs'),dest)}
fs.writeFileSync(path.join(pkg,'tsdown.config.ts'),"import {clientBundle}from'../../client/tsdown.client.ts';export default clientBundle(import.meta.dirname,['index.mjs'],{hostPhase:true})\n");
for(const rel of ['core-skills.lock.json','runtime/src/store.mjs','runtime/src/coding/workspace.mjs','runtime/src/coding/test-tool.mjs','runtime/src/coding/fixture.mjs','runtime/pool','runtime/ui/brand','imports/ymzz-wenrun-design-skill/LICENSE','imports/ymzz-wenrun-design-skill/assets/tokens/tokens.css']){const dest=path.join(pkg,'product',rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.cpSync(path.join(product,rel),dest,{recursive:true,verbatimSymlinks:true})}
edit('packages/bundle/web-app/package.json','  "dependencies": {','  "dependencies": {\n    "@yanming/dsh-zhanzhen": "workspace:*",','real plugin production dependency');
edit('pnpm-lock.yaml','  packages/bundle/web-app:\n    dependencies:\n',"  packages/bundle/web-app:\n    dependencies:\n      '@yanming/dsh-zhanzhen':\n        specifier: workspace:*\n        version: link:../../ymzz/zhanzhen\n",'pin new workspace production dependency');
edit('pnpm-lock.yaml','\npackages:\n',"\n  packages/ymzz/zhanzhen:\n    dependencies:\n      '@deepseek-ai/dsh-client-ui-renderer':\n        specifier: workspace:*\n        version: link:../../client/ui-renderer\n      '@deepseek-ai/dsh-client-ui-sidebar':\n        specifier: workspace:*\n        version: link:../../client/ui-sidebar\n      react:\n        specifier: 18.3.1\n        version: 18.3.1\n      '@deepseek-ai/dsh-llm':\n        specifier: workspace:*\n        version: link:../../llm/llm\n\npackages:\n",'pin real plugin package importer');
const assembly='packages/bundle/web-app/cordis.patch.yml';fs.writeFileSync(path.join(work,assembly),fs.readFileSync(path.join(source,assembly),'utf8')+`\n# 湛箴 derivative only. Full original app stays intact.\n- id: desktop-product-telemetry\n  disabled: true\n- id: product-analytics\n  disabled: true\n- insert:\n    - id: ymzz-zhanzhen\n      name: '@yanming/dsh-zhanzhen'\n      config: {}\n`);changes.push({file:assembly,reason:'full-app plugin autoload plus telemetry opt-out'});
// No update origin, signing certificate, merchant setting or account key is supplied.
fs.writeFileSync(path.join(work,'apps/desktop/.env.windows'),'DSH_DESKTOP_APP_ID=me.yanming.zhanzhen\n');
const patch=[{id:'ymzz-zhanzhen',config:{productRoot:product,runtimeRoot:work,dataDir:path.join(data,'zhanzhen')}}];
fs.writeFileSync(path.join(data,'zhanzhen.patch.yml'),JSON.stringify(patch,null,2)+'\n');fs.writeFileSync(path.join(data,'derivative-changes.json'),JSON.stringify({upstream:lock.commit,verifiedSourceFiles:lock.files.length,changes},null,2)+'\n');
console.log(JSON.stringify({work,patch:path.join(data,'zhanzhen.patch.yml'),verifiedSourceFiles:lock.files.length,changes}));
