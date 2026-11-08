const fs=require('node:fs'),p=require('node:path'),assert=require('node:assert/strict'),test=require('node:test'),vm=require('node:vm');
const root=p.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(p.join(root,'evidence',f)));
const rows=fs.readdirSync(p.join(root,'evidence/traces')).flatMap(f=>read('traces/'+f));
const regular=rows.filter(r=>!r.rapid&&r.index===0&&r.input!=='programmatic');
test('complete trusted input matrix: 120 unique cases across widths, themes and preferences',()=>{
 const expected=[];for(const v of['before','after'])for(const w of[360,390,768,1024,1440])for(const t of['light','dark'])for(const m of['no-preference','reduce'])for(const i of['pointer','Enter','Space'])expected.push([v,w,t,m,i,0,'center','single'].join('-'));
 assert.deepEqual(regular.map(r=>r.id).sort(),expected.sort());
});
for(const r of rows)test(r.id+' action, scroll, focus, results and containment',()=>{
 assert.equal(r.initial.theme,r.theme);assert.equal(r.initial.reduce,r.motion==='reduce');
 assert.equal(r.actions.length,1);assert.equal(r.renders,1);assert.equal(r.scrolls.length,1);
 assert.equal(r.windowScrolls.length,0);
 const keyboard=['Enter','Space'].includes(r.input),instant=r.version==='after'&&keyboard;
 const s=r.scrolls[0];assert.equal(s.target,'courses');assert.deepEqual(s.args,[{behavior:instant?'instant':'smooth',block:'start'}]);
 const click=r.events.filter(e=>e.type==='click'&&e.target==='see-more');assert.equal(click.length,1);
 assert.equal(click[0].trusted,r.input!=='programmatic');assert.equal(click[0].detail,r.input==='pointer'?1:0);
 if(r.input==='pointer')assert.equal(click[0].pointerType,'mouse');
 if(keyboard){assert(r.initial.active.includes('stream-see-more'));assert.equal(r.initial.focusVisible,true);assert.equal(click[0].pointerType,'')}
 assert.equal(r.focusCalls.length,1);const f=r.focusCalls[0];
 assert.equal(f.target,'curriculumFieldFilter');assert.deepEqual(f.args,[{preventScroll:true}]);assert.equal(f.after,f.before);assert.equal(f.active,'curriculumFieldFilter');
 assert.equal(r.final.active,'curriculumFieldFilter');assert.equal(r.final.value,r.selected.field);assert.deepEqual(r.final.codes.slice().sort(),r.expected);
 assert(r.expected.length>0);assert.equal(r.final.open,false);
 assert.equal(r.nextTab.active,'badge category-badge stream-category-trigger');
 assert(Math.abs(r.final.section.y)<=1,'section start alignment '+r.final.section.y);
 assert.equal(r.final.filter.y>=r.final.header.bottom,r.width!==1440,'recorded shared header overlap');
 assert(r.final.filter.bottom<=1000);
 assert.equal(r.initial.root,r.initial.client);assert.equal(r.final.root,r.final.client);
 const pop=r.initial.tooltip;assert(pop&&pop.x>=0&&pop.right<=r.initial.client+.5&&pop.y>=0&&pop.bottom<=1000);
 if(instant){assert(Math.abs(s.after-r.final.y)<=1);assert.equal(f.after,s.after)}
 else if(Math.abs(s.before-r.final.y)>1){if(r.index===0)assert.equal(s.after,s.before);assert(r.positions.some(x=>x.y>Math.min(s.before,r.final.y)&&x.y<Math.max(s.before,r.final.y)))}
});
test('paired Before/After result sets, fields, layouts and scroll destinations agree',()=>{
 for(const a of rows.filter(r=>r.version==='after')){
 const b=rows.find(r=>r.id===a.id.replace('after-','before-'));assert(b);
 assert.deepEqual(a.final.codes,b.final.codes);assert.equal(a.final.value,b.final.value);assert(Math.abs(a.final.y-b.final.y)<=1);
 assert.deepEqual(a.initial.tooltip,b.initial.tooltip);
 }
});
test('real repeated keys cannot reactivate the closed disclosure or repeat filtering',()=>{
 const rapid=rows.filter(r=>r.rapid);assert.equal(rapid.length,4);
 for(const r of rapid){
  assert.equal(r.actions.length,1);assert.equal(r.renders,1);assert.equal(r.scrolls.length,1);
  // After the first action, the second Enter opens the focused native select.
  // Chromium consumes the third Enter in that popup, outside document events.
  assert.deepEqual(r.events.filter(e=>e.type==='keydown'&&e.key==='Enter').map(e=>e.target),['see-more','curriculumFieldFilter']);
 }
});
test('controls preserve Escape, outside click, multiple badges and absent Roadmap stream fixture',()=>{
 const controls=read('controls.json');assert.equal(controls.length,20);
 for(const r of controls){assert.equal(r.checks.length,3);assert.equal(r.multipleBadges,true);assert.equal(r.roadmap.cards,43);assert.equal(r.roadmap.streams,0)}
});
test('candidate helper retains default smooth and guard behavior while forwarding instant explicitly',()=>{
 const src=fs.readFileSync(p.join(root,'source/after/js/app.js'),'utf8');
 const func=src.slice(src.indexOf('function openCurriculumField('),src.indexOf('\nfunction ',src.indexOf('function openCurriculumField(')+1));
 for(const behavior of[undefined,'smooth','instant']){
  const calls=[],filter={value:'all',focus:o=>calls.push(['focus',o])},section={scrollIntoView:o=>calls.push(['scroll',o])};
  const scope={document:{getElementById:id=>id==='courses'?section:filter},closeStreamCategoryTooltips:()=>calls.push(['close']),renderCourseList:()=>calls.push(['render'])};
  vm.createContext(scope);vm.runInContext(func,scope);scope.openCurriculumField('stream-4',behavior);
  assert.equal(filter.value,'stream-4');assert.deepEqual(JSON.parse(JSON.stringify(calls)),[['close'],['render'],['scroll',{behavior:behavior||'smooth',block:'start'}],['focus',{preventScroll:true}]]);
  calls.length=0;scope.openCurriculumField('');assert.deepEqual(calls,[['close']]);
 }
});
test('no unexpected final browser diagnostics',()=>{
 for(const d of read('diagnostics.json'))assert(d.kind==='error'&&/Failed to load resource/.test(d.text)&&(/403/.test(d.text)&&/rest\/v1\/site_settings/.test(d.url||'')||/404/.test(d.text)&&/favicon\.ico/.test(d.url||'')),JSON.stringify(d));
});
test('both app regression suites and historical reference passed 365 tests each',()=>{
 for(const v of['original','before','after']){const s=fs.readFileSync(p.join(root,'evidence',v+'-tests.tap'),'utf8');assert.match(s,/# tests 365/);assert.match(s,/# pass 365/);assert.match(s,/# fail 0/)}
});
test('runtime change and accepted overlay isolation',()=>{
 const guard=read('GIT_PROTECTION.json');assert.equal(guard.baselineByteExactFiles,182);assert.equal(guard.rebuildCopiesMatch,true);
 assert.deepEqual(guard.changedCandidateFiles,['js/app.js','tests/main-integration.test.js']);
 assert.deepEqual(guard.completedWorkspacesBefore,guard.completedWorkspacesAfter);assert.deepEqual(guard.originalBefore,guard.originalAfter);
});
