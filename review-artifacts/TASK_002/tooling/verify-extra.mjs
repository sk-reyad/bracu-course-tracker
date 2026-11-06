import {connect} from './cdp.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const c=await connect(),results=[];const e=x=>c.evaluate(x);let assertions=0;
const check=(v,m)=>{assert(v,m);assertions++};
try{
 for(const [variant,port]of [['original',4280],['option-a',4281],['native',4282]]){
  await c.open(port,390,'light');await e(`document.querySelector('#openSettingsBtn').focus();openModal('settingsModal');document.querySelector('[data-tab=gradeEditor]').click();showToast('Synthetic validation feedback');true`);
  for(let i=0;i<30;i++){if(await e(`Number(getComputedStyle(document.getElementById('toast')).opacity)>.99`))break;await new Promise(r=>setTimeout(r,40));}
  const toast=await e(`(()=>{const t=document.getElementById('toast'),r=t.getBoundingClientRect();return {parent:t.parentElement.id,shown:t.classList.contains('show'),opacity:getComputedStyle(t).opacity,role:t.getAttribute('role'),text:t.textContent,withinViewport:r.top>=0&&r.bottom<=innerHeight}})()`);
  if(!(toast.shown&&toast.withinViewport&&Number(toast.opacity)>.99))console.log({variant,toast});
  check(toast.shown&&toast.withinViewport&&Number(toast.opacity)>.99,'visible toast '+variant);if(variant==='native')check(toast.parent==='settingsModal','toast in native top layer');
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`evidence/screenshots/${variant}-toast-390-light.png`,Buffer.from(shot.data,'base64'));
  const before=await e(`({bodyY:scrollY,modalY:document.getElementById('settingsModal').scrollTop})`);await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:160,y:500,deltaX:0,deltaY:600});await new Promise(r=>setTimeout(r,150));
  const after=await e(`({bodyY:scrollY,modalY:document.getElementById('settingsModal').scrollTop})`);check(after.modalY>before.modalY,'modal actually scrolls '+variant);if(variant!=='original')check(after.bodyY===before.bodyY,'background scroll frozen '+variant);
  await e(`closeModal('settingsModal');true`);if(variant==='native')check(await e(`document.getElementById('toast').parentElement===document.body`),'toast returned home');
  results.push({variant,toast,scroll:{before,after}});
 }
 for(const fallback of [false,true]){
  await c.open(4282,390,'dark');await e(`window.__events=[];for(const id of ['dashboardModal','supportDialog'])for(const type of ['cancel','close'])document.getElementById(id).addEventListener(type,e=>window.__events.push({type,id,cancelable:e.cancelable}));document.querySelector('#openSettingsBtn').focus();renderDashboardModal(true);document.querySelector('#dashboardModal [data-open-support]').click();true`);await new Promise(r=>setTimeout(r,400));
  if(fallback)await e(`document.getElementById('supportDialog').requestClose=undefined;true`);
  await c.key('Escape');await new Promise(r=>setTimeout(r,100));
  const nested=await e(`({events:window.__events,parentOpen:document.getElementById('dashboardModal').open,childOpen:document.getElementById('supportDialog').open,focusedInsideParent:document.getElementById('dashboardModal').contains(document.activeElement)})`);
  check(nested.parentOpen&&!nested.childOpen&&nested.focusedInsideParent,'nested parent retained '+fallback);check(nested.events.filter(e=>e.type==='close'&&e.id==='supportDialog').length===1,'one child close '+fallback);check(nested.events.filter(e=>e.id==='dashboardModal').length===0,'no parent cancellation '+fallback);
  await c.key('Escape');await new Promise(r=>setTimeout(r,100));check(await e(`document.getElementById('dashboardModal').hidden`),'next Escape closes parent '+fallback);
  results.push({fallbackRequestClose:fallback,nested});
 }
 fs.writeFileSync('evidence/advanced-browser.json',JSON.stringify({assertions,results},null,2));console.log('PASS advanced browser: '+assertions+' assertions; toast, wheel scrolling, nested native cancel and fallback.');
}finally{c.close()}
