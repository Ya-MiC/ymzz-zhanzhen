// MIT. Private adapter for DSH attachment call sites, NOT a complete Sharp implementation.
// Real image-rs/libwebp operations in an owned, bundled, no-file/network Rust helper.
const {spawn}=require('node:child_process');const path=require('node:path');
const binary=path.join(__dirname.replace(/([\\/])app\.asar([\\/])/,'$1app.asar.unpacked$2'),'bin',process.platform==='win32'?'ymzz-dsh-image-codec.exe':'ymzz-dsh-image-codec');
function request(data,options={}){return new Promise((resolve,reject)=>{
 if(!ArrayBuffer.isView(data)||data.byteLength>128*1024*1024){reject(new Error('RASTER_BYTES_OR_SIZE_REJECTED'));return}
 const env={TZ:'Asia/Seoul',LANG:'C.UTF-8'};for(const k of ['SystemRoot','SYSTEMROOT','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
 const child=spawn(binary,[],{env,shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});let output=[],bytes=0,settled=false;
 const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value)};
 const timer=setTimeout(()=>{child.kill();finish(new Error('IMAGE_CODEC_TIMEOUT'))},20000);
 child.once('error',()=>finish(new Error('BUNDLED_IMAGE_CODEC_UNAVAILABLE')));child.stdin.on('error',()=>{});child.stderr.resume();
 child.stdout.on('data',b=>{bytes+=b.length;if(bytes>128*1024*1024){child.kill();finish(new Error('IMAGE_CODEC_OUTPUT_LIMIT'));return}output.push(b)});
 child.once('close',code=>{if(code!==0)return finish(new Error('IMAGE_CODEC_REJECTED'));try{finish(null,JSON.parse(Buffer.concat(output).toString('utf8')))}catch{finish(new Error('IMAGE_CODEC_RESPONSE_INVALID'))}});
 child.stdin.end(JSON.stringify({...options,data:Buffer.from(data).toString('base64')}));
})}
function pipeline(input,options={},state={}){
 if(!ArrayBuffer.isView(input)||input.byteLength>128*1024*1024)throw new Error('RASTER_BYTES_OR_SIZE_REJECTED');const data=Buffer.from(input);
 const self={metadata:()=>request(data,{op:'metadata'}),rotate(){state.rotate=true;return self},toColourspace(space){if(space!=='srgb')throw new Error('IMAGE_COLORSPACE_UNSUPPORTED');state.srgb=true;return self},resize(r){if(!r||typeof r!=='object')throw new Error('IMAGE_RESIZE_OPTIONS_REQUIRED');for(const key of ['width','height'])if(r[key]!==undefined&&(!Number.isSafeInteger(r[key])||r[key]<1))throw new Error('IMAGE_RESIZE_INVALID');Object.assign(state,{width:r.width,height:r.height,withoutEnlargement:r.withoutEnlargement===true});return self},clone(){return pipeline(data,options,{...state})},webp({quality=85}={}){state.format='webp';state.quality=quality;return self},jpeg({quality=85}={}){state.format='jpeg';state.quality=quality;return self},async toBuffer(out={}){if(!state.format)throw new Error('IMAGE_ENCODER_REQUIRED');const r=await request(data,{...state,op:'encode'}),buffer=Buffer.from(r.data,'base64');return out.resolveWithObject?{data:buffer,info:r.info}:buffer}};
 return self;
}
module.exports=pipeline;
module.exports.validateRaster=async data=>{await request(data,{op:'validate'})};
