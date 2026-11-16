// MIT. Verify canonical Git bytes, including explicitly documented Windows Git checkout representations.
import fs from 'node:fs';import path from 'node:path';import {createHash}from'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function pinnedBytes(source,record,{windows=process.platform==='win32'}={}){
 const file=path.join(source,record.path),st=fs.lstatSync(file);let bytes;
 if(record.mode==='120000'&&st.isSymbolicLink()){
  bytes=Buffer.from(fs.readlinkSync(file));
  // Git on Windows may expose junctions/absolute or backslash targets, not the stored relative blob text.
  if(sha(bytes)!==record.sha256&&windows&&typeof record.linkTarget==='string'&&sha(record.linkTarget)===record.sha256){
   const expected=path.resolve(path.dirname(file),record.linkTarget);
   if(!expected.startsWith(path.resolve(source)+path.sep))throw new Error('EXTERNAL_SOURCE_LINK');
   if(fs.realpathSync.native(file).toLowerCase()===fs.realpathSync.native(expected).toLowerCase())bytes=Buffer.from(record.linkTarget);
  }
 }else{if(st.isSymbolicLink()||!st.isFile())throw new Error('SOURCE_FILE_TYPE_CHANGED');bytes=fs.readFileSync(file)}
 if(sha(bytes)!==record.sha256&&windows&&record.path.endsWith('.cmd'))bytes=Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n'));
 if(sha(bytes)!==record.sha256)throw new Error('UPSTREAM_CHANGED: '+record.path);return bytes;
}
