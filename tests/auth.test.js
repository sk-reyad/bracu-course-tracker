const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

const AuthCore = require('../js/auth-core.js');
const config = require('../js/config.js');
const AuthPageServices = require('../js/auth.js');
const SupabaseModule = require('../js/supabase-client.js');

test('OAuth callback surfaces the approved BRACU-domain rejection from query or hash parameters', () => {
  const approved = 'Please use your official BRAC University G-Suite email';
  const legacy = 'Please use you official BRAC University G-suite email';
  assert.equal(
    AuthPageServices.getOAuthCallbackError(`?error=server_error&error_description=${encodeURIComponent(approved)}`, ''),
    approved
  );
  assert.equal(
    AuthPageServices.getOAuthCallbackError('', `#error=access_denied&error_description=${encodeURIComponent(approved)}`),
    approved
  );
  assert.equal(
    AuthPageServices.getOAuthCallbackError(`?error=server_error&error_description=${encodeURIComponent(legacy)}`, ''),
    approved
  );
  assert.equal(AuthPageServices.getOAuthCallbackError('', ''), '');
});

test('deleted-user JWT is cleared locally and replaced with a friendly retry message', async () => {
  let signOutOptions;
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    client: { auth: { async signOut(options) { signOutOptions = options; } } },
    getSessionContext: async () => { throw new Error('User from sub claim in JWT does not exist'); }
  });

  await assert.rejects(
    () => controller.completeStudentOAuth(),
    /previous session expired.*Continue with Google again/i
  );
  assert.deepEqual(signOutOptions, { scope: 'local' });
});

test('accepts only the exact BRACU G-Suite suffix', () => {
  assert.equal(AuthCore.isBracuGsuiteEmail('student@g.bracu.ac.bd'), true);
  assert.equal(AuthCore.isBracuGsuiteEmail(' STUDENT@G.BRACU.AC.BD '), true);
  assert.equal(AuthCore.isBracuGsuiteEmail('student@bracu.ac.bd'), false);
  assert.equal(AuthCore.isBracuGsuiteEmail('student@g.bracu.ac.bd.evil.test'), false);
  assert.equal(AuthCore.isBracuGsuiteEmail(''), false);
});

test('routes authenticated accounts by canonical role, status, and onboarding state', () => {
  assert.equal(AuthCore.resolvePostAuthRoute({ role: 'student', status: 'active', onboardingCompleted: true }), 'index.html');
  assert.equal(AuthCore.resolvePostAuthRoute({ role: 'student', status: 'pending', onboardingCompleted: false }), 'auth.html?step=onboarding');
  assert.equal(AuthCore.resolvePostAuthRoute({ role: 'admin', status: 'active', onboardingCompleted: true }), 'admin.html');
  assert.equal(AuthCore.resolvePostAuthRoute({ role: 'super_admin', status: 'active', onboardingCompleted: true }), 'admin.html');
  assert.equal(AuthCore.resolvePostAuthRoute({ role: 'student', status: 'suspended', onboardingCompleted: true }), 'auth.html?error=suspended');
});

test('normalizes onboarding values without accepting identity or status fields', () => {
  assert.deepEqual(AuthCore.normalizeProfileInput({
    studentId: ' 24210009 ',
    program: 'BSc in Computer Science (CS)',
    startingTerm: 'Fall',
    startingYear: '2026',
    avatarPath: ' user/avatar.webp ',
    fullName: 'Must not pass',
    email: 'must-not-pass@example.com',
    status: 'active'
  }), {
    studentId: '24210009',
    program: 'BSc in Computer Science (CS)',
    startingTerm: 'Fall',
    startingYear: 2026,
    avatarPath: 'user/avatar.webp'
  });
});

test('public browser configuration contains the supplied project and no server secret field', () => {
  assert.equal(config.supabaseUrl, 'https://eeorkgnbhxenaszdxtti.supabase.co');
  assert.match(config.supabasePublishableKey, /^sb_publishable_/);
  assert.equal(config.authPageUrl, 'auth.html');
  assert.equal(config.appPageUrl, 'index.html');
  assert.equal(config.adminPageUrl, 'admin.html');
  assert.equal(config.turnstileSiteKey, '0x4AAAAAAEX2Osurb6IGHo9a');
  assert.equal('serviceRoleKey' in config, false);
  assert.equal('secretKey' in config, false);
});

test('database migrations enforce profile, role, permission, hook, and onboarding boundaries', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608120001_auth_profiles_rbac.sql'), 'utf8');
  assert.match(sql, /create table public\.profiles/i);
  assert.match(sql, /BSc in Computer Science & Engineering \(CSE\)/);
  assert.match(sql, /BSc in Computer Science \(CS\)/);
  assert.match(sql, /create table public\.app_roles/i);
  assert.match(sql, /create table public\.app_permissions/i);
  for (const permission of ['profiles.read', 'users.read', 'users.status.manage', 'admins.read', 'admins.manage', 'permissions.manage']) {
    assert.match(sql, new RegExp(permission.replace('.', '\\.')));
  }
  assert.match(sql, /create or replace function public\.hook_restrict_signup\(event jsonb\)/i);
  assert.match(sql, /create or replace function public\.hook_restrict_signup\(event jsonb\)/i);
  assert.match(sql, /create or replace function public\.custom_access_token_hook\(event jsonb\)/i);
  assert.match(sql, /app_permissions/);
  assert.match(sql, /account_status/);
  assert.match(sql, /create or replace function public\.complete_student_onboarding/i);
  assert.match(sql, /immutable_profile_identity/i);
  assert.match(sql, /enable row level security/i);
});

test('login tracking records one event per browser session and never blocks session context', async () => {
  let rpcCalls = 0;
  const session = {
    access_token: 'header.payload.signature',
    user: { id: 'user-1', app_metadata: { app_role: 'student' } }
  };
  const client = {
    auth: { async getSession() { return { data: { session }, error: null }; } },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: { id: 'user-1', status: 'active' }, error: null }; }
      };
    },
    async rpc(name) {
      assert.equal(name, 'record_login_event');
      rpcCalls += 1;
      return { data: null, error: new Error('metrics are temporarily unavailable') };
    }
  };
  const api = SupabaseModule.createSupabaseApi({
    config: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'public-key' },
    sdk: { createClient() { return client; } }
  });

  await assert.doesNotReject(() => api.getSessionContext());
  await assert.doesNotReject(() => api.getSessionContext());
  assert.equal(rpcCalls, 1);
});

test('login metrics migration deduplicates Auth sessions and uses Dhaka calendar periods', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608130007_login_session_metrics.sql'), 'utf8');
  assert.match(sql, /create table(?: if not exists)? public\.login_events/i);
  assert.match(sql, /unique\s*\(user_id,\s*session_id\)/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /auth\.jwt\(\)\s*->>\s*'session_id'/i);
  assert.match(sql, /at time zone 'Asia\/Dhaka'/i);
  assert.match(sql, /grant execute on function public\.record_login_event\(\) to authenticated/i);
  assert.doesNotMatch(sql, /grant (?:select|insert|update|delete)[^;]*public\.login_events[^;]*to (?:anon|authenticated|public)/i);
});

test('admin identity migration adds service-only atomic provisioning and guarded repair', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202608130008_admin_permissions_identity_management.sql'), 'utf8');
  assert.match(sql, /users\.identity\.manage/i);
  assert.match(sql, /insert into public\.role_permissions\s*\(role_id, permission_id\)[\s\S]*?permission\.name = 'users\.identity\.manage'[\s\S]*?role\.name = 'super_admin'[\s\S]*?on conflict do nothing/i);
  assert.match(sql, /create or replace function public\.provision_admin_account\s*\(/i);
  assert.match(sql, /create or replace function public\.set_account_access\s*\(/i);
  assert.match(sql, /create or replace function public\.admin_effective_access\s*\(/i);
  assert.match(sql, /granted\s*=\s*excluded\.granted/i);
  assert.match(sql, /action\s*=\s*'create-admin'/i);
  assert.match(sql, /audit\.succeeded\s*=\s*true/i);
  assert.match(sql, /audit\.target_id\s+is\s+not\s+null/i);
  assert.match(sql, /grant execute on function public\.provision_admin_account[^;]+to service_role/i);
  assert.doesNotMatch(sql, /grant execute on function public\.(?:provision_admin_account|set_account_access|admin_effective_access)[^;]+to\s+(?:anon|authenticated|public)/i);
  assert.match(sql, /notify pgrst, 'reload schema'/i);
});

test('admin identity migration atomically protects the last active Super Admin', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202608130008_admin_permissions_identity_management.sql'), 'utf8');
  const accessMatch = sql.match(/create or replace function public\.set_account_access\s*\([\s\S]*?as \$\$([\s\S]*?)\$\$;/i);
  const statusMatch = sql.match(/create or replace function public\.set_account_status_guarded\s*\([\s\S]*?as \$\$([\s\S]*?)\$\$;/i);
  assert.ok(accessMatch, 'atomic account-access RPC must exist');
  assert.ok(statusMatch, 'guarded account-status RPC must exist');

  const lockPattern = /pg_advisory_xact_lock\(202608130008\)/i;
  for (const body of [accessMatch[1], statusMatch[1]]) {
    assert.match(body, lockPattern, 'both mutations must share one transaction-scoped advisory lock key');
    assert.match(body, /from public\.profiles[\s\S]*public\.user_roles[\s\S]*public\.app_roles/i);
    assert.match(body, /count\(\*\)[\s\S]*profile\.status\s*=\s*'active'[\s\S]*role\.name\s*=\s*'super_admin'/i);
    assert.match(body, /last active Super Admin cannot be suspended or demoted/i);
  }
  assert.match(accessMatch[1], /role\.name[\s\S]*profile\.status[\s\S]*where profile\.id\s*=\s*target_user/i);
  assert.match(statusMatch[1], /update public\.profiles[\s\S]*set status\s*=\s*target_status/i);
  assert.match(sql, /revoke all on function public\.set_account_status_guarded\(uuid, text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.set_account_status_guarded\(uuid, text\) to service_role/i);
  assert.doesNotMatch(sql, /grant execute on function public\.set_account_status_guarded[^;]+to\s+(?:anon|authenticated|public)/i);
});

test('additive admin access hardening prevents Student permission grants after deployed migration 008', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202608140009_admin_access_security_hardening.sql'), 'utf8');
  assert.match(sql, /create or replace function public\.set_account_access\s*\(/i);
  assert.match(sql, /create or replace function public\.admin_effective_access[\s\S]*when role\.name\s*=\s*'student' then '\[\]'::jsonb/i);
  assert.match(sql, /target_role\s*=\s*'student'[\s\S]*cardinality\s*\(\s*coalesce\s*\(\s*target_permissions/i);
  assert.match(sql, /Student accounts cannot receive administrator permissions/i);
  assert.match(sql, /update public\.user_permissions[\s\S]*set granted\s*=\s*false[\s\S]*role\.name\s*=\s*'student'/i);
  assert.match(sql, /create or replace function public\.set_account_status_guarded\s*\(/i);
  assert.match(sql, /revoke all on function public\.set_account_access\(uuid, text, text\[\]\) from public, anon, authenticated/i);
  assert.match(sql, /revoke all on function public\.set_account_status_guarded\(uuid, text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.set_account_access\(uuid, text, text\[\]\) to service_role/i);
  assert.match(sql, /grant execute on function public\.set_account_status_guarded\(uuid, text\) to service_role/i);
});

test('canonical avatar migration adds explicit preference and validated student profile RPCs', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608120004_canonical_student_profile_avatar.sql'), 'utf8');
  assert.match(sql, /avatar_preference[\s\S]*check[\s\S]*'google'[\s\S]*'custom'[\s\S]*'none'/i);
  assert.match(sql, /create or replace function public\.complete_student_onboarding/i);
  assert.match(sql, /create or replace function public\.update_student_profile/i);
  assert.match(sql, /storage\.objects[\s\S]*owner_id[\s\S]*caller::text/i);
  assert.match(sql, /avatar_preference\s+in\s*\('google',\s*'custom',\s*'none'\)/i);
  assert.match(sql, /current_app_role\(caller\)\s*<>\s*'student'/i);
  assert.match(sql, /grant execute on function public\.update_student_profile/i);
  assert.doesNotMatch(sql, /grant execute on function public\.(?:complete_student_onboarding|update_student_profile)[^;]*to\s+(?:anon|public)/i);
});

test('manual onboarding reset is exact-account guarded and absent from the website runtime', () => {
  const root = path.join(__dirname, '..');
  const resetSql = fs.readFileSync(path.join(root, 'supabase', 'manual', '20260812_reset_sk_reyad_ali_onboarding.sql'), 'utf8');
  assert.match(resetSql, /sk\.reyad\.ali@g\.bracu\.ac\.bd/i);
  assert.match(resetSql, /expected exactly one matching student profile/i);
  assert.match(resetSql, /profile-photos/i);
  assert.match(resetSql, /delete from public\.course_tracker_data/i);
  assert.match(resetSql, /status\s*=\s*'pending'/i);
  assert.match(resetSql, /onboarding_completed\s*=\s*false/i);
  assert.doesNotMatch(resetSql, /create\s+(?:or\s+replace\s+)?(?:function|trigger)|pg_cron|setInterval/i);
  for (const file of ['auth.html', 'index.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /reset_sk_reyad_ali|manual\/20260812/i);
  }
});

test('tracker and private avatar migrations scope every row and object to the signed-in user', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608120002_tracker_storage_rls.sql'), 'utf8');
  assert.match(sql, /create table if not exists public\.course_tracker_data/i);
  assert.match(sql, /user_id\s+uuid/i);
  assert.match(sql, /auth\.uid\(\)\s*=\s*user_id/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /profile-photos/);
  assert.match(sql, /private/i);
  assert.match(sql, /storage\.foldername\(name\)\)\[1\]/i);
  assert.match(sql, /auth\.uid\(\)::text/i);
});

test('authenticated API roles receive only the table privileges required by RLS policies', () => {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const sql = fs.readdirSync(migrationsDir)
    .filter(name => name.endsWith('.sql'))
    .sort()
    .map(name => fs.readFileSync(path.join(migrationsDir, name), 'utf8'))
    .join('\n');

  assert.match(sql, /grant select, update on table public\.profiles to authenticated/i);
  for (const table of ['app_roles', 'app_permissions', 'role_permissions', 'user_roles', 'user_permissions', 'admin_audit_log']) {
    assert.match(sql, new RegExp(`grant select on table public\\.${table} to authenticated`, 'i'));
  }
  assert.match(sql, /grant select, insert, update, delete on table public\.course_tracker_data to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+.+\s+on table public\.(?:profiles|course_tracker_data)\s+to\s+(?:anon|public)/i);
});

test('private avatar policies permit pending onboarding but reject suspended accounts', () => {
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608120001_auth_profiles_rbac.sql'), 'utf8');
  const storageSql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608120002_tracker_storage_rls.sql'), 'utf8');
  assert.match(schemaSql, /create or replace function public\.profile_asset_access_allowed/i);
  assert.match(schemaSql, /status in \('pending', 'active'\)/i);
  assert.match(storageSql, /public\.profile_asset_access_allowed\(\)/i);
});

test('browser JavaScript never contains a service-role credential', () => {
  const jsDir = path.join(__dirname, '..', 'js');
  const browserSource = fs.readdirSync(jsDir)
    .filter(name => name.endsWith('.js'))
    .map(name => fs.readFileSync(path.join(jsDir, name), 'utf8'))
    .join('\n');
  assert.doesNotMatch(browserSource, /service[_-]?role|sb_secret_/i);
});

test('auth page exposes the approved centered brand, compact navigation, and unified student access', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'auth.html'), 'utf8');
  assert.match(html, /<strong>BRACU Course Tracker<\/strong>/);
  assert.match(html, /href="index\.html\?preview=1"[^>]*>[^<]*<i[^>]+>[^<]*<\/i>\s*<span>Preview<\/span>/s);
  assert.match(html, /id="openAdminView"/);
  assert.match(html, /id="authThemeToggle"/);
  assert.doesNotMatch(html, /role-switcher|Student\s*\|\s*Admin/i);
  assert.doesNotMatch(html, /id="studentModeTabs"/);
  assert.doesNotMatch(html, /id="studentLoginTab"|id="studentSignupTab"/);
  assert.match(html, /id="studentGoogleButton"/);
  assert.match(html, /Welcome back/);
  assert.doesNotMatch(html, /Only accounts ending in @g\.bracu\.ac\.bd are accepted\./);
  assert.doesNotMatch(html, /Continue with your official BRACU account\./);
});

test('auth page pins Vanta NET dependencies and provides an accessible reduced-motion fallback', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'auth.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'auth.css'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  assert.match(html, /three\.js\/r134\/three\.min\.js/);
  assert.match(html, /vanta@0\.5\.24\/dist\/vanta\.net\.min\.js/);
  assert.match(html, /id="authBackground"[^>]*aria-hidden="true"/);
  assert.match(js, /points:\s*20/);
  assert.match(js, /maxDistance:\s*30/);
  assert.match(js, /spacing:\s*17/);
  assert.match(js, /showDots:\s*true/);
  assert.match(js, /pagehide/);
  assert.match(js, /\.destroy\(\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /min-height:\s*44px/);
});

test('student Google access uses one OAuth entry point without login or signup intent', async () => {
  let oauthRequest;
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    config: { authPageUrl: 'auth.html' },
    location: { href: 'http://localhost:4173/auth.html' },
    sessionStore: { setItem() { throw new Error('Student OAuth must not store an auth intent.'); } },
    client: { auth: { async signInWithOAuth(value) { oauthRequest = value; return { data: {}, error: null }; } } }
  });
  await controller.startStudentGoogleAuth();
  assert.deepEqual(oauthRequest, {
    provider: 'google',
    options: { redirectTo: 'http://localhost:4173/auth.html' }
  });
  assert.equal(AuthPageServices.AUTH_INTENT_KEY, undefined);
});

test('OAuth completion signs out non-BRACU accounts with the exact required error', async () => {
  let signedOut = 0;
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    client: { auth: { async signOut() { signedOut += 1; } } },
    getSessionContext: async () => ({ user: { email: 'student@gmail.com' }, profile: { status: 'pending' }, role: 'student' })
  });
  await assert.rejects(() => controller.completeStudentOAuth(), {
    message: 'Please use your official BRAC University G-Suite email'
  });
  assert.equal(signedOut, 1);
});

test('onboarding payload validates approved values and excludes immutable identity fields', () => {
  assert.deepEqual(AuthPageServices.buildOnboardingPayload({
    studentId: ' 24210009 ',
    program: 'BSc in Computer Science (CS)',
    startingTerm: 'Fall',
    startingYear: '2026',
    avatarPreference: 'none',
    avatarPath: ' user-1/avatar.webp ',
    fullName: 'Blocked',
    email: 'blocked@example.com',
    status: 'active'
  }, AuthCore), {
    student_id: '24210009',
    program: 'BSc in Computer Science (CS)',
    starting_term: 'Fall',
    starting_year: 2026,
    avatar_preference: 'none',
    avatar_path: null
  });
  assert.throws(() => AuthPageServices.buildOnboardingPayload({ studentId: '', program: 'Bad', startingTerm: 'Fall', startingYear: 2026 }, AuthCore), /Student ID is required/);
});

test('photo validation accepts only JPEG, PNG, or WebP up to five megabytes', () => {
  assert.equal(AuthPageServices.validatePhotoFile({ type: 'image/webp', size: 5 * 1024 * 1024 }).valid, true);
  assert.equal(AuthPageServices.validatePhotoFile({ type: 'image/gif', size: 100 }).valid, false);
  assert.equal(AuthPageServices.validatePhotoFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }).valid, false);
});

test('photo candidate selection uses the first file and the existing validation boundary', () => {
  const valid = { type: 'image/png', size: 100, name: 'avatar.png' };
  const extra = { type: 'image/jpeg', size: 100, name: 'extra.jpg' };
  assert.deepEqual(AuthPageServices.selectPhotoCandidate([valid, extra]), {
    file: valid,
    valid: true,
    error: ''
  });
  assert.deepEqual(AuthPageServices.selectPhotoCandidate([]), {
    file: null,
    valid: true,
    error: ''
  });
  assert.equal(AuthPageServices.selectPhotoCandidate([{ type: 'text/plain', size: 1, name: 'notes.txt' }]).valid, false);
});

test('profile photo control is a responsive dropzone with mutually exclusive media states', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'auth.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'auth.css'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  assert.match(html, /id="photoDropzone"[^>]*role="group"/);
  assert.match(html, /aria-describedby="photoFilename"/);
  assert.match(html, /Choose or drop a profile photo/);
  assert.match(html, /class="photo-media"/);
  assert.match(html, /class="photo-actions"/);
  assert.match(html, /id="onboardingIdentityImage"[^>]*referrerpolicy="no-referrer"[^>]*hidden/);
  assert.match(html, /class="identity-avatar-media"/);
  assert.match(html, /id="removeGooglePhoto"[^>]*aria-label="Remove Google profile photo"/);
  assert.doesNotMatch(html, /id="useGooglePhoto"|Use Google photo/i);
  assert.doesNotMatch(html, /id="photoPreview"/);
  assert.match(html, /id="removePhoto"[^>]*aria-label="Remove custom profile photo"/);
  assert.match(js, /addEventListener\("dragover"/);
  assert.match(js, /addEventListener\("drop"/);
  assert.match(js, /dataTransfer\.files/);
  assert.match(js, /applySelectedPhoto/);
  assert.match(js, /BracuProfile\.createAvatarDraft/);
  assert.match(js, /BracuProfile\.createProfileService/);
  assert.match(js, /chooseNone\(\)/);
  assert.doesNotMatch(js, /useGooglePhoto/);
  assert.match(css, /grid-template-areas/);
  assert.match(css, /\.identity-avatar-remove\s*\{[^}]*opacity:\s*0?\.72/s);
  assert.match(css, /\.identity-avatar-remove\s*\{[^}]*background:\s*var\(--auth-soft\)/s);
  assert.match(css, /\.identity-avatar-remove:hover[^}]*opacity:\s*1/s);
  assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*grid-template-areas:\s*"media copy"\s*"actions actions"/);
  assert.match(css, /\.photo-copy small\s*\{[^}]*white-space:\s*normal/s);
  assert.doesNotMatch(css, /body[^}]*overflow-y:\s*hidden/s);
});

test('onboarding avatar presentation keeps previews in the identity row and separates delete ownership', () => {
  const google = AuthPageServices.deriveOnboardingAvatarView({
    avatarPreference: 'google',
    googleUrl: 'https://google.example/avatar.jpg'
  });
  assert.deepEqual(google, {
    identityUrl: 'https://google.example/avatar.jpg',
    showGoogleRemove: true,
    showCustomRemove: false,
    filename: 'JPEG, PNG or WebP · max 5 MB',
    actionLabel: 'Choose photo'
  });

  const custom = AuthPageServices.deriveOnboardingAvatarView({
    avatarPreference: 'custom',
    googleUrl: 'https://google.example/avatar.jpg',
    customUrl: 'blob:custom-photo',
    customFileName: 'portrait.png'
  });
  assert.deepEqual(custom, {
    identityUrl: 'blob:custom-photo',
    showGoogleRemove: false,
    showCustomRemove: true,
    filename: 'portrait.png',
    actionLabel: 'Replace'
  });

  const none = AuthPageServices.deriveOnboardingAvatarView({
    avatarPreference: 'none',
    googleUrl: 'https://google.example/avatar.jpg'
  });
  assert.equal(none.identityUrl, '');
  assert.equal(none.showGoogleRemove, false);
  assert.equal(none.showCustomRemove, false);
});

test('auth controller delegates onboarding photo transactions to the shared profile service', async () => {
  let submitted;
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    client: { auth: {} },
    profileService: {
      async submitOnboarding(input) { submitted = input; return { status: 'active' }; }
    },
  });
  const file = { type: 'image/webp', size: 100 };
  const result = await controller.submitOnboarding({
    studentId: '24210009', program: 'BSc in Computer Science (CS)', startingTerm: 'Fall', startingYear: 2026, avatarPreference: 'custom'
  }, file);
  assert.equal(result.status, 'active');
  assert.equal(submitted.photoFile, file);
  assert.equal(submitted.avatarPreference, 'custom');
});

test('browser auth wiring connects Google, photo, onboarding, toast, and return-session flows', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  const profileJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'profile.js'), 'utf8');
  assert.match(js, /studentGoogleButton[\s\S]*addEventListener[\s\S]*startStudentGoogleAuth\(\)/);
  assert.match(js, /profilePhoto[\s\S]*addEventListener/);
  assert.match(js, /removePhoto[\s\S]*addEventListener/);
  assert.match(profileJs, /async function compressProfilePhoto/);
  assert.match(profileJs, /Math\.min\(1,\s*512\s*\/\s*width,\s*512\s*\/\s*height\)/);
  assert.match(js, /controller\.submitOnboarding/);
  assert.match(js, /authToast[\s\S]*dataset\.show/);
  assert.match(js, /completeStudentOAuth\(\)/);
  assert.doesNotMatch(js, /AuthPage\s*=\s*Object\.freeze\([^)]*setStudentMode/);
});

test('admin password login sends CAPTCHA and rejects non-admin sessions', async () => {
  let passwordRequest;
  let signedOut = 0;
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    client: { auth: {
      async signInWithPassword(value) { passwordRequest = value; return { data: { session: {} }, error: null }; },
      async signOut() { signedOut += 1; }
    } },
    getSessionContext: async () => ({ role: 'student', profile: { status: 'active' } })
  });
  await assert.rejects(() => controller.submitAdminLogin({
    email: 'admin@example.com', password: 'secret-password', captchaToken: 'captcha-token'
  }), /active administrator account/i);
  assert.deepEqual(passwordRequest, {
    email: 'admin@example.com',
    password: 'secret-password',
    options: { captchaToken: 'captcha-token' }
  });
  assert.equal(signedOut, 1);
});

test('active admin login routes only to the admin panel', async () => {
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    client: { auth: {
      async signInWithPassword() { return { data: { session: {} }, error: null }; },
      async signOut() {},
      mfa: { async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null }; } }
    } },
    getSessionContext: async () => ({ role: 'admin', profile: { status: 'active' } })
  });
  assert.equal(await controller.submitAdminLogin({ email: 'admin@example.com', password: 'secret', captchaToken: 'token' }), 'admin.html');
});

test('AAL1 admin login routes to mandatory MFA setup or challenge', async () => {
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    config: { authPageUrl: 'auth.html' },
    client: { auth: {
      async signInWithPassword() { return { data: { session: {} }, error: null }; },
      async signOut() {},
      mfa: { async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null }; } }
    } },
    getSessionContext: async () => ({ role: 'super_admin', profile: { status: 'active' } })
  });
  assert.equal(
    await controller.submitAdminLogin({ email: 'admin@example.com', password: 'secret', captchaToken: 'token' }),
    'auth.html?mode=admin&mfa=1'
  );
});

test('admin MFA enrolls TOTP when needed and challenges verified factors', async () => {
  let verifiedFactors = [];
  const calls = [];
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    client: { auth: { mfa: {
      async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: 'aal1', nextLevel: verifiedFactors.length ? 'aal2' : 'aal1' }, error: null }; },
      async listFactors() { return { data: { totp: verifiedFactors, phone: [] }, error: null }; },
      async enroll(input) { calls.push(input); return { data: { id: 'new-factor', totp: { qr_code: 'data:image/svg+xml,test', secret: 'MFASECRET' } }, error: null }; }
    } } },
    getSessionContext: async () => ({ role: 'admin', profile: { status: 'active' } })
  });

  assert.deepEqual(await controller.beginAdminMfa(), {
    mode: 'enroll',
    factorId: 'new-factor',
    qrCode: 'data:image/svg+xml,test',
    secret: 'MFASECRET'
  });
  assert.deepEqual(calls, [{ factorType: 'totp', issuer: 'BRACU Course Tracker', friendlyName: 'Admin access' }]);

  verifiedFactors = [{ id: 'verified-factor', status: 'verified', factor_type: 'totp' }];
  assert.deepEqual(await controller.beginAdminMfa(), {
    mode: 'challenge', factorId: 'verified-factor', qrCode: '', secret: ''
  });
});

test('admin MFA accepts only a six-digit code and confirms the upgraded AAL2 session', async () => {
  let verification;
  let level = 'aal1';
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    config: { adminPageUrl: 'admin.html' },
    client: { auth: { mfa: {
      async challengeAndVerify(input) { verification = input; level = 'aal2'; return { data: {}, error: null }; },
      async getAuthenticatorAssuranceLevel() { return { data: { currentLevel: level, nextLevel: 'aal2' }, error: null }; }
    } } }
  });

  await assert.rejects(() => controller.verifyAdminMfa({ factorId: 'factor-1', code: '12ab' }), /six-digit/i);
  assert.equal(await controller.verifyAdminMfa({ factorId: 'factor-1', code: '123456' }), 'admin.html');
  assert.deepEqual(verification, { factorId: 'factor-1', code: '123456' });
});

test('admin recovery requires CAPTCHA, uses the dedicated callback, and updates only the authenticated password', async () => {
  let resetRequest;
  let updateRequest;
  const controller = AuthPageServices.createAuthController({
    authCore: AuthCore,
    config: { authPageUrl: 'auth.html' },
    location: { href: 'http://localhost:4173/auth.html' },
    client: { auth: {
      async resetPasswordForEmail(email, options) { resetRequest = { email, options }; return { error: null }; },
      async updateUser(value) { updateRequest = value; return { error: null }; }
    } }
  });
  await assert.rejects(
    () => controller.requestAdminPasswordReset('admin@example.com', ''),
    /complete the security verification/i
  );
  await controller.requestAdminPasswordReset('admin@example.com', 'recovery-captcha-token');
  await assert.rejects(
    () => controller.completeAdminPasswordRecovery('new-secure-password'),
    /12 characters.*uppercase.*lowercase.*number.*symbol/i
  );
  assert.equal(updateRequest, undefined);
  await controller.completeAdminPasswordRecovery('SecurePass!2026');
  assert.deepEqual(resetRequest, {
    email: 'admin@example.com',
    options: {
      redirectTo: 'http://localhost:4173/auth.html?mode=admin&recovery=1',
      captchaToken: 'recovery-captcha-token'
    }
  });
  assert.deepEqual(updateRequest, { password: 'SecurePass!2026' });
});

test('admin UI renders explicit Turnstile with no sign-up path and wires password/recovery actions', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'auth.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8');
  assert.match(html, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/);
  assert.match(html, /id="turnstileContainer"/);
  assert.match(html, /id="recoveryTurnstileContainer"/);
  assert.match(html, /id="adminMfaView"/);
  assert.match(html, /id="mfaCode"/);
  assert.match(html, /id="mfaQrCode"/);
  assert.match(html, /id="toggleAdminPassword"/);
  assert.match(html, /id="forgotAdminPassword"/);
  assert.doesNotMatch(html, /admin[^\n]{0,40}sign[ -]?up|sign[ -]?up[^\n]{0,40}admin/i);
  assert.match(js, /turnstile\.render/);
  assert.match(js, /submitAdminLogin/);
  assert.match(js, /requestAdminPasswordReset/);
  assert.match(js, /admin_recovery/);
  assert.match(js, /recoveryTurnstileToken/);
  assert.match(js, /completeAdminPasswordRecovery/);
  assert.match(js, /beginAdminMfa/);
  assert.match(js, /verifyAdminMfa/);
});

test('admin password recovery suppresses normal student-session resume routing', () => {
  assert.equal(AuthPageServices.shouldResumeStudentAuth('?mode=admin&recovery=1'), false);
  assert.equal(AuthPageServices.shouldResumeStudentAuth('?mode=admin'), true);
  assert.equal(AuthPageServices.shouldResumeStudentAuth(''), true);
});
