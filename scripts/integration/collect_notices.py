#!/usr/bin/env python3
"""Collect actual license/notice texts for the portable runtime's Rust+UI dependencies.
Reads only public dependency package roots described by Cargo/npm, never credentials.
"""
import json,subprocess,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'runtime/dist/licenses';OUT.mkdir(parents=True,exist_ok=True)
metadata=json.loads(subprocess.check_output(['cargo','metadata','--locked','--format-version','1','--manifest-path',str(ROOT/'runtime-desktop/Cargo.toml'),'--filter-platform','x86_64-pc-windows-msvc']))
index=[]
for p in metadata['packages']:
 package=Path(p['manifest_path']).parent
 files=[f for f in package.iterdir() if f.is_file() and not f.is_symlink() and f.name.lower().startswith(('license','copying','notice','copyright'))]
 if p.get('license_file'):
  f=(package/p['license_file']).resolve()
  if f.is_relative_to(package.resolve()) and f.is_file() and f not in files:files.append(f)
 if not p['source'] and not files:files=[ROOT/'LICENSE']
 dest=OUT/'rust'/(p['name']+'-'+p['version']);dest.mkdir(parents=True,exist_ok=True)
 for f in files:shutil.copyfile(f,dest/f.name)
 extra=ROOT/'runtime/extra-notices'/(p['name']+'-'+p['version'])
 if extra.is_dir():
  for f in extra.iterdir():
   if f.is_file() and not f.is_symlink():shutil.copyfile(f,dest/f.name);files.append(f)
 index.append({'name':p['name'],'version':p['version'],'spdx':p.get('license'),'texts':[str((dest/f.name).relative_to(OUT)) for f in files]})
# Runtime JS kernel source license already copied by build.mjs; original browser UI uses these packages.
for name in ['react','react-dom','zustand']:
 p=ROOT/'apps/ui/node_modules'/name
 if p.exists():
  real=p.resolve()
  for dependency in [real,real.parent/'scheduler',real.parent/'use-sync-external-store']:
   if not dependency.is_dir():continue
   info=dependency/'package.json'
   if not info.is_file():continue
   pkg=json.loads(info.read_text());dest=OUT/'ui'/(pkg['name'].replace('/','-')+'-'+pkg['version']);dest.mkdir(parents=True,exist_ok=True)
   files=[f for f in dependency.iterdir() if f.is_file() and not f.is_symlink() and f.name.lower().startswith(('license','notice','copying'))]
   for f in files:shutil.copyfile(f,dest/f.name)
   index.append({'name':pkg['name'],'version':pkg['version'],'spdx':pkg.get('license'),'texts':[str((dest/f.name).relative_to(OUT)) for f in files]})
(OUT/'dependency-notices-index.json').write_text(json.dumps(index,indent=2)+'\n')
missing=[r for r in index if not r['texts']]
print(f'Collected actual notice texts for {len(index)} packages; {len(missing)} without root texts')
if missing:
 (OUT/'missing-root-license-texts.json').write_text(json.dumps(missing,indent=2)+'\n')
 # SPDX declarations are still audited separately; report missing texts rather than inventing them.
 print([r['name'] for r in missing])
 raise SystemExit('Missing dependency notice material')
