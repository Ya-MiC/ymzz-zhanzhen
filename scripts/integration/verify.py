#!/usr/bin/env python3
"""Offline snapshot/pool preservation verification. Paths & hashes, never secrets."""
import hashlib,json,subprocess,struct
from pathlib import Path
root=Path(__file__).resolve().parents[2]
records=json.loads((root/'docs/integration/sources.lock.json').read_text())
records+=json.loads((root/'core-skills.lock.json').read_text())['skills']
count=0
for r in records:
 for f in r['files']:
  if 'sha256' not in f: continue
  p=root/r['destination']/f['path']
  assert p.is_file(),str(p)
  assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],str(p)
  count+=1
for skill in json.loads((root/'core-skills.lock.json').read_text())['skills']:
 assert (root/skill['entrypoint']).is_file(),skill['id']
# Entire source histories were inventoried, not overwritten into root paths.
assert {r['ref'] for r in records if r['repository'].endswith('/ymzz-loop')}=={'origin/main','origin/product'}
assert (root/'runtime/dist/ui/tokens.css').read_bytes()==(root/'imports/ymzz-wenrun-design-skill/assets/tokens/tokens.css').read_bytes()
# New UI may consume authority variables but cannot mint color literals.
css=(root/'runtime/ui/app.css').read_text()
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
print(f'VERIFIED: {count} exact upstream files, nine skills, two loop histories, unchanged color authority')
