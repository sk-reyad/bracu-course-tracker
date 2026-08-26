const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('public copy uses canonical spelling and product terminology', () => {
  const index = read('index.html');
  const privacy = read('privacy.html');
  const terms = read('terms.html');
  const auth = read(path.join('js', 'auth.js'));
  const readme = read('README.md');

  for (const source of [index, privacy, terms, auth, readme]) {
    assert.doesNotMatch(source, /Please use you official/i);
    assert.doesNotMatch(source, /G-suite/);
  }

  assert.match(index, /Search, add, edit, or remove courses\./);
  assert.match(index, />All statuses</);
  assert.match(privacy, /private\s+profile photo storage, and Edge Functions\./);
  assert.match(privacy, /protected Edge Functions/);
  assert.match(privacy, /request\s+access to, correction of, or deletion of personal data/i);
});

test('deployed auth-function copy receives a forward-only correction migration', () => {
  const migration = read(path.join(
    'supabase',
    'migrations',
    '202608260017_user_facing_copy_corrections.sql'
  ));

  assert.match(migration, /hook_restrict_signup\(jsonb\)/i);
  assert.match(migration, /complete_student_onboarding\(text,text,text,integer,text,text\)/i);
  assert.match(migration, /Please use your official BRAC University G-Suite email/);
  assert.match(migration, /if\s+position\(legacy_message\s+in\s+function_definition\)\s*>\s*0\s+then/i);
  assert.match(migration, /execute\s+replace\(function_definition,\s*legacy_message,\s*corrected_message\)/i);
  assert.match(migration, /elsif\s+position\(corrected_message\s+in\s+function_definition\)\s*=\s*0\s+then/i);
  assert.doesNotMatch(migration, /\b(?:insert|update|delete|truncate|drop)\b/i);
});
