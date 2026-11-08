import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';

const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'evidence');
for(const d of ['traces','screenshots','captures'])fs.mkdirSync(path.join(out,d),{recursive:true});
const save=(f,v)=>fs.writeFileSync(path.join(out,f),JSON.stringify(v,null,2)+'\n');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const c=await connect(),{send,evaluate:ev,key,click}=c;
let context='',frames;
const diagnostics=[];
c.on('Log.entryAdded',({entry})=>{if(['error','warning'].includes(entry.level))diagnostics.push({context,kind:entry.level,text:entry.text,url:entry.url})});
c.on('Runtime.exceptionThrown',({exceptionDetails:e})=>diagnostics.push({context,kind:'exception',text:e.exception?.description||e.text}));
c.on('Runtime.consoleAPICalled',e=>{if(['error','warning'].includes(e.type))diagnostics.push({context,kind:e.type,text:e.args.map(a=>a.value??a.description).join(' ')})});
c.on('Page.screencastFrame',e=>{if(frames)frames.push({time:e.metadata.timestamp,jpeg:e.data});void send('Page.screencastFrameAck',{sessionId:e.sessionId})});
async function until(expr){for(let n=0;n<180;n++){if(await ev(expr))return;await pause(40)}throw Error(context+' timeout '+expr)}
async function shot(name){
 const filename=name.replace('-0-center-single','').replace('-no-preference','-normal').replace('-intermediate','-mid').replace('-programmatic','-script');
 const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(path.join(out,'screenshots',filename+'.png'),Buffer.from(data,'base64'));
}
function install(){
 let run;
 const active=()=>document.activeElement?.id||document.activeElement?.className||document.activeElement?.tagName;
 const now=()=>Math.round((performance.now()-run.start)*100)/100;
 const rect=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
 const codes=()=>[...document.querySelectorAll('.list-course-card .list-top strong')].map(e=>e.textContent.replace(/\s/g,''));
 const snap=()=>{
  const f=document.getElementById('curriculumFieldFilter'),s=document.getElementById('courses'),h=document.querySelector('.site-header'),pop=document.querySelector('[data-stream-open]');
  return{y:scrollY,active:active(),value:f.value,codes:codes(),filter:rect(f),section:rect(s),header:rect(h),open:!!pop,tooltip:pop?rect(pop):null,root:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,focusVisible:document.activeElement?.matches(':focus-visible'),theme:document.documentElement.dataset.theme,reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,rootBehavior:getComputedStyle(document.documentElement).scrollBehavior};
 };
 const scroll=Element.prototype.scrollIntoView;
 Element.prototype.scrollIntoView=function(...args){
  if(!run)return scroll.apply(this,args);
  const call={ms:now(),target:this.id,args,before:scrollY,sectionBefore:rect(document.getElementById('courses'))};
  const result=scroll.apply(this,args);call.after=scrollY;call.returnMs=now();run.scrolls.push(call);return result;
 };
 const focus=HTMLElement.prototype.focus;
 HTMLElement.prototype.focus=function(...args){
  if(!run)return focus.apply(this,args);
  const item={ms:now(),target:this.id||this.className,args,before:scrollY};
  const result=focus.apply(this,args);item.after=scrollY;item.active=active();run.focusCalls.push(item);return result;
 };
 const scrollTo=window.scrollTo;
 window.scrollTo=function(...args){if(run)run.windowScrolls.push({ms:now(),args});return scrollTo.apply(this,args)};
 const open=openCurriculumField;
 openCurriculumField=function(...args){if(run)run.actions.push({ms:now(),args});return open.apply(this,args)};
 const render=renderCourseList;
 renderCourseList=function(...args){if(run)run.renders++;return render.apply(this,args)};
 for(const type of ['keydown','keyup','click','pointerdown','focusin','focusout'])document.addEventListener(type,e=>{
  if(run)run.events.push({ms:now(),type,target:e.target.closest?.('button')?.getAttribute('data-stream-see-more')!==null&&e.target.closest?.('[data-stream-see-more]')?'see-more':e.target.id||e.target.className,key:e.key,trusted:e.isTrusted,detail:e.detail,pointerType:e.pointerType,active:active()});
 },true);
 window.probe={
  snap,rect,
  reset(){closeStreamCategoryTooltips();document.getElementById('curriculumFieldFilter').value='all';renderCourseList()},
  begin(){
   run={start:performance.now(),initial:snap(),events:[],scrolls:[],focusCalls:[],windowScrolls:[],actions:[],renders:0,positions:[]};
   const current=run;
   function sample(){if(current!==run)return;run.positions.push({ms:now(),y:scrollY,active:active(),open:!!document.querySelector('[data-stream-open]')});requestAnimationFrame(sample)}
   sample();
  },
  finish(){const r={...run,final:snap()};run=undefined;return r},
  expected(field){return state.courses.filter(c=>BracuCatalog.matchesCurriculumField(c.category,field)).map(c=>c.code.replace(/\s/g,'')).sort()}
 };
}
async function load(v,port){
 context=v+'-load';
 await send('Page.bringToFront');
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/index.html?preview=1'});
 await until("typeof state!=='undefined' && !!state && document.querySelectorAll('.list-course-card').length>0");
 await ev('('+install.toString()+')()');
}
async function select(index=0,edge=false){
 await ev("probe.reset();window.t=[...document.querySelectorAll('.list-course-card .stream-category-trigger')].at("+index+");t.scrollIntoView({block:'center',behavior:'instant'});true");
 await pause(300);
 if(edge) {
  await ev("window.scrollTo({top:scrollY+t.getBoundingClientRect().top-240,behavior:'instant'})");
  await pause(200);
 }
 return ev("({field:t.dataset.curriculumField,label:t.textContent,course:t.closest('article').querySelector('strong').textContent,rect:probe.rect(t)})");
}
async function open(input='Enter'){
 if(input==='pointer'){
  const r=await ev('probe.rect(t)');await click({x:r.x+r.w/2,y:r.y+r.h/2});
 }else {await ev('t.focus({preventScroll:true})');await key('Enter');await key('Tab')}
 await until("!!document.querySelector('[data-stream-open]')");
 if(input!=='pointer')assert(await ev("document.activeElement.matches('[data-stream-see-more]')"),context+' keyboard bridge');
 await pause(100);
}
async function activate(v,w,theme,motion,input,index=0,edge=false,rapid=false){
 context=[v,w,theme,motion,input,index,edge?'edge':'center',rapid?'repeat':'single'].join('-');
 const selected=await select(index,edge);
 await open(input);
 const expected=await ev('probe.expected('+JSON.stringify(selected.field)+')');
 const illustrated=[390,1440].includes(w)&&index===0&&!rapid&&((theme==='light'&&motion==='no-preference')||(theme==='dark'&&motion==='reduce'));
 const film=illustrated&&w===390&&theme==='light';
 if(illustrated)await shot(context+'-initial');
 if(film){frames=[];await send('Page.startScreencast',{format:'jpeg',quality:70,maxWidth:390,maxHeight:1000,everyNthFrame:1});await pause(130)}
 await ev('probe.begin()');
 if(input==='pointer'){
  const r=await ev("probe.rect(document.querySelector('[data-stream-open] [data-stream-see-more]'))");await click({x:r.x+r.w/2,y:r.y+r.h/2});
 }else if(input==='programmatic')await ev("document.querySelector('[data-stream-open] [data-stream-see-more]').click()");
 else {await key(input);if(rapid){await key(input);await key(input)}}
 if(illustrated){await pause(100);await shot(context+'-intermediate')}
 await pause(1000);
 const result=await ev('probe.finish()');
 if(film){await send('Page.stopScreencast');save('captures/'+v+'-'+input+'.json',frames);frames=undefined}
 if(illustrated)await shot(context+'-final');
 await key('Tab');
 const nextTab=await ev("({active:document.activeElement.id||document.activeElement.className,y:scrollY})");
 return{id:context,version:v,width:w,theme,motion,input,index,edge,rapid,selected,expected,...result,nextTab};
}
try{
 for(const d of ['Runtime','Page','Log'])await send(d+'.enable');
 save('browser.json',await send('Browser.getVersion'));
 for(const[v,port]of[['before',4321],['after',4322]]){
  await load(v,port);
  for(const w of[360,390,768,1024,1440]){
   await send('Emulation.setDeviceMetricsOverride',{width:w,height:1000,deviceScaleFactor:1,mobile:false});
   const rows=[];
   for(const theme of['light','dark']){
    await ev('state.settings.theme='+JSON.stringify(theme)+';renderAll();true');
    for(const motion of['no-preference','reduce']){
     await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:motion}]});
     for(const input of['pointer','Enter','Space'])rows.push(await activate(v,w,theme,motion,input));
     if(w===1440&&theme==='dark'){
      rows.push(await activate(v,w,theme,motion,'programmatic'));
      rows.push(await activate(v,w,theme,motion,'Enter',0,false,true));
      rows.push(await activate(v,w,theme,motion,'Enter',-1,true));
     }
    }
   }
   save('traces/'+v+'-'+w+'.json',rows);console.log(v,w,rows.length);
  }
 }
}finally{save('diagnostics.json',diagnostics);c.close()}
