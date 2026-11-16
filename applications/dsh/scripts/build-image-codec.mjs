// MIT. Build a real standalone permissive image replacement and retain dependency notices.
import fs from 'node:fs';import path from 'node:path';import {execFileSync}from'node:child_process';import {createHash}from'node:crypto';
const base=path.resolve(import.meta.dirname,'..'),src=path.join(base,'image-codec'),pkg=path.join(base,'.worktree/packages/ymzz/image-codec'),cargo=process.env.CARGO||'cargo',hash=b=>createHash('sha256').update(b).digest('hex');
import {selectPermissive}from'./codec-license.mjs';
const metadata=JSON.parse(execFileSync(cargo,['metadata','--locked','--format-version','1','--manifest-path',path.join(src,'Cargo.toml')],{encoding:'utf8',maxBuffer:16*1024*1024}));
const packages=[],texts=[];
const cargoLock=fs.readFileSync(path.join(src,'Cargo.lock'),'utf8');
const rustc=process.env.RUSTC||'rustc',sysroot=execFileSync(rustc,['--print','sysroot'],{encoding:'utf8'}).trim(),stdNotice=path.join(sysroot,'share/doc/rust/COPYRIGHT-library.html');
if(!fs.existsSync(stdNotice))throw new Error('RUST_STANDARD_LIBRARY_NOTICE_MISSING');
const stdBytes=fs.readFileSync(stdNotice);texts.push('===== Rust standard-library upstream notices (broad source inventory, including target-specific components not linked on this platform) =====\n'+stdBytes.toString('utf8'));
const rustVersion=execFileSync(rustc,['-vV'],{encoding:'utf8'}).trim();
for(const p of metadata.packages){
 const selectedLicense=selectPermissive(p.license);if(!p.source){if(p.name!=='ymzz-dsh-image-codec')throw new Error('UNREVIEWED_LOCAL_CODEC_DEPENDENCY');continue}
 if(!p.source.startsWith('registry+https://github.com/rust-lang/crates.io-index'))throw new Error('UNREVIEWED_CODEC_REGISTRY');
 const dir=path.dirname(p.manifest_path),files=fs.readdirSync(dir).filter(f=>/^(license|licence|copying|notice|unlicense|authors)([._-]|$)/i.test(f)&&fs.statSync(path.join(dir,f)).isFile());
 if(p.name==='libwebp-sys')for(const f of ['vendor/COPYING','vendor/PATENTS','vendor/AUTHORS'])if(fs.existsSync(path.join(dir,f)))files.push(f);
 if(!files.length)throw new Error('CODEC_NOTICE_MISSING: '+p.name);
 files.push('Cargo.toml');
 const notices=files.map(f=>{const b=fs.readFileSync(path.join(dir,f));texts.push(`\n===== ${p.name}@${p.version} / ${f} =====\n${b.toString('utf8')}\n`);return {file:f,sha256:hash(b)}});
 const entry=cargoLock.split('[[package]]').find(b=>b.includes('name = '+JSON.stringify(p.name)+'\n')&&b.includes('version = '+JSON.stringify(p.version)+'\n')),checksum=entry?.match(/checksum = "([a-f0-9]{64})"/)?.[1];if(!checksum)throw new Error('LOCK_CHECKSUM_MISSING: '+p.name);
 packages.push({name:p.name,version:p.version,checksum,crateURL:`https://crates.io/crates/${p.name}/${p.version}`,repository:p.repository,declaredLicense:p.license,selectedLicense,source:p.source,notices});
}
texts.push('\nVendored libwebp C implementation retains its BSD-3-Clause COPYING and PATENTS above; the libwebp-sys MIT wrapper license does not relabel that C code.\n');
const buildEnv={...process.env};if(process.platform==='win32')buildEnv.RUSTFLAGS=[buildEnv.RUSTFLAGS||'','-C target-feature=+crt-static'].join(' ').trim();
execFileSync(cargo,['build','--release','--locked','--manifest-path',path.join(src,'Cargo.toml')],{stdio:'inherit',env:buildEnv});
const name=process.platform==='win32'?'ymzz-dsh-image-codec.exe':'ymzz-dsh-image-codec',binary=path.join(src,'target/release',name),bytes=fs.readFileSync(binary),fingerprint=hash(Buffer.concat(['Cargo.toml','Cargo.lock','src/main.rs','adapter.cjs'].map(f=>fs.readFileSync(path.join(src,f)))));
const lock={schema:1,rustStandardLibrary:{version:rustVersion,source:'https://github.com/rust-lang/rust',license:'MIT OR Apache-2.0',broadUpstreamNoticeSha256:hash(stdBytes)},purpose:'actual permissive image-rs/libwebp runtime replacement; Sharp is development-only for independent upstream fixtures',platform:process.platform,sourceFingerprint:fingerprint,adapterSha256:hash(fs.readFileSync(path.join(src,'adapter.cjs'))),binary:{file:'bin/'+name,sha256:hash(bytes),bytes:bytes.length},packages:packages.sort((a,b)=>a.name.localeCompare(b.name)),vendoredNative:{name:'libwebp',license:'BSD-3-Clause',noticesRetained:true},permissiveCodecCleared:true};
for(const dest of [src,pkg]){if(dest===pkg){fs.mkdirSync(pkg,{recursive:true});for(const [from,to]of [['adapter.cjs','index.cjs'],['index.d.ts','index.d.ts'],['LICENSE','LICENSE']])fs.copyFileSync(path.join(src,from),path.join(pkg,to))}fs.mkdirSync(path.join(dest,'bin'),{recursive:true});fs.copyFileSync(binary,path.join(dest,'bin',name));fs.writeFileSync(path.join(dest,'codec-sources.lock.json'),JSON.stringify(lock,null,2)+'\n');fs.writeFileSync(path.join(dest,'THIRD_PARTY_NOTICES.txt'),texts.join(''))}
const out=path.join(base,'evidence',process.platform==='win32'?'windows/image-codec-license.json':'image-codec-license-linux.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(lock,null,2)+'\n');console.log(JSON.stringify({codec:name,packages:packages.length,sourceFingerprint:fingerprint,binarySHA256:hash(bytes),permissiveCodecCleared:true}));
