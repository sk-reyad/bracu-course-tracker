const fs = require('node:fs');
const path = require('node:path');
const child = require('node:child_process');
const workspace = fs.realpathSync(process.argv[2]);
const dest = path.join(workspace, 'evidence');
fs.mkdirSync(dest, {recursive: true});
for (const variant of ['before', 'after']) {
  const cwd = path.join(workspace, variant);
  const tests = fs.readdirSync(path.join(cwd, 'tests')).filter(f => f.endsWith('.test.js')).sort();
  const result = child.spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests.map(f => 'tests/' + f)], {
    cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024
  });
  let log = result.stdout + result.stderr;
  for (const spelling of [cwd.replaceAll('\\','\\\\'), cwd, cwd.replaceAll('\\','/')])
    log = log.replaceAll(spelling, '<' + variant + '>');
  fs.writeFileSync(path.join(dest, variant + '-tests.tap'), log.trimEnd() + '\n');
  console.log(variant, log.split('\n').filter(s => /^# (tests|pass|fail|skipped) /.test(s)).join(', '));
  if (result.status !== 0) process.exitCode = 1;
}
