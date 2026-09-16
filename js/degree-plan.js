(function(root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./degree-plan-data.js") : root.BracuDegreePlanData);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BracuDegreePlan = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(data) {
  "use strict";
  const ranks = { completed: 0, current: 1, selected: 2, failed: 3, omitted: 4, "not-started": 5, "not-selected": 6 };
  const byCode = (a,b) => a.code.localeCompare(b.code, undefined, {numeric:true});
  const sortRows = rows => rows.slice().sort((a,b) => ranks[a.status]-ranks[b.status] || byCode(a,b));
  const chronology = (a,b) => ranks[a.status]-ranks[b.status] || a.order-b.order || byCode(a,b);
  const active = row => ["completed","current","selected"].includes(row.status);
  const number = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  function gpa(rows) {
    const atoms = rows.flatMap(row => row.gpaAtoms || []);
    const credits = atoms.reduce((sum,a) => sum+a.credits,0);
    return credits ? atoms.reduce((sum,a) => sum+a.credits*a.point,0)/credits : null;
  }
  function section(id, title, required, rows, extra = {}) {
    const completed = Math.min(required,rows.reduce((sum,row) => sum+(row.completed ? Math.min(row.credits,row.requirementCredits ?? row.credits) : 0),0));
    return {id,title,required,completed,remaining:required-completed,percent:required?Math.min(100,completed/required*100):0,gpa:gpa(rows),rows:sortRows(rows),...extra};
  }
  function calculate(state = {}) {
    const catalog = data.mergeCourses(state.courses || []);
    const byKey = new Map(catalog.map(course => [data.normalize(course.code),course]));
    const attempts = new Map();
    const allocations = {};
    (state.semesters || []).forEach((semester,index) => {
      (semester.courses || []).forEach((attempt,attemptIndex) => {
        const key = data.canonical(attempt.code);
        if (!key) return;
        const entries = attempts.get(key) || [];
        entries.push({...attempt,code:data.normalize(attempt.code),order:Number(semester.number || index+1)*10000+attemptIndex});
        attempts.set(key,entries);
      });
    });
    const gradePoint = attempt => {
      const scale = (state.gradeScale || []).find(row => row.grade === attempt.grade);
      return number(attempt.gradePoint ?? scale?.point);
    };
    const records = new Map();
    function rowFor(definition) {
      const def = typeof definition === "string" ? {code:definition,title:definition} : definition;
      const key = data.canonical(def.code);
      if (records.has(key)) return records.get(key);
      const entries = attempts.get(key) || [];
      const counted = entries.filter(a => a.status === "completed" && !(state.settings?.autoCountHighestRetake === false && a.countsInCGPA === false));
      const numeric = counted.filter(a => gradePoint(a) !== null).sort((a,b) => gradePoint(b)-gradePoint(a) || b.order-a.order);
      const passed = counted.filter(a => a.grade === "P" || (gradePoint(a) ?? 0)>0);
      const bestPassed = numeric.find(a => gradePoint(a)>0) || passed[0];
      const current = entries.find(a => a.status === "current");
      const selected = entries.find(a => a.status === "planned" || a.status === "selected");
      const attempt = bestPassed || current || selected || numeric[0] || entries.at(-1);
      const course = byKey.get(attempt?.code) || byKey.get(data.normalize(def.code)) || byKey.get(key) || def;
      const zeroCredit = ["ENG091","MAT092"].includes(key) || course.category === "non-credit" || Number(course.credits) === 0;
      const credits = zeroCredit ? 0 : Math.max(0,number(attempt?.creditsOverride ?? course.credits ?? def.credits) ?? 0);
      const status = bestPassed ? "completed" : current ? "current" : selected ? "selected" : attempt?.status === "omitted" ? "omitted" : attempt ? "failed" : "not-started";
      const gpaAttempt = numeric[0];
      const gpaCredits = zeroCredit ? 0 : Math.max(0,number(gpaAttempt?.creditsOverride ?? course.credits ?? def.credits) ?? 0);
      const row = {key,code:attempt?.code || def.code,title:course.title || def.title || key,department:course.department || "",category:course.category || "",credits,status,completed:status === "completed",grade:["completed","failed"].includes(status)?attempt?.grade || "—":"—",gp:status === "completed" || status === "failed"?gradePoint(attempt || {}):null,order:passed.length?Math.min(...passed.map(a=>a.order)):attempt?.order ?? Infinity,attemptId:attempt?.id || null,allocated:false,gpaAtoms:gpaAttempt && gpaCredits>0?[{point:gradePoint(gpaAttempt),credits:gpaCredits}]:[]};
      records.set(key,row);
      return row;
    }
    function allocate(row, sectionId, slot, requirementCredits = 3) {
      if (allocations[row.key]) return;
      allocations[row.key] = {section:sectionId,slot};
      row.allocated = true; row.allocation = sectionId; row.slot = slot; row.requirementCredits = requirementCredits;
    }
    const fixedKeys = new Set(data.fixedSections.flatMap(s=>s.courses.map(c=>data.canonical(c.code))));
    const alternativeKeys = new Set(Object.values(data.alternatives).flat(2));
    const sections = data.fixedSections.map(def => {
      const rows = def.courses.map(course => {
        let row = rowFor(course);
        if (!row.completed) {
          const pair = (data.alternatives[course.code] || []).map(codes => ({codes,rows:codes.map(rowFor)})).filter(pair => pair.rows.some(r=>r.attemptId)).sort((a,b)=>Number(b.rows.every(r=>r.completed))-Number(a.rows.every(r=>r.completed)))[0];
          if (pair && (pair.rows.every(r=>r.completed) || !active(row))) {
            const completed = pair.rows.every(r=>r.completed);
            const points = gpa(pair.rows);
            row = {...row,code:pair.codes.join(" + "),title:course.title,credits:course.credits,completed,status:completed?"completed":pair.rows.some(r=>r.status==="current")?"current":pair.rows.some(r=>r.status==="selected")?"selected":"not-started",grade:completed?[...new Set(pair.rows.map(r=>r.grade))].join(" / "):"—",gp:completed?points:null,gpaAtoms:pair.rows.flatMap(r=>r.gpaAtoms),alternativeCodes:pair.codes};
          }
        }
        allocate(row,def.id,course.code,course.credits);
        return row;
      });
      return section(def.id,def.title,def.required,rows,{subtitle:def.subtitle});
    });
    const streamKeys = new Set();
    const extraPool = [];
    const streams = data.streams.map((def,index) => {
      const primary = def.requiredCourses.map(rowFor);
      const choices = def.choices.map(rowFor);
      const legacy = index === 2 ? data.legacyArts.filter(code=>attempts.has(code)).map(rowFor).filter(r=>r.completed) : [];
      const all = [...primary,...choices,...legacy];
      all.forEach(r=>streamKeys.add(r.key));
      const compulsory = index===2?primary:index===3?primary:[];
      compulsory.forEach(row=>allocate(row,def.id,row.key));
      const eligible = all.filter(r=>r.credits>0 && !compulsory.includes(r)).filter(active).sort(chronology);
      const minimum = eligible.slice(0,def.required-compulsory.length);
      minimum.forEach((row,i)=>allocate(row,def.id,`minimum-${i+1}`));
      const counted = [...compulsory,...minimum];
      const complete = counted.length===def.required && counted.every(r=>r.completed);
      const extras = index>0 && complete ? eligible.filter(r=>!minimum.includes(r)) : [];
      extraPool.push(...extras);
      const remaining = choices.filter(r=>!minimum.includes(r)&&!extras.includes(r));
      const initial = primary.filter(r=>!extras.includes(r));
      const result = section(def.id,def.title,def.required*3,counted,{subtitle:def.subtitle,courseRequirement:def.required,done:counted.filter(r=>r.completed).length,complete,primary:sortRows(initial),minimum:sortRows(minimum.filter(r=>!initial.includes(r))),extras:sortRows(extras),choices:sortRows(remaining),legacy:sortRows(legacy.filter(r=>!minimum.includes(r)&&!extras.includes(r)))});
      if(index===0)result.flat=sortRows(all);
      if(index===4 && !extras.length){result.flat=sortRows([...minimum,...remaining]);result.minimum=[];result.choices=[];}
      return result;
    });
    // Recognized alternatives/core/stream courses are never counted again as outside electives.
    const outsiders = [...attempts.keys()].filter(key=>!fixedKeys.has(key)&&!streamKeys.has(key)&&!alternativeKeys.has(key)&&!data.legacyArts.includes(key)).map(rowFor).filter(row=>row.credits>0&&active(row)&&row.department&&row.department!=="CSE"&&!/^CSE/.test(row.code)&&["gened","general-elective","custom","program-elective"].includes(row.category));
    const genedPool = [...extraPool,...outsiders].filter(row=>row.department!=="CSE"&&!/^CSE/.test(row.code)&&row.credits>0&&!allocations[row.key]).sort(chronology);
    const genedRows = genedPool.slice(0,3);
    genedRows.forEach((row,i)=>allocate(row,"gened-electives",i+1));
    const placeholder = (code,title,credits=3) => ({key:code,code,title,credits,status:"not-selected",completed:false,grade:"—",gp:null,allocated:false,gpaAtoms:[]});
    const gened = section("gened-electives","GenEd Electives",9,genedRows);
    gened.rows = sortRows(genedRows).concat(Array.from({length:3-genedRows.length},(_,i)=>placeholder(`GENED-ELECTIVE-${genedRows.length+i+1}`,`GenEd Elective-${genedRows.length+i+1}`)));
    gened.additional = [];
    const csePool = data.cseElectives.map(rowFor).filter(active).filter(row=>row.credits>0&&!allocations[row.key]).sort(chronology);
    const hasVariant = csePool.some(row=>/^CSE490[A-Z]$/.test(row.code));
    const hasCompletedVariant = csePool.some(row=>/^CSE490[A-Z]$/.test(row.code)&&row.completed);
    const cseEligible = csePool.filter(row=>!(row.key==="CSE490"&&(hasCompletedVariant || (hasVariant&&!row.completed))));
    const pinned = cseEligible[0];
    if(pinned)allocate(pinned,"program-elective","CSE-ELECTIVE");
    const programPool = [...cseEligible.slice(1),...(gened.completed===9?genedPool.slice(3):[])].sort(chronology);
    const programRows = programPool.slice(0,6);
    programRows.forEach((row,i)=>allocate(row,"program-elective",`ELECTIVE-${i+1}`));
    const electives = [pinned || placeholder("CSE-ELECTIVE","Required CSE Elective"),...sortRows(programRows)];
    for(let i=programRows.length+1;i<=6;i++)electives.push(placeholder(`ELECTIVE-${i}`,`Program Elective ${i}`));
    const programElective = section("program-elective","Program Elective",21,electives,{rows:electives,subtitle:"Minimum 1 course from CSE department, others can be COD / GenEd / Minor / 2nd Major"});
    gened.additional = sortRows(genedPool.filter(row=>!allocations[row.key]));
    const university = section("university-core","University Core (General Education)",39,[]);
    university.completed = streams.reduce((sum,s)=>sum+s.completed,0)+gened.completed;
    university.remaining=39-university.completed; university.percent=university.completed/39*100;
    university.gpa=gpa([...streams.flatMap(s=>s.rows),...genedRows]);
    const overall = {required:124,completed:university.completed+sections.reduce((sum,s)=>sum+s.completed,0)+programElective.completed};
    overall.remaining=124-overall.completed; overall.percent=overall.completed/124*100;
    [...attempts.keys()].forEach(rowFor);
    // Display substitution must not erase actual counted tracker attempts from CGPA.
    overall.gpa=gpa([...records.values()]);
    return {streams,gened,sections,programElective,university,overall,allocations,cseElectives:data.cseElectives.filter(c=>!(hasVariant&&c.code==="CSE490"))};
  }
  return Object.freeze({calculate,sortRows});
});
