const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),p=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const original=p.join(__dirname,'original'),a=p.join(__dirname,'option-a'),b=p.join(__dirname,'native'),old=p.resolve(__dirname,'../bracu-ui-demo-9d86db46');
const read=(root,file)=>fs.readFileSync(p.join(root,file),'utf8').replace(/\r\n/g,'\n'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);
test('all original tracked files match verified base commit (line-ending-neutral export)',()=>{
 const repo=p.resolve(__dirname,'../bracu-sequential-review-20261107'),base='9d86db46b1134a3755a2e269252b1ee1234f2570';
 const paths=cp.execFileSync('git',['-C',repo,'ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n');
 for(const file of paths){const bytes=cp.execFileSync('git',['-C',repo,'cat-file','blob',`${base}:${file}`],{maxBuffer:10*1024*1024});const actual=fs.readFileSync(p.join(original,file));if(!actual.equals(bytes))assert.equal(actual.toString('utf8').replace(/\r\n/g,'\n'),bytes.toString('utf8').replace(/\r\n/g,'\n'),file);}
});
test('only three UI source files differ in A; only those plus owning test differ in B',()=>{
 for(const [root,allowed]of [[a,['index.html','css/style.css','js/app.js']],[b,['index.html','css/style.css','js/app.js','tests/interaction-layer.test.js']]])for(const file of walk(original)){const rel=p.relative(original,file).replaceAll(p.sep,'/');if(!allowed.includes(rel))assert.equal(sha(fs.readFileSync(file)),sha(fs.readFileSync(p.join(root,rel))),rel);}
});
test('completed A/B/C/D workspaces and baseline remain byte-identical',()=>{
 const before=JSON.parse(fs.readFileSync(p.join(__dirname,'preserved-before.json'),'utf8'));for(const name of ['baseline','improved'])for(const file of before[name])assert.equal(sha(fs.readFileSync(p.join(old,name,file.path))),file.sha256,file.path);
});
test('Option A contains the selected custom modal helpers exactly, no native architecture',()=>{
 const selected=read(p.join(old,'improved'),'js/app.js'),actual=read(a,'js/app.js');assert.equal(actual.slice(actual.indexOf('function activeTrackerModal()'),actual.indexOf('function downloadPdfReport()')),selected.slice(selected.indexOf('function activeTrackerModal()'),selected.indexOf('function downloadPdfReport()')));assert.ok(!actual.includes('nativeModalSessions'));
});
test('B has four named native hosts and no nested duplicate ARIA dialogs',()=>{
 const html=read(b,'index.html');assert.equal((html.match(/<dialog class="modal-backdrop"/g)||[]).length,4);assert.equal((html.match(/role="dialog"/g)||[]).length,0);for(const id of ['dashboardModal','settingsModal','courseModal','departmentModal'])assert.match(html,new RegExp(`<dialog[^>]+id="${id}"[^>]+aria-label=`));
});
test('B uses native modality without the custom A inert manager/focus redirect',()=>{
 const js=read(b,'js/app.js');assert.match(js,/modal\.showModal\(\)/);assert.ok(!js.includes('modalBackgroundInert'));assert.ok(!js.includes('modalFocusStack'));assert.ok(!js.includes('function syncModalBackground'));assert.match(js,/One Escape belongs to its originally focused dialog/);assert.match(js,/nativeEscapeOwner\.requestClose/);
});
test('all academic/save/PDF/support implementations remain unchanged',()=>{
 const before=read(original,'js/app.js'),after=read(b,'js/app.js');
 for(const [start,end]of [['function saveCourseFromForm(','function removeCourse('],['function saveDepartmentFromForm(','function removeDepartment('],['function downloadPdfReport(','function bindEvents(']])assert.equal(after.slice(after.indexOf(start),after.indexOf(end)),before.slice(before.indexOf(start),before.indexOf(end)),start);
 assert.equal(read(original,'js/support-widget.js'),read(b,'js/support-widget.js'));
});
test('no B/C/D visual or motion candidate changes leaked into the alternative',()=>{
 for(const root of [a,b]){const html=read(root,'index.html'),js=read(root,'js/app.js'),css=read(root,'css/style.css');assert.ok(!html.includes('demo-polish'));assert.ok(!js.includes('preferredScrollBehavior'));assert.ok(!css.includes('[data-stream-open]'));assert.ok(!css.includes('data-demo-polish'));}
});
