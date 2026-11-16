// MIT. App-owned SQLite only; no telemetry, home-directory scans or registry writes.
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export const sha = v => createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export function assert(ok,code){if(!ok)throw new Error(code);}
export class Store {
 constructor(file){
  mkdirSync(dirname(file),{recursive:true,mode:0o700});this.db=new DatabaseSync(file);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
   CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,title TEXT NOT NULL,input TEXT NOT NULL,state TEXT NOT NULL,owner TEXT,result TEXT);
   CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY,task TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,previous TEXT NOT NULL,hash TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS memory(id TEXT PRIMARY KEY,task TEXT NOT NULL,text TEXT NOT NULL,created TEXT NOT NULL);`);
  // A killed process cannot silently resume an in-flight provider/tool action.
  for(const row of this.db.prepare("SELECT id FROM tasks WHERE state='running'").all()){
   this.event(row.id,'interrupted',{recovery:'manual retry requires a new task'});
   this.db.prepare("UPDATE tasks SET state='failed' WHERE id=?").run(row.id);
  }
 }
 get(key,fallback=null){const r=this.db.prepare('SELECT value FROM config WHERE key=?').get(key);return r?JSON.parse(r.value):fallback;}
 set(key,value){this.db.prepare('INSERT OR REPLACE INTO config VALUES(?,?)').run(key,JSON.stringify(value));}
 event(task,kind,payload){const data=JSON.stringify(payload);const prev=this.db.prepare('SELECT hash FROM events ORDER BY seq DESC LIMIT 1').get()?.hash||'';
  const hash=sha([task,kind,data,prev]);this.db.prepare('INSERT INTO events(task,kind,payload,previous,hash) VALUES(?,?,?,?,?)').run(task,kind,data,prev,hash);return hash;}
 verify(){let prev='';for(const e of this.db.prepare('SELECT * FROM events ORDER BY seq').all()){
  if(e.previous!==prev||e.hash!==sha([e.task,e.kind,e.payload,prev]))return false;prev=e.hash;
 }return true;}
 task(id){const t=this.db.prepare('SELECT * FROM tasks WHERE id=?').get(id);assert(t,'TASK_NOT_FOUND');return {...t,result:t.result?JSON.parse(t.result):null};}
 tasks(){return this.db.prepare('SELECT * FROM tasks ORDER BY rowid DESC').all().map(t=>({...t,result:t.result?JSON.parse(t.result):null}));}
 create(title,input){assert(typeof title==='string'&&title.trim()&&title.length<=160,'TITLE_REQUIRED');assert(typeof input==='string'&&input.length<=1_048_576,'INPUT_INVALID');
  const id=randomUUID();this.db.prepare('INSERT INTO tasks VALUES(?,?,?,\'todo\',NULL,NULL)').run(id,title.trim(),input);this.event(id,'created',{input_sha256:sha(input)});return this.task(id);}
 claim(id,owner){assert(typeof owner==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(owner),'OWNER_INVALID');assert(this.verify(),'EVIDENCE_TAMPERED');
  const n=this.db.prepare("UPDATE tasks SET state='claimed',owner=? WHERE id=? AND state='todo'").run(owner,id).changes;assert(n===1,'TASK_ALREADY_CLAIMED');this.event(id,'claimed',{owner});return this.task(id);}
 transition(id,from,to,owner,result=null){assert(this.verify(),'EVIDENCE_TAMPERED');const n=this.db.prepare('UPDATE tasks SET state=?,result=? WHERE id=? AND state=? AND owner=?').run(to,result?JSON.stringify(result):null,id,from,owner).changes;
  assert(n===1,'STATE_OR_OWNER_MISMATCH');this.event(id,to,result||{owner});return this.task(id);}
 review(id,accepted){assert(typeof accepted==='boolean','REVIEW_BOOLEAN_REQUIRED');const t=this.task(id);assert(t.state==='review'&&t.result?.gate_passed&&this.verify(),'GATE_OR_EVIDENCE_FAILED');
  return this.transition(id,'review',accepted?'done':'rejected',t.owner,t.result);}
 remember(task,text,consent){assert(consent===true,'MEMORY_CONSENT_REQUIRED');assert(this.task(task).state==='done','REVIEW_REQUIRED');assert(typeof text==='string'&&text.length>0&&text.length<=8000,'MEMORY_INVALID');
  const id=randomUUID();this.db.prepare('INSERT INTO memory VALUES(?,?,?,?)').run(id,task,text,new Date().toISOString());this.event(task,'remembered',{id,text_sha256:sha(text)});return id;}
 memories(query=''){assert(typeof query==='string'&&query.length<=1000,'QUERY_INVALID');return this.db.prepare('SELECT * FROM memory WHERE instr(text,?)>0 ORDER BY rowid DESC LIMIT 100').all(query);}
 evidence(id){this.task(id);return this.db.prepare('SELECT * FROM events WHERE task=? ORDER BY seq').all(id).map(x=>({...x,payload:JSON.parse(x.payload)}));}
 close(){this.db.close();}
}
