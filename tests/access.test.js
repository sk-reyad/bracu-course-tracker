const test = require('node:test');
const assert = require('node:assert/strict');

const SupabaseModule = require('../js/supabase-client.js');
const AccessModule = require('../js/access.js');
const StorageModule = require('../js/storage.js');
const PreviewModule = require('../js/preview.js');
const BootModule = require('../js/app-boot.js');

function makeLocation(search = '') {
  return {
    search,
    assigned: '',
    replace(value) { this.assigned = value; }
  };
}

function context(overrides = {}) {
  return {
    session: { access_token: 'token' },
    user: { id: 'user-1', email: 'student@g.bracu.ac.bd' },
    profile: { id: 'user-1', status: 'active', onboarding_completed: true },
    role: 'student',
    permissions: [],
    ...overrides
  };
}

test('shared client validates public config and creates only one browser client', () => {
  let createCount = 0;
  const expected = { auth: {} };
  const api = SupabaseModule.createSupabaseApi({
    config: { supabaseUrl: 'https://project.supabase.co', supabasePublishableKey: 'sb_publishable_test' },
    sdk: { createClient() { createCount += 1; return expected; } }
  });
  assert.equal(api.getClient(), expected);
  assert.equal(api.getClient(), expected);
  assert.equal(createCount, 1);

  const invalid = SupabaseModule.createSupabaseApi({ config: {}, sdk: { createClient() {} } });
  assert.throws(() => invalid.getClient(), /configuration/i);
});

test('shared client exposes the active authenticator assurance level', async () => {
  const api = SupabaseModule.createSupabaseApi({
    config: { supabaseUrl: 'https://project.supabase.co', supabasePublishableKey: 'sb_publishable_test' },
    sdk: { createClient() { return { auth: { mfa: {
      async getAuthenticatorAssuranceLevel() {
        return { data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null };
      }
    } } }; } }
  });
  assert.deepEqual(await api.getAuthenticatorAssuranceLevel(), {
    currentLevel: 'aal2',
    nextLevel: 'aal2'
  });
});

test('preview access bypasses Supabase completely', async () => {
  let calls = 0;
  const location = makeLocation('?preview=1');
  const access = AccessModule.createAccessManager({
    location,
    supabaseApi: { async getSessionContext() { calls += 1; } }
  });
  const result = await access.requireMainAccess();
  assert.equal(result.preview, true);
  assert.equal(result.role, 'preview');
  assert.equal(calls, 0);
  assert.equal(location.assigned, '');
});

test('missing main session redirects to authentication', async () => {
  const location = makeLocation();
  const access = AccessModule.createAccessManager({
    location,
    supabaseApi: { async getSessionContext() { return { session: null }; } }
  });
  assert.equal(await access.requireMainAccess(), null);
  assert.equal(location.assigned, 'auth.html');
});

test('active onboarded student enters the main tracker', async () => {
  const location = makeLocation();
  const value = context();
  const access = AccessModule.createAccessManager({ location, supabaseApi: { async getSessionContext() { return value; } } });
  assert.equal(await access.requireMainAccess(), value);
  assert.equal(location.assigned, '');
});

test('pending student returns to onboarding', async () => {
  const location = makeLocation();
  const access = AccessModule.createAccessManager({
    location,
    supabaseApi: { async getSessionContext() { return context({ profile: { status: 'pending', onboarding_completed: false } }); } }
  });
  assert.equal(await access.requireMainAccess(), null);
  assert.equal(location.assigned, 'auth.html?step=onboarding');
});

test('suspended account is signed out before redirect', async () => {
  let signedOut = 0;
  const location = makeLocation();
  const access = AccessModule.createAccessManager({
    location,
    supabaseApi: {
      async getSessionContext() { return context({ profile: { status: 'suspended', onboarding_completed: true } }); },
      async signOut() { signedOut += 1; }
    }
  });
  assert.equal(await access.requireMainAccess(), null);
  assert.equal(signedOut, 1);
  assert.equal(location.assigned, 'auth.html?error=suspended');
});

test('student cannot enter admin panel and admin permissions are enforced', async () => {
  const studentLocation = makeLocation();
  const studentAccess = AccessModule.createAccessManager({
    location: studentLocation,
    supabaseApi: { async getSessionContext() { return context(); }, async signOut() {} }
  });
  assert.equal(await studentAccess.requireAdminAccess(), null);
  assert.equal(studentLocation.assigned, 'error.html?code=403&source=admin');

  const admin = context({ role: 'admin', permissions: ['users.read'] });
  const adminLocation = makeLocation();
  const adminAccess = AccessModule.createAccessManager({
    location: adminLocation,
    supabaseApi: {
      async getSessionContext() { return admin; },
      async getAuthenticatorAssuranceLevel() { return { currentLevel: 'aal2', nextLevel: 'aal2' }; }
    }
  });
  assert.equal((await adminAccess.requireAdminAccess()).role, 'admin');
  assert.equal(adminAccess.hasPermission(admin, 'users.read'), true);
  assert.equal(adminAccess.hasPermission(admin, 'admins.manage'), false);
  assert.equal(await adminAccess.requireAdminAccess('admins.manage'), null);
  assert.equal(adminLocation.assigned, 'error.html?code=403&source=admin');
});

test('admin panel redirects an AAL1 administrator to MFA verification', async () => {
  const location = makeLocation();
  const access = AccessModule.createAccessManager({
    location,
    supabaseApi: {
      async getSessionContext() { return context({ role: 'admin', permissions: ['users.read'] }); },
      async getAuthenticatorAssuranceLevel() { return { currentLevel: 'aal1', nextLevel: 'aal2' }; }
    }
  });

  assert.equal(await access.requireAdminAccess(), null);
  assert.equal(location.assigned, 'auth.html?mode=admin&mfa=1');
});

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); }
  };
}

function defaultData() {
  return {
    defaultProfile: { name: 'Template owner', email: 'owner@example.com', studentId: 'old', program: 'Old', startingSemester: 'Spring 2020' },
    courses: [{ code: 'CSE110', title: 'Programming Language I', credits: 3 }],
    departments: [{ id: 'CSE', name: 'Computer Science and Engineering' }],
    gradeScale: [{ grade: 'A', point: 4 }],
    defaultFaculties: [{ id: 'fac-1', name: 'Faculty' }],
    defaultSemesters: [{ id: 'sem-old', name: 'Legacy semester', courses: [] }]
  };
}

test('tracker storage uses a user-scoped v2 key and fresh accounts receive no previous owner history', () => {
  const local = memoryStorage();
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local, normalizeCourseCode: value => value });
  const fresh = manager.createFreshAuthenticatedState({
    full_name: 'New Student', email: 'new@g.bracu.ac.bd', student_id: '24100001', program: 'BSc in Computer Science (CS)',
    starting_term: 'Fall', starting_year: 2026, avatar_preference: 'custom', avatar_path: 'user-7/avatar.webp'
  });

  assert.equal(manager.keyForUser('user-7'), 'bracuCsCourseTracker.v2:user-7');
  assert.equal(fresh.profile.name, 'New Student');
  assert.equal(fresh.profile.email, 'new@g.bracu.ac.bd');
  assert.equal(fresh.profile.startingSemester, 'Fall 2026');
  assert.equal(fresh.profile.avatarPreference, 'custom');
  assert.equal(fresh.profile.avatarPath, 'user-7/avatar.webp');
  assert.equal('profilePhoto' in fresh.profile, false);
  assert.deepEqual(fresh.semesters, []);
  assert.equal(fresh.courses[0].code, 'CSE110');

  manager.saveUserState('user-7', fresh);
  assert.ok(local.getItem('bracuCsCourseTracker.v2:user-7'));
  assert.equal(local.getItem('bracuCsCourseTracker.v1'), null);
});

test('legacy v1 data migrates only for the same email and never deletes the legacy copy', () => {
  const legacy = {
    profile: { name: 'Matching Student', email: 'match@g.bracu.ac.bd' },
    semesters: [{ id: 'legacy-sem', name: 'Fall 2024', courses: [] }]
  };
  const local = memoryStorage({ 'bracuCsCourseTracker.v1': JSON.stringify(legacy) });
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local, normalizeCourseCode: value => value });

  assert.equal(manager.findLegacyMigrationCandidate('other@g.bracu.ac.bd'), null);
  const match = manager.loadUserState('matching-user', { profile: { email: 'match@g.bracu.ac.bd' } });
  assert.equal(match.semesters[0].id, 'legacy-sem');
  assert.ok(local.getItem('bracuCsCourseTracker.v2:matching-user'));
  assert.ok(local.getItem('bracuCsCourseTracker.v1'));
});

test('cloud state wins over local state and saves remain scoped to the authenticated user', () => {
  const local = memoryStorage({
    'bracuCsCourseTracker.v2:user-a': JSON.stringify({ profile: { email: 'a@g.bracu.ac.bd' }, semesters: [{ id: 'local' }] })
  });
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local, normalizeCourseCode: value => value });
  const loaded = manager.loadUserState('user-a', {
    profile: { email: 'a@g.bracu.ac.bd' },
    cloudState: { profile: { email: 'a@g.bracu.ac.bd' }, semesters: [{ id: 'cloud' }] }
  });
  assert.equal(loaded.semesters[0].id, 'cloud');
  assert.equal(JSON.parse(local.getItem('bracuCsCourseTracker.v2:user-a')).semesters[0].id, 'cloud');
});

test('preview state is generic, read-only, and does not use Supabase', () => {
  let supabaseCalls = 0;
  const preview = PreviewModule.createPreviewManager({ defaultData: defaultData() });
  const state = preview.createSanitizedState();
  assert.equal(state.profile.name, 'Preview Student');
  assert.equal(state.profile.email, 'preview@g.bracu.ac.bd');
  assert.notEqual(state.profile.name, defaultData().defaultProfile.name);
  assert.equal(preview.guardMutation(() => { supabaseCalls += 1; }), false);
  assert.equal(supabaseCalls, 0);
});

test('main boot waits for access, bypasses cloud in preview, and debounces per-user sync', async () => {
  const events = [];
  let scheduled;
  const previewBoot = BootModule.createTrackerBoot({
    accessManager: { async requireMainAccess() { events.push('access'); return { preview: true, role: 'preview' }; } },
    previewManager: { createSanitizedState() { events.push('preview'); return { profile: {}, semesters: [] }; } },
    storageManager: {},
    supabaseApi: { getClient() { throw new Error('preview must not create a Supabase client'); } },
    initializeApp(payload) { events.push('init'); return payload; },
    setTimer(callback) { scheduled = callback; return 1; },
    clearTimer() {}
  });
  await previewBoot.start();
  assert.deepEqual(events, ['access', 'preview', 'init']);

  const writes = [];
  const cloudClient = {
    from() {
      return {
        select() { return { eq() { return { maybeSingle: async () => ({ data: null, error: null }) }; } }; },
        upsert(row) { writes.push(row); return Promise.resolve({ error: null }); }
      };
    }
  };
  const authenticatedBoot = BootModule.createTrackerBoot({
    accessManager: { async requireMainAccess() { return context(); } },
    previewManager: {},
    storageManager: {
      loadUserState(userId) { return { owner: userId, settings: {}, semesters: [] }; },
      saveUserState() {}
    },
    supabaseApi: { getClient() { return cloudClient; } },
    initializeApp() {},
    setTimer(callback) { scheduled = callback; return 1; },
    clearTimer() {}
  });
  const runtime = await authenticatedBoot.start();
  runtime.queueCloudSync({ marker: 1 });
  runtime.queueCloudSync({ marker: 2 });
  assert.equal(writes.length, 0);
  await scheduled();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].user_id, 'user-1');
  assert.equal(writes[0].data.marker, 2);
});
