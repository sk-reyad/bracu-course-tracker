(function(root,factory){
  const api=factory(typeof module === "object" && module.exports?require("./degree-plan.js"):root.BracuDegreePlan);
  if(typeof module === "object" && module.exports)module.exports=api;
  else root.BracuDegreePlanView=api;
})(typeof globalThis !== "undefined"?globalThis:this,function(plan){
  "use strict";
  const controllers=new WeakMap();
  const labels={completed:"Completed",current:"Currently doing",selected:"Selected","not-started":"Not started","not-selected":"Not selected",failed:"Not completed",omitted:"Omitted"};
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const decimal=value=>value===null||value===undefined?"—":Number(value).toFixed(2);
  const status=(value,header=false)=>`<span class="${header?"dp-status-pill":"dp-row-status"} dp-status-${escape(value)}">${escape(labels[value]||"Not started")}</span>`;
  const completion=s=>s.completed>=s.required?"completed":s.completed>0?"current":"not-started";
  function table(rows,block="main"){
    if(!rows.length)return "";
    return `<div class="dp-table-block" data-block="${escape(block)}"><table class="dp-course-table"><colgroup><col><col><col><col><col></colgroup><thead><tr><th scope="col">Course</th><th class="dp-cell-center" scope="col">Credits</th><th class="dp-cell-center" scope="col">Grade</th><th class="dp-cell-center" scope="col">GP</th><th scope="col">Status</th></tr></thead><tbody>${rows.map(row=>{
      const suffix=row.credits===0?" (Non-Credit Course)":row.key==="ENG103"?" (Only for ENG102 freshers)":"";
      return `<tr data-course-code="${escape(row.code)}" data-course-status="${escape(row.status)}"><th scope="row" class="dp-course-cell"><span class="dp-course-code">${escape(row.code)}</span><span class="dp-course-title">${escape(row.title+suffix)}</span></th><td class="dp-cell-center" data-label="Credits">${escape(row.credits)}</td><td class="dp-cell-center" data-label="Grade">${escape(row.grade)}</td><td class="dp-cell-center" data-label="GP">${row.gp===null?"—":escape(Number(row.gp).toFixed(1))}</td><td data-label="Status">${status(row.status)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function header(s,subtitle,stream=false){
    const percent=Math.round(s.percent);
    return `<summary class="dp-section-head"><div class="dp-section-heading"><h3>${escape(s.title)}</h3>${subtitle?`<p class="dp-section-subtitle">${escape(subtitle)}</p>`:""}</div><div class="dp-header-meter"><div class="dp-progress dp-section-progress" role="progressbar" aria-label="${escape(s.title)} progress" aria-valuemin="0" aria-valuemax="${s.required}" aria-valuenow="${s.completed}"><span style="width:${s.percent}%"></span></div><span class="dp-header-percent">${percent}%</span>${stream?status(completion(s),true):`<span class="dp-progress-pill">${s.completed} / ${s.required} Cr completed</span>`}</div><span class="dp-collapse" aria-hidden="true"></span></summary>`;
  }
  function summary(s){return `<footer class="dp-section-summary"><div class="dp-summary-item"><small>Required</small><strong>${s.required} Cr</strong></div><div class="dp-summary-item"><small>Completed</small><strong>${s.completed} Cr</strong></div><div class="dp-summary-item"><small>Remaining</small><strong>${s.remaining} Cr</strong></div><div class="dp-summary-item"><small>Section GPA</small><strong>${decimal(s.gpa)}</strong></div></footer>`}
  function group(title,rows,block){return rows.length?`<div class="dp-table-block" data-group="${escape(block)}"><div class="dp-subsection-title${block==="extra"?" dp-extra-title":""}">${escape(title)}</div>${table(rows,block)}</div>`:""}
  function streamMarkup(s){
    let body=s.flat?table(s.flat):table(s.primary,"required")+group(s.id==="stream-5"?"Minimum 1 course":"Minimum 1 additional course",s.minimum,"minimum")+group("Extra from this stream",s.extras,"extra")+group(s.complete?"Other courses":s.id==="stream-2"?"Optional":"Minimum 1 from:",s.choices,"choices")+group("Legacy completed course",s.legacy,"legacy");
    return `<details class="dp-stream" id="${s.id}" open>${header(s,s.subtitle,true)}${body}<div class="dp-condition"><strong>Requirement progress</strong><span>${s.done} of ${s.courseRequirement} required courses completed</span></div></details>`;
  }
  function navigation(model){
    const links=[['dp-top','Top'],['university-core','University Core (General Education)'],...model.streams.map(s=>[s.id,`Stream ${s.id.slice(-1)}`,true]),['gened-electives','GenEd Electives',true],['school-core','School Core'],['program-core','Program Core'],['program-elective','Program Elective'],['project','Project / Internship / Thesis']];
    return `<nav class="dp-page-nav" aria-label="Degree Plan sections"><button class="dp-page-nav-toggle" type="button" aria-label="Open section navigation" aria-controls="degree-plan-nav-list" aria-expanded="false"><span class="dp-nav-icon" aria-hidden="true"></span></button><ul class="dp-page-nav-list" id="degree-plan-nav-list" inert>${links.map(([id,label,child])=>`<li${child?' class="dp-page-nav-child"':""}><a href="#${id}">${escape(label)}</a></li>`).join("")}</ul></nav>`;
  }
  function footer(){return `<footer class="dp-sources"><div class="dp-sources-copy"><h3>Disclaimer</h3><p>Degree-plan information is provided for planning purposes and may change. BRAC University’s official policies and guidance always take precedence. Please verify the latest requirements with the relevant university authorities.</p><div class="dp-contact"><p>For exact or updated information, please contact the relevant university authorities.</p></div></div><span class="dp-review-date">Last reviewed: 31 August 2026</span><div class="dp-footer-actions"><div class="dp-source-group"><h4>Sources</h4><div class="dp-source-links"><a href="https://www.bracu.ac.bd/academics/schools-and-departments/school-general-education/streams-and-courses" target="_blank" rel="noopener noreferrer">BRAC University — Streams and Courses</a><a href="https://docs.google.com/document/d/1jFtSQLYyIlu1FMRuRAGBWbtUT3FbeCLB/edit?pli=1" target="_blank" rel="noopener noreferrer">Updated Degree Plan CS — Google Docs</a></div></div><a class="dp-contact-link" href="https://www.bracu.ac.bd/contact" target="_blank" rel="noopener noreferrer">Contact information</a></div></footer>`}
  function markup(model){
    const s=model.overall;
    const fixed=item=>`<details class="dp-section" id="${item.id}" open>${header(item,item.subtitle)}${table(item.rows)}${summary(item)}</details>`;
    const gened=model.gened;
    return `${navigation(model)}<section class="dp-overall" id="dp-top" aria-label="Overall Progress"><div class="dp-overall-head"><div class="dp-overall-title"><h3>Overall Progress</h3><span class="dp-muted">${s.completed} of ${s.required} requirement credits completed</span></div>${status(completion(s),true)}</div><div class="dp-stats"><div class="dp-stat"><small>Required</small><strong>${s.required}</strong></div><div class="dp-stat"><small>Completed</small><strong data-degree-completed>${s.completed}</strong></div><div class="dp-stat"><small>Remaining</small><strong>${s.remaining}</strong></div><div class="dp-stat"><small>Overall CGPA</small><strong>${decimal(s.gpa)}</strong></div></div><div class="dp-progress" role="progressbar" aria-label="Overall degree progress" aria-valuemin="0" aria-valuemax="124" aria-valuenow="${s.completed}"><span style="width:${s.percent}%"></span></div></section><div class="dp-sections"><details class="dp-section" id="university-core" open>${header(model.university,"")}<div class="dp-streams">${model.streams.map(streamMarkup).join("")}<details class="dp-stream" id="gened-electives" open>${header(gened,"After completing the minimum requirements (10 courses) above, students may take 3 GenEd elective courses from Streams 2, 3, 4 and 5, or from other approved elective courses outside the CSE department.")}${table(gened.rows)}${group("Other courses",gened.additional,"additional")}</details></div>${summary(model.university)}</details>${fixed(model.sections[0])}${fixed(model.sections[1])}${fixed(model.programElective)}${fixed(model.sections[2])}</div>${footer()}`;
  }
  function render(root,state){
    if(!root)return;
    controllers.get(root)?.abort();
    const controller=new AbortController(); controllers.set(root,controller);
    const opened=new Map([...root.querySelectorAll('details[id]')].map(node=>[node.id,node.open]));
    root.innerHTML=markup(plan.calculate(state));
    for(const node of root.querySelectorAll('details[id]'))if(opened.has(node.id))node.open=opened.get(node.id);
    const nav=root.querySelector('.dp-page-nav'),toggle=nav.querySelector('button'),list=nav.querySelector('ul');
    const modal=root.closest('.modal-backdrop'),panel=root.closest('.modal-panel');
    const hover=matchMedia('(hover: hover) and (pointer: fine)'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
    const listen=(target,name,handler)=>target?.addEventListener(name,handler,{signal:controller.signal});
    const close=()=>setOpen(false);
    function setOpen(open){
      if(!open&&list.contains(document.activeElement))toggle.focus({preventScroll:true});
      nav.classList.toggle('is-open',open); list.inert=!open;
      toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close section navigation':'Open section navigation');
    }
    listen(nav,'pointerenter',event=>{if(hover.matches&&event.pointerType!=='touch')setOpen(true)});
    listen(nav,'pointerleave',event=>{if(hover.matches&&event.pointerType!=='touch')close()});
    listen(toggle,'click',()=>setOpen(!nav.classList.contains('is-open')));
    listen(nav,'focusout',event=>{if(!nav.contains(event.relatedTarget))close()});
    listen(document,'pointerdown',event=>{if(!nav.contains(event.target))close()});
    listen(nav,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close()}});
    listen(nav,'click',event=>{
      const link=event.target.closest('a[href^="#"]');if(!link)return;
      event.preventDefault();const target=root.querySelector(link.getAttribute('href'));if(!target)return;
      for(let node=target;node&&node!==root;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;
      const focusTarget=target.querySelector(':scope > summary') || panel?.querySelector('.modal-head button');
      focusTarget?.focus({preventScroll:true});
      if(modal){const top=target.getBoundingClientRect().top-modal.getBoundingClientRect().top+modal.scrollTop-16;modal.scrollTo({top:target.id==='dp-top'?0:top,behavior:reduce.matches||event.detail===0?'instant':'smooth'})}
      else target.scrollIntoView({behavior:reduce.matches||event.detail===0?'instant':'smooth',block:'start'});
      close();
    });
    const observer=new MutationObserver(()=>{if(!root.classList.contains('active')||modal?.hidden)close()});
    observer.observe(root,{attributes:true,attributeFilter:['class']});
    if(modal)observer.observe(modal,{attributes:true,attributeFilter:['hidden']});
    controller.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
  }
  return Object.freeze({render,markup});
});
