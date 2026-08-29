const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const StorageModule = require('../js/storage.js');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('production CSP permits only the Google Identity Services browser boundaries it uses', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const headers = vercel.headers.flatMap(entry => entry.headers || []);
  const policy = headers.find(header => header.key === 'Content-Security-Policy')?.value || '';
  assert.match(policy, /script-src[^;]*https:\/\/accounts\.google\.com\/gsi\/client/);
  assert.match(policy, /connect-src[^;]*https:\/\/accounts\.google\.com\/gsi\//);
  assert.match(policy, /frame-src[^;]*https:\/\/accounts\.google\.com\/gsi\//);

  const publicConfig = fs.readFileSync(path.join(root, 'js', 'config.js'), 'utf8');
  const authSource = fs.readFileSync(path.join(root, 'js', 'auth.js'), 'utf8');
  assert.doesNotMatch(`${publicConfig}\n${authSource}`, /googleClientSecret|client_secret/i);
});

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

test('versioned tracker migration enforces ownership, optimistic concurrency, snapshots, and bounded history', () => {
  const sql = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608280022_versioned_tracker_storage.sql'),
    'utf8'
  );
  assert.match(sql, /add column if not exists revision bigint not null default 1/i);
  assert.match(sql, /create table if not exists public\.course_tracker_data_history/i);
  assert.match(sql, /primary key \(user_id, revision\)/i);
  assert.match(sql, /create index[^;]+\(user_id, revision desc\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /\(select auth\.uid\(\)\) = user_id/i);
  assert.match(sql, /create or replace function public\.save_course_tracker_state/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.doesNotMatch(sql, /p_user_id/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /p_expected_revision[\s\S]*tracker_revision_conflict/i);
  assert.match(sql, /tracker_blank_overwrite_blocked/i);
  assert.match(sql, /insert into public\.course_tracker_data_history/i);
  assert.match(sql, /offset 20/i);
  assert.match(sql, /revoke insert, update, delete on table public\.course_tracker_data from authenticated/i);
  assert.match(sql, /grant execute on function public\.save_course_tracker_state\(bigint, jsonb, boolean\) to authenticated/i);
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

test('migration 018 makes the global catalog readable but never browser-writable', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608260018_global_catalog.sql'),
    'utf8'
  );
  for (const table of ['catalog_departments', 'catalog_courses', 'catalog_faculties']) {
    assert.match(migration, new RegExp(`create table public\\.${table}`, 'i'));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`, 'i'));
    assert.doesNotMatch(migration, new RegExp(`grant select on table public\\.${table} to authenticated`, 'i'));
    assert.match(migration, new RegExp(`grant select \\([^)]+\\) on table public\\.${table} to authenticated`, 'i'));
  }
  assert.match(migration, /catalog_courses[\s\S]*department text not null references public\.catalog_departments\(id\) on delete restrict/i);
  assert.match(migration, /create policy catalog_departments_select_active/i);
  assert.match(migration, /using\s*\(\s*\(select public\.current_account_active\(\(select auth\.uid\(\)\)\)\)\s*\)/i);
  assert.match(migration, /catalog_departments_created_by_idx/i);
  assert.match(migration, /catalog_courses_created_by_idx/i);
  assert.match(migration, /catalog_faculties_created_by_idx/i);
  assert.match(migration, /status = 'active'/i);
  assert.match(migration, /catalog\.manage/i);
  assert.match(migration, /create or replace function public\.mutate_global_catalog/i);
  assert.match(migration, /security definer[\s\S]*insert into public\.admin_audit_log/i);
  const rpcStart = migration.indexOf('create or replace function public.mutate_global_catalog');
  const rpcBody = migration.slice(rpcStart, migration.indexOf('revoke all on function public.mutate_global_catalog', rpcStart));
  const lockIndex = rpcBody.indexOf('perform pg_advisory_xact_lock');
  const firstCatalogRead = rpcBody.indexOf('public.admin_effective_access');
  assert.ok(lockIndex > -1 && lockIndex < firstCatalogRead, 'catalog mutation lock must precede catalog and access reads');
  assert.match(rpcBody, /unnest\([^)]*hard_codes[\s\S]*soft_codes[\s\S]*not exists[\s\S]*catalog_courses/i);
  assert.match(rpcBody, /hard_prerequisites\s*@>\s*array\[input_key\]/i);
  assert.match(rpcBody, /soft_prerequisites\s*@>\s*array\[input_key\]/i);
  assert.match(migration, /create index catalog_courses_hard_prerequisites_gin_idx[\s\S]*using gin\s*\(hard_prerequisites\)/i);
  assert.match(migration, /create index catalog_courses_soft_prerequisites_gin_idx[\s\S]*using gin\s*\(soft_prerequisites\)/i);
  assert.match(migration, /revoke all on function public\.mutate_global_catalog[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.mutate_global_catalog[\s\S]*to service_role/i);
  assert.match(migration, /revoke all on function public\.set_account_access\(uuid, text, text\[\]\) from public, anon, authenticated/i);
});

test('migration 023 lets authenticated students read course visibility without opening catalog writes', () => {
  const migrationPath = path.join(
    root,
    'supabase',
    'migrations',
    '202608290023_catalog_visibility_read_grant.sql'
  );
  assert.equal(
    fs.existsSync(migrationPath),
    true,
    'the forward catalog visibility grant migration must exist'
  );

  const migration = fs.readFileSync(migrationPath, 'utf8');
  assert.match(
    migration,
    /grant\s+select\s*\(\s*visibility\s*\)\s+on\s+table\s+public\.catalog_courses\s+to\s+authenticated/i
  );
  assert.doesNotMatch(migration, /to\s+(?:public|anon)\b/i);
  assert.doesNotMatch(migration, /grant\s+(?:insert|update|delete|all)\b/i);
});

test('migrations 024 and 025 expand alternative visibility then consolidate catalog data without tracker writes', () => {
  const schema = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608290024_catalog_alternative_visibility.sql'),
    'utf8'
  );
  const data = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608290025_canonical_catalog_consolidation.sql'),
    'utf8'
  );
  assert.match(schema, /visibility\s+in\s*\(\s*'curriculum'\s*,\s*'search_only'\s*,\s*'alternative'\s*\)/i);
  assert.doesNotMatch(schema, /update\s+public\.|delete\s+from|course_tracker_data/i);
  assert.match(data, /insert\s+into\s+public\.catalog_departments[\s\S]*'MPS'[\s\S]*'GENED'/i);
  assert.match(data, /update\s+public\.catalog_courses[\s\S]*when\s+department\s*=\s*'MNS'\s+then\s+'MPS'[\s\S]*when\s+department\s+in\s*\(\s*'GED'\s*,\s*'SGE'\s*\)\s+then\s+'GENED'/i);
  assert.match(data, /update\s+public\.catalog_faculties/i);
  for (const code of ['CSE161','CSE162L','EEE103','EEE103L','ECE103','ECE103L','EEE283','EEE283L','ECE283','ECE283L','EEE301','EEE302']) {
    assert.match(data, new RegExp(`'${code}'`));
  }
  assert.match(data, /set\s+visibility\s*=\s*'alternative'/i);
  assert.doesNotMatch(data, /course_tracker_data|course_tracker_data_history|auth\.users/i);
  assert.doesNotMatch(data, /grant\s+(?:insert|update|delete|all)/i);
});

test('migration 019 seeds every canonical global catalog item without overwriting existing rows', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase', 'migrations', '202608270019_seed_default_global_catalog.sql'),
    'utf8'
  );
  const { DEFAULT_DATA } = require('../js/data.js');
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const nullable = (value) => (
    value === null || value === undefined || value === '' ? 'null' : quote(value)
  );
  const textArray = (values) => (
    !Array.isArray(values) || values.length === 0
      ? "'{}'::text[]"
      : `array[${values.map(quote).join(', ')}]::text[]`
  );
  const valuesBlock = (rows) => rows
    .map((row, index) => `  (${row.join(', ')})${index === rows.length - 1 ? '' : ','}`)
    .join('\n');
  const realCourses = DEFAULT_DATA.courses.filter((item) => !item.isRoadmapSlot);
  // Migration 019 is immutable and predates the canonical department rename.
  // Migration 025 moves these legacy seed identities forward in production.
  const legacyDepartment = (value) => ({ MPS: 'MNS', GENED: 'GED' })[value] || value;
  const expected = {
    departments: DEFAULT_DATA.departments.map((item) => {
      const id = legacyDepartment(item.id);
      const legacy = id === 'MNS'
        ? { name: 'Mathematics and Natural Sciences', color: 'teal' }
        : id === 'GED'
          ? { name: 'General Education', color: 'slate' }
          : item;
      return [
      quote(id), quote(legacy.name), quote(legacy.color || 'gray'),
      ];
    }),
    courses: realCourses.map((item) => [
      quote(item.code),
      quote(item.title),
      String(item.credits),
      quote(legacyDepartment(item.department)),
      quote(item.category),
      item.roadmapLevel == null ? 'null' : String(item.roadmapLevel),
      item.roadmapOrder == null ? 'null' : String(item.roadmapOrder),
      textArray(item.hardPrerequisites),
      textArray(item.softPrerequisites),
      nullable(item.sourceNote),
      item.isRoadmapSlot ? 'true' : 'false',
    ]),
    faculties: DEFAULT_DATA.defaultFaculties.map((item) => [
      quote(item.initial),
      quote(item.name),
      nullable(item.email ? item.email.toLowerCase() : null),
      quote(legacyDepartment(item.department)),
    ]),
  };

  for (const [kind, rows] of Object.entries(expected)) {
    const section = migration.match(new RegExp(
      `-- catalog-seed:${kind}:start([\\s\\S]*?)-- catalog-seed:${kind}:end`,
      'i'
    ));
    assert.ok(section, `${kind} seed section must exist`);
    const seededValues = section[1].match(/\nvalues\n([\s\S]*?)\non conflict/i);
    assert.ok(seededValues, `${kind} seed must use an explicit values block`);
    assert.equal(
      seededValues[1],
      valuesBlock(rows),
      `${kind} seed payload must match every normalized canonical field in order`
    );
    assert.match(section[1], /on conflict \([a-z_]+\) do nothing/i);
  }

  assert.equal(expected.departments.length, 6);
  assert.equal(expected.courses.length, 66);
  assert.equal(expected.faculties.length, 193);
  const insertTargets = [...migration.matchAll(/insert\s+into\s+public\.([a-z_]+)/gi)]
    .map((match) => match[1]);
  assert.equal([...migration.matchAll(/insert\s+into\b/gi)].length, insertTargets.length);
  assert.deepEqual(
    insertTargets,
    ['catalog_departments', 'catalog_courses', 'catalog_faculties']
  );
  assert.doesNotMatch(migration, /\b(?:update|delete\s+from|truncate|drop)\b/i);
  assert.doesNotMatch(migration, /course_tracker_data|student_profiles|auth\.users/i);
});

test('catalog Edge actions use explicit authorization, allowlists, AAL2, and audit-safe errors', () => {
  const edge = fs.readFileSync(path.join(root, 'supabase', 'functions', 'admin-access', 'index.ts'), 'utf8');
  const actions = fs.readFileSync(path.join(root, 'supabase', 'functions', 'admin-access', 'catalog-actions.mjs'), 'utf8');
  assert.match(edge, /"list-catalog"/);
  assert.match(edge, /"upsert-catalog-item"/);
  assert.match(edge, /"delete-catalog-item"/);
  assert.match(edge, /"upsert-catalog-item": "catalog\.manage"/);
  assert.match(edge, /"delete-catalog-item": "catalog\.manage"/);
  assert.match(actions, /pickAllowed|allowed/i);
  assert.match(actions, /assertCatalogManager/);
  assert.match(actions, /normalizeCatalogPayload|cleanCourseCode/);
  assert.match(actions, /cleanVisibility/);
  assert.match(actions, /visibility/);
  assert.match(actions, /admin\.rpc\('mutate_global_catalog'/);
  assert.match(actions, /PUBLIC_FIELDS/);
  assert.doesNotMatch(actions, /\.select\('\*'\)/);
  assert.doesNotMatch(actions, /created_by|created_at|updated_at/);
  assert.doesNotMatch(actions, /\.from\([^)]*catalog_(?:departments|courses|faculties)/);
  assert.match(edge, /ATOMIC_AUDIT_ACTIONS/);
  assert.match(edge, /ATOMIC_AUDIT_ACTIONS\.has\(action\)\s*\?\s*null\s*:\s*payload\.id/);
  assert.doesNotMatch(actions, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
