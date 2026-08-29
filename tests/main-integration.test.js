const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const roadmap = fs.readFileSync(path.join(root, 'js', 'roadmap.js'), 'utf8');
const storage = fs.readFileSync(path.join(root, 'js', 'storage.js'), 'utf8');
const data = require('../js/data.js');

test('main tracker uses the approved product name and guarded boot scripts', () => {
  assert.match(html, /<strong>BRACU Course Tracker<\/strong>/);
  assert.doesNotMatch(html, /<strong>BRACU CS Tracker<\/strong>/);
  for (const script of ['config.js', 'supabase-client.js', 'access.js', 'preview.js', 'app-boot.js']) {
    assert.match(html, new RegExp(`src="js/${script.replace('.', '\\.')}`));
  }
  assert.doesNotMatch(app, /let state\s*=\s*loadState\(\)/);
  assert.match(app, /BracuTrackerBoot\.start\(\)/);
});

test('Add Course searches the master catalog without exposing internal visibility labels', () => {
  assert.match(app, /let availableCatalogCourses = \[\]/);
  assert.match(app, /id="courseCatalogSearch"/);
  assert.match(app, /id="courseCatalogDepartment"/);
  assert.match(app, /id="courseCatalogResults"/);
  assert.match(app, /data-add-catalog-course/);
  assert.match(app, /data-catalog-credits/);
  assert.match(app, /BracuCatalog\.searchCatalogCourses/);
  assert.match(app, /BracuCatalog\.addCatalogCourse/);
  assert.doesNotMatch(app, /Search-only catalog/);
});

test('Course List exposes every approved curriculum field and applies the shared category matcher', () => {
  assert.match(html, /id="curriculumFieldFilter"/);
  for (const label of [
    'Stream 1: Writing Comprehension', 'Stream 2: Math and Natural Sciences',
    'Stream 3: Arts and Humanities', 'Stream 4: Social Sciences',
    'Stream 5: Communities, Seeking Transformation', 'GenEd Electives',
    'School Core', 'Program Core', 'Program Elective', 'Project / Internship / Thesis',
  ]) assert.ok(html.includes(label), label);
  assert.match(app, /BracuCatalog\.matchesCurriculumField\(course\.category,\s*curriculumFieldFilter\)/);
  assert.match(app, /curriculumFieldFilter[\s\S]*addEventListener\("change",\s*renderCourseList\)/);
});

test('stream badges disclose full names and See more opens the matching Course List filter', () => {
  assert.match(roadmap, /function renderCategoryBadge\(/);
  assert.match(roadmap, /class="badge category-badge stream-category"/);
  assert.match(roadmap, /<button class="stream-category-trigger" type="button"/);
  assert.match(roadmap, /data-curriculum-field=/);
  assert.match(roadmap, />See more<\/button>/);
  assert.match(app, /function openCurriculumField\(fieldId\)/);
  assert.match(app, /curriculumFieldFilter\.value\s*=\s*fieldId/);
  assert.match(app, /document\.getElementById\("courses"\)/);
  assert.match(app, /data-stream-see-more/);
});

test('course editing preserves Stream and grouped curriculum categories', () => {
  assert.match(app, /function categoryOptions\(selected = ""\)/);
  assert.match(app, /BracuCatalog\.curriculumFieldOptions\(\)/);
  assert.match(app, /if \(selected && !categories\.has\(selected\)\)/);
});

test('roadmap resolves semester alternatives without replacing stored attempt records', () => {
  assert.match(roadmap, /BracuCatalog\.resolveAlternativeReplacement\(state,\s*course\.code\)/);
  assert.match(roadmap, /alternativeReplacement/);
  assert.match(roadmap, /completedCount/);
});

test('dashboard profile is read-only until Edit and uses canonical Supabase controls', () => {
  assert.match(app, /let dashboardProfileEditing = false/);
  assert.match(app, /data-action="edit-profile"[^>]*>[\s\S]{0,120}data-lucide="pencil"/);
  assert.match(app, /data-action="save-profile"[^>]*>[\s\S]{0,120}data-lucide="check"/);
  assert.match(app, /data-action="cancel-profile-edit"[^>]*>[\s\S]{0,120}data-lucide="x"/);
  assert.match(app, /<select[^>]*data-profile-field="program"/);
  assert.match(app, /data-profile-field="startingTerm"/);
  assert.match(app, /data-profile-field="startingYear"/);
  assert.doesNotMatch(app, /<input[^>]*data-profile-field="program"/);
  assert.match(app, /BracuProfile\.createProfileService/);
  assert.match(app, /BracuProfile\.createAvatarRuntime/);
  assert.match(app, /BracuProfile\.normalizeCanonicalProfile/);
  assert.doesNotMatch(app, /Image is saved locally/);
  assert.doesNotMatch(app, /state\.profile\.profilePhoto/);
});

test('settings expose account sync without browser credentials', () => {
  assert.doesNotMatch(app, /id="cloudUrl"|id="cloudAnonKey"|id="cloudPassword"|cloudConfigForm|cloudAuthForm/);
  assert.match(app, /id="syncNowBtn"/);
  assert.match(html, /supportTicketsPanel[\s\S]*dashboard-sign-out-row[\s\S]*id="accountSignOutBtn"/);
  assert.doesNotMatch(app, /account-sync-actions[\s\S]{0,500}id="accountSignOutBtn"/);
});

test('only explicit reset and backup import may request a destructive cloud save', () => {
  assert.match(app, /function persist\(message = "Saved locally", options = \{\}\)/);
  assert.match(app, /queueTrackerCloudSync\(state, options\)/);
  assert.match(app, /intentionalResetAt:\s*new Date\(\)\.toISOString\(\)/);
  assert.match(app, /persist\("Data reset", \{ allowDestructive: true \}\)/);
  assert.match(app, /persist\("Backup imported", \{ allowDestructive: true \}\)/);
});

test('settings use a read-only faculty editor and a canonical grade scale table', () => {
  assert.match(app, /let editingFacultyId = null/);
  assert.match(app, /data-action="edit-faculty"[^>]*>[\s\S]{0,120}data-lucide="pencil"/);
  assert.match(app, /data-action="save-faculty-edit"[^>]*>[\s\S]{0,120}data-lucide="check"/);
  assert.match(app, /data-action="cancel-faculty-edit"[^>]*>[\s\S]{0,120}data-lucide="x"/);
  assert.match(app, /function validateFacultyDraft\(/);
  assert.match(app, /Faculty initial already exists/);
  assert.match(app, /class="grade-scale-table"/);
  assert.match(app, /<th scope="col">Grade<\/th>/);
  assert.match(app, /<th scope="col">Grade point<\/th>/);
  assert.doesNotMatch(app, /data-action="update-grade-scale"/);
});

test('faculty settings filter locally while preserving the active edit row', () => {
  assert.match(app, /id="facultySearch"/);
  assert.match(app, /id="facultyDepartmentFilter"/);
  assert.match(app, /id="facultyFilterCount"[^>]*role="status"/);
  assert.match(app, /BracuCatalog\.filterCatalogItems\("faculty"[\s\S]*preserveKey:\s*editingFacultyId/);
  assert.match(app, /facultySearch[\s\S]*renderFacultyList/);
  assert.match(app, /facultyDepartmentFilter[\s\S]*renderFacultyList/);
});

test('semester add and edit use canonical term and dynamic year selectors', () => {
  assert.match(html, /<select[^>]*id="semesterTermInput"/);
  assert.match(html, /<select[^>]*id="semesterYearInput"/);
  assert.doesNotMatch(html, /id="semesterNameInput"/);
  assert.match(app, /data-semester-term-draft/);
  assert.match(app, /data-semester-year-draft/);
  assert.match(app, /BracuProfile\.semesterYearOptions/);
  assert.match(app, /BracuProfile\.validateSemesterSelection/);
});

test('preview mode blocks faculty saving before any state mutation', () => {
  const previewGuard = app.slice(app.indexOf('function installPreviewMutationGuard'), app.indexOf('function initializeApp'));
  assert.match(previewGuard, /data-action='save-faculty-edit'/);
  const saveHandler = app.slice(app.indexOf('if (action === "save-faculty-edit")'), app.indexOf('if (action === "edit-course")'));
  assert.match(saveHandler, /if \(appAccessContext\?\.preview\)/);
  assert.match(saveHandler, /return showToast\("Preview mode is read-only"\)/);
});

test('dashboard photo editor reuses private avatar choices and responsive drop behavior', () => {
  assert.match(app, /id="dashboardPhotoDropzone"/);
  assert.match(app, /id="dashboardPhotoInput"[^>]*accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(app, /data-action="use-google-photo"/);
  assert.match(app, /data-action="remove-profile-photo"[^>]*aria-label="Remove profile photo"/);
  assert.match(app, /dashboardPhotoDropzone[\s\S]*dragover/);
  assert.match(app, /dashboardPhotoDropzone[\s\S]*drop/);
  assert.match(app, /referrerpolicy="no-referrer"/);
});

test('theme preference is global while tracker data remains user scoped', () => {
  assert.match(storage, /bracuCourseTracker\.theme/);
  assert.match(storage, /bracuCsCourseTracker\.v2:/);
  assert.match(app, /THEME_STORAGE_KEY/);
});

test('report metadata uses the deployed page URL and approved profile links', () => {
  assert.equal(
    data.resolveReportWebsiteUrl('', 'https://tracker.example/app/index.html?preview=1#report'),
    'https://tracker.example/app/index.html'
  );
  assert.equal(
    data.resolveReportWebsiteUrl('https://custom.example/tracker', 'https://ignored.example/index.html'),
    'https://custom.example/tracker'
  );
  assert.equal(data.resolveReportWebsiteUrl('', 'file:///tracker/index.html'), 'this website');
  assert.equal(data.DEFAULT_DATA.program.linkedinUrl, 'https://www.linkedin.com/in/sk-reyad/');
  assert.match(app, /resolveReportWebsiteUrl\(\s*DEFAULT_DATA\.program\.websiteUrl,\s*window\.location\.href,?\s*\)/);
});
