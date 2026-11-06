import {connect} from './cdp.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('evidence/screenshots',{recursive:true});
const c=await connect(),results=[],comparisons=[];let checks=0;
const e=x=>c.evaluate(x);
const check=(v,msg)=>{assert(v,msg);checks++};
const wait=async expression=>{for(let i=0;i<100;i++){if(await e(expression))return;await new Promise(r=>setTimeout(r,40))}throw Error('Wait failed: '+expression)};
const openModal=async id=>{await e(`document.querySelector('#openSettingsBtn').focus();${id==='settingsModal'?`document.querySelector('#openSettingsBtn').click()` : id==='dashboardModal'?'renderDashboardModal(true)':id==='courseModal'?'openCourseModal("CSE110")':'openDepartmentModal("CSE")'};true`);};
const rects=`(()=>{const m=document.querySelector('.modal-backdrop:not([hidden])'),p=m.querySelector('.modal-panel');const box=n=>{const r=n.getBoundingClientRect();const s=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,background:s.backgroundColor,border:s.border,radius:s.borderRadius,shadow:s.boxShadow,font:s.fontFamily}};return {host:box(m),panel:box(p),pageY:scrollY,modalScroll:m.scrollTop}})()`;
try{
 for(const width of [390,1440])for(const theme of ['light','dark'])for(const [variant,port]of [['original',4280],['option-a',4281],['native',4282]]){
  await c.open(port,width,theme);await e('document.fonts.ready.then(()=>true)');
  for(const id of ['settingsModal','dashboardModal','courseModal','departmentModal']){
   await openModal(id);
   const initial=await e(`({focus:document.activeElement.id||document.activeElement.getAttribute('data-close-modal')||document.activeElement.tagName,inside:document.getElementById('${id}').contains(document.activeElement),tag:document.getElementById('${id}').tagName,open:document.getElementById('${id}').open,hidden:document.getElementById('${id}').hidden})`);
   const row={variant,width,theme,id,initial};
   if(variant!=='original'){
    check(initial.inside,variant+' initial focus '+id);
    await e(`document.querySelector('#openDashboardBtn').focus();true`);
    check(await e(`document.getElementById('${id}').contains(document.activeElement)`),'background focus prevented');
    const sequence=[];const n=await e(`(()=>{const m=document.getElementById('${id}');return [...m.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(x=>!x.closest('[hidden]')&&x.getClientRects().length).length})()`);
    for(let i=0;i<n+3;i++){await c.key('Tab');const x=await e(`({inside:document.getElementById('${id}').contains(document.activeElement),focus:document.activeElement.id||document.activeElement.getAttribute('data-close-modal')||document.activeElement.tagName})`);sequence.push(x);check(x.inside,variant+' Tab containment '+id)}
    for(let i=0;i<3;i++){await c.key('Tab',8);check(await e(`document.getElementById('${id}').contains(document.activeElement)`),'Shift Tab containment')}
    row.focusSequence=sequence;
    if(variant==='native'){
     check(initial.tag==='DIALOG'&&initial.open,'native showModal open state');
     check(await e(`document.getElementById('${id}').matches(':modal')`),'native top layer');
     check(await e(`!!document.getElementById('${id}').getAttribute('aria-label')`),'native accessible name');
    }
   }else row.baselineFocusDefect=!initial.inside;
   // Identical screenshot state: Grade Scale for Settings, focused close button,
   // same content/zoom/viewport/pointer, no D assets or B/C changes.
   if(id==='settingsModal')await e(`document.querySelector('[data-tab=gradeEditor]').click();true`);
   await e(`document.getElementById('${id}').scrollTop=0;document.querySelector('#${id} [data-close-modal]').focus();true`);
   await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
   await new Promise(r=>setTimeout(r,180));
   row.geometry=await e(rects);
   const file=`${variant}-${id}-${width}-${theme}.png`;row.screenshot='screenshots/'+file;
   const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('evidence/screenshots/'+file,Buffer.from(shot.data,'base64'));
   const ax=await c.send('Accessibility.getFullAXTree');row.accessibility=ax.nodes.filter(n=>n.role?.value==='dialog').map(n=>({role:n.role.value,name:n.name?.value,modal:n.properties?.find(x=>x.name==='modal')?.value?.value}));
   await c.key('Escape');await wait(`document.getElementById('${id}').hidden`);
   if(variant!=='original')check(await e('document.activeElement.id')==='openSettingsBtn','focus restored');
   if(variant==='native')check(await e(`!document.getElementById('${id}').open`),'closed has no native open attribute');
   results.push(row);
  }
  if(variant!=='original'){
   await openModal('settingsModal');await e(`document.querySelector('[data-tab=facultyEditor]').focus();true`);
   for(const [key,target]of [['End','cloudEditor'],['Home','facultyEditor'],['ArrowRight','degreePlanEditor'],['ArrowLeft','facultyEditor']]){await c.key(key);check(await e('document.activeElement.dataset.tab')===target,'Settings '+key)}
   check(await e(`document.querySelectorAll('#settingsModal [role=tab][aria-selected=true]').length`)==1,'one selected tab');
   await c.key('Escape');
   await openModal('dashboardModal');
   // Actual support trigger, without submitting credentials or cloud requests.
   await e(`document.querySelector('#dashboardModal [data-open-support]').click();true`);await wait(`document.querySelector('#supportDialog').open`);
   await new Promise(r=>setTimeout(r,150));await c.key('Escape');await wait(`!document.querySelector('#supportDialog').open`);
   check(await e(`!document.getElementById('dashboardModal').hidden`),'nested Escape leaves parent');
   check(await e(`document.getElementById('dashboardModal').contains(document.activeElement)`),'nested focus return');
   await c.key('Escape');await wait(`document.getElementById('dashboardModal').hidden`);
  }
  if(variant==='native'){
   // Native cancel/external close/idempotence/race and real pointer close routes.
   await e(`window.__closeEvents=0;window.__resets=0;window.__realReset=resetDashboardProfileDraft;resetDashboardProfileDraft=()=>{window.__resets++;return window.__realReset()};document.getElementById('dashboardModal').addEventListener('close',()=>window.__closeEvents++);true`);
   await openModal('dashboardModal');await e(`closeModal('dashboardModal');closeModal('dashboardModal');true`);await wait('window.__closeEvents===1');check(await e('window.__resets')===1,'one dashboard cleanup for duplicate close calls');
   await openModal('dashboardModal');await e(`document.getElementById('dashboardModal').close();true`);await wait(`document.getElementById('dashboardModal').hidden`);check(await e('window.__resets')===2,'external native close cleaned once');
   await openModal('settingsModal');await e(`closeModal('settingsModal');openModal('settingsModal');true`);await new Promise(r=>setTimeout(r,100));check(await e(`document.getElementById('settingsModal').open&&!document.getElementById('settingsModal').hidden`),'queued old close cannot hide reopened modal');
   await c.key('Escape');await wait(`document.getElementById('settingsModal').hidden`);
   for(const [route,x,y]of [['backdrop',2,2],['close',null,null]]){
    await openModal('settingsModal');const pt=x===null?await e(`(()=>{const r=document.querySelector('#settingsModal [data-close-modal]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`):{x,y};
    for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,x:pt.x,y:pt.y,button:'left',clickCount:1});await wait(`document.getElementById('settingsModal').hidden`);check(true,'pointer '+route);
   }
   // Memory-only fixture calls through the unchanged save routines. No persistence.
   for(const [modal,fn]of [['courseModal','saveCourseFromForm'],['departmentModal','saveDepartmentFromForm']]){
    await openModal(modal);await e(`window.__saved=0;window.__oldPersist=persist;persist=()=>window.__saved++;${fn}(document.querySelector('#${modal} form'));true`);await wait(`document.getElementById('${modal}').hidden`);check(await e('window.__saved')===1,'synthetic '+fn+' closes then calls mocked persistence once');await e('persist=window.__oldPersist;true');
   }
   check(await e(`document.body.style.overflow===''`),'body overflow restored');
  }
  const errors=c.events.filter(x=>x.method==='Runtime.exceptionThrown').map(x=>x.params.exceptionDetails.text);
  check(errors.length===0,'no JS runtime exceptions '+variant);comparisons.push({variant,width,theme,consoleExceptions:errors});
 }
 fs.writeFileSync('evidence/browser-results.json',JSON.stringify({checks,groups:results.length,results,comparisons},null,2));console.log('PASS browser: '+checks+' assertions, '+results.length+' three-way modal/theme/viewport groups and screenshots.');
}catch(error){fs.writeFileSync('evidence/browser-failure.json',JSON.stringify({message:error.message,checks,results},null,2));throw error}finally{c.close()}
