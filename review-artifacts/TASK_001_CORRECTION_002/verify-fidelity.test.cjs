const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),p=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const dir=__dirname,root=p.dirname(dir),repo=p.dirname(root),load=f=>JSON.parse(fs.readFileSync(p.join(dir,f),'utf8'));
const reg=load('evidence/REGISTER.json'),delta=load('evidence/RECONCILIATION.json'),fidelity=load('evidence/SOURCE_FIDELITY.json'),inv=load('evidence/SOURCE_INVENTORY.json'),coverage=load('evidence/SOURCE_COMPLETENESS.json'),protection=load('evidence/GIT_PROTECTION.json');
const previous=JSON.parse(fs.readFileSync(p.join(root,'TASK_001_CORRECTION_001/evidence/REGISTER.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=id=>fs.readFileSync(p.resolve(dir,inv.find(s=>s.id===id).file),'utf8');
const exactFile=p.join(dir,fidelity.publicArchive.file),publicBytes=fs.readFileSync(exactFile),publicText=publicBytes.toString('utf8');
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const get=id=>reg.recommendations.find(r=>r.id===id);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);
const privateAvailable=Boolean(process.env.IMPECCABLE_PRIVATE_ARCHIVE&&process.env.IMPECCABLE_DELIVERED_SOURCE);
test('01: exact private archive byte-matches the owner-delivered source',{skip:!privateAvailable},()=>{
 const input=fs.readFileSync(process.env.IMPECCABLE_DELIVERED_SOURCE),archive=fs.readFileSync(process.env.IMPECCABLE_PRIVATE_ARCHIVE);assert.deepEqual(archive,input);assert.equal(input.length,fidelity.inputBytes);assert.equal(sha(input),fidelity.inputSha256);assert.equal(sha(archive),fidelity.privateArchive.sha256);assert.ok(!p.resolve(process.env.IMPECCABLE_PRIVATE_ARCHIVE).startsWith(repo+p.sep));
});
test('02: published copy differs only by seven documented private path-prefix removals',{skip:!privateAvailable},()=>{
 const input=fs.readFileSync(process.env.IMPECCABLE_DELIVERED_SOURCE).toString('utf8');let expected=input;
 for(const redaction of [...fidelity.redactions].reverse()){const removed=input.slice(redaction.originalCharacterStart,redaction.originalCharacterStart+redaction.removedCharacters);assert.equal(sha(Buffer.from(removed)),redaction.removedTextSha256);expected=expected.slice(0,redaction.originalCharacterStart)+redaction.replacement+expected.slice(redaction.originalCharacterStart+redaction.removedCharacters);}
 assert.deepEqual(Buffer.from(expected,'utf8'),publicBytes);assert.equal(fidelity.redactions.length,7);
});
test('03: UTF-8 bytes and original CRLF remain preserved with explicit no-normalization attribute',()=>{
 assert.equal(sha(publicBytes),fidelity.publicArchive.sha256);assert.equal(publicBytes.length,5649);assert.equal((publicText.match(/\r\n/g)||[]).length,30);assert.equal((publicText.match(/\n/g)||[]).length,30);
 assert.match(fs.readFileSync(p.join(dir,'evidence/sources/.gitattributes'),'utf8'),/^S12_IMPECCABLE_VERBATIM_SANITIZED\.txt -text$/m);assert.match(git('check-attr','text','--',p.relative(repo,exactFile)),/: text: unset$/);
});
test('04: every original external reference URL is restored verbatim',()=>{
 const urls=[...publicText.matchAll(/https:\/\/[^\s)>]+/g)].map(m=>m[0]);assert.deepEqual(urls,fidelity.externalUrls);assert.deepEqual(urls,['https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/','https://www.w3.org/WAI/ARIA/apg/patterns/tabs/','https://www.w3.org/WAI/WCAG22/Understanding/reflow.html','https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html']);
});
test('05: code-reference paths and historical lines survive sanitization without private prefixes',()=>{
 assert.equal(fidelity.localReferences.length,7);for(const ref of fidelity.localReferences){assert.ok(publicText.includes(`<${ref.repoRelativePath}:${ref.historicalLine}>`));assert.ok(fs.existsSync(p.join(repo,ref.repoRelativePath)));assert.ok(!ref.repoRelativePath.includes('..'));assert.ok(ref.baseCommitReference.includes(`/blob/${reg.base}/${ref.repoRelativePath}#L${ref.historicalLine}`));}
});
test('06: source roles distinguish actual original, structured restatement and later instructions',()=>{
 assert.equal(inv.find(s=>s.id==='S12').role,'PRIMARY HISTORICAL ORIGINAL');assert.match(inv.find(s=>s.id==='S10').role,/SECONDARY STRUCTURED RESTATEMENT/);assert.match(inv.find(s=>s.id==='S11').role,/LATER EXTRACTION\/CORRECTION INSTRUCTIONS/);assert.equal(inv.find(s=>s.id==='S13').role,'LATER CORRECTION INSTRUCTIONS');
});
test('07: all 28 accepted clauses remain supported one-to-one by exact original substrings',()=>{
 const old=JSON.parse(fs.readFileSync(p.join(root,'TASK_001_CORRECTION_001/evidence/RECONCILIATION.json'),'utf8'));assert.equal(delta.support.length,28);assert.equal(delta.all28Supported,true);assert.deepEqual(delta.support.map(s=>s.recommendation).sort(),old.recoveredActions.map(s=>s.recommendation).sort());
 for(const item of delta.support){assert.equal(item.result,'SUPPORTED');assert.equal(item.verbatimSupport.source,'S12');assert.ok(publicText.split(/\r?\n/)[item.verbatimSupport.start-1].includes(item.verbatimSupport.quote));assert.ok(item.previousStructuredQuote.length);}
});
test('08: all current source quotations match full lines or explicitly identified exact substrings',()=>{
 for(const o of reg.occurrences){const text=source(o.source).split(/\r?\n/).slice(o.start-1,o.end).join('\n');if(o.quoteMode==='EXACT_SUBSTRING_OF_LINE')assert.ok(text.includes(o.quote),o.id);else assert.equal(text,o.quote,o.id);}
});
test('09: all 106 IDs and every owner disposition match the accepted reconciliation',()=>{
 assert.deepEqual(reg.recommendations.map(r=>r.id),previous.recommendations.map(r=>r.id));for(const r of previous.recommendations)assert.equal(get(r.id).status,r.status,r.id);assert.deepEqual(delta.newRecords,[]);assert.deepEqual(delta.removedRecords,[]);assert.deepEqual(delta.statusChanges,[]);
});
test('10: accepted raw/deduplicated/status counts remain unchanged',()=>{
 assert.equal(reg.occurrences.length,119);assert.equal(reg.recommendations.length,106);assert.equal(reg.counts.rawAtomicSourceOccurrences,119);assert.equal(reg.counts.exactDuplicateOccurrencesRemoved,13);assert.equal(reg.duplicates.reduce((n,d)=>n+d.removed,0),13);assert.deepEqual(reg.counts.statuses,{SELECTED:23,REJECTED:9,HOLD:7,UNREVIEWED:67,'IN REVIEW':0});assert.equal(reg.counts.newRecordsThisCorrection,0);
});
test('11: derivative S10 is not double-counted as an independent new audit',()=>{
 assert.equal(reg.occurrences.filter(o=>o.source==='S10').length,0);assert.equal(reg.occurrences.filter(o=>o.source==='S12').length,28);assert.equal(reg.occurrences.filter(o=>o.source==='S13').length,0);assert.match(reg.countingPolicy,/citation replacement/);
});
test('12: four source-supported scope clarifications are faithful',()=>{
 assert.equal(get('R-094').action,'Move login metrics into the Admin details drawer');assert.ok(!get('R-094').action.includes('secondary'));assert.equal(get('R-103').action,'Give every heading an explicit font fallback');assert.match(get('R-104').component,/roadmap, Course List and report/);assert.match(get('R-065').evidence,/explicitly includes course list and report/);assert.match(get('R-065').evidence,/no separate remaining Course List cause or residual defect/);
 assert.deepEqual(delta.recordClarifications.map(c=>c.id).sort(),['R-065','R-094','R-103','R-104']);
});
test('13: accepted alternatives and exact-only duplicate identity proofs are preserved',()=>{
 for(const pair of [['R-056','R-090'],['R-061','R-097'],['R-009','R-105']])assert.notEqual(get(pair[0]).action,get(pair[1]).action);
 for(const d of reg.duplicates){const os=d.occurrences.map(id=>reg.occurrences.find(o=>o.id===id));for(const o of os)assert.deepEqual(o.identity,os[0].identity);assert.ok(d.proof.length>100);}
 assert.deepEqual(reg.duplicates.map(d=>[d.retained,d.removed]),previous.duplicates.map(d=>[d.retained,d.removed]));
});
test('14: source inventory hashes/line counts and all-source mapping reconcile',()=>{
 for(const s of inv){const text=source(s.id);assert.equal(sha(Buffer.from(text)),s.sanitizedSha256,s.id);const c=coverage.find(c=>c.source===s.id);assert.equal(text.split(/\r?\n/).length,s.lineCount);assert.equal(c.lineDisposition.length,s.lineCount);assert.equal(c.atomicOccurrences,reg.occurrences.filter(o=>o.source===s.id).length);assert.equal(c.retainedPrimary,reg.recommendations.filter(r=>r.refs[0].source===s.id).length);assert.ok(c.lineDisposition.every(l=>l.disposition));}
 for(const o of reg.occurrences)assert.ok(coverage.find(c=>c.source===o.source).lineDisposition[o.start-1].recommendations.includes(o.recommendation));
});
test('15: both historical task directories remain byte-identical to the accepted parent',()=>{
 for(const f of protection.previousEvidenceFiles){const b=fs.readFileSync(p.join(repo,f.path));assert.equal(sha(b),f.sha256,f.path);const prior=cp.execFileSync('git',['-C',repo,'cat-file','blob',`${reg.previousReviewCommit}:${f.path}`]);assert.equal(sha(b),sha(prior),f.path);}assert.equal(protection.previousEvidenceFiles.length,31);
});
test('16: original application and completed demos are unchanged',()=>{
 assert.deepEqual(protection.originalBefore,protection.originalAfter);assert.equal(protection.originalBefore.head,reg.base);assert.equal(protection.originalBefore.branch,'main');assert.equal(protection.originalBefore.status,'?? FRONTEND_UI_MULTISKILL_AUDIT.md');assert.equal(protection.originalBefore.trackedDiff,'');assert.equal(protection.originalBefore.stagedDiff,'');assert.deepEqual(protection.demosBefore,protection.demosAfter);assert.equal(git('diff',reg.previousReviewCommit,'--numstat','--','.',':(exclude)review-artifacts'),'');
});
test('17: only intended review artifacts are staged or tracked as changes',()=>{
 const allowed=s=>s==='review-artifacts/MASTER_RECOMMENDATIONS.md'||s==='review-artifacts/REVIEW_LEDGER.md'||s.startsWith('review-artifacts/TASK_001_CORRECTION_002/');
 for(const args of [['diff',reg.previousReviewCommit,'--name-only'],['diff','--cached','--name-only']])for(const file of git(...args).split('\n').filter(Boolean))assert.ok(allowed(file),file);assert.equal(git('branch','--show-current'),'temp/ui-ux-audit-review');
});
test('18: public artifacts contain no private paths, session files or credential signatures',()=>{
 const files=walk(dir).filter(f=>f!==__filename);files.push(p.join(root,'MASTER_RECOMMENDATIONS.md'),p.join(root,'REVIEW_LEDGER.md'));
 const patterns=[/\b[A-Z]:[\\/]/i,/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i,/\bgh[pousr]_[A-Za-z0-9]{20,}\b/,/\bgithub_pat_[A-Za-z0-9_]{20,}\b/,/\bBearer\s+[A-Za-z0-9._-]{20,}\b/];
 for(const file of files){assert.ok(!/\.env(?:\.|$)|cookies|profile\.zip|backup\.sql|S12_IMPECCABLE_ORIGINAL_EXACT/i.test(p.basename(file)));const text=fs.readFileSync(file,'utf8');for(const re of patterns)assert.ok(!re.test(text),`${p.relative(root,file)} matches ${re}`);}
 assert.equal(fidelity.privateArchive.excludedFromPublicRepositoryAndPackage,true);
});
test('19: ledger matches all records and source-role corrections are stated in the master',()=>{
 const ledger=fs.readFileSync(p.join(root,'REVIEW_LEDGER.md'),'utf8'),master=fs.readFileSync(p.join(root,'MASTER_RECOMMENDATIONS.md'),'utf8');for(const r of reg.recommendations)assert.ok(ledger.includes(`| ${r.action} | ${r.status} |`),r.id);assert.match(master,/S12 is the actual original audit/);assert.match(master,/S10 is the previous ChatGPT-restructured version/);assert.match(master,/full raw individual transcripts remain unavailable/);
});
test('20: report has A-M, all 15 requirements, comparison and independent-review handoff',()=>{
 const text=fs.readFileSync(p.join(dir,'TASK_001_CORRECTION_002.md'),'utf8');for(const ch of 'ABCDEFGHIJKLM')assert.match(text,new RegExp(`^## ${ch}\\.`,'m'));assert.match(text,/FID-15/);assert.match(text,/NOT TESTED/);assert.match(text,/not.*independent.*approval/i);assert.match(text,/Before \/ after/);
});
test('21: current public handoff links resolve without local computer dependencies',()=>{
 for(const file of [p.join(root,'MASTER_RECOMMENDATIONS.md'),p.join(root,'REVIEW_LEDGER.md'),p.join(dir,'TASK_001_CORRECTION_002.md')])for(const m of fs.readFileSync(file,'utf8').matchAll(/\]\(([^)]+)\)/g)){const target=m[1].split('#')[0];if(!target||target.startsWith('https://github.com/'))continue;assert.ok(fs.existsSync(p.resolve(p.dirname(file),target)),`${p.basename(file)} -> ${target}`);}
});
test('22: historical manual score and the restored workflow sentence are archived, not executed',()=>{
 assert.match(publicText,/12\/20/);assert.match(publicText,/detector couldn’t start/);assert.match(publicText,/manual code and browser evidence/);assert.match(publicText,/rerun `\$impeccable audit` after the fixes/);
 const line=publicText.split(/\r?\n/).findIndex(l=>l.includes('**My recommendation:**'))+1;const mapped=coverage.find(c=>c.source==='S12').lineDisposition[line-1];assert.match(mapped.disposition,/CONDITIONAL WORKFLOW/);assert.equal(mapped.recommendations.length,0);
});
