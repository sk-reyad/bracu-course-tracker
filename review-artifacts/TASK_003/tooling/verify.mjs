import {connect} from './cdp.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const c=await connect(),out=new URL('./evidence/',import.meta.url);fs.mkdirSync(out,{recursive:true});fs.mkdirSync(new URL('screenshots/',out),{recursive:true});
const resume=process.argv.includes('--continue-r023'),screensOnly=process.argv.includes('--screenshots-only');
const prior=resume||screensOnly?JSON.parse(fs.readFileSync(new URL(screensOnly?'browser-results.json':'hover-coordinate-harness-run.json',out),'utf8')):null;
const rows=prior?prior.rows.filter(r=>screensOnly||r.variant==='demo-b'):[],shots=[],errors=prior?.errors||[],failures=[];
const ev=c.evaluate;
const settle=()=>ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function click(x,y){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await settle()}
async function key(k){if(!['Enter',' '].includes(k))return c.key(k);const code=k==='Enter'?'Enter':'Space',n=k==='Enter'?13:32;await c.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:k,code,windowsVirtualKeyCode:n});await c.send('Input.dispatchKeyEvent',{type:'char',key:k,code,text:k==='Enter'?'\r':' ',windowsVirtualKeyCode:n});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code,windowsVirtualKeyCode:n});await settle()}
const active=()=>ev('document.activeElement?.className');
async function select(index=0){await ev(`window.t=[...document.querySelectorAll('.list-course-card .stream-category-trigger')].at(${index});t.scrollIntoView({block:'center',behavior:'instant'});true`);await settle();await new Promise(r=>setTimeout(r,450));return ev(`(()=>{const b=t.closest('.stream-category').getBoundingClientRect(),a=t.getBoundingClientRect(),s=getComputedStyle(t),badge=getComputedStyle(t.closest('.badge'));return {badge:{x:b.x,y:b.y,w:b.width,h:b.height},target:{x:a.x,y:a.y,w:a.width,h:a.height},field:t.dataset.curriculumField,course:t.closest('article').querySelector('strong').textContent,label:t.textContent,color:s.color,font:s.font,background:badge.backgroundColor,border:badge.borderColor,role:t.tagName,type:t.type,nested:!!t.querySelector('button,a,input'),tabIndex:t.tabIndex}})()`)}
const opened=()=>ev('t.getAttribute("aria-expanded")==="true"');
async function screenshot(name){await settle();const r=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(new URL('screenshots/'+name+'.png',out),Buffer.from(r.data,'base64'));shots.push(name)}
try{
 for(const [variant,port] of (screensOnly?[]:resume?[['r023',4292]]:[['demo-b',4291],['r023',4292]]))for(const theme of ['light','dark'])for(const width of [360,390,768,1024,1280,1440]){
  await c.open(port,width,theme);const geometry=await select();const row={variant,theme,width,geometry,pointer:[],checks:{}};rows.push(row);
  assert(geometry.target.w>=24&&geometry.target.h>=24);assert.equal(geometry.nested,false);assert.equal(geometry.role,'BUTTON');
  await ev('window.activations=0;window.originalOpen=openStreamCategoryTooltip;openStreamCategoryTooltip=function(t){activations++;return originalOpen(t)}');
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:geometry.badge.x+geometry.badge.w/2,y:geometry.badge.y+geometry.badge.h/2});
  await new Promise(r=>setTimeout(r,250));
  const b=await ev('(()=>{const b=t.closest(".badge").getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}})()');
  const points=[['center',.5,.5],['left',.025,.5],['right',.975,.5],['top',.5,.025],['bottom',.5,.975],['left-padding',.07,.5],['right-padding',.93,.5]];
  for(const [name,fx,fy] of points){await ev('closeStreamCategoryTooltips();activations=0;document.activeElement.blur();true');const x=b.x+b.w*fx,y=b.y+b.h*fy;const hit=await ev(`document.elementFromPoint(${x},${y})?.closest('.stream-category-trigger')===t`);await click(x,y);const isOpen=await opened(),n=await ev('activations');row.pointer.push({name,x,y,hit,opened:isOpen,activations:n});assert.equal(isOpen,hit);assert.equal(n,hit?1:0);if(variant==='r023')assert(isOpen,name);}
  await ev('closeStreamCategoryTooltips();true');
  for(const k of ['Enter',' ']){await c.key('Tab');await ev('t.focus({preventScroll:true});true');await key(k);assert(await opened(),k);await c.key('Escape');assert(!(await opened()));assert((await active()).includes('stream-category-trigger'));}row.checks.enterSpaceEscape=true;
  await ev('t.focus({preventScroll:true});true');await key('Enter');await c.key('Tab');assert((await active()).includes('stream-see-more'));await c.key('Tab',8);assert((await active()).includes('stream-category-trigger'));assert.notEqual(await ev('getComputedStyle(t).boxShadow'),'none');row.checks.tabShiftTabFocusVisible=true;
  await c.key('Tab');await key('Enter');assert.equal(await ev('document.querySelector("#curriculumFieldFilter").value'),geometry.field);assert.equal(await ev('document.activeElement.id'),'curriculumFieldFilter');assert.equal(await ev('!!document.querySelector("[data-stream-open]")'),false);row.checks.seeMoreKeyboardFilterFocus=true;
  // Complete smooth scrolling before the next real pointer interaction.
  await new Promise(r=>setTimeout(r,700));await ev('document.querySelector("#curriculumFieldFilter").value="all";renderCourseList();true');await select();
  await ev('t.focus();true');await key('Enter');await c.key('Tab');const more=await ev('(()=>{const b=document.activeElement.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()');await click(more.x,more.y);assert.equal(await ev('document.activeElement.id'),'curriculumFieldFilter');assert.equal(await ev('document.querySelector("#curriculumFieldFilter").value'),geometry.field);row.checks.seeMorePointer=true;
  await new Promise(r=>setTimeout(r,700));await ev('document.querySelector("#curriculumFieldFilter").value="all";renderCourseList();true');await select();await ev('t.focus();true');await key('Enter');await click(1,500);assert(!(await opened()));row.checks.outsideClick=true;
  const edges=[];
  for(const idx of [0,-1]){await ev('closeStreamCategoryTooltips();true');await select(idx);await ev('t.focus();true');await key('Enter');const r=await ev('(()=>{const p=document.querySelector("[data-stream-open]"),b=p.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,root:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,controls:t.getAttribute("aria-controls"),id:p.id,role:p.getAttribute("role"),label:p.getAttribute("aria-label"),parent:p.parentElement.tagName}})()');assert(r.left>=0&&r.right<=width+.5&&r.top>=0&&r.bottom<=1000.5);assert(r.root<=r.client);assert.equal(r.controls,r.id);assert.equal(r.role,'group');assert(r.label);assert.equal(r.parent,'BODY');edges.push(r);await c.key('Escape')};row.edges=edges;
  // Adjacent badges in the same card: opening the second closes the first.
  await select();const adjacent=await ev('(()=>{const a=[...document.querySelectorAll(".list-course-card .stream-category-trigger")];return a.findIndex((t,i)=>i&&t.closest("article")===a[i-1].closest("article"))})()');
  const index=adjacent>0?adjacent:1;await select(index-1);await ev('window.first=t;t.focus();true');await key('Enter');await select(index);await ev('t.focus();true');await key('Enter');assert.equal(await ev('first.getAttribute("aria-expanded")'),'false');assert.equal(await ev('document.querySelectorAll("[data-stream-open]").length'),1);row.checks.multipleBadges={sameCard:adjacent>0};await c.key('Escape');
  // Actual scroll and resize dismissal, plus long content bounds.
  await select();await ev('t.focus();true');await key('Enter');await ev('scrollBy(0,20);true');await settle();assert(!(await opened()));row.checks.scrollDismiss=true;
  await select();await ev('t.nextElementSibling.querySelector("strong").textContent += " Long curriculum label".repeat(30);t.focus();true');await key('Enter');const long=await ev('(()=>{const b=document.querySelector("[data-stream-open]").getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom,root:document.documentElement.scrollWidth}})()');assert(long.left>=0&&long.right<=width+.5&&long.top>=0&&long.bottom<=1000.5&&long.root<=width);row.long=long;
  await c.send('Emulation.setDeviceMetricsOverride',{width:width+1,height:1000,deviceScaleFactor:1,mobile:false});await settle();assert(!(await opened()));row.checks.resizeDismiss=true;
  const bad=c.events.filter(e=>e.method==='Runtime.exceptionThrown'||e.method==='Runtime.consoleAPICalled'&&e.params.type==='error');errors.push(...bad.map(e=>({variant,theme,width,...e})));console.log('PASS',variant,theme,width);
 }
 // Matched visual evidence: identical course, dimensions, data, theme, state.
 for(const [variant,port] of [['original',4290],['demo-b',4291],['r023',4292]])for(const theme of ['light','dark'])for(const width of [390,1440]){
  await c.open(port,width,theme);await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});const g=await select();await ev('document.activeElement.blur();true');await screenshot(`${variant}-${width}-${theme}-closed`);
  await c.key('Tab');await select();await ev('t.focus({preventScroll:true});true');assert(await ev('t.getBoundingClientRect().top>180&&t.getBoundingClientRect().bottom<1000'));await screenshot(`${variant}-${width}-${theme}-focus`);
  await key('Enter');await screenshot(`${variant}-${width}-${theme}-open`);
  if(variant!=='original'){await c.key('Tab');await key('Enter')}else{const r=await ev('(()=>{const b=t.nextElementSibling.querySelector("button").getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}})()');await click(r.x,r.y)}
  await new Promise(r=>setTimeout(r,700));await screenshot(`${variant}-${width}-${theme}-see-more`);console.log('SCREENSHOTS',variant,theme,width,g.course,g.label);
 }
}catch(e){failures.push({message:e.message,stack:e.stack});console.error(e);process.exitCode=1}finally{fs.writeFileSync(new URL('browser-results.json',out),JSON.stringify({browser:await c.send('Browser.getVersion'),rows,shots,errors,failures},null,2));c.close()}
