// MIT. Maintainer-reviewed, signature-verified OPAQUE staging, never unsigned code loading.
// No network, extraction, import(), child process, registry edit or background polling.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,createPublicKey,verify,randomUUID} from 'node:crypto';
const need=(ok,code)=>{if(!ok)throw new Error(code)};
const digest=b=>createHash('sha256').update(b).digest('hex');
const sha=/^[a-f0-9]{64}$/;
const commit=/^[a-f0-9]{40}$/;
const version=/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/;
export class ReviewedUpdates {
  constructor({directory,channel,currentDSHCommit}) {
    this.directory=path.resolve(directory);this.channel=structuredClone(channel);this.currentDSHCommit=currentDSHCommit;
    need(channel.productId==='me.yanming.zhanzhen'&&commit.test(currentDSHCommit),'UPDATE_PRODUCT_CONFIGURATION_INVALID');
    this.stateFile=path.join(this.directory,'state.json');this.busy=false;
  }
  state(){
    let staged=null;if(fs.existsSync(this.directory))need(!fs.lstatSync(this.directory).isSymbolicLink(),'UPDATE_CACHE_LINK_FORBIDDEN');if(fs.existsSync(this.stateFile)){const st=fs.lstatSync(this.stateFile);need(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.size<=8192,'UPDATE_STATE_TYPE_OR_SIZE');const fd=fs.openSync(this.stateFile,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));try{const opened=fs.fstatSync(fd);need(opened.ino===st.ino&&opened.dev===st.dev&&opened.size<=8192,'UPDATE_STATE_CHANGED');staged=JSON.parse(fs.readFileSync(fd,'utf8'))}finally{fs.closeSync(fd)}}
    return {mode:'verified-staging-only',configured:Boolean(this.channel.maintainerPublicKey),liveChannelConfigured:false,automaticPolling:false,
      installSupported:false,restartSupported:false,busy:this.busy,stage:staged,
      message:this.channel.maintainerPublicKey?'只驗證並暫存簽署更新；尚未安裝，不執行任何程式。':'尚未配置維護者公鑰／發佈通道；不連網、不假裝已有可用更新。'};
  }
  manifest(envelope){
    need(this.channel.maintainerPublicKey,'MAINTAINER_CHANNEL_NOT_CONFIGURED');
    need(envelope&&typeof envelope.payload==='string'&&Buffer.byteLength(envelope.payload)<=4096&&typeof envelope.signature==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature),'SIGNED_MANIFEST_REQUIRED');
    const key=createPublicKey(this.channel.maintainerPublicKey);need(key.asymmetricKeyType==='ed25519','ED25519_MAINTAINER_KEY_REQUIRED');
    need(verify(null,Buffer.from(envelope.payload),key,Buffer.from(envelope.signature,'base64')),'UPDATE_SIGNATURE_INVALID');
    const m=JSON.parse(envelope.payload);
    need(m.schema===1&&m.productId===this.channel.productId,'UPDATE_PRODUCT_MISMATCH');
    need(m.compatibility?.fromDSHCommit===this.currentDSHCommit&&m.compatibility.pluginApi==='dsh-0.2','UPDATE_INCOMPATIBLE');
    need(version.test(m.version)&&m.version.length<=64&&commit.test(m.targetDSHCommit),'UPDATE_VERSION_INVALID');
    need(m.review?.approved===true&&m.review.repository==='https://github.com/Ya-MiC/ymzz-zhanzhen'&&commit.test(m.review.commit),'MAINTAINER_REVIEW_REQUIRED');
    need(['full-dsh-app','reviewed-plugin-bundle'].includes(m.artifact?.kind)&&sha.test(m.artifact.sha256)&&Number.isSafeInteger(m.artifact.bytes)&&m.artifact.bytes>=4&&m.artifact.bytes<=2*1024**3,'UPDATE_ARTIFACT_INVALID');
    need(m.licenseAudit?.permissivePassed===true&&sha.test(m.licenseAudit.reportSHA256),'UPDATE_LICENSE_GATE_REQUIRED');
    return m;
  }
  save(state){
    fs.mkdirSync(this.directory,{recursive:true,mode:0o700});need(!fs.lstatSync(this.directory).isSymbolicLink(),'UPDATE_CACHE_LINK_FORBIDDEN');
    const temp=this.stateFile+'.'+randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(state),{flag:'wx',mode:0o600});fs.renameSync(temp,this.stateFile);
  }
  async stage({envelope,payloadPath,consent}){
    need(consent===true,'UPDATE_EXPLICIT_CONSENT_REQUIRED');need(!this.busy,'UPDATE_BUSY');
    const m=this.manifest(envelope); // Authentication precedes ANY selected-file read.
    need(typeof payloadPath==='string'&&path.isAbsolute(payloadPath)&&!payloadPath.startsWith('\\\\')&&/\.zip$/i.test(payloadPath),'UPDATE_PICK_LOCAL_ZIP');
    need(this.state().stage?.status!=='staged-not-installed','STAGED_UPDATE_PRESENT');
    const before=fs.lstatSync(payloadPath);need(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1&&before.size===m.artifact.bytes,'UPDATE_PAYLOAD_TYPE_OR_SIZE');
    this.busy=true;let input,output,temp;
    try{
      fs.mkdirSync(this.directory,{recursive:true,mode:0o700});need(!fs.lstatSync(this.directory).isSymbolicLink(),'UPDATE_CACHE_LINK_FORBIDDEN');
      const id=randomUUID();temp=path.join(this.directory,id+'.zip');input=fs.openSync(payloadPath,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
      const opened=fs.fstatSync(input);need(opened.ino===before.ino&&opened.dev===before.dev&&opened.nlink===1,'UPDATE_PAYLOAD_CHANGED');
      output=fs.openSync(temp,'wx',0o600);const h=createHash('sha256');let total=0;
      const end=Date.now()+60000;
      for await(const data of fs.createReadStream(payloadPath,{fd:input,autoClose:false,highWaterMark:65536})){
        need(Date.now()<end,'UPDATE_STAGE_TIMEOUT');const count=data.length;total+=count;need(total<=m.artifact.bytes,'UPDATE_PAYLOAD_SIZE');h.update(data);
        let offset=0;while(offset<count)offset+=await new Promise((resolve,reject)=>fs.write(output,data,offset,count-offset,(error,written)=>error?reject(error):written>0?resolve(written):reject(new Error('UPDATE_WRITE_FAILED'))));
      }
      need(total===m.artifact.bytes&&h.digest('hex')===m.artifact.sha256,'UPDATE_PAYLOAD_HASH_INVALID');fs.fsyncSync(output);
      const state={id,status:'staged-not-installed',version:m.version,artifactKind:m.artifact.kind,sha256:m.artifact.sha256,bytes:total,targetDSHCommit:m.targetDSHCommit,reviewCommit:m.review.commit,manifestSHA256:digest(envelope.payload),signatureVerified:true,licenseAuditSHA256:m.licenseAudit.reportSHA256,installed:false,restartSupported:false};
      this.save(state);temp=undefined;return state;
    }finally{if(input!==undefined)fs.closeSync(input);if(output!==undefined)fs.closeSync(output);if(temp&&fs.existsSync(temp))fs.unlinkSync(temp);this.busy=false;}
  }
  async rollback(consent){
    need(consent===true,'UPDATE_EXPLICIT_CONSENT_REQUIRED');need(!this.busy,'UPDATE_BUSY');const state=this.state().stage;
    need(state?.status==='staged-not-installed'&&/^[a-f0-9-]{36}$/.test(state.id),'NO_STAGED_UPDATE');
    const payload=path.join(this.directory,state.id+'.zip');const st=fs.lstatSync(payload);need(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1,'UPDATE_CACHE_LINK_FORBIDDEN');
    need(st.size===state.bytes,'STAGED_UPDATE_TAMPERED');this.busy=true;try{const h=createHash('sha256'),end=Date.now()+60000;let bytes=0;for await(const chunk of fs.createReadStream(payload)){need(Date.now()<end,'UPDATE_STAGE_TIMEOUT');bytes+=chunk.length;need(bytes<=state.bytes,'STAGED_UPDATE_TAMPERED');h.update(chunk)}need(bytes===state.bytes&&h.digest('hex')===state.sha256,'STAGED_UPDATE_TAMPERED');const after=fs.lstatSync(payload);need(after.ino===st.ino&&after.dev===st.dev&&!after.isSymbolicLink(),'UPDATE_CACHE_LINK_FORBIDDEN');fs.unlinkSync(payload);this.save({...state,status:'staging-rolled-back'});}finally{this.busy=false}
    return {rolledBackStaging:true,installedApplicationUntouched:true,originalSelectedFileUntouched:true};
  }
}
