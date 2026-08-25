const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const readLines = file => fs.readFileSync(path.join(root, file), 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'));

test('local ignore rules protect private and generated deployment artifacts', () => {
  const rules = new Set(readLines('.gitignore'));

  for (const rule of ['.env', '.env.*', '.vercel/', '.superpowers/', '.tmp/', 'tmp/', '*.pdf']) {
    assert.ok(rules.has(rule), `.gitignore must include ${rule}`);
  }
  assert.ok(rules.has('!.env.example'), 'the public environment template must remain trackable');
});

test('Vercel deploys only the runtime website surface', () => {
  const rules = new Set(readLines('.vercelignore'));

  for (const rule of [
    '.env*', '.superpowers/', '.tmp/', 'tmp/', 'tests/', 'docs/', 'scripts/',
    'supabase/', '*.md', '*.pdf'
  ]) {
    assert.ok(rules.has(rule), `.vercelignore must include ${rule}`);
  }

  for (const runtimePath of ['assets/', 'css/', 'js/', 'shared/', 'index.html', 'auth.html']) {
    assert.ok(!rules.has(runtimePath), `${runtimePath} must remain deployable`);
  }
});

test('retired design prototypes and unused reference assets are absent', () => {
  const retiredArtifacts = [
    'maintenance-preview.html',
    'maintenance-headline-options.html',
    'css/maintenance-headline-options.css',
    'js/maintenance-headline-options-state.js',
    'js/maintenance-headline-options.js',
    'assets/arrowhead-right-svgrepo-com.svg'
  ];
  const deployRules = new Set(readLines('.vercelignore'));

  for (const artifact of retiredArtifacts) {
    assert.equal(fs.existsSync(path.join(root, artifact)), false, `${artifact} must be removed`);
    assert.equal(deployRules.has(artifact), false, `${artifact} no longer needs a deploy exception`);
  }
});
