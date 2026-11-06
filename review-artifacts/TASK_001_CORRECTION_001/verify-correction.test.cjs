const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),p=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const dir=__dirname,root=p.dirname(dir),repo=p.dirname(root),load=f=>JSON.parse(fs.readFileSync(p.join(dir,f),'utf8'));
const r=load('evidence/REGISTER.json'),delta=load('evidence/RECONCILIATION.json'),inv=load('evidence/SOURCE_INVENTORY.json'),cov=load('evidence/SOURCE_COMPLETENESS.json'),protection=load('evidence/GIT_PROTECTION.json');
const previous=JSON.parse(fs.readFileSync(p.join(root,'TASK_001/evidence/REGISTER.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);
const readSource=id=>fs.readFileSync(p.resolve(dir,inv.find(s=>s.id===id).file),'utf8');
const get=id=>r.recommendations.find(x=>x.id===id);
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
test('01: current records retain all 89 IDs and append exactly 17 stable IDs',()=>{
 assert.deepEqual(r.recommendations.map(x=>x.id),Array.from({length:106},(_,i)=>`R-${String(i+1).padStart(3,'0')}`));assert.equal(delta.changes.filter(c=>c.operation==='ADDED').length,17);
});
test('02: every prior status is identical and every new record is unreviewed',()=>{
 for(const old of previous.recommendations)assert.equal(get(old.id).status,old.status,old.id);for(const x of r.recommendations.slice(89))assert.equal(x.status,'UNREVIEWED');assert.deepEqual(delta.statusChanges,[]);
});
test('03: nine generic leads are refined and the remaining owner lead is not falsely attributed',()=>{
 for(let i=56;i<=64;i++){const x=get(`R-${String(i).padStart(3,'0')}`);assert.equal(x.kind,'RECOVERED ORIGINAL ACTION');assert.ok(x.refs.some(q=>q.source==='S10'));assert.ok(x.contextRefs.some(q=>q.source==='S04'));}
 assert.equal(get('R-065').kind,'OWNER LEAD — UNCORROBORATED');assert.ok(get('R-065').refs.every(q=>q.source==='S04'));assert.match(get('R-065').evidence,/does not identify a distinct remaining Course List issue/);
});
test('04: original report has 28 mapped atomic actions and no double-counted embedded owner copy',()=>{
 assert.equal(delta.recoveredActions.length,28);assert.equal(r.occurrences.filter(o=>o.source==='S10').length,28);assert.equal(r.occurrences.filter(o=>o.source==='S11').length,0);
 assert.deepEqual(delta.recoveredActions.map(a=>a.id),Array.from({length:28},(_,i)=>`IH-${String(i+1).padStart(2,'0')}`));
});
test('05: every recovered actionable bullet is mapped; preservation bullets are constraints',()=>{
 const lines=readSource('S10').split('\n'),actions=delta.recoveredActions;
 for(let i=0;i<lines.length;i++)if(lines[i].startsWith('- ')){const mapped=actions.filter(a=>a.start===i+1);if(lines[i].startsWith('- Preserve '))assert.equal(mapped.length,0);else assert.ok(mapped.length,`Unmapped actionable bullet ${i+1}`);}
 assert.equal(actions.filter(a=>a.start===30).length,2); // Explicit OR alternatives, not two copies of the whole action.
});
test('06: navbar and credit-progress alternatives are distinct and unreviewed',()=>{
 assert.match(get('R-056').action,/navigation link beside Roadmap and My Path/);assert.match(get('R-090').action,/credit-progress summary/);for(const id of ['R-056','R-090'])assert.equal(get(id).status,'UNREVIEWED');assert.ok(!/Dashboard/.test(get('R-090').action));
});
test('07: local SVG and visible-text fallbacks are separate unreviewed choices',()=>{
 assert.match(get('R-061').action,/local SVG/);assert.match(get('R-097').action,/visible fallback text/);for(const id of ['R-061','R-097'])assert.equal(get(id).status,'UNREVIEWED');
});
test('08: source-specific native reuse is not collapsed into custom reuse or generic native migration',()=>{
 assert.equal(get('R-009').status,'SELECTED');for(const id of ['R-010','R-105'])assert.equal(get(id).status,'UNREVIEWED');assert.match(get('R-105').action,/support form native dialog pattern/);
});
test('09: exactly two new recovered duplicate occurrences preserve target/action/outcome/implementation',()=>{
 const merged=delta.changes.filter(c=>c.operation==='EXACT_SOURCE_DUPLICATE');assert.deepEqual(merged.map(x=>x.id).sort(),['R-009','R-011']);
 for(const d of r.duplicates){const os=d.occurrences.map(id=>r.occurrences.find(o=>o.id===id));for(const o of os){assert.equal(o.recommendation,d.retained);assert.deepEqual(o.identity,os[0].identity);}assert.ok(d.proof.length>100);}
 assert.equal(r.duplicates.reduce((n,d)=>n+d.removed,0),13);
});
test('10: all count transitions and current status totals reconcile',()=>{
 const c=r.counts;assert.equal(c.previousRaw-c.priorGenericLeadOccurrencesReclassifiedAsContext+c.originalRecoveredActionOccurrences,119);assert.equal(r.occurrences.length,119);assert.equal(119-13,106);assert.equal(89+17,106);assert.equal(c.retained,106);
 assert.deepEqual(c.statuses,{SELECTED:23,REJECTED:9,HOLD:7,UNREVIEWED:67,'IN REVIEW':0});for(const [s,n]of Object.entries(c.statuses))assert.equal(r.recommendations.filter(x=>x.status===s).length,n);
});
test('11: every current source quotation matches archived line references and hashes',()=>{
 for(const s of inv){const text=readSource(s.id);assert.equal(text.split('\n').length,s.lineCount,s.id);assert.equal(sha(Buffer.from(text)),s.sanitizedSha256,s.id);}
 for(const o of r.occurrences)assert.equal(readSource(o.source).split('\n').slice(o.start-1,o.end).join('\n'),o.quote,o.id);
});
test('12: line-by-line coverage and per-source occurrence counts are complete',()=>{
 for(const s of inv){const c=cov.find(c=>c.source===s.id);assert.equal(c.lineDisposition.length,s.lineCount);assert.deepEqual(c.lineDisposition.map(l=>l.line),Array.from({length:s.lineCount},(_,i)=>i+1));assert.equal(c.atomicOccurrences,r.occurrences.filter(o=>o.source===s.id).length);assert.equal(c.retainedPrimary,r.recommendations.filter(x=>x.refs[0].source===s.id).length);assert.ok(c.lineDisposition.every(l=>l.disposition));}
 for(const o of r.occurrences)assert.ok(cov.find(c=>c.source===o.source).lineDisposition[o.start-1].recommendations.includes(o.recommendation));
});
test('13: historical manual 12/20 and detector failure are preserved without claiming current confirmation',()=>{
 assert.equal(delta.score.score,'12/20');assert.match(readSource('S10'),/The Impeccable detector could not start/);assert.match(readSource('S10'),/The 12\/20 score came from manual code and browser evidence/);assert.equal(Object.values(delta.score.dimensions).reduce((n,s)=>n+Number(s[0]),0),12);
 for(const x of r.recommendations.filter(x=>x.kind==='RECOVERED ORIGINAL ACTION'))assert.match(x.evidence,/Requires re-verification/);
});
test('14: repository-relative historical code paths and source provenance survive sanitization',()=>{
 for(const needle of ['js/app.js','historical line 1839','css/style.css','historical line 2760','historical line 1034','css/admin.css','historical line 347','index.html','historical line 605','auth.html','historical line 378','maintenance.html','historical line 94'])assert.ok(readSource('S10').includes(needle),needle);
 for(const x of r.recommendations)assert.equal(x.provenance.length,x.refs.length);assert.match(delta.remainingUnavailable.join(' '),/Other skills full raw individual transcripts/);
});
test('15: previous TASK_001 evidence and report are byte-identical to the reviewed commit',()=>{
 for(const f of protection.priorTaskFiles){const b=fs.readFileSync(p.join(repo,f.path));assert.equal(sha(b),f.sha256,f.path);const old=cp.execFileSync('git',['-C',repo,'cat-file','blob',`${r.previousReviewCommit}:${f.path}`]);assert.equal(sha(b),sha(old),f.path);}
});
test('16: original tracked/untracked state and completed-demo fingerprints are unchanged',()=>{
 assert.deepEqual(protection.originalBefore,protection.originalAfter);assert.equal(protection.originalBefore.branch,'main');assert.equal(protection.originalBefore.head,r.base);assert.equal(protection.originalBefore.status,'?? FRONTEND_UI_MULTISKILL_AUDIT.md');assert.equal(protection.originalBefore.trackedDiff,'');assert.equal(protection.originalBefore.stagedDiff,'');assert.deepEqual(protection.demosBefore,protection.demosAfter);
 assert.equal(git('diff',r.previousReviewCommit,'--numstat','--','.',':(exclude)review-artifacts'),'');assert.equal(git('branch','--show-current'),'temp/ui-ux-audit-review');
});
test('17: green tint, illustration, page-family constraints and C/D owner decisions remain explicit',()=>{
 assert.match(get('R-058').action,/preserving its green tint/);assert.match(get('R-064').evidence,/preserve the illustration/);assert.match(get('R-063').risk,/compact Admin rows and readable legal/);
 for(const x of r.recommendations.filter(x=>x.finding==='F-007'))assert.equal(x.status,'HOLD');for(let i=47;i<=55;i++)assert.equal(get(`R-${String(i).padStart(3,'0')}`).status,'REJECTED');
});
test('18: every current record has metadata, matching ledger status and an unbroken public handoff',()=>{
 const ledger=fs.readFileSync(p.join(root,'REVIEW_LEDGER.md'),'utf8');for(const x of r.recommendations){for(const key of ['action','component','category','priority','status','finding','skills','evidence','benefit','risk','refs','demonstrated','kind','ownerDecision','provenance'])assert.ok(x[key]?.length,`${x.id} ${key}`);assert.ok(ledger.includes(`| ${x.action} | ${x.status} |`));}
 const paths=[p.join(root,'MASTER_RECOMMENDATIONS.md'),p.join(root,'REVIEW_LEDGER.md'),p.join(dir,'TASK_REVIEW_001_CORRECTION_001.md')];for(const file of paths)for(const m of fs.readFileSync(file,'utf8').matchAll(/\]\(([^)]+)\)/g)){const target=m[1].split('#')[0];if(!target||target.startsWith('https://github.com/'))continue;assert.ok(fs.existsSync(p.resolve(p.dirname(file),target)),`${p.basename(file)} -> ${target}`);}
});
test('19: correction report has A-M, source-coverage limitations and explicit requirements',()=>{
 const report=fs.readFileSync(p.join(dir,'TASK_REVIEW_001_CORRECTION_001.md'),'utf8');for(const ch of 'ABCDEFGHIJKLM')assert.match(report,new RegExp(`^## ${ch}\\.`,'m'));assert.match(report,/REC-16/);assert.match(report,/NOT TESTED/);assert.match(report,/not.*independent.*approval/i);assert.match(report,/source-import/);
});
test('20: new public artifacts contain no private paths, loopback URLs or credential signatures',()=>{
 const files=walk(dir).filter(f=>f!==__filename);files.push(p.join(root,'MASTER_RECOMMENDATIONS.md'),p.join(root,'REVIEW_LEDGER.md'));
 const patterns=[/\b[A-Z]:[\\/]/i,/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i,/\bgh[pousr]_[A-Za-z0-9]{20,}\b/,/\bgithub_pat_[A-Za-z0-9_]{20,}\b/,/\bBearer\s+[A-Za-z0-9._-]{20,}\b/,/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\b/];
 for(const file of files){const text=fs.readFileSync(file,'utf8');assert.ok(!/\.env(?:\.|$)|cookies|profile\.zip|backup\.sql/i.test(p.basename(file)));for(const pattern of patterns)assert.ok(!pattern.test(text),`${p.relative(root,file)} matches ${pattern}`);}
});
