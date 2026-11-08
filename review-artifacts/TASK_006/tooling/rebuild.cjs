const fs=require('node:fs'),p=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const [checkoutArg,outArg]=process.argv.slice(2);
if(!checkoutArg||!outArg)throw Error('Usage: node rebuild.cjs <Git-checkout> <new-external-output>');
const repo=fs.realpathSync(checkoutArg),out=p.resolve(outArg);
assert(!fs.existsSync(out)&&out!==repo&&!out.startsWith(repo+p.sep),'Use a new external directory');
const git=(...args)=>cp.execFileSync('git',['-C',repo,...args],{maxBuffer:32e6});
const base='9d86db46b1134a3755a2e269252b1ee1234f2570',selected='426a1cebac9a617d7ef5ce27eeb2782aed2c70ee';
for(const line of git('ls-tree','-r',base).toString().trimEnd().split('\n')){
 const [meta,file]=line.split('\t'),b=git('cat-file','blob',meta.split(' ')[2]);
 for(const v of ['original','before','after']){const dest=p.join(out,v,file);fs.mkdirSync(p.dirname(dest),{recursive:true});fs.writeFileSync(dest,b)}
}
const prefix='review-artifacts/TASK_003/source/r023/';
for(const line of git('ls-tree','-r',selected,'--',prefix).toString().trimEnd().split('\n')){
 const [meta,file]=line.split('\t'),rel=file.slice(prefix.length),b=git('cat-file','blob',meta.split(' ')[2]);
 for(const v of ['before','after'])fs.writeFileSync(p.join(out,v,rel),b);
}
fs.copyFileSync(p.join(__dirname,'../source/after/js/app.js'),p.join(out,'after/js/app.js'));
fs.copyFileSync(p.join(__dirname,'../source/after/tests/main-integration.test.js'),p.join(out,'after/tests/main-integration.test.js'));
for(const file of ['serve.cjs','cdp.mjs','measure.mjs'])fs.copyFileSync(p.join(__dirname,file),p.join(out,file));
fs.mkdirSync(p.join(out,'evidence'),{recursive:true});
console.log('Rebuilt Original and matched selected Before/After from pinned Git blobs.');
