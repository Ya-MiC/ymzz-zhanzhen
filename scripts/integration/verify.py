#!/usr/bin/env python3
"""Offline snapshot/pool preservation verification. Paths & hashes, never secrets."""
import hashlib,json,subprocess,struct
from pathlib import Path
root=Path(__file__).resolve().parents[2]
records=json.loads((root/'docs/integration/sources.lock.json').read_text(encoding="utf-8"))
records+=json.loads((root/'core-skills.lock.json').read_text(encoding="utf-8"))['skills']
count=0
for r in records:
 for f in r['files']:
  if 'sha256' not in f: continue
  p=root/r['destination']/f['path']
  assert p.is_file(),str(p)
  assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],str(p)
  count+=1
for skill in json.loads((root/'core-skills.lock.json').read_text(encoding="utf-8"))['skills']:
 assert (root/skill['entrypoint']).is_file(),skill['id']
# Both unrelated branch-head trees are preserved without flattening source paths.
assert {r['ref'] for r in records if r['repository'].endswith('/ymzz-loop')}=={'origin/main','origin/product'}
history=json.loads((root/'docs/integration/loop-history-inventory.json').read_text(encoding="utf-8"))
assert history['unrelatedHistories'] and history['mergeBase'] is None
for name in ['product','main']:
 branch=history['branches'][name]
 assert branch['commitCount']==len(branch['commits'])
 assert branch['head']==next(r['commit'] for r in records if r.get('ref')=='origin/'+name)
assert (root/'runtime/dist/ui/tokens.css').read_bytes()==(root/'imports/ymzz-wenrun-design-skill/assets/tokens/tokens.css').read_bytes()
# New UI may consume authority variables but cannot mint color literals.
css=(root/'runtime/ui/app.css').read_text(encoding="utf-8")
import re
assert not re.search(r'#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(',css)
# Windows RC requires a real DIB entry, correct resource offset and the AND-mask height.
icon=(root/'runtime-desktop/assets/icon.ico').read_bytes()
assert struct.unpack_from('<HHH',icon)==(0,1,1)
w,h,_,_,planes,bpp,size,offset=struct.unpack_from('<BBBBHHII',icon,6)
header=struct.unpack_from('<IIIHHIIIIII',icon,offset)
assert offset==22 and size==len(icon)-offset and planes==1 and bpp==32
assert header[:5]==(40,w,h*2,1,32)
assert len(icon)==offset+40+w*h*4+((w+31)//32)*4*h
print(f'VERIFIED: {count} exact upstream files, nine skills, two loop branch heads and commit inventories, unchanged color authority')

# Supplied product art is retained byte-for-byte; Lucide icons remain pinned ISC sources.
art=json.loads((root/'docs/integration/product-icon.lock.json').read_text(encoding='utf-8'))
assert hashlib.sha256((root/art['originalFile']).read_bytes()).hexdigest()==art['sha256']
ui=json.loads((root/'docs/integration/ui-components.lock.json').read_text(encoding='utf-8'))
for file in ui['files']:
 assert hashlib.sha256((root/'runtime/ui'/file['path']).read_bytes()).hexdigest()==file['sha256']
assert hashlib.sha256((root/'runtime/ui/icons/LICENSE').read_bytes()).hexdigest()==ui['licenseSha256']
product=(root/art['windowsIco']).read_bytes();reserved,kind,n=struct.unpack_from('<HHH',product)
assert reserved==0 and kind==1 and n>=6
for i in range(n):
 width,height,_,_,planes,bits,size,offset=struct.unpack_from('<BBBBHHII',product,6+i*16)
 assert size>0 and offset+size<=len(product)
 blob=product[offset:offset+size]
 if blob.startswith(bytes([137,80,78,71,13,10,26,10])):
  assert struct.unpack_from('>II',blob,16)==(width or 256,height or 256)
print('VERIFIED: actual supplied artwork, genuine multi-size ICO, pinned ISC Lucide UI assets')
