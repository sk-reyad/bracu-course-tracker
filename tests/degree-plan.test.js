const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/degree-plan-data.js');
const plan = require('../js/degree-plan.js');
function state(attempts = [], courses = []) {
  return { courses: data.mergeCourses(courses), gradeScale: [{grade:'A',point:4},{grade:'B',point:3},{grade:'C',point:2},{grade:'F',point:0},{grade:'P',point:null}], settings:{autoCountHighestRetake:true}, semesters:[{number:1,courses:attempts.map((row,i)=>({id:`a${i}`,status:'completed',grade:'A',...row}))}] };
}
const done = (...codes) => codes.map(code=>({code}));
test('shared catalog preserves owned metadata and the default tracker still yields 42 credits / 3.35 GPA',()=>{
  const {DEFAULT_DATA}=require('../js/data.js');
  const result=plan.calculate({...DEFAULT_DATA,semesters:DEFAULT_DATA.defaultSemesters});
  assert.equal(result.overall.completed,42);
  assert.equal(result.overall.gpa.toFixed(2),'3.35');
  const existing={code:'CSE490B',title:'Custom title',credits:3,hardPrerequisites:['CSE110']};
  assert.deepEqual(data.mergeCourses([existing]).find(row=>row.code===existing.code),existing);
});
test('main roadmap uses the pinned CSE slot and distinguishes special-topic variants',()=>{
  const vm=require('node:vm'),fs=require('node:fs');
  const {DEFAULT_DATA}=require('../js/data.js');
  const s=state(done('CSE490B','CSE490D'),data.mergeCourses(DEFAULT_DATA.courses));
  const context={BracuDegreePlan:plan,courseByCode:(s,c)=>s.courses.find(row=>row.code===c),isAttemptCounted:()=>true};
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../js/roadmap.js'),'utf8'),context);
  const rows=context.getDisplayRoadmapCourses(s);
  assert.equal(rows.find(row=>row.replacedSlotCode==='CSE-ELECTIVE').code,'CSE490B');
  assert.equal(rows.find(row=>row.replacedSlotCode==='ELECTIVE-1').code,'CSE490D');
  assert(!rows.some(row=>row.code==='CSE490'));
});
test('Degree Plan markup escapes user-owned titles and keeps status cells annotation-free',()=>{
  const view=require('../js/degree-plan-view.js');
  const s=state(done('CSE427'),[{code:'CSE427',title:'<img src=x onerror=alert(1)>',credits:3,department:'CSE',category:'program-elective'}]);
  const html=view.markup(plan.calculate(s));
  assert(!html.includes('<img'));assert(html.includes('&lt;img'));
  assert(!html.includes('Allocated as GenEd elective'));assert(!html.includes('Status / Notes'));
});
test('import metadata includes special topics and current stream membership',async()=>{
  const {CURRICULUM_COURSES,DEGREE_PLAN_COURSES}=await import('../scripts/catalog-source-config.mjs');
  assert.equal(CURRICULUM_COURSES.BUS334.category,'stream-5-communities-seeking-transformation');
  assert.equal(CURRICULUM_COURSES.CSE490F.category,'program-elective');
  assert.equal(DEGREE_PLAN_COURSES.find(row=>row.code==='CSE490F').credits,3);
});
test('planned/current special topics do not erase a completed generic elective or GPA',()=>{
  for(const status of ['planned','current']){
    const result=plan.calculate(state([{code:'MAT120',grade:'C'},{code:'CSE490',grade:'A'},{code:'CSE490B',status,grade:''}]));
    assert.equal(result.overall.completed,6);
    assert.equal(result.overall.gpa,3);
    assert.equal(result.programElective.rows[0].code,'CSE490');
  }
});
test('abandoned alternative history cannot replace an active canonical course',()=>{
  for(const status of ['current','planned']){
    const result=plan.calculate(state([{code:'CSE110',status,grade:''},{code:'CSE161',grade:'F'}]));
    const row=result.sections[1].rows.find(row=>row.key==='CSE110');
    assert.equal(row.code,'CSE110');
    assert.equal(row.status,status==='planned'?'selected':'current');
  }
});
test('empty tracker has all slots and zero of 124 credits without mutating state',()=>{
  const s=state(), before=JSON.stringify(s), result=plan.calculate(s);
  assert.equal(result.overall.required,124); assert.equal(result.overall.completed,0);
  assert.equal(result.gened.rows.length,3); assert.equal(result.programElective.rows.length,7);
  assert.equal(JSON.stringify(s),before);
});
test('passed credits exclude F and noncredit; P earns credit without GPA; best retake is counted once',()=>{
  const result=plan.calculate(state([{code:'MAT120',grade:'C'},{code:'MAT120',grade:'A'},{code:'MAT215',grade:'F'},{code:'MAT216',grade:'P'},{code:'ENG091',grade:'P'}]));
  assert.equal(result.sections[0].completed,6);
  assert.equal(result.sections[0].gpa,2); // A and F, P/noncredit do not dilute GPA
  assert.equal(result.streams[0].completed,0);
});
test('minimum choice precedes extras and extra credit is counted once in GenEd',()=>{
  const result=plan.calculate(state(done('BNG103','HUM103','HUM101','ENG113','CST301','BUS334','CST201')));
  assert.deepEqual(result.streams[2].minimum.map(x=>x.code),['HUM101']);
  assert.deepEqual(result.streams[2].extras.map(x=>x.code),['ENG113']);
  assert.deepEqual(result.streams[4].minimum.map(x=>x.code),['CST301']);
  assert.deepEqual(result.gened.rows.map(x=>x.code),['BUS334','CST201','ENG113']);
  assert.equal(result.allocations.ENG113.slot,1); // allocation chronology is independent of display order
  assert.equal(result.gened.completed,9); assert.equal(result.overall.completed,21);
});
test('compulsory subjects cannot be substituted by other choices',()=>{
  const result=plan.calculate(state(done('ENG110','ENG113','ENG114')));
  assert.equal(result.streams[2].completed,3); assert.equal(result.streams[2].extras.length,0);
  assert.equal(result.gened.completed,0);
});
test('GenEd excludes Stream 1 and CSE; non-CSE program electives wait for GenEd quota',()=>{
  const extra={code:'LAW201',title:'Law',credits:3,department:'LAW',category:'general-elective'};
  const s=state(done('ENG101','ENG102','ENG103','CSE101','LAW201'),[extra]);
  const result=plan.calculate(s);
  assert.equal(result.gened.rows[0].code,'LAW201');
  assert.equal(result.programElective.rows.filter(x=>x.allocated).length,0);
  assert(!result.gened.rows.some(x=>x.code==='ENG103'||x.code==='CSE101'));
});
test('first completed CSE elective is pinned; current/planned slots earn no credit',()=>{
  const result=plan.calculate(state([{code:'CSE427',status:'current',grade:''},{code:'CSE490B'},{code:'CSE490D',status:'planned',grade:''}]));
  assert.equal(result.programElective.rows[0].code,'CSE490B');
  assert.equal(result.programElective.completed,3);
  assert.equal(result.programElective.rows[1].status,'current');
  assert.equal(result.programElective.rows[2].status,'selected');
});
test('same-semester aliases and canonical/alternative courses never earn duplicate credit',()=>{
  const s=state(done('EMB101','SOC201','ANT202','CSE110','CSE161','CSE162L'));
  const result=plan.calculate(s);
  assert.equal(result.streams[3].completed,6); assert.equal(result.streams[3].extras.length,0);
  assert.equal(result.sections[1].completed,3); assert.equal(result.gened.completed,0);
});
test('complete alternative pair replaces fixed requirement, incomplete pair does not complete it',()=>{
  const alt=[{code:'CSE161',title:'Programming',credits:3,department:'CSE',category:'program-core'},{code:'CSE162L',title:'Lab',credits:1,department:'CSE',category:'program-core'}];
  let result=plan.calculate(state(done('CSE161'),alt));
  assert.equal(result.sections[1].completed,0);
  result=plan.calculate(state(done('CSE161','CSE162L'),alt));
  assert.equal(result.sections[1].completed,3);
  assert.equal(result.sections[1].rows.find(x=>x.key==='CSE110').code,'CSE161 + CSE162L');
});
test('requirement credit is capped at 124 and outside-CSE overflow follows three GenEd courses',()=>{
  const core=data.fixedSections.flatMap(x=>x.courses.map(c=>c.code));
  const outside=['LAW201','LAW202','LAW203','LAW204'].map(code=>({code,title:code,credits:3,department:'LAW',category:'general-elective'}));
  const s=state(done('ENG101','ENG102','MAT110','PHY111','BNG103','HUM103','HUM101','EMB101','SOC101','CST301',...core,...outside.map(c=>c.code),'CSE490B','CSE427','CSE428','CSE431','CSE472','CSE491','CSE310'),outside);
  const result=plan.calculate(s);
  assert.equal(result.overall.completed,124);
  assert(result.programElective.rows.some(x=>x.code==='LAW204'));
  assert.equal(new Set(Object.keys(result.allocations)).size,Object.keys(result.allocations).length);
});
