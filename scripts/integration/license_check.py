#!/usr/bin/env python3
"""Audit actual resolved Rust graph and new build-tool npm locks. No API/network execution.
Cargo metadata may fetch public crate manifests. Unknown/restrictive expressions fail closed.
Original archival imports are NOT runtime dependencies and keep their own notices.
"""
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ALLOW={'MIT','Apache-2.0','Apache-2.0 WITH LLVM-exception','BSD-2-Clause','BSD-3-Clause','ISC','Zlib','Unicode-3.0','Unicode-DFS-2016','CC0-1.0','BSL-1.0','0BSD','Unlicense','BlueOak-1.0.0','LicenseRef-scancode-w3c-software-notice-and-license-19980720','WTFPL','MPL-2.0','OpenSSL','bzip2-1.0.6'}
def permissive(expr):
 if not expr:return False
 expr=expr.strip().strip('()')
 # These are simple SPDX expressions from resolved manifests, not prose.
 if expr in ALLOW:return True
 if ' OR ' in expr:return any(permissive(x) for x in expr.split(' OR '))
 if ' AND ' in expr:return all(permissive(x) for x in expr.split(' AND '))
 if '/' in expr:return any(permissive(x) for x in expr.split('/'))
 return False
records=[]
for manifest in ['Cargo.toml','runtime-desktop/Cargo.toml']:
 metadata=json.loads(subprocess.check_output(['cargo','metadata','--format-version','1','--locked','--manifest-path',str(ROOT/manifest),'--filter-platform','x86_64-pc-windows-msvc'],cwd=ROOT))
 for p in metadata['packages']:
  # Only transitive resolved graph; path packages authored here inherit their unchanged root MIT LICENSE.
  expr=p.get('license')
  if p['source'] is None and not expr and (ROOT/'LICENSE').is_file():expr='MIT (workspace root LICENSE)'
  records.append({'ecosystem':'cargo','scope':manifest,'name':p['name'],'version':p['version'],'license':expr,'allowed':expr=='MIT (workspace root LICENSE)' or permissive(expr)})
for manifest in ['runtime/package-lock.json','runtime-desktop/package-lock.json']:
 for name,p in json.loads((ROOT/manifest).read_text())['packages'].items():
  if not name:continue
  expr=p.get('license');records.append({'ecosystem':'npm','scope':manifest,'name':name,'version':p.get('version'),'license':expr,'allowed':permissive(expr)})
failed=[r for r in records if not r['allowed']]
report={'policy':'New code MIT; permissible upstream licenses retained; no GPL/AGPL/Commons Clause. MPL-2.0 is weak file copyleft, not relabeled MIT. Node engine licenses separately shipped. Scan is manifest-based, not legal certification.','records':records,'failed':failed}
(ROOT/'docs/integration/dependency-licenses.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'{len(records)} resolved dependency records; {len(failed)} blocked')
for r in failed: print(r)
sys.exit(bool(failed))
