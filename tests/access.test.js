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

test('database state is canonical even when a non-pending local copy is newer', () => {
  const local = memoryStorage({
    'bracuCsCourseTracker.v2:user-a': JSON.stringify({
      profile: { email: 'a@g.bracu.ac.bd' },
      semesters: [{ id: 'local', courses: [{ id: 'local-attempt', code: 'CSE110' }] }],
      settings: { lastUpdated: '2026-08-28T00:00:00.000Z' }
    })
  });
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local, normalizeCourseCode: value => value });
  const loaded = manager.loadUserState('user-a', {
    profile: { email: 'a@g.bracu.ac.bd' },
    cloudRecord: {
      revision: 7,
      updatedAt: '2026-08-20T00:00:00.000Z',
      data: {
        profile: { email: 'a@g.bracu.ac.bd' },
        semesters: [{ id: 'cloud', courses: [{ id: 'cloud-attempt', code: 'CSE110' }] }],
        settings: { lastUpdated: '2026-08-20T00:00:00.000Z' }
      }
    }
  });
  assert.equal(loaded.semesters[0].id, 'cloud');
  assert.equal(JSON.parse(local.getItem('bracuCsCourseTracker.v2:user-a')).semesters[0].id, 'cloud');
  assert.deepEqual(manager.getLastLoadResolution(), {
    source: 'cloud',
    shouldSync: false,
    conflict: false,
    revision: 7
  });
});

test('a one-time legacy local recovery can repair blank pre-versioned cloud data', () => {
  const local = memoryStorage({
    'bracuCsCourseTracker.v2:user-a': JSON.stringify({
      profile: { email: 'a@g.bracu.ac.bd' },
      semesters: [{ id: 'fall-2025', courses: [{ id: 'attempt-1', code: 'CSE110' }] }],
      settings: { lastUpdated: '2026-08-01T00:00:00.000Z' }
    })
  });
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local, normalizeCourseCode: value => value });
  const loaded = manager.loadUserState('user-a', {
    profile: { email: 'a@g.bracu.ac.bd' },
    cloudRecord: {
      revision: 1,
      updatedAt: '2026-08-28T00:00:00.000Z',
      data: {
        profile: { email: 'a@g.bracu.ac.bd' },
        semesters: [],
        settings: { lastUpdated: '2026-08-28T00:00:00.000Z' }
      }
    }
  });

  assert.equal(loaded.semesters[0].id, 'fall-2025');
  assert.deepEqual(manager.getLastLoadResolution(), {
    source: 'local',
    shouldSync: true,
    conflict: false,
    revision: 1
  });
});

test('sync metadata is user scoped, survives reload, and clears only after a confirmed revision', () => {
  const local = memoryStorage({
    'bracuCsCourseTracker.sync.v1:broken': '{not-json'
  });
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local });

  assert.deepEqual(manager.getSyncMeta('broken'), {
    revision: 0,
    pending: false,
    protocolVersion: 0
  });
  manager.markSyncPending('user-a', 4);
  assert.deepEqual(manager.getSyncMeta('user-a'), {
    revision: 4,
    pending: true,
    protocolVersion: 1
  });
  assert.equal(manager.getSyncMeta('user-b').pending, false);
  manager.markSyncComplete('user-a', 5);
  assert.deepEqual(manager.getSyncMeta('user-a'), {
    revision: 5,
    pending: false,
    protocolVersion: 1
  });
});

test('compatible pending local data is retried while a revision mismatch is preserved as a conflict', () => {
  const state = {
    profile: { email: 'a@g.bracu.ac.bd' },
    semesters: [{ id: 'local', courses: [{ id: 'attempt-1', code: 'CSE110' }] }],
    settings: { lastUpdated: '2026-08-28T00:00:00.000Z' }
  };
  const key = 'bracuCsCourseTracker.v2:user-a';
  const local = memoryStorage({ [key]: JSON.stringify(state) });
  const manager = StorageModule.createStorageManager({ defaultData: defaultData(), storage: local, normalizeCourseCode: value => value });
  manager.markSyncPending('user-a', 3);

  let loaded = manager.loadUserState('user-a', {
    profile: { email: 'a@g.bracu.ac.bd' },
    cloudRecord: { revision: 3, data: { semesters: [] } }
  });
  assert.equal(loaded.semesters[0].id, 'local');
  assert.deepEqual(manager.getLastLoadResolution(), {
    source: 'local-pending',
    shouldSync: true,
    conflict: false,
    revision: 3
  });

  loaded = manager.loadUserState('user-a', {
    profile: { email: 'a@g.bracu.ac.bd' },
    cloudRecord: { revision: 4, data: { semesters: [] } }
  });
  assert.equal(loaded.semesters[0].id, 'local');
  assert.deepEqual(manager.getLastLoadResolution(), {
    source: 'local-conflict',
    shouldSync: false,
    conflict: true,
    revision: 4
  });
});

test('faculty catalog migration adds verified defaults once without overwriting user faculty records', () => {
  const defaults = defaultData();
  defaults.facultyCatalogVersion = 1;
  defaults.defaultFaculties = [
    { id: 'fac-default-a', initial: 'AAA', name: 'Default A', email: 'a@bracu.ac.bd', department: 'CSE' },
    { id: 'fac-default-b', initial: 'BBB', name: 'Default B', email: 'b@bracu.ac.bd', department: 'CSE' }
  ];
  const manager = StorageModule.createStorageManager({ defaultData: defaults, normalizeCourseCode: value => value });
  const migrated = manager.migrateState({
    settings: {},
    faculties: [
      { id: 'fac-user-a', initial: 'AAA', name: 'User A', email: 'custom@example.com', department: 'CSE' },
      { id: 'fac-custom', initial: 'CUSTOM', name: 'Custom Faculty', email: '', department: 'CSE' }
    ]
  });

  assert.equal(migrated.settings.facultyCatalogVersion, 1);
  assert.equal(migrated.faculties.length, 3);
  assert.equal(migrated.faculties.find(faculty => faculty.initial === 'AAA').name, 'User A');
  assert.equal(migrated.faculties.find(faculty => faculty.initial === 'BBB').name, 'Default B');
  assert.equal(migrated.faculties.find(faculty => faculty.initial === 'CUSTOM').name, 'Custom Faculty');

  const rerun = manager.migrateState(migrated);
  assert.equal(rerun.faculties.length, 3);
});

test('faculty catalog migration persists its version for an existing local user', () => {
  const defaults = defaultData();
  defaults.facultyCatalogVersion = 1;
  defaults.defaultFaculties = [
    { id: 'fac-default-a', initial: 'AAA', name: 'Default A', email: 'a@bracu.ac.bd', department: 'CSE' },
    { id: 'fac-default-b', initial: 'BBB', name: 'Default B', email: 'b@bracu.ac.bd', department: 'CSE' }
  ];
  const key = 'bracuCsCourseTracker.v2:existing-user';
  const local = memoryStorage({
    [key]: JSON.stringify({
      profile: { email: 'existing@g.bracu.ac.bd' },
      settings: {},
      faculties: [{ id: 'fac-default-a', initial: 'AAA', name: 'Default A', email: 'a@bracu.ac.bd', department: 'CSE' }],
      semesters: []
    })
  });
  const manager = StorageModule.createStorageManager({ defaultData: defaults, storage: local, normalizeCourseCode: value => value });

  manager.loadUserState('existing-user', { profile: { email: 'existing@g.bracu.ac.bd' } });
  const persisted = JSON.parse(local.getItem(key));

  assert.equal(persisted.settings.facultyCatalogVersion, 1);
  assert.deepEqual(persisted.faculties.map(faculty => faculty.initial), ['AAA', 'BBB']);
});

test('catalog data migration consolidates departments without changing academic history', () => {
  const defaults = defaultData();
  defaults.catalogDataVersion = 2;
  defaults.departments = [
    { id: 'MPS', name: 'Department of Mathematics & Physical Sciences' },
    { id: 'GENED', name: 'School of General Education' },
    { id: 'CSE', name: 'Computer Science and Engineering' },
  ];
  defaults.courses = [];
  defaults.defaultFaculties = [];
  const manager = StorageModule.createStorageManager({
    defaultData: defaults,
    normalizeCourseCode: value => String(value || '').toUpperCase(),
  });
  const history = [{
    id: 'fall-2024', number: 1,
    courses: [{ id: 'attempt-1', code: 'CSE161', status: 'completed', grade: 'A', facultyId: 'fac-mns' }],
  }];
  const migrated = manager.migrateState({
    settings: { catalogDataVersion: 0 },
    departments: [
      { id: 'MNS', name: 'Old Mathematics' },
      { id: 'MPS', name: 'New Mathematics' },
      { id: 'GED', name: 'General Education' },
      { id: 'SGE', name: 'School of General Education' },
    ],
    courses: [
      { code: 'MAT110', title: 'Math', department: 'MNS' },
      { code: 'SOC101', title: 'Sociology', department: 'SGE' },
    ],
    faculties: [
      { id: 'fac-mns', initial: 'AAA', name: 'Math Faculty', department: 'MNS' },
      { id: 'fac-ged', initial: 'BBB', name: 'GenEd Faculty', department: 'GED' },
    ],
    semesters: structuredClone(history),
  });

  assert.equal(migrated.settings.catalogDataVersion, 2);
  assert.deepEqual(migrated.departments.map(item => item.id), ['MPS', 'GENED', 'CSE']);
  assert.equal(migrated.courses.find(item => item.code === 'MAT110').department, 'MPS');
  assert.equal(migrated.courses.find(item => item.code === 'SOC101').department, 'GENED');
  assert.equal(migrated.faculties.find(item => item.initial === 'AAA').department, 'MPS');
  assert.equal(migrated.faculties.find(item => item.initial === 'BBB').department, 'GENED');
  assert.equal(migrated.semesters.length, history.length);
  assert.equal(migrated.semesters[0].courses.length, history[0].courses.length);
  for (const field of ['id', 'code', 'status', 'grade', 'facultyId']) {
    assert.equal(migrated.semesters[0].courses[0][field], history[0].courses[0][field]);
  }
  assert.deepEqual(manager.migrateState(migrated), migrated, 'migration must be idempotent');
});

test('authenticated load persists and syncs a catalog data version upgrade', () => {
  const defaults = defaultData();
  defaults.catalogDataVersion = 2;
  const local = memoryStorage();
  const manager = StorageModule.createStorageManager({
    defaultData: defaults,
    storage: local,
    normalizeCourseCode: value => String(value || '').toUpperCase(),
  });
  const loaded = manager.loadUserState('catalog-user', {
    profile: { email: 'catalog@g.bracu.ac.bd' },
    cloudRecord: {
      revision: 4,
      data: {
        profile: { email: 'catalog@g.bracu.ac.bd' },
        courses: [], departments: [], faculties: [], semesters: [],
        settings: { catalogDataVersion: 0 },
      },
    },
  });

  assert.equal(loaded.settings.catalogDataVersion, 2);
  assert.equal(JSON.parse(local.getItem(manager.keyForUser('catalog-user'))).settings.catalogDataVersion, 2);
  assert.deepEqual(manager.getLastLoadResolution(), {
    source: 'cloud', shouldSync: true, conflict: false, revision: 4,
  });
});

test('state migration restores the canonical BRACU grade scale instead of accepting backup edits', () => {
  const defaults = defaultData();
  defaults.gradeScale = [
    { grade: 'A+', point: 4, range: '97 - 100' },
    { grade: 'F', point: 0, range: '0 - <50' }
  ];
  const manager = StorageModule.createStorageManager({
    defaultData: defaults,
    normalizeCourseCode: value => value
  });

  const migrated = manager.migrateState({
    gradeScale: [{ grade: 'A+', point: 1, range: 'Custom range' }]
  });

  assert.deepEqual(migrated.gradeScale, defaults.gradeScale);
  assert.notEqual(migrated.gradeScale, defaults.gradeScale);
});

test('faculty edit transitions validate saves and leave source data unchanged on cancel or rejection', () => {
  const manager = StorageModule.createStorageManager({
    defaultData: defaultData(),
    normalizeCourseCode: value => value
  });
  const faculties = [
    { id: 'fac-1', name: 'Alice Faculty', initial: 'ALC', email: 'alice@bracu.ac.bd', department: 'CSE' },
    { id: 'fac-2', name: 'Bob Faculty', initial: 'BOB', email: '', department: 'CSE' }
  ];
  const original = structuredClone(faculties);

  const cancelled = manager.resolveFacultyEdit({
    faculties,
    departments: defaultData().departments,
    facultyId: 'fac-1',
    action: 'cancel',
    draft: { name: 'Unsaved name', initial: 'ZZZ', email: '', department: 'CSE' }
  });
  assert.equal(cancelled.cancelled, true);
  assert.deepEqual(cancelled.faculties, original);
  assert.deepEqual(faculties, original);

  const duplicate = manager.resolveFacultyEdit({
    faculties,
    departments: defaultData().departments,
    facultyId: 'fac-1',
    action: 'save',
    draft: { name: 'Alice Revised', initial: 'bob', email: 'alice@bracu.ac.bd', department: 'CSE' }
  });
  assert.equal(duplicate.error, 'Faculty initial already exists');
  assert.deepEqual(duplicate.faculties, original);
  assert.deepEqual(faculties, original);

  const saved = manager.resolveFacultyEdit({
    faculties,
    departments: defaultData().departments,
    facultyId: 'fac-1',
    action: 'save',
    draft: { name: 'Alice Revised', initial: 'alc2', email: 'alice.revised@bracu.ac.bd', department: 'CSE' }
  });
  assert.equal(saved.saved, true);
  assert.equal(saved.faculties.find(item => item.id === 'fac-1').initial, 'ALC2');
  assert.equal(saved.faculties.find(item => item.id === 'fac-1').name, 'Alice Revised');
  assert.deepEqual(faculties, original);

  const spaced = manager.resolveFacultyEdit({
    faculties,
    departments: defaultData().departments,
    facultyId: 'fac-1',
    action: 'save',
    draft: { name: 'Alice Revised', initial: 'a lc 2', email: '', department: 'CSE' }
  });
  assert.equal(spaced.saved, true);
  assert.equal(spaced.faculties.find(item => item.id === 'fac-1').initial, 'ALC2');
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

test('main boot waits for access, bypasses cloud in preview, and debounces one revisioned RPC save', async () => {
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

  const rpcCalls = [];
  const pending = [];
  const completed = [];
  const cloudClient = {
    from() {
      return {
        select(columns) {
          assert.equal(columns, 'data, revision, updated_at');
          return { eq() { return { maybeSingle: async () => ({ data: null, error: null }) }; } };
        }
      };
    },
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      return { data: [{ new_revision: 1, saved_at: '2026-08-28T00:00:00Z' }], error: null };
    }
  };
  const authenticatedBoot = BootModule.createTrackerBoot({
    accessManager: { async requireMainAccess() { return context(); } },
    previewManager: {},
    storageManager: {
      setActiveStorageUser() {},
      loadUserState(userId) { return { owner: userId, settings: {}, semesters: [] }; },
      getLastLoadResolution() { return { source: 'fresh', shouldSync: false, conflict: false, revision: 0 }; },
      markSyncPending(userId, revision) { pending.push({ userId, revision }); },
      markSyncComplete(userId, revision) { completed.push({ userId, revision }); }
    },
    supabaseApi: { getClient() { return cloudClient; } },
    initializeApp() {},
    setTimer(callback) { scheduled = callback; return 1; },
    clearTimer() {}
  });
  const runtime = await authenticatedBoot.start();
  runtime.queueCloudSync({ marker: 1 });
  runtime.queueCloudSync({ marker: 2 });
  assert.equal(rpcCalls.length, 0);
  assert.deepEqual(pending.at(-1), { userId: 'user-1', revision: 0 });
  await scheduled();
  assert.equal(rpcCalls.length, 1);
  assert.deepEqual(rpcCalls[0], {
    name: 'save_course_tracker_state',
    args: {
      p_expected_revision: 0,
      p_data: { marker: 2 },
      p_allow_destructive: false
    }
  });
  assert.deepEqual(completed, [{ userId: 'user-1', revision: 1 }]);
});

test('boot migrates legacy local history against the current cloud revision through the RPC', async () => {
  let scheduled;
  const rpcCalls = [];
  const recovered = {
    profile: { email: 'student@g.bracu.ac.bd' },
    semesters: [{ id: 'spring-2026', courses: [] }],
    settings: { lastUpdated: '2026-08-01T00:00:00.000Z' }
  };
  const client = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { data: { semesters: [], settings: { lastUpdated: '2026-08-28T00:00:00.000Z' } }, revision: 6, updated_at: '2026-08-28T00:00:00Z' },
                  error: null
                })
              };
            }
          };
        },
      };
    },
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      return { data: [{ new_revision: 7, saved_at: '2026-08-28T01:00:00Z' }], error: null };
    }
  };
  const boot = BootModule.createTrackerBoot({
    accessManager: { async requireMainAccess() { return context(); } },
    previewManager: {},
    storageManager: {
      setActiveStorageUser() {},
      loadUserState() { return recovered; },
      getLastLoadResolution() { return { source: 'local', shouldSync: true, conflict: false, revision: 6 }; },
      markSyncPending() {},
      markSyncComplete() {}
    },
    supabaseApi: { getClient() { return client; } },
    initializeApp() {},
    setTimer(callback) { scheduled = callback; return 1; },
    clearTimer() {}
  });

  await boot.start();
  assert.equal(rpcCalls.length, 0);
  assert.equal(typeof scheduled, 'function');
  await scheduled();
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0].name, 'save_course_tracker_state');
  assert.equal(rpcCalls[0].args.p_expected_revision, 6);
  assert.equal(rpcCalls[0].args.p_data.semesters[0].id, 'spring-2026');
  assert.equal(rpcCalls[0].args.p_allow_destructive, false);
});
