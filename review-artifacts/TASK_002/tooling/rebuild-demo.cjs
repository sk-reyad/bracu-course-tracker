const fs=require('node:fs'),p=require('node:path'),cp=require('node:child_process');
const base='9d86db46b1134a3755a2e269252b1ee1234f2570';
const [checkoutArg,outputArg]=process.argv.slice(2);
if(!checkoutArg||!outputArg)throw Error('Usage: node rebuild-demo.cjs <public-repository-checkout> <new-external-output-directory>');
const checkout=fs.realpathSync(checkoutArg),output=p.resolve(outputArg),artifact=p.resolve(__dirname,'..');
if(output===checkout||output.startsWith(checkout+p.sep)||fs.existsSync(output))throw Error('Output must be new and outside the checkout');
cp.execFileSync('git',['-C',checkout,'cat-file','-e',base+'^{commit}']);
fs.mkdirSync(output,{recursive:true});const tar=p.join(output,'baseline.tar');
cp.execFileSync('git',['-C',checkout,'archive','--format=tar','--output',tar,base]);
const original=p.join(output,'original');fs.mkdirSync(original);
cp.execFileSync('tar',['-xf',tar,'-C',original]);
for(const variant of ['option-a','native']){const target=p.join(output,variant);fs.cpSync(original,target,{recursive:true});fs.cpSync(p.join(artifact,'source',variant),target,{recursive:true});}
for(const file of ['serve.cjs','cdp.mjs','verify-browser.mjs','verify-extra.mjs'])fs.copyFileSync(p.join(__dirname,file),p.join(output,file));
console.log('Created tracked-base three-way preview. Run node serve.cjs from the new output directory. No checkout files changed.');
