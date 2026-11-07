// Run after measure.mjs against the same isolated preview server and fresh Chrome profile.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const out = process.argv[2];
if (!out) throw Error('Usage: node control.mjs <existing-evidence-directory>');
const {send,evaluate,click,on,close} = await connect();
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
const results=[];
try {
  await send('Page.enable');
  await send('Runtime.enable');
  for (const [version, port] of [['before',4310],['after',4311]]) {
    const errors=[];
    on('Runtime.exceptionThrown', e=>errors.push(e.exceptionDetails.text));
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:800,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/index.html?preview=1'});
    for(let i=0;i<100;i++) {
      if(await evaluate("document.querySelectorAll('.course-card').length > 0"))break;
      await delay(100);
    }
    const lifecycle=[];
    for(const y of [0,359,360,361,700,360,0]) {
      // Re-apply the instant test position after any initial asynchronous layout.
      for (let attempt=0; attempt<4; attempt++) {
        await evaluate("window.scrollTo({top:"+y+",behavior:'instant'})");
        await delay(250);
        if (await evaluate('scrollY') === y) break;
      }
      const sample=await evaluate("({y:scrollY,threshold:Math.max(360,innerHeight*.45),visible:backToTopBtn.classList.contains('is-visible'),visibility:getComputedStyle(backToTopBtn).visibility})");
      lifecycle.push(sample);
      assert.equal(sample.y,y);
      assert.equal(sample.visible,y>sample.threshold);
      assert.equal(sample.visibility,sample.visible?'visible':'hidden');
    }
    await evaluate("window.testCalls=[];window.testClicks=[];const original=window.scrollTo;window.scrollTo=function(...a){testCalls.push(a);return original.apply(window,a)};document.addEventListener('click',e=>testClicks.push({button:e.target.closest('button')?.id,trusted:e.isTrusted}),true)");
    const center=await evaluate("(()=>{const r=openDashboardBtn.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await click(center);
    await delay(200);
    const dashboard=await evaluate("({open:!dashboardModal.hidden,calls:testCalls,clicks:testClicks})");
    assert.equal(dashboard.open,true);
    assert.deepEqual(dashboard.calls,[]);
    assert.deepEqual(dashboard.clicks,[{button:'openDashboardBtn',trusted:true}]);
    assert.deepEqual(errors,[]);
    results.push({version,lifecycle,dashboard,errors});
  }
  fs.writeFileSync(path.join(out,'controls.json'),JSON.stringify(results,null,2)+'\n');
  console.log('PASS: visibility boundary sequence and unrelated Dashboard click in both versions.');
} finally {close()}
