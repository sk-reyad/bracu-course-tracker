const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');

const base = '9d86db46b1134a3755a2e269252b1ee1234f2570';
const [checkoutArg, outputArg] = process.argv.slice(2);
if (!checkoutArg || !outputArg) throw Error('Usage: node rebuild.cjs <git-checkout> <new-external-directory>');
const checkout = fs.realpathSync(checkoutArg);
const output = path.join(fs.realpathSync(path.dirname(path.resolve(outputArg))), path.basename(outputArg));
assert(!fs.existsSync(output) && output !== checkout && !output.startsWith(checkout + path.sep));
const git = (...args) => execFileSync('git', ['-C', checkout, ...args], {maxBuffer: 32 * 1024 * 1024});
const entries = git('ls-tree', '-r', base).toString().trimEnd().split('\n');
for (const entry of entries) {
  const [meta, name] = entry.split('\t');
  assert(/^100(644|755) blob /.test(meta));
  const blob = git('cat-file', 'blob', meta.split(' ')[2]);
  for (const version of ['before', 'after']) {
    const dest = path.join(output, version, name);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, version === 'after' && name === 'js/app.js'
      ? fs.readFileSync(path.join(__dirname, '../source/after/js/app.js')) : blob);
  }
}
for (const name of ['serve.cjs', 'measure.mjs', 'cdp.mjs']) {
  fs.copyFileSync(path.join(__dirname, name), path.join(output, name));
}
console.log('Rebuilt both variants from ' + entries.length + ' pinned blobs.');
