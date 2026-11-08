const fs=require('node:fs'),p=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{test}=require('node:test');
const out=__dirname,repo=p.resolve(out,'../..'),parent='70636d7bce53d8c2783d00142c54e1ee7c2ff222',base='9d86db46b1134a3755a2e269252b1ee1234f2570';
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'),json=f=>JSON.parse(read(p.join(out,f)));
const old=JSON.parse(read(p.join(out,'../TASK_004_DECISION_001/REGISTER.json'))),next=json('REGISTER.json'),r=next.recommendations.find(r=>r.id==='R-029'),delta=json('DECISION_CHANGE.json');
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=file=>cp.execFileSync('git',['-C',repo,'show',parent+':'+file],{maxBuffer:16e6}).toString().replace(/\r\n/g,'\n');
function inventory(dir){
 const files=[];
 function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){
 if(['.git','node_modules'].includes(e.name)||e.name.startsWith('browser-profile'))continue;
 const file=p.join(d,e.name);if(e.isDirectory())walk(file);else files.push({path:p.relative(dir,file).replaceAll('\\','/'),sha256:hash(fs.readFileSync(file))});
 }}
 walk(dir);files.sort((a,b)=>a.path.localeCompare(b.path));
 return {files:files.length,aggregateSha256:hash(JSON.stringify(files))};
}
function originalState(dir){
 const g=(...args)=>cp.execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
 return {head:g('rev-parse','HEAD'),branch:g('branch','--show-current'),status:g('status','--porcelain'),trackedDiff:g('diff','--numstat'),stagedDiff:g('diff','--cached','--numstat'),auditSha256:hash(fs.readFileSync(p.join(dir,'FRONTEND_UI_MULTISKILL_AUDIT.md')))};
}
test('one complete record changed; all other 105 retain their full contents',()=>{
 assert.equal(next.recommendations.length,106);
 const changed=next.recommendations.filter((r,i)=>JSON.stringify(r)!==JSON.stringify(old.recommendations[i])).map(r=>r.id);
 assert.deepEqual(changed,['R-029']);
 assert.deepEqual(delta.before,old.recommendations.find(r=>r.id==='R-029'));assert.deepEqual(delta.after,r);
 const expected={...delta.before,status:r.status,ownerDecision:r.ownerDecision,demonstrated:r.demonstrated,evidence:r.evidence,verificationEvidence:r.verificationEvidence,ownerDecisionRecord:r.ownerDecisionRecord};
 assert.deepEqual(r,expected);
});
test('exact rejection reason, historical demonstration and delegated decision',()=>{
 const exact='R-029 was rejected after technical review and owner-delegated evaluation. The keyboard-only instant-scroll alternative showed measurable timing improvement but insufficient practical UX benefit to justify changing the existing consistent smooth-scroll behavior and adding input-classification logic. Existing focus-loss behavior remains a separate limitation. Original Back to Top scrolling is preferred.';
 assert.equal(r.status,'REJECTED');assert.equal(r.ownerDecision,exact);assert.equal(r.ownerDecisionRecord.reason,exact);
 assert(read(p.join(out,'OWNER_DECISION.txt')).includes(exact));
 assert.match(r.demonstrated,/TASK_005.*demonstrated and tested.*rejected/);
 assert.match(r.evidence,/120 primary trusted-input/);
});
test('held recommendations, unreviewed R-030 and counts reconcile',()=>{
 for(const id of ['R-025','R-026','R-027','R-028'])assert.equal(next.recommendations.find(r=>r.id===id).status,'HOLD');
 assert.equal(next.recommendations.find(r=>r.id==='R-030').status,'UNREVIEWED');
 const counts={SELECTED:0,REJECTED:0,HOLD:0,UNREVIEWED:0,'IN REVIEW':0};
 for(const r of next.recommendations)counts[r.status]++;
 assert.deepEqual(counts,{SELECTED:25,REJECTED:11,HOLD:7,UNREVIEWED:63,'IN REVIEW':0});
 assert.deepEqual(next.counts.statuses,counts);assert.deepEqual(json('COUNTS.json'),next.counts);
 assert.equal(next.counts.retained,106);
});
test('source fidelity, exact duplicates, occurrences and implementation relationships preserved',()=>{
 for(const key of Object.keys(old).filter(k=>!['counts','recommendations','authority','previousReviewCommit'].includes(k)))assert.deepEqual(next[key],old[key],key);
 assert.equal(next.counts.rawAtomicSourceOccurrences,119);assert.equal(next.counts.exactDuplicateOccurrencesRemoved,13);
});
test('authority points to current snapshots and preserves previous decision sources',()=>{
 assert.equal(next.authority.task,'TASK_005_DECISION_001');assert.equal(next.previousReviewCommit,parent);
 assert.equal(next.authority.previousRegister,'../TASK_004_DECISION_001/REGISTER.json');
 for(const file of Object.values(next.authority.decisionHistory))assert(fs.existsSync(p.resolve(out,file)));
 assert.equal(next.authority.decisionHistory.R024,'../TASK_004_DECISION_001/OWNER_DECISION.txt');
});
test('four technical links are pinned, present and checksum-identical historical evidence',()=>{
 assert.equal(Object.keys(r.verificationEvidence).length,4);
 for(const link of Object.values(r.verificationEvidence)){
 assert(link.includes('/blob/'+parent+'/review-artifacts/TASK_005/'));
 const file=link.split('/blob/'+parent+'/')[1];
 assert.equal(read(p.join(repo,file)),blob(file));
 }
});
test('all other 105 master recommendation blocks preserved',()=>{
 const file='review-artifacts/MASTER_RECOMMENDATIONS.md',current=read(p.join(repo,file)),previous=blob(file);
 const blocks=s=>new Map(s.split(/(?=^### R-\d{3}$)/m).slice(1).map(b=>[b.slice(4,9),b.trim()]));
 const a=blocks(current),b=blocks(previous);assert.equal(a.size,106);
 for(const [id,block]of b)if(id!=='R-029')assert.equal(a.get(id),block,id);
 assert(a.get('R-029').includes(r.ownerDecision));assert(a.get('R-029').includes(r.demonstrated));
 const counts=JSON.parse(current.match(/## Counts\n\n```json\n([\s\S]+?)\n```/)[1]);assert.deepEqual(counts,next.counts);
});
test('all other 105 ledger rows preserved and R-029 records tested rejection',()=>{
 const file='review-artifacts/REVIEW_LEDGER.md',current=read(p.join(repo,file)),previous=blob(file);
 const rows=s=>s.split('\n').filter(l=>/^\| \[R-\d/.test(l));
 for(const row of rows(previous))if(!row.startsWith('| [R-029]'))assert(rows(current).includes(row));
 const row=rows(current).find(l=>l.startsWith('| [R-029]'));
 assert(row.includes('| REJECTED | TASK_005'));for(const target of ['TASK_REVIEW_005.md','GALLERY.md','CHANGES.diff','matrix.csv'])assert(row.includes(target));
});
test('Git changes restricted to authorized current documents and new decision directory',()=>{
 const allowed=f=>['review-artifacts/MASTER_RECOMMENDATIONS.md','review-artifacts/REVIEW_LEDGER.md'].includes(f)||f.startsWith('review-artifacts/TASK_005_DECISION_001/');
 const paths=git('diff',parent,'--name-only').split('\n').filter(Boolean);
 for(const file of paths)assert(allowed(file),file);
 const untracked=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
 for(const file of untracked)assert(allowed(file),file);
});
test('historical TASK_005 and all application Git objects remain unchanged',()=>{
 const files=git('ls-tree','-r','--name-only',parent,'--','review-artifacts/TASK_005').split('\n');
 assert.equal(files.length,54);
 for(const file of files){
 const oid=git('rev-parse',parent+':'+file),b=cp.execFileSync('git',['-C',repo,'cat-file','blob',oid],{maxBuffer:16e6});
 assert.equal(hash(b),hash(fs.readFileSync(p.join(repo,file))),file);
 }
 assert.equal(git('diff',parent,'--name-only','--','.',':(exclude)review-artifacts'),'');
});
test('recorded original and all six completed workspace fingerprints match',()=>{
 const g=json('GIT_PROTECTION.json');assert.deepEqual(g.originalBefore,g.originalAfter);
 assert.equal(g.originalBefore.head,base);assert.equal(g.originalBefore.branch,'main');
 assert.equal(g.originalBefore.status,'?? FRONTEND_UI_MULTISKILL_AUDIT.md');
 assert.equal(g.originalBefore.trackedDiff,'');assert.equal(g.originalBefore.stagedDiff,'');
 assert.deepEqual(g.workspacesBefore,g.workspacesAfter);assert.equal(g.workspacesBefore.length,6);
});
test('live original repository protection',{skip:!process.env.BRACU_ORIGINAL_REPO},()=>{
 assert.deepEqual(originalState(process.env.BRACU_ORIGINAL_REPO),json('GIT_PROTECTION.json').originalBefore);
});
test('live six completed workspace inventories',{skip:!process.env.BRACU_REVIEW_EXTERNAL_ROOT},()=>{
 for(const item of json('GIT_PROTECTION.json').workspacesBefore)assert.deepEqual(inventory(p.join(process.env.BRACU_REVIEW_EXTERNAL_ROOT,item.workspace)),{files:item.files,aggregateSha256:item.aggregateSha256},item.workspace);
});
test('report distinguishes historical tests, preserves limitations and stops',()=>{
 const report=read(p.join(out,'DECISION_REPORT.md'));
 assert.match(report,/Application and browser tests were not rerun/);assert.match(report,/Existing focus loss/);assert.match(report,/STOP after publication/);
 assert(report.includes(r.ownerDecision));
});
module.exports={inventory,originalState};
