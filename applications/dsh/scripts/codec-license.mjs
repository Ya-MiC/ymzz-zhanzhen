// MIT. Fail-closed SPDX AND/OR selection for the standalone codec only.
const allowed=new Set(['MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','BSD-4-Clause','ISC','0BSD','Unlicense','Zlib','Unicode-3.0','BSL-1.0','CC0-1.0']);
export function selectPermissive(expression){
 const tokens=String(expression||'').replace(/MIT\/Apache-2\.0/g,'MIT OR Apache-2.0').match(/\(|\)|\bAND\b|\bOR\b|[^\s()]+/g)||[];let i=0;
 const term=()=>{if(tokens[i]==='('){i++;const x=or();if(tokens[i++]!==')')throw new Error('LICENSE_SYNTAX');return x}const id=tokens[i++];return allowed.has(id)?[id]:null};
 const and=()=>{let a=term();while(tokens[i]==='AND'){i++;const b=term();a=a&&b?[...new Set([...a,...b])]:null}return a};
 const or=()=>{let a=and();while(tokens[i]==='OR'){i++;const b=and();a=a||b}return a};
 const out=or();if(i!==tokens.length||!out)throw new Error('NON_PERMISSIVE_CODEC_LICENSE: '+expression);return out;
}
