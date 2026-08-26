const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
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
  assert.match(app, /id="accountSignOutBtn"/);
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
