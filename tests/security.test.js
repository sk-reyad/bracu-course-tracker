const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const StorageModule = require('../js/storage.js');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('Supabase Auth config mirrors the administrator password policy', () => {
  const config = fs.readFileSync(path.join(root, 'supabase', 'config.toml'), 'utf8');
  assert.match(config, /minimum_password_length\s*=\s*12/);
  assert.match(config, /password_requirements\s*=\s*"lower_upper_letters_digits_symbols"/);
  assert.match(config, /secure_password_change\s*=\s*true/);
  assert.match(config, /site_url\s*=\s*"http:\/\/localhost:4173"/);
  assert.match(config, /additional_redirect_urls\s*=\s*\["http:\/\/localhost:4173\/\*\*"\]/);
  assert.match(config, /\[auth\.mfa\.totp\][\s\S]*enroll_enabled\s*=\s*true[\s\S]*verify_enabled\s*=\s*true/);
  assert.match(config, /enable_confirmations\s*=\s*true/);
  assert.match(config, /max_frequency\s*=\s*"1m"/);
  assert.match(config, /otp_length\s*=\s*8/);
});
const publicErrorPath = path.join(root, 'supabase', 'functions', '_shared', 'public-error.mjs');
const roadmapSource = fs.readFileSync(path.join(root, 'js', 'roadmap.js'), 'utf8');

function loadRoadmapRenderer() {
  const context = {
    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[character]));
    },
    getCourseStatus() { return 'not-started'; },
    checkPrerequisites() { return { eligible: true }; },
    getLatestAttempt() { return null; },
    renderEmptyAttemptMeta() { return ''; },
    completedCourseCodes() { return new Set(); },
    document: {},
    window: { requestAnimationFrame() {} }
  };
  vm.createContext(context);
  vm.runInContext(roadmapSource, context);
  return context;
}

test('roadmap renderer encodes every imported course field before inserting HTML', () => {
  const roadmap = loadRoadmapRenderer();
  const payload = 'X" onmouseover="globalThis.pwned=1';
  const state = {
    departments: [{ id: payload }],
    categories: [{ id: payload, label: payload }]
  };
  const html = roadmap.renderCourseCard(state, {
    code: payload,
    title: '<img src=x onerror=globalThis.pwned=1>',
    department: payload,
    category: payload,
    credits: payload,
    hardPrerequisites: [payload],
    softPrerequisites: []
  });

  assert.doesNotMatch(html, /"\s+onmouseover="/i);
  assert.doesNotMatch(html, /<img\b/i);
  assert.match(html, /&quot;/);
  assert.match(html, /&lt;img/);
});

test('backup validation rejects executable identifiers and oversized collections', () => {
  const manager = StorageModule.createStorageManager({
    defaultData: { courses: [], departments: [], defaultFaculties: [], defaultSemesters: [] }
  });
  assert.equal(typeof manager.validateBackupState, 'function');
  assert.doesNotThrow(() => manager.validateBackupState({
    courses: [{ code: 'CSE110' }],
    departments: [{ id: 'CSE' }],
    faculties: [{ id: 'faculty-1' }],
    semesters: [{ id: 'semester-1', courses: [{ id: 'attempt-1', code: 'CSE110' }] }]
  }));
  assert.throws(
    () => manager.validateBackupState({ courses: [{ code: 'X" onmouseover="pwned' }] }),
    /unsafe identifier/i
  );
  assert.throws(
    () => manager.validateBackupState({ courses: Array.from({ length: 1001 }, (_, index) => ({ code: `C${index}` })) }),
    /too many courses/i
  );
});

test('edge responses hide database errors unless the message is explicitly public', async () => {
  const errors = await import(`${pathToFileURL(publicErrorPath).href}?test=${Date.now()}`);
  const allowed = new Set(['Enter a valid email address.']);
  assert.equal(
    errors.publicErrorMessage(new Error('permission denied for table profiles'), allowed),
    'Request failed.'
  );
  assert.equal(
    errors.publicErrorMessage(new Error('Enter a valid email address.'), allowed),
    'Enter a valid email address.'
  );
});

test('admin Edge Function uses the shared safe-error boundary', () => {
  const source = fs.readFileSync(path.join(root, 'supabase', 'functions', 'admin-access', 'index.ts'), 'utf8');
  assert.match(source, /publicErrorMessage\(error, PUBLIC_ERROR_MESSAGES\)/);
  assert.doesNotMatch(source, /error:\s*auditMessage/);
});

test('security hardening migration narrows profile visibility and direct mutation', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608250012_security_hardening.sql'),
    'utf8'
  );
  assert.match(migration, /revoke update on table public\.profiles from authenticated/i);
  assert.match(migration, /public\.authorize\('admins\.read'\)/i);
  assert.match(migration, /target_role\.name in \('admin', 'super_admin'\)/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /existing_role_name text/i);
  assert.doesNotMatch(migration, /declare\s+current_role text/i);
});

test('migration 014 revokes direct API execution of internal SECURITY DEFINER functions', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608250014_internal_function_execute_lockdown.sql'),
    'utf8'
  );

  assert.match(
    migration,
    /revoke\s+all\s+on\s+function\s+public\.handle_new_auth_user\(\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i
  );
  assert.match(migration, /to_regprocedure\('public\.rls_auto_enable\(\)'\)/i);
  assert.match(
    migration,
    /revoke\s+all\s+on\s+function\s+public\.rls_auto_enable\(\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i
  );
  assert.match(migration, /begin\s*;/i);
  assert.match(migration, /commit\s*;/i);
  assert.doesNotMatch(migration, /drop\s+(?:function|trigger|table)/i);
});

test('admin Edge Function requires an AAL2 JWT after Supabase validates the user', async () => {
  const assurancePath = path.join(root, 'supabase', 'functions', '_shared', 'jwt-assurance.mjs');
  const assurance = await import(`${pathToFileURL(assurancePath).href}?test=${Date.now()}`);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'none' })}.${encode({ sub: 'admin-1', aal: 'aal2' })}.signature`;
  assert.equal(assurance.jwtAssuranceLevel(token), 'aal2');
  assert.equal(assurance.jwtAssuranceLevel('malformed'), 'aal1');

  const edge = fs.readFileSync(path.join(root, 'supabase', 'functions', 'admin-access', 'index.ts'), 'utf8');
  assert.match(edge, /jwtAssuranceLevel\(bearerToken\)\s*!==\s*"aal2"/);
  assert.match(edge, /Multi-factor authentication required\./);
  assert.ok(
    edge.indexOf('if (userError || !userData.user)') < edge.indexOf('jwtAssuranceLevel(bearerToken)'),
    'the JWT must be validated by Supabase before its AAL claim is trusted'
  );
});

test('migration 015 requires AAL2 for privileged direct database access while preserving self reads', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608250015_admin_aal2_rls.sql'),
    'utf8'
  );

  assert.match(migration, /\(select\s+auth\.jwt\(\)\s*->>\s*'aal'\)\s*=\s*'aal2'/i);
  assert.match(migration, /drop policy if exists profiles_select_authorized/i);
  assert.match(migration, /id\s*=\s*auth\.uid\(\).*status in \('pending', 'active'\)/is);
  assert.match(migration, /drop policy if exists support_tickets_read_authorized/i);
  assert.match(migration, /drop policy if exists site_settings_manage_authorized/i);
  assert.doesNotMatch(migration, /delete\s+from|truncate\s+table|drop\s+table/i);
});

test('migration 016 builds JWT roles from the protected role mapping without the caller-sensitive helper', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608250016_access_token_role_claim_fix.sql'),
    'utf8'
  );

  assert.match(migration, /create\s+or\s+replace\s+function\s+public\.custom_access_token_hook\(event jsonb\)/i);
  assert.match(migration, /join\s+public\.user_roles\s+user_role\s+on\s+user_role\.user_id\s*=\s*profile\.id/i);
  assert.match(migration, /join\s+public\.app_roles\s+app_role\s+on\s+app_role\.id\s*=\s*user_role\.role_id/i);
  assert.match(migration, /into\s+token_role\s*,\s*token_status/i);
  assert.doesNotMatch(migration, /current_app_role\s*\(/i);
  assert.match(migration, /grant\s+execute\s+on\s+function\s+public\.custom_access_token_hook\(jsonb\)\s+to\s+supabase_auth_admin/i);
  assert.match(migration, /revoke\s+all\s+on\s+function\s+public\.custom_access_token_hook\(jsonb\)\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.doesNotMatch(migration, /delete\s+from|truncate\s+table|drop\s+table/i);
});
