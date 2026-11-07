const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const root = path.join(__dirname, '..');
const evidence = path.join(root, 'evidence');
const read = file => JSON.parse(fs.readFileSync(path.join(evidence, file)));
const files = fs.readdirSync(path.join(evidence, 'traces'));
const rows = files.flatMap(file => read('traces/' + file));
const regular = rows.filter(r => !r.rapid && r.input !== 'programmatic');
const clicks = row => row.events.filter(e => e.type === 'click' && e.target === 'backToTopBtn');

test('full primary matrix has exactly 120 distinct configurations', () => {
  const expected = [];
  for (const v of ['before','after']) for (const w of [360,390,768,1024,1440])
    for (const t of ['light','dark']) for (const m of ['no-preference','reduce'])
      for (const i of ['pointer','Enter','Space']) expected.push([v,w,t,m,i].join('-'));
  assert.deepEqual(regular.map(r=>r.id).sort(),expected.sort());
});
for (const row of regular) {
  test(row.id + ' native activation, request, positions, visibility and focus', () => {
    const keyboard = row.input !== 'pointer';
    assert.equal(row.actual.theme,row.theme);
    assert.equal(row.actual.reduce,row.motion==='reduce');
    assert.equal(row.actual.rootBehavior,row.actual.reduce?'auto':'smooth');
    assert.equal(row.actual.innerWidth,row.width);
    assert.equal(row.actual.label,'Back to top');
    assert.equal(row.initial.visibility,'visible');
    assert(row.initial.y > 360);
    if(keyboard) {
      assert.equal(row.initial.active,'backToTopBtn');
      assert.equal(row.initial.focusVisible,true);
      assert.equal(Number(row.initial.opacity),1);
      for(const type of ['keydown','keyup'])
        assert(row.events.some(e=>e.type===type && e.key===(row.input==='Space'?' ':row.input) && e.trusted));
    } else {
      assert(row.events.some(e=>e.type==='pointerdown' && e.trusted && e.pointerType==='mouse'));
    }
    const events = clicks(row);
    assert.equal(events.length,1);
    assert.equal(events[0].trusted,true);
    assert.equal(events[0].pointerType,keyboard?'':'mouse');
    assert.equal(events[0].detail,keyboard?0:1);
    const instant = row.version==='after' && keyboard;
    assert.equal(row.calls.length,1);
    const [call] = row.calls;
    assert.deepEqual(call.args,[{top:0,behavior:instant?'instant':'smooth'}]);
    assert(call.before>360);
    if(instant) {
      assert.equal(call.after,0);
      assert(row.frames.filter(f=>f.ms>call.returnMs).every(f=>f.y===0));
    } else {
      assert.equal(call.after,call.before);
      assert(row.frames.some(f=>f.y>0 && f.y<call.before));
    }
    assert.equal(row.settled.y,0);
    assert.equal(row.settled.active,'BODY');
    assert.equal(row.settled.visibleClass,false);
    assert.equal(row.settled.visibility,'hidden');
    assert.equal(row.settled.pointerEvents,'none');
  });
}
test('rapid three-Enter bursts dispatch one request per native button click without extra actions', () => {
  const bursts = rows.filter(r=>r.rapid);
  assert.equal(bursts.length,4);
  for (const r of bursts) {
    assert.equal(r.events.filter(e=>e.type==='keydown' && e.key==='Enter' && e.trusted).length,3);
    assert.equal(r.calls.length,clicks(r).length);
    assert(r.calls.length >= 1);
    for (const c of r.calls) {
      assert.deepEqual(c.args,[{top:0,behavior:r.version==='after'?'instant':'smooth'}]);
      if (r.version==='after') assert.equal(c.after,0);
    }
    assert.equal(r.settled.y,0);
  }
});
test('programmatic click retains historical smooth behavior under both preferences', () => {
  const scripted = rows.filter(r=>r.input==='programmatic');
  assert.equal(scripted.length,4);
  for (const r of scripted) {
    assert.equal(clicks(r).length,1);
    assert.equal(clicks(r)[0].trusted,false);
    assert.equal(r.calls.length,1);
    assert.deepEqual(r.calls[0].args,[{top:0,behavior:'smooth'}]);
    assert.equal(r.settled.y,0);
  }
});
test('geometry, computed keyboard focus style and document overflow match paired originals', () => {
  for (const r of regular.filter(r=>r.version==='after')) {
    const before=regular.find(b=>b.id===r.id.replace('after-', 'before-'));
    for(const k of ['client','scrollWidth','innerHeight']) assert.equal(r.actual[k],before.actual[k],r.id+' '+k);
    for(const k of ['x','top','width','height','background','shadow','focusVisible','pointerEvents'])
      assert.deepEqual(r.initial[k],before.initial[k],r.id+' '+k);
  }
});
test('visibility boundaries and independent Dashboard click match across versions', () => {
  const controls=read('controls.json');
  assert.equal(controls.length,2);
  assert.deepEqual(controls[0].lifecycle,controls[1].lifecycle);
  for(const c of controls) {
    assert.deepEqual(c.lifecycle.map(s=>s.visible),[false,false,false,true,true,false,false]);
    assert.deepEqual(c.dashboard,{open:true,calls:[],clicks:[{button:'openDashboardBtn',trusted:true}]});
    assert.deepEqual(c.errors,[]);
  }
});
test('diagnostics contain only recognized loopback responses', () => {
  for (const r of read('diagnostics.json'))
    assert(r.kind==='error' && /(?:403 .*rest\/v1\/site_settings|404 .*favicon\.ico)/.test(r.message),JSON.stringify(r));
});
test('evidence contains both source screencasts and all sixteen stills', () => {
  const movie = read('screencasts/timing.json');
  for(const v of ['before','after']) {
    assert(movie[v].sourceFrames>1);
    assert.equal(fs.readFileSync(path.join(evidence,'screencasts',v+'.gif')).subarray(0,3).toString(),'GIF');
  }
  assert.equal(fs.readdirSync(path.join(evidence,'screenshots')).filter(f=>f.endsWith('.png')).length,16);
});
