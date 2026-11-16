// MIT. Audit the ACTUAL materialized portable payload, separately from workspace npm declarations.
import{createRequire}from'node:module';import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
const base=path.resolve(import.meta.dirname,'..'),proof=path.join(base,'evidence/windows'),record=path.join(proof,'packaged-production-license-report.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
if(process.argv.includes('--enforce')){const r=JSON.parse(fs.readFileSync(record,'utf8'));if(!r.permissivePortableCleared){console.error(JSON.stringify({status:'BLOCKED_ACTUAL_PORTABLE_LICENSES',blocked:r.blocked}));process.exitCode=1}}else{
 const root=path.resolve(process.argv[2]||''),packages=[],blocked=[],visited=new Set();let codec=false;
 const require=createRequire(path.join(base,'.worktree/apps/desktop/package.json')),{readAsar}=require('app-builder-lib/out/asar/asar.js'),archiveFile=path.join(root,'resources/app.asar'),archive=await readAsar(archiveFile);
 async function read(file){const e=archive.getFile(file,false);if(!e||e.link||e.size>128*1024*1024)throw Error('PACKAGED_ARCHIVE_ENTRY_REJECTED');return archive.readFile(file)}
 async function walk(node,dir=''){
  for(const [name,e]of Object.entries(node.files||{})){if(name==='..'||name.includes('/')||name.includes('\\')||e.link)throw Error('PACKAGED_UNREVIEWED_LINK_OR_PATH');const file=path.join(dir,name);if(e.files){await walk(e,file);continue}
   const loc=file.split(path.sep).join('/');if(!loc.startsWith('dsh/')||!/(?:^|\/)node_modules\/(?:@[^/]+\/)?[^/]+\/package\.json$/.test(loc))continue;
   const p=JSON.parse((await read(file)).toString('utf8'));if(!p.name||!p.version)throw Error('PACKAGED_MANIFEST_INVALID');const license=p.license||null;packages.push({name:p.name,version:p.version,license,path:loc});
   if(p.name==='sharp'||p.name.startsWith('@img/sharp'))blocked.push({component:p.name,reason:'FORBIDDEN_DISTRIBUTED_SHARP',path:loc});
   if(!license)blocked.push({component:p.name,reason:'PACKAGED_LICENSE_MISSING',path:loc});
   if(license&&/GPL|AGPL|MPL|Commons Clause|UNLICENSED|PROPRIETARY/i.test(license)&&!(/\bOR\b/.test(license)&&/\bMIT\b|BSD-[23]-Clause/.test(license)&&!(/\bAND\b/.test(license))))blocked.push({component:p.name,license,reason:'NON_PERMISSIVE_DISTRIBUTED_COMPONENT',path:loc});
   if(p.name==='@yanming/dsh-image'){const dir=path.dirname(file),lock=JSON.parse((await read(path.join(dir,'codec-sources.lock.json'))).toString('utf8')),bin=path.join(dir,lock.binary.file),entry=archive.getFile(bin,false);if(sha(await read(path.join(dir,'index.cjs')))!==lock.adapterSha256||!entry.unpacked||!lock.permissiveCodecCleared||sha(await read(bin))!==lock.binary.sha256||!(await read(path.join(dir,'THIRD_PARTY_NOTICES.txt'))).length)throw Error('PACKAGED_CODEC_HASH_OR_NOTICES_INVALID');codec=true}
  }
 }
 await walk(archive.header);if(packages.length<300)throw Error('ACTUAL_FULL_PACKAGED_RUNTIME_NOT_AUDITED');
 if(!codec)throw Error('ACTUAL_PACKAGED_PERMISSIVE_IMAGE_CODEC_MISSING');
 const ffmpeg=path.join(root,'ffmpeg.dll'),notice=path.join(root,'LICENSES.chromium.html'),native=[];
 if(fs.existsSync(ffmpeg)){
  if(!fs.existsSync(notice))throw Error('ACTUAL_ELECTRON_THIRD_PARTY_NOTICE_MISSING');const b=fs.readFileSync(notice),text=b.toString('utf8'),at=text.toLowerCase().indexOf('ffmpeg');if(at<0)throw Error('ELECTRON_FFMPEG_NOTICE_UNRESOLVED');
  fs.copyFileSync(notice,path.join(proof,'actual-LICENSES.chromium.html'));
  const finding={component:'Electron Chromium FFmpeg',file:'ffmpeg.dll',sha256:sha(fs.readFileSync(ffmpeg)),noticeFile:'LICENSES.chromium.html',noticeSha256:sha(b),noticeExcerpt:text.slice(Math.max(0,at-150),at+3000),license:'LGPL-2.1-or-later',reason:'NON_PERMISSIVE_NATIVE_COMPONENT',source:'https://chromium.googlesource.com/chromium/third_party/ffmpeg/',upstreamExplanation:'https://github.com/electron/electron/issues/34236'};native.push(finding);blocked.push(finding);
 }
 const report={schema:1,scope:'Actual freshly materialized Windows portable runtime package manifests, actual image binary/checksums/notices, and actual stock Electron FFmpeg DLL/notices. This does not relabel Electron/LibreOffice native code MIT and is not a complete legal opinion.',root:'actual win-unpacked',packages,native,permissiveImageCodecVerified:codec,blocked,permissivePortableCleared:blocked.length===0};fs.mkdirSync(proof,{recursive:true});fs.writeFileSync(record,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({actualPackagedPackages:packages.length,permissiveImageCodecVerified:codec,blocked:blocked.map(x=>({component:x.component,license:x.license,reason:x.reason})),permissivePortableCleared:report.permissivePortableCleared}));
}
