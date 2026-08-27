const test = require('node:test');
const assert = require('node:assert/strict');

const CatalogModule = require('../js/catalog.js');
const BootModule = require('../js/app-boot.js');

function catalogState() {
  return {
    courses: [
      { code: 'cse110', title: 'My course title', credits: 4, custom: true },
    ],
    departments: [
      { id: 'cse', name: 'My department name', custom: true },
    ],
    faculties: [
      { id: 'faculty-user', initial: 'abc', name: 'My faculty', custom: true },
    ],
    settings: {},
  };
}

test('normalizeCatalogKey uses the normalized identity field for each catalog kind', () => {
  assert.equal(CatalogModule.normalizeCatalogKey('course', { code: ' cse 110 ' }), 'CSE110');
  assert.equal(CatalogModule.normalizeCatalogKey('courses', { code: ' cse 110 ' }), 'CSE110');
  assert.equal(CatalogModule.normalizeCatalogKey('department', { id: ' c s e ' }), 'CSE');
  assert.equal(CatalogModule.normalizeCatalogKey('faculty', { initial: ' aBc ' }), 'ABC');
  assert.equal(CatalogModule.normalizeCatalogKey('faculty', { initial: ' A B ' }), 'AB');
  assert.equal(CatalogModule.normalizeCatalogKey('unknown', { code: 'CSE110' }), '');
});

test('faculty identity ignores whitespace so a local row wins an equivalent global initial', () => {
  const local = { id: 'faculty-local', initial: 'A B', name: 'Local faculty' };
  const state = { courses: [], departments: [], faculties: [local], settings: {} };

  CatalogModule.mergeGlobalCatalog(state, {
    faculties: [{ initial: 'AB', name: 'Global faculty', department: 'CSE' }],
  });

  assert.equal(state.faculties.length, 1);
  assert.equal(state.faculties[0], local);
  assert.equal(state.faculties[0].name, 'Local faculty');
});

test('catalog filters find the intended records by kind and exact select filters', () => {
  const departments = [
    { id: 'CSE', name: 'Computer Science and Engineering' },
    { id: 'MNS', name: 'Mathematics and Natural Sciences' },
  ];
  const courses = [
    { code: 'CSE110', title: 'Programming Language I', department: 'CSE', category: 'core' },
    { code: 'MAT110', title: 'Mathematics I', department: 'MNS', category: 'math' },
    { code: 'CSE220', title: 'Data Structures', department: 'CSE', category: 'core' },
  ];
  const faculties = [
    { initial: 'ADU', name: 'Ahmed Mahir Ruhan', email: 'ahmed.ruhan@bracu.ac.bd', department: 'CSE' },
    { initial: 'MDS', name: 'Mathematics Faculty', email: 'math@bracu.ac.bd', department: 'MNS' },
  ];

  assert.deepEqual(
    CatalogModule.filterCatalogItems('department', departments, { query: 'natural' }).map((item) => item.id),
    ['MNS']
  );
  assert.deepEqual(
    CatalogModule.filterCatalogItems('course', courses, {
      query: 'cse', department: 'CSE', category: 'core'
    }).map((item) => item.code),
    ['CSE110', 'CSE220']
  );
  assert.deepEqual(
    CatalogModule.filterCatalogItems('faculty', faculties, {
      query: 'ahmed.ruhan', department: 'CSE'
    }).map((item) => item.initial),
    ['ADU']
  );
  assert.deepEqual(
    CatalogModule.filterCatalogItems('course', courses, { department: 'MNS', category: 'core' }),
    []
  );
});

test('catalog filtering preserves an actively edited faculty row when filters change', () => {
  const faculties = [
    { id: 'faculty-adu', initial: 'ADU', name: 'Ahmed Mahir Ruhan', department: 'CSE' },
    { id: 'faculty-mds', initial: 'MDS', name: 'Mathematics Faculty', department: 'MNS' },
  ];

  assert.deepEqual(
    CatalogModule.filterCatalogItems('faculty', faculties, {
      query: 'mathematics', department: 'MNS', preserveKey: 'faculty-adu'
    }).map((item) => item.initial),
    ['ADU', 'MDS']
  );
});

test('faculty edit draft keeps unsaved field values across list filtering', () => {
  const source = {
    id: 'faculty-adu', initial: 'ADU', name: 'Ahmed Mahir Ruhan',
    email: 'ahmed.ruhan@bracu.ac.bd', department: 'CSE'
  };
  const draft = CatalogModule.createFacultyEditDraft(source);
  draft.update('name', 'Unsaved faculty name');
  draft.update('department', 'MNS');

  const visible = CatalogModule.filterCatalogItems('faculty', [source], {
    query: 'does not match', department: 'MNS', preserveKey: source.id
  });

  assert.equal(visible.length, 1);
  assert.deepEqual(draft.snapshot(), {
    id: 'faculty-adu', initial: 'ADU', name: 'Unsaved faculty name',
    email: 'ahmed.ruhan@bracu.ac.bd', department: 'MNS'
  });
  assert.equal(source.name, 'Ahmed Mahir Ruhan');
  assert.equal(source.department, 'CSE');
  assert.throws(() => draft.update('id', 'changed-id'), /cannot be edited/i);
});

test('prepareCatalogEdit marks every global edit as an override and preserves its original key', () => {
  const course = { code: 'CSE220', title: 'Global course', catalogOrigin: 'global', catalogKey: 'CSE220' };
  const changedCourse = CatalogModule.prepareCatalogEdit('course', course, { code: 'CSE 330', title: 'My course' });
  assert.equal(changedCourse.catalogTombstoneKey, 'CSE220');
  assert.equal(changedCourse.item.catalogOrigin, undefined);
  assert.equal(changedCourse.item.catalogKey, 'CSE220');
  assert.equal(changedCourse.item.catalogOverridden, true);

  const department = { id: 'CSE', name: 'Global department', catalogOrigin: 'global', catalogKey: 'CSE' };
  const renamedDepartment = CatalogModule.prepareCatalogEdit('department', department, { id: 'MNS', name: 'Edited' });
  assert.equal(renamedDepartment.catalogTombstoneKey, 'CSE');
  assert.equal(renamedDepartment.item.catalogOrigin, undefined);
  assert.equal(renamedDepartment.item.catalogKey, 'CSE');
  assert.equal(renamedDepartment.item.catalogOverridden, true);

  const revisedFaculty = CatalogModule.prepareCatalogEdit('faculty', { initial: 'ABC', catalogOrigin: 'global', catalogKey: 'ABC' }, { initial: 'ABC', name: 'Edited' });
  assert.equal(revisedFaculty.catalogTombstoneKey, undefined);
  assert.equal(revisedFaculty.item.catalogOrigin, 'global');
  assert.equal(revisedFaculty.item.catalogKey, 'ABC');
  assert.equal(revisedFaculty.item.catalogOverridden, true);

  const renamedFaculty = CatalogModule.prepareCatalogEdit('faculty', { initial: 'ABC', catalogOrigin: 'global', catalogKey: 'ABC' }, { initial: 'A B', name: 'Edited' });
  assert.equal(renamedFaculty.catalogTombstoneKey, 'ABC');
  assert.equal(renamedFaculty.item.catalogOrigin, undefined);
  assert.equal(renamedFaculty.item.catalogKey, 'ABC');
  assert.equal(renamedFaculty.item.catalogOverridden, true);
});

test('mergeGlobalCatalog refreshes untouched global rows while preserving local faculty identity', () => {
  const state = {
    courses: [{ code: 'CSE220', title: 'Old title', catalogOrigin: 'global', catalogKey: 'CSE220' }],
    departments: [{ id: 'CSE', name: 'Old name', catalogOrigin: 'global', catalogKey: 'CSE' }],
    faculties: [{ id: 'faculty-local-id', initial: 'ABC', name: 'Old faculty', catalogOrigin: 'global', catalogKey: 'ABC' }],
    settings: {},
  };

  CatalogModule.mergeGlobalCatalog(state, {
    courses: [{ code: 'CSE220', title: 'New title', credits: 3 }],
    departments: [{ id: 'CSE', name: 'New name', color: 'blue' }],
    faculties: [{ initial: 'ABC', name: 'New faculty', email: 'abc@bracu.ac.bd', department: 'CSE' }],
  });

  assert.equal(state.courses[0].title, 'New title');
  assert.equal(state.departments[0].name, 'New name');
  assert.equal(state.faculties[0].name, 'New faculty');
  assert.equal(state.faculties[0].id, 'faculty-local-id');
  assert.equal(state.faculties[0].catalogOrigin, 'global');
});

test('mergeGlobalCatalog keeps user overrides and matching user-owned rows unchanged', () => {
  const overridden = {
    code: 'CSE220', title: 'My override', catalogOrigin: 'global', catalogKey: 'CSE220', catalogOverridden: true,
  };
  const userOwned = { code: 'CSE330', title: 'My local course' };
  const state = { courses: [overridden, userOwned], departments: [], faculties: [], settings: {} };

  CatalogModule.mergeGlobalCatalog(state, {
    courses: [
      { code: 'CSE220', title: 'New global title' },
      { code: 'CSE330', title: 'Conflicting global title' },
    ],
  });

  assert.equal(state.courses[0], overridden);
  assert.equal(state.courses[0].title, 'My override');
  assert.equal(state.courses[1], userOwned);
  assert.equal(state.courses[1].title, 'My local course');
});

test('mergeGlobalCatalog preserves user rows and injects missing globals with origin metadata', () => {
  const state = catalogState();
  const userCourse = state.courses[0];
  const userDepartment = state.departments[0];
  const catalog = {
    courses: [
      { code: ' CSE110 ', title: 'Global title', credits: 3 },
      { code: 'CSE220', title: 'Data Structures', credits: 3 },
    ],
    departments: [
      { id: ' CSE ', name: 'Global department' },
      { id: 'MNS', name: 'Mathematics and Natural Sciences' },
    ],
    faculties: [
      { initial: ' ABC ', name: 'Global faculty' },
      { initial: 'DEF', name: 'Injected faculty', department: 'CSE' },
    ],
  };

  const merged = CatalogModule.mergeGlobalCatalog(state, catalog);

  assert.equal(merged, state);
  assert.equal(state.courses[0], userCourse);
  assert.equal(state.courses[0].title, 'My course title');
  assert.equal(state.departments[0], userDepartment);
  assert.equal(state.departments[0].name, 'My department name');
  assert.equal(state.faculties.find((item) => item.initial === 'abc').name, 'My faculty');

  const injectedCourse = state.courses.find((item) => item.code === 'CSE220');
  assert.deepEqual(
    { origin: injectedCourse.catalogOrigin, key: injectedCourse.catalogKey },
    { origin: 'global', key: 'CSE220' },
  );
  assert.equal(state.departments.find((item) => item.id === 'MNS').catalogKey, 'MNS');
  assert.equal(state.faculties.find((item) => item.initial === 'DEF').catalogOrigin, 'global');
});

test('mergeGlobalCatalog is idempotent and tombstones keep deleted globals out', () => {
  const state = catalogState();
  state.settings.catalogTombstones = { courses: ['CSE220'], departments: [], faculties: [] };
  const catalog = {
    courses: [
      { code: 'CSE220', title: 'Deleted global course' },
      { code: 'CSE330', title: 'Algorithms' },
    ],
    departments: [],
    faculties: [],
  };

  CatalogModule.mergeGlobalCatalog(state, catalog);
  const first = structuredClone(state);
  CatalogModule.mergeGlobalCatalog(state, catalog);

  assert.deepEqual(state, first);
  assert.equal(state.courses.some((item) => item.code === 'CSE220'), false);
  assert.equal(state.courses.find((item) => item.code === 'CSE330').catalogOrigin, 'global');
});

test('mergeGlobalCatalog removes a previously injected global row once its tombstone is set', () => {
  const state = { courses: [{ code: 'CSE220', catalogOrigin: 'global', catalogKey: 'CSE220' }], settings: {
    catalogTombstones: { courses: ['CSE220'] },
  } };
  CatalogModule.mergeGlobalCatalog(state, { courses: [{ code: 'CSE220', title: 'Reintroduced' }] });
  assert.deepEqual(state.courses, []);
});

test('markCatalogDeleted records only global identities and leaves user data plus attempts intact', () => {
  const state = catalogState();
  state.faculties.push({ id: 'faculty-global', initial: 'XYZ', catalogOrigin: 'global', catalogKey: 'XYZ' });
  state.semesters = [{ id: 's1', courses: [{ id: 'a1', code: 'CSE110', facultyId: 'faculty-global' }] }];

  assert.equal(CatalogModule.markCatalogDeleted(state, 'faculty', state.faculties[0]), state);
  assert.deepEqual(state.settings.catalogTombstones, undefined);

  CatalogModule.markCatalogDeleted(state, 'faculty', state.faculties[1]);
  assert.deepEqual(state.settings.catalogTombstones, { faculties: ['XYZ'] });
  assert.equal(state.semesters[0].courses[0].facultyId, 'faculty-global');
});

test('markCatalogDeleted always records the original catalog key after a global item identity changes', () => {
  const state = { settings: {} };
  CatalogModule.markCatalogDeleted(state, 'course', {
    code: 'CSE330',
    catalogOrigin: 'global',
    catalogKey: 'CSE220',
  });
  assert.deepEqual(state.settings.catalogTombstones, { courses: ['CSE220'] });
});

test('edited global rows either retain their origin or tombstone the old key before future merges', () => {
  const state = {
    courses: [{ code: 'CSE220', title: 'Original', catalogOrigin: 'global', catalogKey: 'CSE220' }],
    departments: [{ id: 'CSE', name: 'Original', catalogOrigin: 'global', catalogKey: 'CSE' }],
    faculties: [{ id: 'faculty-1', initial: 'ABC', name: 'Original', catalogOrigin: 'global', catalogKey: 'ABC' }],
    settings: {},
  };
  const changed = CatalogModule.prepareCatalogEdit('course', state.courses[0], { code: 'CSE 330', title: 'Mine' });
  CatalogModule.markCatalogDeleted(state, 'course', { code: changed.catalogTombstoneKey, catalogOrigin: 'global', catalogKey: changed.catalogTombstoneKey });
  state.courses[0] = changed.item;
  const retained = CatalogModule.prepareCatalogEdit('department', state.departments[0], { id: 'CSE', name: 'Edited' });
  state.departments[0] = retained.item;
  const renamedFaculty = CatalogModule.prepareCatalogEdit('faculty', state.faculties[0], { id: 'faculty-1', initial: 'A B', name: 'Mine' });
  CatalogModule.markCatalogDeleted(state, 'faculty', { initial: renamedFaculty.catalogTombstoneKey, catalogOrigin: 'global', catalogKey: renamedFaculty.catalogTombstoneKey });
  state.faculties[0] = renamedFaculty.item;

  CatalogModule.mergeGlobalCatalog(state, {
    courses: [{ code: 'CSE220', title: 'Returned course' }],
    departments: [{ id: 'CSE', name: 'Returned department' }],
    faculties: [{ initial: 'ABC', name: 'Returned faculty' }],
  });
  assert.equal(state.courses.find((item) => item.code === 'CSE220'), undefined);
  assert.equal(state.departments[0].catalogKey, 'CSE');
  assert.equal(state.departments[0].name, 'Edited');
  assert.equal(state.faculties.find((item) => item.initial === 'ABC'), undefined);
  assert.equal(state.faculties[0].initial, 'A B');
  assert.equal(state.faculties[0].catalogOrigin, undefined);
});

test('fetchGlobalCatalog reads only public catalog columns', async () => {
  const calls = [];
  const rows = {
    catalog_departments: [{ id: 'CSE' }],
    catalog_courses: [{ code: 'CSE110' }],
    catalog_faculties: [{ initial: 'ABC' }],
  };
  const client = {
    from(table) {
      return { select: async (columns) => {
        calls.push([table, columns]);
        return { data: rows[table], error: null };
      } };
    },
  };

  assert.deepEqual(await CatalogModule.fetchGlobalCatalog(client), {
    departments: rows.catalog_departments,
    courses: [{
      code: 'CSE110', title: undefined, credits: undefined, department: undefined,
      category: undefined, roadmapLevel: null, roadmapOrder: null,
      hardPrerequisites: [], softPrerequisites: [], sourceNote: null, isRoadmapSlot: false,
    }],
    faculties: rows.catalog_faculties,
  });
  assert.deepEqual(calls, [
    ['catalog_departments', 'id, name, color'],
    ['catalog_courses', 'code, title, credits, department, category, roadmap_level, roadmap_order, hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot'],
    ['catalog_faculties', 'initial, name, email, department'],
  ]);
  assert.equal(JSON.stringify(calls).includes('created_by'), false);
  assert.equal(JSON.stringify(calls).includes('created_at'), false);
});

test('authenticated boot merges catalog while preview never fetches it and catalog read failure is non-blocking', async () => {
  const events = [];
  const state = catalogState();
  const previewBoot = BootModule.createTrackerBoot({
    accessManager: { async requireMainAccess() { return { preview: true }; } },
    previewManager: { createSanitizedState() { return state; } },
    storageManager: {},
    supabaseApi: { getClient() { throw new Error('preview must not create a client'); } },
    initializeApp() { events.push('init'); },
  });
  await previewBoot.start();
  assert.deepEqual(events, ['init']);

  let initialized;
  const authenticatedBoot = BootModule.createTrackerBoot({
    accessManager: {
      async requireMainAccess() {
        return { user: { id: 'u1' }, profile: {}, preview: false };
      },
    },
    previewManager: {},
    storageManager: {
      loadUserState() { return state; },
    },
    supabaseApi: {
      getClient() {
        return {
          from() {
            return {
              select() {
                return {
                  eq() {
                    return { maybeSingle: async () => ({ data: null, error: null }) };
                  },
                };
              },
            };
          },
        };
      },
    },
    catalogApi: {
      async fetchGlobalCatalog() { throw new Error('offline'); },
    },
    initializeApp(payload) { initialized = payload; },
  });
  const previousWarn = console.warn;
  console.warn = () => {};
  try {
    await assert.doesNotReject(() => authenticatedBoot.start());
  } finally {
    console.warn = previousWarn;
  }
  assert.equal(initialized.state, state);
});

test('authenticated boot applies a successful global catalog before initializing the app', async () => {
  let initialized;
  let catalogReads = 0;
  const localState = { courses: [], departments: [], faculties: [], settings: {} };
  const client = {
    from(table) {
      return {
        select() {
          if (table !== 'course_tracker_data') catalogReads += 1;
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: null, error: null }),
              };
            },
          };
        },
      };
    },
  };
  const boot = BootModule.createTrackerBoot({
    accessManager: { async requireMainAccess() { return { user: { id: 'u1' }, profile: {} }; } },
    storageManager: { loadUserState() { return localState; } },
    supabaseApi: { getClient() { return client; } },
    catalogApi: {
      async fetchGlobalCatalog() {
        catalogReads += 3;
        return { courses: [{ code: 'CSE220' }], departments: [], faculties: [] };
      },
      mergeGlobalCatalog(value, catalog) {
        value.courses.push(...catalog.courses);
        return value;
      },
    },
    initializeApp(payload) { initialized = payload; },
  });

  await boot.start();
  assert.equal(catalogReads, 3);
  assert.equal(initialized.state.courses[0].code, 'CSE220');
});
