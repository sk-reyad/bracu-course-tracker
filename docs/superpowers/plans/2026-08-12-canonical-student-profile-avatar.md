# Canonical Student Profile and Avatar Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase the canonical student-profile source, add explicit Google/custom/none avatar choices, fix private-photo rendering, and replace the always-editable Dashboard profile with a responsive view/edit workflow.

**Architecture:** A new browser/Node-compatible `BracuProfile` module owns profile normalization, photo validation/compression, avatar draft transitions, private-photo runtime URLs, and failure-safe Supabase writes. A new SQL migration adds the avatar preference and validated profile RPCs, while a separate guarded manual SQL file performs the approved one-time onboarding reset and is never loaded by the website or migration chain. Auth and Dashboard become thin UI adapters around the shared profile module.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Supabase JavaScript v2, PostgreSQL/RLS/RPC, Lucide, Node.js built-in test runner.

## Global Constraints

- Supabase `public.profiles` is canonical for Student ID, Program, Starting Term, Starting Year, `avatar_preference`, and `avatar_path`.
- Google-provided name and email remain immutable.
- Programs are exactly `BSc in Computer Science (CS)` and `BSc in Computer Science & Engineering (CSE)`.
- Terms are exactly `Spring`, `Summer`, and `Fall`; year must remain between 2001 and 2100.
- Avatar preferences are exactly `google`, `custom`, and `none`; `none` never silently falls back to Google.
- Custom profile images remain JPEG/PNG/WebP, maximum 5 MB, compressed to WebP, and stored in the private `profile-photos` bucket.
- Runtime Google URLs, Blob URLs, File objects, and Blob objects must never be persisted in localStorage or `course_tracker_data`.
- The onboarding reset is manual, exact-email guarded, non-recurring, and never part of browser code, an Auth hook, a trigger, or automatic migrations.
- Preserve all current roadmap, GPA, faculty, report, preview, admin, OAuth-domain, RLS, light/dark-theme, reduced-motion, and responsive behavior.
- Do not add dependencies or expose a service-role/secret key in browser code.

---

### Task 1: Add Canonical Avatar Schema, RPCs, and Guarded Manual Reset

**Files:**
- Create: `supabase/migrations/202608120004_canonical_student_profile_avatar.sql`
- Create: `supabase/manual/20260812_reset_sk_reyad_ali_onboarding.sql`
- Modify: `tests/auth.test.js`

**Interfaces:**
- Produces database column `public.profiles.avatar_preference text not null` constrained to `google|custom|none`.
- Produces RPC `public.complete_student_onboarding(student_id text, program text, starting_term text, starting_year integer, avatar_preference text, avatar_path text)`.
- Produces RPC `public.update_student_profile(student_id text, program text, starting_term text, starting_year integer, avatar_preference text, avatar_path text)` returning `public.profiles`.
- The manual reset consumes the exact email `sk.reyad.ali@g.bracu.ac.bd` and affects exactly one existing student profile.

- [ ] **Step 1: Write failing schema and reset-isolation tests**

Extend `tests/auth.test.js` with assertions equivalent to:

```js
const profileSql = fs.readFileSync(path.join(root, 'supabase/migrations/202608120004_canonical_student_profile_avatar.sql'), 'utf8');
const resetSql = fs.readFileSync(path.join(root, 'supabase/manual/20260812_reset_sk_reyad_ali_onboarding.sql'), 'utf8');
assert.match(profileSql, /avatar_preference[\s\S]*check[\s\S]*'google'[\s\S]*'custom'[\s\S]*'none'/i);
assert.match(profileSql, /create or replace function public\.update_student_profile/i);
assert.match(profileSql, /storage\.objects[\s\S]*owner_id[\s\S]*auth\.uid/i);
assert.match(resetSql, /sk\.reyad\.ali@g\.bracu\.ac\.bd/i);
assert.match(resetSql, /expected exactly one matching student profile/i);
assert.match(resetSql, /delete from public\.course_tracker_data/i);
assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /reset_sk_reyad_ali|manual\/20260812/);
assert.doesNotMatch(fs.readFileSync(path.join(root, 'auth.html'), 'utf8'), /reset_sk_reyad_ali|manual\/20260812/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/auth.test.js`

Expected: FAIL because the migration and guarded manual reset do not exist.

- [ ] **Step 3: Implement the avatar migration and backfill**

The migration must:

```sql
alter table public.profiles
  add column if not exists avatar_preference text;

update public.profiles
set avatar_preference = case when avatar_path is null then 'google' else 'custom' end
where avatar_preference is null;

alter table public.profiles
  alter column avatar_preference set default 'google',
  alter column avatar_preference set not null;
```

Add a named check constraint only when it does not already exist. Replace the five-argument onboarding function with the six-argument form, validate the preference, require a caller-owned object in `storage.objects` for `custom`, clear the path for `google|none`, and retain the current official-domain, pending-status, and profile identity protections. Grant only `authenticated` execution.

Create `update_student_profile` with the same program/term/year/avatar validation, but require an active onboarded caller whose app role is `student`; update only Student ID, program, starting term/year, avatar preference/path, and `updated_at`.

- [ ] **Step 4: Implement the one-time manual reset guard**

The manual file must use a transaction and a PL/pgSQL guard that:

```sql
select count(*) into target_count
from public.profiles
where lower(email) = 'sk.reyad.ali@g.bracu.ac.bd';

if target_count <> 1 then
  raise exception 'Reset aborted: expected exactly one matching student profile';
end if;
```

Abort if any `profile-photos` Storage object remains under the target UUID folder, because files must be deleted with the Storage API/Dashboard. Then update only the exact profile to pending/unonboarded with cleared academic fields, `avatar_preference='google'`, `avatar_path=null`, and delete only the target UUID's `course_tracker_data` row. End with a verification `select`; do not create a function, trigger, cron job, browser button, or migration reference.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run: `node --test tests/auth.test.js`

Expected: all auth tests PASS.

### Task 2: Build the Shared Profile and Avatar Domain Module

**Files:**
- Create: `js/profile.js`
- Create: `tests/profile.test.js`
- Modify: `auth.html`
- Modify: `index.html`
- Modify: `js/storage.js`
- Modify: `tests/access.test.js`

**Interfaces:**
- Produces `BracuProfile.PROGRAMS`, `TERMS`, and `AVATAR_PREFERENCES` frozen arrays.
- Produces `normalizeCanonicalProfile(profile, user): TrackerProfile` with `startingTerm`, `startingYear`, `startingSemester`, `avatarPreference`, and `avatarPath`.
- Produces `getGoogleAvatarUrl(user): string` and `getInitials(name): string`.
- Produces `validatePhotoFile(file): { valid: boolean, error: string }` and `compressProfilePhoto(file): Promise<Blob>`.
- Produces `createAvatarDraft({ profile, user }): { snapshot, chooseGoogle(), chooseNone(), chooseCustom(file) }`.
- Produces `createAvatarRuntime({ client, urlApi }): { resolve(profile, user), dispose() }`, where `resolve()` returns `{ kind: 'image'|'initials', src: string, initials: string, external: boolean }`.
- Produces `createProfileService({ client, getSessionContext, clock, nonce }): { submitOnboarding(input), updateStudentProfile(input) }`.

- [ ] **Step 1: Write failing pure-domain and runtime tests**

Create `tests/profile.test.js` covering:

```js
assert.deepEqual(Profile.normalizeCanonicalProfile({
  full_name: 'Student', email: 'S@G.BRACU.AC.BD', starting_term: 'Fall', starting_year: 2026,
  avatar_preference: 'custom', avatar_path: 'user-1/avatar.webp'
}, { id: 'user-1' }), {
  name: 'Student', email: 's@g.bracu.ac.bd', studentId: '', program: '',
  university: 'BRAC University', startingTerm: 'Fall', startingYear: 2026,
  startingSemester: 'Fall 2026', avatarPreference: 'custom', avatarPath: 'user-1/avatar.webp'
});
assert.equal(Profile.getGoogleAvatarUrl({ user_metadata: { avatar_url: 'https://google/avatar' } }), 'https://google/avatar');
assert.equal(Profile.createAvatarDraft({ profile: { avatarPreference: 'google' }, user: {} }).chooseNone().avatarPreference, 'none');
```

Use a fake Storage client and fake `urlApi` to prove custom resolution calls `download(path)`, creates a Blob URL, revokes the previous URL, and never falls back to Google for `custom` failure or `none`.

- [ ] **Step 2: Run the new tests and verify RED**

Run: `node --test tests/profile.test.js tests/access.test.js`

Expected: FAIL because `js/profile.js` and the canonical mapping do not exist.

- [ ] **Step 3: Implement pure normalization and the avatar state machine**

Use database field names exactly:

```js
const startingTerm = clean(profile.starting_term || profile.startingTerm);
const startingYear = Number(profile.starting_year || profile.startingYear) || 0;
const avatarPreference = AVATAR_PREFERENCES.includes(profile.avatar_preference || profile.avatarPreference)
  ? (profile.avatar_preference || profile.avatarPreference)
  : (profile.avatar_path || profile.avatarPath ? 'custom' : 'google');
```

`chooseNone()` clears the draft File and path; `chooseGoogle()` clears them and is unavailable as an image if metadata has no URL; `chooseCustom(file)` validates the File and retains it only on success. Keep runtime display URLs outside the draft snapshot.

- [ ] **Step 4: Implement private-photo runtime and transactional writes**

For `custom`, call `client.storage.from('profile-photos').download(path)`, then `urlApi.createObjectURL(blob)`. Revoke any prior custom object URL before replacing it and in `dispose()`.

For a new custom photo, compress it and upload a versioned caller path such as `${userId}/avatar-${clock()}-${nonce()}.webp`. Invoke the relevant RPC with the six canonical arguments. On RPC failure, remove the new object. On success, remove an old custom object only after the canonical row is updated. For `none|google`, send a null path and clean an old custom object after success.

- [ ] **Step 5: Wire scripts and fix tracker normalization**

Load `js/profile.js` before `js/auth.js` in `auth.html`, and before `js/storage.js`/`js/app.js` in `index.html`. Replace `storage.js`'s ad-hoc profile mapper with `BracuProfile.normalizeCanonicalProfile(profile, user)`; update its public factory dependency so Node tests inject/import `ProfileModule` without relying on browser globals.

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run: `node --test tests/profile.test.js tests/access.test.js`

Expected: all profile and access tests PASS, including correct `Fall 2026`, `avatarPreference`, and `avatarPath` mapping.

### Task 3: Integrate Google, Custom, and No-Photo States into Onboarding

**Files:**
- Modify: `auth.html`
- Modify: `css/auth.css`
- Modify: `js/auth.js`
- Modify: `js/auth-core.js`
- Modify: `tests/auth.test.js`

**Interfaces:**
- Consumes `BracuProfile.createAvatarDraft`, `createAvatarRuntime`, `createProfileService`, `PROGRAMS`, and `TERMS`.
- Produces onboarding DOM actions `useGooglePhoto`, `removePhoto`, and the existing `profilePhoto` picker/drop target.
- Submits `{ studentId, program, startingTerm, startingYear, avatarPreference, avatarPath?, photoFile? }` through the shared profile service.

- [ ] **Step 1: Write failing onboarding avatar-choice tests**

Assert the onboarding markup includes an actual identity `<img>` state, `Use Google photo`, accessible `Remove profile photo`, and the existing custom dropzone. Add controller/service tests proving:

```js
assert.equal(payload.avatar_preference, 'none');
assert.equal(payload.avatar_path, null);
assert.match(googleImageMarkup, /referrerpolicy="no-referrer"/);
```

Also assert the program values and term values are sourced from the exact shared constants and no expiring/object URL is placed in the RPC payload.

- [ ] **Step 2: Run auth tests and verify RED**

Run: `node --test tests/auth.test.js tests/profile.test.js`

Expected: FAIL because onboarding currently shows initials only and supports only an optional custom file.

- [ ] **Step 3: Render the initial Google photo and privacy actions**

When OAuth resumes, initialize the avatar draft from `context.profile` and `context.user`. Render Google metadata using `avatar_url`, then `picture`, with `referrerpolicy="no-referrer"`. If no Google photo exists, render initials and hide the restore-Google action. The delete button changes the draft to `none`; it does not modify name/email or call Supabase before form submission.

- [ ] **Step 4: Reuse custom picker/drop behavior with the shared draft**

Picker and drop both call `chooseCustom(file)`. Keep the fixed media slot, supported-format hint, selected filename, Replace, and accessible delete behavior. Switching to Google or none revokes the temporary selected-file URL and clears the file input. Switching to custom hides the placeholder/Google preview in the same media slot.

- [ ] **Step 5: Submit through the shared canonical service**

Remove the page-local upload/RPC transaction and call `profileService.submitOnboarding(...)`. Preserve busy state, error copy, success toast, official-domain routing, and redirect to `index.html`. Refresh the session context after success so the next page receives active canonical data.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test tests/auth.test.js tests/profile.test.js`

Expected: all onboarding/profile tests PASS.

### Task 4: Replace Always-Editable Dashboard Profile with View/Edit Workflow

**Files:**
- Modify: `js/app.js`
- Modify: `css/style.css`
- Modify: `tests/main-integration.test.js`
- Modify: `tests/interaction-layer.test.js`

**Interfaces:**
- Consumes `appAccessContext.user`, canonical `appAccessContext.profile`, `BracuProfile.createAvatarRuntime`, `createAvatarDraft`, and `createProfileService`.
- Produces `dashboardProfileEditing: boolean`, a draft profile object, and runtime-only resolved avatar display.
- Produces Dashboard actions `edit-profile`, `save-profile`, `cancel-profile-edit`, `use-google-photo`, and `remove-profile-photo`.

- [ ] **Step 1: Write failing Dashboard structure and transition tests**

Replace the old always-editable assertions with contracts for:

```js
assert.match(app, /data-action="edit-profile"[^>]*>[\s\S]*data-lucide="pencil"/);
assert.match(app, /data-action="save-profile"[^>]*>[\s\S]*data-lucide="check"/);
assert.match(app, /data-action="cancel-profile-edit"[^>]*>[\s\S]*data-lucide="x"/);
assert.match(app, /<select[^>]*data-profile-field="program"/);
assert.match(app, /data-profile-field="startingTerm"/);
assert.match(app, /data-profile-field="startingYear"/);
assert.doesNotMatch(app, /<input[^>]*data-profile-field="program"/);
```

Assert the Dashboard photo editor uses the same supported formats, 5 MB boundary, drag events, Google restore, custom preview, and accessible photo delete control. Assert the old `Image is saved locally` copy is removed.

- [ ] **Step 2: Run main interaction tests and verify RED**

Run: `node --test tests/main-integration.test.js tests/interaction-layer.test.js`

Expected: FAIL because the profile form is permanently open and uses text/native file inputs.

- [ ] **Step 3: Implement read-only view mode and edit-state header**

Render profile details as text by default. Put Edit in the details panel's top-right. In edit mode, render Save and Cancel in the same header. Name/email stay read-only and Google-managed; University stays fixed. Program uses the exact two-option dropdown, and term/year use the onboarding option sets and main-site inset select-arrow styling.

- [ ] **Step 4: Implement the shared responsive photo editor**

Resolve the canonical avatar on Dashboard open. In edit mode, initialize an isolated avatar draft and reuse the fixed media/copy/actions layout, picker, drag/drop, Google restore, and no-photo delete semantics. The trash action must set `none`, never alter name/email, and never persist before Save. Cancel revokes draft/runtime URLs and restores the canonical display.

- [ ] **Step 5: Save to Supabase, then synchronize tracker state**

Call `profileService.updateStudentProfile(draft)`. On success, re-read the canonical context/profile, update `appAccessContext.profile`, merge `BracuProfile.normalizeCanonicalProfile(...)` into `state.profile`, save the user-scoped local state, queue cloud sync, re-resolve the avatar, leave edit mode, rerender Dashboard/report, and show a floating success toast. On failure, keep edit mode and the draft intact with an actionable error; never partially mutate `state.profile`.

- [ ] **Step 6: Make the profile UI responsive and accessible**

Add explicit grid regions and breakpoints so view/edit/photo actions have no horizontal overflow at 360, 768, 1024, and 1280 CSS pixels. Maintain 44px touch targets, visible focus, dark-theme contrast, reduced-motion behavior, accessible photo action names, and the existing approved button hover family.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `node --test tests/main-integration.test.js tests/interaction-layer.test.js tests/profile.test.js`

Expected: all Dashboard/profile interaction tests PASS.

### Task 5: Verify Reset Isolation, Persistence, and Regression Boundaries

**Files:**
- Modify: `docs/SETUP.md`
- Verify: `supabase/manual/20260812_reset_sk_reyad_ali_onboarding.sql`
- Verify: `supabase/migrations/202608120004_canonical_student_profile_avatar.sql`
- Verify: `auth.html`, `index.html`, `css/auth.css`, `css/style.css`, and all touched JavaScript.

**Interfaces:**
- Consumes completed Tasks 1–4.
- Produces an operator checklist that applies migration 004 once and runs the onboarding reset only by deliberate SQL Editor action.

- [ ] **Step 1: Document migration and one-time reset separately**

In `docs/SETUP.md`, add exact instructions:

1. Apply migration `202608120004_canonical_student_profile_avatar.sql` once.
2. Do not paste the manual reset into migrations, hooks, triggers, scheduled jobs, or frontend code.
3. Export tracker data before resetting when the existing roadmap should remain recoverable.
4. Remove the target user's custom Storage object through Dashboard Storage/API.
5. Run `20260812_reset_sk_reyad_ali_onboarding.sql` manually and verify one pending row.
6. Sign out, remove only `bracuCsCourseTracker.v2:<target-user-id>`, and sign in again.

State explicitly that the reset never repeats automatically and never targets other profiles.

- [ ] **Step 2: Run the full automated suite and syntax checks**

Run:

```powershell
node --test tests/*.test.js
node --check js/profile.js
node --check js/auth.js
node --check js/auth-core.js
node --check js/supabase-client.js
node --check js/storage.js
node --check js/app.js
node --check js/app-boot.js
```

Expected: zero failed tests and zero syntax errors.

- [ ] **Step 3: Run static secret/reset isolation scans**

Run:

```powershell
rg -n "service_role|SUPABASE_SERVICE_ROLE|reset_sk_reyad_ali|20260812_reset" auth.html index.html js css
rg -n "setInterval|cron|pg_cron|create trigger|auth\.onAuthStateChange" supabase/manual/20260812_reset_sk_reyad_ali_onboarding.sql
```

Expected: no browser secret/reset references and no recurring/trigger construct in the manual reset file.

- [ ] **Step 4: Verify the live UI without mutating external data**

At 1280, 1024, 768, and 360 CSS pixels in light and dark themes, confirm Dashboard view mode, Edit/Save/Cancel switching, exact program and semester selects, photo layout, drag-state stability, no horizontal overflow, and initials/Google display from the current canonical profile. Use preview mode only for non-destructive layout checks.

- [ ] **Step 5: Perform the owner-controlled Supabase checks**

After the user applies migration 004, verify with the real G-Suite account:

- Google avatar → custom avatar → none → Google transitions persist after refresh/sign-out.
- A custom private object is readable by its owner and not by another account.
- Cancel performs no Database/Storage write.
- Save updates Database, local state, cloud tracker state, Dashboard, and report consistently.
- The exact-email manual reset affects one row once, next login opens onboarding, and completing onboarding prevents subsequent resets.

If OAuth account selection or Supabase SQL execution remains user-controlled, record the exact manual evidence still required rather than claiming it was automated.
