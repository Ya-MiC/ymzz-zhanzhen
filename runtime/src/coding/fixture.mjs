// MIT. Explicit OFFLINE deterministic fake model transport, never represents live inference.
export const exampleFiles={'calculator.mjs':'export function add(a, b) { return a - b; }\n','calculator.test.mjs':"import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {add} from './calculator.mjs';\ntest('adds two numbers',()=>assert.equal(add(2,3),5));\n"};
export async function fixtureTransport(url,options){const c=JSON.parse(JSON.parse(options.body).messages[0].content).context;let plan;
 if(c.round===0)plan={summary:'離線假模型：先閱讀示例與測試。',tools:[{type:'read',path:'calculator.mjs'},{type:'read',path:'calculator.test.mjs'}]};
 else if(c.round===1)plan={summary:'離線假模型：故意提出錯誤修正，驗證失敗回饋。',tools:[{type:'patch',path:'calculator.mjs',find:'return a - b;',replace:'return a * b;',expectedHash:c.files['calculator.mjs'].hash},{type:'test',path:'calculator.test.mjs'}]};
 else if(c.round===2)plan={summary:'離線假模型：依真實失敗測試修正為加法。',tools:[{type:'patch',path:'calculator.mjs',find:'return a * b;',replace:'return a + b;',expectedHash:c.files['calculator.mjs'].hash},{type:'test',path:'calculator.test.mjs'}]};
 else plan={summary:'離線假模型：真實測試已通過，等待人工 diff 驗收。',done:true,tools:[]};
 return Response.json({choices:[{message:{content:JSON.stringify(plan)}}]});}
