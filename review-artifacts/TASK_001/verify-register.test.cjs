const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const task=__dirname, root=path.dirname(task), repo=path.dirname(root);
const read=p=>fs.readFileSync(path.join(task,p),'utf8');
const reg=JSON.parse(read('evidence/REGISTER.json'));
const inv=JSON.parse(read('evidence/SOURCE_INVENTORY.json'));
const coverage=JSON.parse(read('evidence/SOURCE_COMPLETENESS.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const get=action=>reg.recommendations.find(r=>r.action===action);
test('01: IDs are sequential and unique',()=>assert.deepEqual(reg.recommendations.map(r=>r.id),Array.from({length:reg.counts.retained},(_,i)=>`R-${String(i+1).padStart(3,'0')}`)));
test('02: every record has the required attribution, action, scope, evidence, risk and disposition',()=>{
 for(const r of reg.recommendations)for(const k of ['action','component','category','priority','status','finding','skills','evidence','benefit','risk','refs','demonstrated','kind','implementation','ownerDecision'])assert.ok(r[k]?.length,`${r.id} ${k}`);
});
test('03: every occurrence quotation exactly matches its sanitized source lines',()=>{
 for(const o of reg.occurrences){const s=inv.find(s=>s.id===o.source);assert.equal(read(s.file).split('\n').slice(o.start-1,o.end).join('\n'),o.quote,o.id);assert.ok(o.quote.trim());}
});
test('04: every snapshot matches its recorded SHA-256 and line count',()=>{
 for(const s of inv){assert.equal(sha(Buffer.from(read(s.file))),s.sanitizedSha256,s.id);assert.equal(read(s.file).split('\n').length,s.lineCount);}
});
test('05: completeness mapping accounts for every line of every supplied source',()=>{
 for(const s of inv){const c=coverage.find(c=>c.source===s.id);assert.equal(c.lineDisposition.length,s.lineCount);assert.deepEqual(c.lineDisposition.map(l=>l.line),Array.from({length:s.lineCount},(_,i)=>i+1));assert.ok(c.lineDisposition.every(l=>l.disposition));}
 const audit=coverage.find(c=>c.source==='S01');
 for(let n=1;n<=audit.lineCount;n++)assert.ok(audit.blocks.some(b=>b.start<=n&&b.end>=n),`Unclassified audit line ${n}`);
});
test('06: every retained action and raw occurrence has a bidirectional source mapping',()=>{
 for(const r of reg.recommendations){const os=reg.occurrences.filter(o=>o.recommendation===r.id);assert.equal(os.length,r.refs.length);for(const o of os)assert.ok(coverage.find(c=>c.source===o.source).lineDisposition[o.start-1].recommendations.includes(r.id));}
 assert.ok(reg.occurrences.every(o=>reg.recommendations.some(r=>r.id===o.recommendation)));
});
test('07: raw, duplicate, retained, provenance and owner-state counts reconcile',()=>{
 const c=reg.counts;assert.equal(c.rawAtomicSourceOccurrences,reg.occurrences.length);assert.equal(c.retained,reg.recommendations.length);assert.equal(c.rawAtomicSourceOccurrences-c.exactDuplicateOccurrencesRemoved,c.retained);
 assert.equal(c.auditImplementationAndPrinciples+c.auditVerificationProcess+c.correctionRecords+c.historicalLeads+c.rejectedDemoTreatments,c.retained);
 for(const [s,n]of Object.entries(c.statuses))assert.equal(n,reg.recommendations.filter(r=>r.status===s).length);
 assert.equal(Object.values(c.statuses).reduce((a,b)=>a+b,0),c.retained);
});
test('08: every declared exact-duplicate group preserves four identity fields and a written proof',()=>{
 let removed=0;for(const d of reg.duplicates){assert.ok(d.proof.length>100);const os=d.occurrences.map(id=>reg.occurrences.find(o=>o.id===id));assert.ok(os.length>1);for(const o of os){assert.equal(o.recommendation,d.retained);assert.deepEqual(o.identity,os[0].identity);}assert.equal(d.removed,os.length-1);removed+=d.removed;}
 assert.equal(removed,reg.counts.exactDuplicateOccurrencesRemoved);
 // This verifies recorded identities, not the correctness of human semantic interpretation.
});
test('09: materially different focus, implementation, input and token proposals remain separate',()=>{
 const sets=[['Set explicit initial focus when opening each tracker modal','Contain Tab and Shift+Tab within the active tracker modal'],['Retain tracker overlays and reuse the admin drawer custom focus-management pattern','Use native dialog.showModal instead of custom tracker overlays'],['Replace undefined tooltip --shadow-lg with existing --shadow','Replace undefined tooltip --shadow-lg with existing --soft-shadow','Deliberately add a documented tooltip-elevation token','Define the missing semantic shadow token in both light and dark themes'],['Increase the actual stream trigger box to at least 24 by 24 CSS pixels','Make the containing stream badge the interactive target','Increase the actual stream interaction box without visually inflating every badge']];
 for(const actions of sets){const ids=actions.map(a=>{assert.ok(get(a),a);return get(a).id;});assert.equal(new Set(ids).size,ids.length);}
});
test('10: owner decisions and unimplemented alternatives are preserved',()=>{
 for(const r of reg.recommendations){if(r.demonstrated.startsWith('Demo D'))assert.equal(r.status,'REJECTED');if(r.finding==='F-006'&& !r.action.includes('keyboard'))assert.equal(r.status,'HOLD');if(r.finding==='F-007')assert.equal(r.status,'HOLD');}
 assert.equal(get('Use native dialog.showModal instead of custom tracker overlays').status,'UNREVIEWED');assert.equal(get('Replace undefined tooltip --shadow-lg with existing --soft-shadow').status,'UNREVIEWED');assert.equal(reg.counts.statuses['IN REVIEW'],0);
});
test('11: all nine findings and the corrected visible reduced-motion check are represented',()=>{
 for(let i=1;i<=9;i++)assert.ok(reg.recommendations.some(r=>r.finding===`F-${String(i).padStart(3,'0')}`));assert.equal(get('Set copied-check opacity to 1 and transform to none under reduced motion').status,'HOLD');
});
test('12: ten historical leads remain uncertain and are not falsely attributed to an available original report',()=>{
 const hs=reg.recommendations.filter(r=>r.kind==='HISTORICAL LEAD');assert.equal(hs.length,10);for(const r of hs){assert.equal(r.status,'UNREVIEWED');assert.ok(r.skills.join(' ').includes('original report unavailable'));assert.match(r.evidence,/Reverify/);}assert.ok(!hs.some(r=>/move.+navbar|shortcut.+Dashboard/i.test(r.action)));
});
test('13: skipped and unavailable audits are disclosed rather than supplying invented findings',()=>{
 const m=fs.readFileSync(path.join(root,'MASTER_RECOMMENDATIONS.md'),'utf8');assert.match(m,/Audits 08\/09\/18\/19 were skipped/);assert.match(m,/17 was N\/A/);assert.match(m,/separate full raw outputs/);for(const r of reg.recommendations)assert.ok(!r.skills.some(s=>/^webapp-testing$|^redesign-existing-projects$|^ui-ux-pro-max$|^figma:figma-generate-library$/.test(s)));
});
test('14: public artifacts contain no local preview dependencies, personal absolute paths or credential patterns',()=>{
 const forbidden=[/\b[A-Z]:[\\/]/i,/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i,/\bgh[pousr]_[A-Za-z0-9]{20,}\b/,/\bgithub_pat_[A-Za-z0-9_]{20,}\b/,/\bBearer\s+[A-Za-z0-9._-]{20,}\b/,/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\b/];
 for(const p of walk(root)){if(p===__filename)continue;const b=fs.readFileSync(p);const s=b.toString('utf8');assert.ok(!/\.env(?:\.|$)|cookies|profile\.zip|backup\.sql/i.test(path.basename(p)),p);for(const re of forbidden)assert.ok(!re.test(s),`${path.relative(root,p)} matches ${re}`);}
});
test('15: separate clone branch and tracked runtime remain untouched at verification',()=>{
 const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();assert.equal(git('branch','--show-current'),'temp/ui-ux-audit-review');assert.equal(git('merge-base',reg.base,'HEAD'),reg.base);assert.equal(git('diff',reg.base,'--numstat','--','.',':(exclude)review-artifacts'),'');assert.equal(git('diff','--cached','--numstat','--','.',':(exclude)review-artifacts'),'');
});
test('16: original protection evidence preserves HEAD, status, pre-existing audit bytes and tracked files',()=>{
 const p=JSON.parse(read('evidence/ORIGINAL_PROTECTION.json'));assert.equal(p.originalBefore.branch,p.originalAfter.branch);assert.equal(p.originalBefore.head,p.originalAfter.head);assert.equal(p.originalBefore.status,p.originalAfter.status);assert.equal(p.originalBefore.auditSha256,p.originalAfter.auditSha256);assert.equal(p.originalAfter.trackedDiff,'');assert.equal(p.originalAfter.stagedDiff,'');
});
test('17: report contains A-M, requirement results and independent-review limitations',()=>{
 const report=read('TASK_REVIEW_001.md');for(const c of 'ABCDEFGHIJKLM')assert.match(report,new RegExp(`^## ${c}\\.`,'m'));assert.match(report,/REQ-01/);assert.match(report,/not.*independent.*approval/i);assert.match(report,/NOT TESTED/);
});
test('18: public handoff links point to included artifacts or GitHub, not local files',()=>{
 const docs=[path.join(root,'MASTER_RECOMMENDATIONS.md'),path.join(root,'REVIEW_LEDGER.md'),path.join(task,'TASK_REVIEW_001.md')];
 for(const p of docs)for(const m of fs.readFileSync(p,'utf8').matchAll(/\]\(([^)]+)\)/g)){const link=m[1].split('#')[0];if(/^https:\/\//.test(link)){assert.ok(link.startsWith('https://github.com/'));continue;}if(!link)continue;assert.ok(fs.existsSync(path.resolve(path.dirname(p),link)),`${path.basename(p)} -> ${link}`);}
});
test('19: ledger and register contain exactly the same actions and current dispositions',()=>{
 const l=fs.readFileSync(path.join(root,'REVIEW_LEDGER.md'),'utf8');for(const r of reg.recommendations)assert.ok(l.includes(`| ${r.action} | ${r.status} |`),r.id);
});
test('20: per-source action counts and all individual audit blocks are included',()=>{
 for(const s of inv){const c=coverage.find(c=>c.source===s.id);assert.equal(c.atomicOccurrences,reg.occurrences.filter(o=>o.source===s.id).length);assert.equal(c.retainedPrimary,reg.recommendations.filter(r=>r.refs[0].source===s.id).length);}
 assert.equal(coverage.find(c=>c.source==='S01').blocks.filter(b=>b.disposition.startsWith('Individual section')).length,19);
});
