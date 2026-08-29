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

test('legacy alternative identities and canonical department labels are centralized', () => {
  assert.equal(CatalogModule.isAlternativeCourseCode('cse 161'), true);
  assert.equal(CatalogModule.isAlternativeCourseCode('EEE283L'), true);
  assert.equal(CatalogModule.isAlternativeCourseCode('CSE110'), false);
  assert.equal(CatalogModule.departmentDisplayId('GENED'), 'GenEd');
  assert.equal(CatalogModule.departmentDisplayId('MPS'), 'MPS');
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
    { code: 'CSE110', title: 'Programming Language I', department: 'CSE', category: 'core', visibility: 'curriculum' },
    { code: 'MAT110', title: 'Mathematics I', department: 'MNS', category: 'math', visibility: 'curriculum' },
    { code: 'CSE220', title: 'Data Structures', department: 'CSE', category: 'core', visibility: 'search_only' },
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
  assert.deepEqual(
    CatalogModule.filterCatalogItems('course', courses, { visibility: 'search_only' }).map((item) => item.code),
    ['CSE220']
  );
});

test('catalog partitions curriculum courses from Add Course only records', () => {
  const result = CatalogModule.partitionCatalogCourses([
    { code: 'CSE110', visibility: 'curriculum' },
    { code: 'ARC201', visibility: 'search_only' },
    { code: 'CSE161', visibility: 'alternative' },
    { code: 'MAT110' },
  ]);

  assert.deepEqual(result.all.map((course) => course.code), ['CSE110', 'ARC201', 'CSE161', 'MAT110']);
  assert.deepEqual(result.curriculum.map((course) => course.code), ['CSE110', 'MAT110']);
  assert.deepEqual(result.searchOnly.map((course) => course.code), ['ARC201']);
  assert.deepEqual(result.alternatives.map((course) => course.code), ['CSE161']);
  assert.deepEqual(result.addable.map((course) => course.code), ['CSE110', 'ARC201', 'CSE161', 'MAT110']);
});

test('curriculum fields preserve stable slugs while matching approved grouped filters', () => {
  assert.deepEqual(CatalogModule.curriculumFieldOptions().map((item) => item.label), [
    'Stream 1: Writing Comprehension',
    'Stream 2: Math and Natural Sciences',
    'Stream 3: Arts and Humanities',
    'Stream 4: Social Sciences',
    'Stream 5: Communities, Seeking Transformation',
    'GenEd Electives',
    'School Core',
    'Program Core',
    'Program Elective',
    'Project / Internship / Thesis',
  ]);
  assert.equal(CatalogModule.curriculumFieldForCategory('stream-4-social-sciences'), 'stream-4');
  assert.equal(CatalogModule.curriculumFieldForCategory('gened'), 'gened-electives');
  assert.equal(CatalogModule.curriculumFieldForCategory('general-elective'), 'gened-electives');
  assert.equal(CatalogModule.curriculumFieldForCategory('capstone'), 'project');
  assert.equal(CatalogModule.curriculumFieldForCategory('thesis-project'), 'project');
  assert.equal(CatalogModule.matchesCurriculumField('program-core', 'program-core'), true);
  assert.equal(CatalogModule.matchesCurriculumField('school-core', 'program-core'), false);
});

test('alternative pairs replace only their canonical roadmap requirement without rewriting attempts', () => {
  const state = {
    semesters: [{
      id: 'fall-2024',
      courses: [
        { id: 'one', code: 'CSE161', status: 'completed', grade: 'A' },
        { id: 'two', code: 'CSE162L', status: 'current', grade: '' },
      ],
    }],
  };
  const before = structuredClone(state);
  const replacement = CatalogModule.resolveAlternativeReplacement(state, 'CSE110');

  assert.deepEqual(replacement.codes, ['CSE161', 'CSE162L']);
  assert.equal(replacement.completedCount, 1);
  assert.equal(replacement.satisfied, false);
  assert.equal(replacement.status, 'current');
  assert.equal(CatalogModule.resolveAlternativeReplacement(state, 'CSE260'), null);
  assert.deepEqual(state, before);

  state.semesters[0].courses[1].status = 'completed';
  assert.equal(CatalogModule.resolveAlternativeReplacement(state, 'CSE110').satisfied, true);
  assert.equal(CatalogModule.resolveAlternativeReplacement(state, 'CSE110').status, 'completed');
});

test('alternative resolution prefers a satisfied path over an earlier partial path', () => {
  const state = {
    semesters: [{ courses: [
      { id: 'planned-first', code: 'CSE161', status: 'planned' },
      { id: 'done-one', code: 'EEE103', status: 'completed', countsInCGPA: true },
      { id: 'done-two', code: 'EEE103L', status: 'completed', countsInCGPA: true },
    ] }],
  };
  const replacement = CatalogModule.resolveAlternativeReplacement(state, 'CSE110');
  assert.deepEqual(replacement.codes, ['EEE103', 'EEE103L']);
  assert.equal(replacement.satisfied, true);
});

test('student catalog search covers all courses while filtering by department', () => {
  const courses = [
    { code: 'CSE110', title: 'Programming Language I', department: 'CSE' },
    { code: 'ARC201', title: 'Design Studio III', department: 'ARC', visibility: 'search_only' },
    { code: 'CSE220', title: 'Data Structures', department: 'CSE' },
  ];

  assert.deepEqual(
    CatalogModule.searchCatalogCourses(courses, { query: 'design', department: 'ARC' })
      .map((course) => course.code),
    ['ARC201'],
  );
  assert.deepEqual(
    CatalogModule.searchCatalogCourses(courses, { department: 'CSE' })
      .map((course) => course.code),
    ['CSE110', 'CSE220'],
  );
});

test('adding from the master catalog blocks duplicates and requires unknown credits', () => {
  const state = { courses: [{ code: 'cse110', title: 'My existing course' }] };
  const duplicate = CatalogModule.addCatalogCourse(state, {
    code: ' CSE 110 ', title: 'Global duplicate', credits: 3,
  });
  assert.equal(duplicate.added, false);
  assert.match(duplicate.error, /already/i);
  assert.equal(state.courses.length, 1);

  const unknown = { code: 'ARC201', title: 'Design Studio III', credits: null, visibility: 'search_only' };
  const missingCredits = CatalogModule.addCatalogCourse(state, unknown);
  assert.equal(missingCredits.added, false);
  assert.match(missingCredits.error, /credits/i);

  const added = CatalogModule.addCatalogCourse(state, unknown, { credits: 3 });
  assert.equal(added.added, true);
  assert.equal(state.courses.length, 2);
  assert.deepEqual(
    { code: added.course.code, credits: added.course.credits, title: added.course.title },
    { code: 'ARC201', credits: 3, title: 'Design Studio III' },
  );
  assert.equal(added.course.visibility, undefined);
  assert.equal(added.course.catalogOrigin, undefined);
});

test('alternative visibility follows an existing user course without overwriting its data', () => {
  const state = {
    courses: [{ code: 'ARC201', title: 'My saved title', credits: 4 }],
    departments: [], faculties: [], semesters: [], settings: {},
  };
  CatalogModule.mergeGlobalCatalog(state, {
    courses: [{ code: 'ARC201', title: 'Global title', credits: 3, visibility: 'alternative' }],
    departments: [], faculties: [],
  });
  assert.equal(state.courses[0].title, 'My saved title');
  assert.equal(state.courses[0].catalogVisibility, 'alternative');

  const addedState = { courses: [] };
  CatalogModule.addCatalogCourse(
    addedState,
    { code: 'EEE103', title: 'Alternative', credits: 3, visibility: 'alternative' },
  );
  assert.equal(addedState.courses[0].catalogVisibility, 'alternative');
});

test('catalog presents friendly category labels while storing validated slugs', () => {
  assert.equal(CatalogModule.slugifyCategoryLabel('Stream 4: Social Sciences'), 'stream-4-social-sciences');
  assert.equal(CatalogModule.slugifyCategoryLabel('Math & Natural Sciences'), 'math-and-natural-sciences');
  assert.equal(CatalogModule.categoryDisplayLabel('stream-4-social-sciences'), 'Stream 4: Social Sciences');
  assert.equal(CatalogModule.categoryDisplayLabel('architecture-core'), 'Architecture Core');
});

test('catalog extracts the Edge Function JSON error instead of the generic SDK message', async () => {
  const response = new Response(JSON.stringify({ error: 'Enter a valid course category.' }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
  const sdkError = Object.assign(
    new Error('Edge Function returned a non-2xx status code'),
    { context: response },
  );

  assert.equal(
    await CatalogModule.functionErrorMessage(sdkError, null),
    'Enter a valid course category.',
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

test('mergeGlobalCatalog is idempotent and non-course tombstones keep deleted globals out', () => {
  const state = catalogState();
  state.settings.catalogTombstones = { departments: ['MNS'], faculties: [] };
  const catalog = {
    courses: [
      { code: 'CSE220', title: 'Data Structures' },
      { code: 'CSE330', title: 'Algorithms' },
    ],
    departments: [{ id: 'MNS', name: 'Mathematics and Natural Sciences' }],
    faculties: [],
  };

  CatalogModule.mergeGlobalCatalog(state, catalog);
  const first = structuredClone(state);
  CatalogModule.mergeGlobalCatalog(state, catalog);

  assert.deepEqual(state, first);
  assert.equal(state.departments.some((item) => item.id === 'MNS'), false);
  assert.equal(state.courses.find((item) => item.code === 'CSE220').catalogOrigin, 'global');
  assert.equal(state.courses.find((item) => item.code === 'CSE330').catalogOrigin, 'global');
});

test('mergeGlobalCatalog removes a previously injected non-course row once its tombstone is set', () => {
  const state = { departments: [{ id: 'MNS', catalogOrigin: 'global', catalogKey: 'MNS' }], settings: {
    catalogTombstones: { departments: ['MNS'] },
  } };
  CatalogModule.mergeGlobalCatalog(state, { departments: [{ id: 'MNS', name: 'Reintroduced' }] });
  assert.deepEqual(state.departments, []);
});

test('mergeGlobalCatalog repairs legacy course tombstones so curriculum courses stay canonical for every account', () => {
  const state = {
    courses: [], departments: [], faculties: [],
    settings: {
      catalogTombstones: {
        courses: ['SOC101'],
        faculties: ['ABC'],
      },
    },
  };

  CatalogModule.mergeGlobalCatalog(state, {
    courses: [{
      code: 'SOC101', title: 'Introduction to Sociology',
      visibility: 'curriculum', department: 'ESS', credits: 3,
    }],
    departments: [], faculties: [],
  });

  assert.equal(state.courses.some((course) => course.code === 'SOC101'), true);
  assert.equal(state.courses.find((course) => course.code === 'SOC101').catalogOrigin, 'global');
  assert.deepEqual(state.settings.catalogTombstones, { faculties: ['ABC'] });
});

test('mergeGlobalCatalog keeps Add Course only records out of the default Course List', () => {
  const userOwned = { code: 'ARC202', title: 'User-added catalog course' };
  const overridden = {
    code: 'ARC203', title: 'User override', catalogOrigin: 'global',
    catalogKey: 'ARC203', catalogOverridden: true,
  };
  const state = {
    courses: [
      { code: 'ARC201', title: 'Previously injected', catalogOrigin: 'global', catalogKey: 'ARC201' },
      userOwned,
      overridden,
    ],
    departments: [], faculties: [], settings: {},
  };

  CatalogModule.mergeGlobalCatalog(state, {
    courses: [
      { code: 'ARC201', title: 'Design Studio III', visibility: 'search_only' },
      { code: 'ARC202', title: 'Design Studio IV', visibility: 'search_only' },
      { code: 'ARC203', title: 'History of Architecture', visibility: 'search_only' },
      { code: 'CSE110', title: 'Programming Language I', visibility: 'curriculum' },
    ],
  });

  assert.equal(state.courses.some((course) => course.code === 'ARC201'), false);
  assert.equal(state.courses.find((course) => course.code === 'ARC202'), userOwned);
  assert.equal(state.courses.find((course) => course.code === 'ARC203'), overridden);
  assert.equal(state.courses.find((course) => course.code === 'CSE110').catalogOrigin, 'global');
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

test('markCatalogDeleted never hides a canonical global course after its identity changes', () => {
  const state = { settings: {} };
  CatalogModule.markCatalogDeleted(state, 'course', {
    code: 'CSE330',
    catalogOrigin: 'global',
    catalogKey: 'CSE220',
  });
  assert.deepEqual(state.settings.catalogTombstones, undefined);
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
  assert.equal(state.courses.find((item) => item.code === 'CSE220').catalogOrigin, 'global');
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
      category: undefined, visibility: 'curriculum', roadmapLevel: null, roadmapOrder: null,
      hardPrerequisites: [], softPrerequisites: [], sourceNote: null, isRoadmapSlot: false,
    }],
    faculties: rows.catalog_faculties,
  });
  assert.deepEqual(calls, [
    ['catalog_departments', 'id, name, color'],
    ['catalog_courses', 'code, title, credits, department, category, visibility, roadmap_level, roadmap_order, hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot'],
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
    setTimer() { return 1; },
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
        return {
          courses: [
            { code: 'CSE220', visibility: 'curriculum' },
            { code: 'ARC201', visibility: 'search_only' },
          ],
          departments: [], faculties: [],
        };
      },
      mergeGlobalCatalog(value, catalog) {
        value.courses.push(...catalog.courses);
        return value;
      },
    },
    initializeApp(payload) { initialized = payload; },
    setTimer() { return 1; },
  });

  await boot.start();
  assert.equal(catalogReads, 3);
  assert.equal(initialized.state.courses[0].code, 'CSE220');
  assert.deepEqual(
    initialized.availableCatalogCourses.map((course) => course.code),
    ['CSE220', 'ARC201'],
  );
});

test('authenticated boot persists fresh-account curriculum hydration to the cloud', async () => {
  const localState = {
    courses: [], departments: [], faculties: [], semesters: [], settings: {},
  };
  const rpcCalls = [];
  let queuedWrite = Promise.resolve();
  let initialized;
  const client = {
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
    async rpc(name, args) {
      rpcCalls.push([name, args]);
      return {
        data: [{ new_revision: 1, saved_at: '2026-08-29T00:00:00Z' }],
        error: null,
      };
    },
  };
  const boot = BootModule.createTrackerBoot({
    accessManager: {
      async requireMainAccess() {
        return { user: { id: 'new-user' }, profile: {}, preview: false };
      },
    },
    storageManager: {
      loadUserState() { return localState; },
      getLastLoadResolution() { return { shouldSync: false }; },
      saveUserState() {},
      markSyncPending() {},
      markSyncComplete() {},
    },
    supabaseApi: { getClient() { return client; } },
    catalogApi: {
      async fetchGlobalCatalog() {
        return {
          courses: [{
            code: 'SOC101', title: 'Introduction to Sociology',
            visibility: 'curriculum', department: 'ESS', credits: 3,
          }],
          departments: [], faculties: [],
        };
      },
      mergeGlobalCatalog: CatalogModule.mergeGlobalCatalog,
    },
    initializeApp(payload) { initialized = payload; },
    setTimer(callback) {
      queuedWrite = Promise.resolve(callback());
      return 1;
    },
  });

  await boot.start();
  await queuedWrite;

  assert.equal(initialized.state.courses.some((course) => course.code === 'SOC101'), true);
  assert.equal(rpcCalls.length, 1);
  assert.equal(rpcCalls[0][0], 'save_course_tracker_state');
  assert.equal(rpcCalls[0][1].p_expected_revision, 0);
  assert.equal(rpcCalls[0][1].p_data, localState);
});
