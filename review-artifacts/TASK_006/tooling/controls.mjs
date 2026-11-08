import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const {send,evaluate:ev,key,click,close}=await connect();
const rows=[];
const wait=()=>new Promise(r=>setTimeout(r,250));
try{
 for(const d of['Runtime','Page'])await send(d+'.enable');
 for(const[v,port]of[['before',4321],['after',4322]])for(const width of[360,390,768,1024,1440])for(const theme of['light','dark']){
  await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/index.html?preview=1'});
  for(let n=0;n<100;n++){if(await ev("typeof state!=='undefined' && !!state && document.querySelectorAll('.list-course-card').length>0"))break;await wait()}
  await ev('state.settings.theme='+JSON.stringify(theme)+';renderAll();window.a=[...document.querySelectorAll(".list-course-card .stream-category-trigger")];true');
  const row={version:v,width,theme,checks:[],roadmap:await ev("({cards:document.querySelectorAll('#roadmapWrapper .course-card').length,streams:document.querySelectorAll('#roadmapWrapper .stream-category-trigger').length})")};rows.push(row);
  for(const index of[0,1,-1]){
   await ev('closeStreamCategoryTooltips();window.t=a.at('+index+');t.scrollIntoView({block:"center",behavior:"instant"});true');await wait();
   await ev('t.focus({preventScroll:true})');await key('Enter');await key('Tab');
   assert(await ev("document.activeElement.matches('[data-stream-see-more]')"));
   const geometry=await ev("(()=>{const e=document.querySelector('[data-stream-open]'),b=e.getBoundingClientRect(),h=document.querySelector('.site-header').getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,headerBottom:h.bottom,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,field:t.dataset.curriculumField,parent:e.parentElement.tagName,role:e.getAttribute('role'),controls:t.getAttribute('aria-controls')===e.id}})()");
   assert(geometry.left>=0&&geometry.right<=geometry.client+.5&&geometry.top>=0&&geometry.bottom<=1000);
   assert.equal(geometry.client,geometry.scroll);assert.equal(geometry.parent,'BODY');assert.equal(geometry.role,'group');assert.equal(geometry.controls,true);
   await key('Escape');
   assert(await ev("!document.querySelector('[data-stream-open]') && document.activeElement===t"));
   await key('Enter');
   await click({x:2,y:500});
   assert(await ev("!document.querySelector('[data-stream-open]')"));
   row.checks.push({index,geometry,escapeRestoresFocus:true,outsideCloses:true});
  }
  await ev('window.t=a[0];t.scrollIntoView({block:"center",behavior:"instant"});true');await wait();
  await ev('t.focus({preventScroll:true})');await key('Enter');
  await ev('a[1].focus({preventScroll:true})');await key('Enter');
  assert(await ev("a[0].getAttribute('aria-expanded')==='false' && a[1].getAttribute('aria-expanded')==='true' && document.querySelectorAll('[data-stream-open]').length===1"));
  row.multipleBadges=true;await key('Escape');
  console.log(v,width,theme);
 }
 fs.writeFileSync(path.join(process.argv[2],'controls.json'),JSON.stringify(rows,null,2)+'\n');
}finally{close()}
