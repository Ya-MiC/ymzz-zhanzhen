// MIT. Genuine DSH browser plugin: fill the EXISTING sidebar slots, never rearrange its layout.
import {createElement as h} from 'react';
export const inject=['slots'];
export function apply(ctx){
  const Mark=({size=24})=>h('img',{src:globalThis.__YMZZ_DSH_BRAND__,alt:'湛箴_ymzz',width:size,height:size,style:{borderRadius:6,objectFit:'contain'}});
  const Name=()=>h('span',null,'湛箴_ymzz');
  const Tools=()=>h('button',{type:'button','aria-label':'湛箴_ymzz 插件與驗證閘',onClick:()=>globalThis.dispatchEvent(new Event('ymzz-open-plugin')),style:{minHeight:44,minWidth:44}},'湛箴_ymzz 插件');
  ctx.slots.inject('sidebar.brand.mark',()=>ctx.slots.inject('sidebar.brand.name',function*(){yield ctx.slots.register({name:'sidebar.brand.mark'},Mark);yield ctx.slots.register({name:'sidebar.brand.name'},Name)}));
  ctx.slots.inject('sidebar.footer.action',()=>ctx.slots.register({name:'sidebar.footer.action',id:'ymzz-reviewed-tools'},Tools));
  ctx.effect(()=>{globalThis.__YMZZ_NATIVE_SLOT_READY__=true;globalThis.dispatchEvent(new Event('ymzz-native-slot-ready'));return()=>{globalThis.__YMZZ_NATIVE_SLOT_READY__=false;globalThis.dispatchEvent(new Event('ymzz-native-slot-ready'))}},'ymzz: actual native sidebar slot lifecycle');
}
