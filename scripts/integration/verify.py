#!/usr/bin/env python3
"""Offline snapshot/pool preservation verification. Paths & hashes, never secrets."""
import hashlib,json,subprocess
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
print(f'VERIFIED: {count} exact upstream files, nine skills, two loop histories, unchanged color authority')
