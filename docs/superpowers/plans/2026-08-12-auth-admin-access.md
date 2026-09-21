# BRACU Course Tracker Authentication and Admin Access Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved centered authentication gateway, secure Supabase student/admin access, first-phase Admin Panel, read-only site preview, and authenticated tracker synchronization without regressing the existing tracker.

**Architecture:** Preserve the vanilla HTML/CSS/JavaScript application and add focused auth/admin files around it. Supabase Auth, Postgres RLS/hooks, private Storage, and one authenticated Edge Function form the security boundary; browser code receives only a publishable key. The main tracker remains local-first but is keyed by authenticated user and debounced to the existing per-user cloud row.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Supabase JS v2, Supabase Auth/Postgres/Storage/Edge Functions, Google OAuth, Cloudflare Turnstile, Vanta NET 0.5.24, Three.js r134, Lucide, Node built-in test runner.

## Global Constraints

- Student authentication is Google-only and must use an email ending in `@g.bracu.ac.bd`.
- The non-BRACU error must be exactly `Please use your official BRAC University G-Suite email`.
- Administrators have password login only, are pre-created, and have no sign-up path.
- Never expose a Supabase secret/service-role key in browser files.
- Google name/email are immutable; remove only the visual `Google · locked` badge.
- The auth page uses the approved centered layout, compact top navigation, and no full-width navbar.
- Preserve all current roadmap, GPA, report, course, department, faculty, footer, hover, dot-grid, and modal behavior unless a task explicitly names it.
- Preview mode is anonymous, sanitized, read-only, and must never load authenticated user data.
- Preserve legacy localStorage until a verified matching-email migration succeeds.
- Support light/dark themes, `prefers-reduced-motion`, keyboard use, and 360–1440px widths.
- Existing repository has no Git metadata; do not initialize Git or invent commits during execution.

---

## File map

### Create

- `auth.html` — authentication, onboarding, admin login, and recovery shell.
- `admin.html` — first-phase Admin Panel shell.
- `css/auth.css` — auth/onboarding/Vanta/responsive styles.
- `css/admin.css` — Admin Panel tables, cards, drawer, permissions, responsive styles.
- `js/config.js` — public Supabase URL/publishable key, redirect URLs, Turnstile site key.
- `js/auth-core.js` — pure validation/routing/copy helpers testable in Node.
- `js/supabase-client.js` — one shared browser client and session/profile helpers.
- `js/auth.js` — auth page state, OAuth, onboarding, photo control, admin login/recovery, Vanta lifecycle.
- `js/access.js` — main/admin access guards and role/status checks.
- `js/preview.js` — sanitized preview state and mutation lockdown.
- `js/admin.js` — Admin Panel reads, filters, drawers, and Edge Function commands.
- `supabase/migrations/202608120001_auth_profiles_rbac.sql` — profiles, roles, permissions, hooks, audit, RLS.
- `supabase/migrations/202608120002_tracker_storage_rls.sql` — tracker RLS and private photo bucket policies.
- `supabase/functions/admin-access/index.ts` — privileged account/role/status operations.
- `supabase/functions/admin-access/deno.json` — pinned function imports.
- `tests/auth.test.js` — pure auth/copy/route/file contract tests.
- `tests/access.test.js` — gate, preview, scoped-storage, and legacy-migration tests.
- `tests/admin.test.js` — permissions and server-action contract tests.
- `docs/AUTH_SETUP.md` — Google, Supabase, Turnstile, redirects, migration, first super-admin setup.

### Modify

- `index.html` — load shared config/access code, add guarded/preview state hooks, and replace Cloud Sync assumptions.
- `css/style.css` — preview banner/lockdown, identity read-only controls, sync status, shared select chevron alignment.
- `js/storage.js` — per-user keys, fresh-user state, safe legacy migration.
- `js/app.js` — async guarded boot, debounced cloud sync, read-only preview behavior, immutable profile fields, account actions.
- `js/data.js` — keep catalog/sample data but prevent personal identity/history from becoming a new user's initial state.
- `README.md` — replace optional manual Cloud Sync instructions with auth/setup overview.
- `SELF_CHECK.md` — add authentication, security, and responsive verification checklist.

---

### Task 1: Shared configuration and pure authentication contracts

**Files:**
- Create: `js/config.js`
- Create: `js/auth-core.js`
- Create: `tests/auth.test.js`

**Interfaces:**
- Produces: `window.BRACU_CONFIG`
- Produces: `AuthCore.isBracuGsuiteEmail(email): boolean`
- Produces: `AuthCore.getStudentCopy(mode): { title, subtitle }`
- Produces: `AuthCore.resolvePostAuthRoute({ role, status, onboardingCompleted }): string`
- Produces: `AuthCore.normalizeProfileInput(input): object`

- [ ] **Step 1: Write failing pure-function tests**

```js
test('accepts only the exact BRACU G-Suite suffix', () => {
  assert.equal(AuthCore.isBracuGsuiteEmail('student@g.bracu.ac.bd'), true);
  assert.equal(AuthCore.isBracuGsuiteEmail('student@bracu.ac.bd'), false);
  assert.equal(AuthCore.isBracuGsuiteEmail('student@g.bracu.ac.bd.evil.test'), false);
});

test('uses approved login and sign-up copy', () => {
  assert.deepEqual(AuthCore.getStudentCopy('login'), { title: 'Welcome back', subtitle: '' });
  assert.deepEqual(AuthCore.getStudentCopy('signup'), {
    title: 'Create your account',
    subtitle: 'Sign-up with your G-suit account.'
  });
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/auth.test.js`  
Expected: FAIL because `js/auth-core.js` does not exist.

- [ ] **Step 3: Implement the minimal UMD-style pure module**

```js
(function exposeAuthCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AuthCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function buildAuthCore() {
  const BRACU_SUFFIX = '@g.bracu.ac.bd';
  function isBracuGsuiteEmail(value) {
    return String(value || '').trim().toLowerCase().endsWith(BRACU_SUFFIX);
  }
  function getStudentCopy(mode) {
    return mode === 'signup'
      ? { title: 'Create your account', subtitle: 'Sign-up with your G-suit account.' }
      : { title: 'Welcome back', subtitle: '' };
  }
  function resolvePostAuthRoute({ role, status, onboardingCompleted }) {
    if (status !== 'active' && status !== 'pending') return 'auth.html?error=suspended';
    if (role === 'admin' || role === 'super_admin') return 'admin.html';
    return onboardingCompleted ? 'index.html' : 'auth.html?step=onboarding';
  }
  return { isBracuGsuiteEmail, getStudentCopy, resolvePostAuthRoute };
});
```

- [ ] **Step 4: Add public configuration with explicit runtime validation**

`js/config.js` must expose named fields `supabaseUrl`, `supabasePublishableKey`, `authPageUrl`, `appPageUrl`, `adminPageUrl`, and `turnstileSiteKey`. `supabase-client.js` will show a safe configuration error if required values are empty. No secret key field is allowed.

- [ ] **Step 5: Run GREEN and syntax checks**

Run: `node --test tests/auth.test.js && node --check js/auth-core.js && node --check js/config.js`  
Expected: PASS with zero failures.

---

### Task 2: Supabase schema, hooks, RBAC, RLS, and private photo storage

**Files:**
- Create: `supabase/migrations/202608120001_auth_profiles_rbac.sql`
- Create: `supabase/migrations/202608120002_tracker_storage_rls.sql`
- Extend tests: `tests/auth.test.js`

**Interfaces:**
- Produces roles `student`, `admin`, `super_admin`
- Produces permissions `profiles.read`, `users.read`, `users.status.manage`, `admins.read`, `admins.manage`, `permissions.manage`
- Produces profile statuses `pending`, `active`, `suspended`
- Produces `public.authorize(permission_name text): boolean`
- Produces `public.custom_access_token_hook(event jsonb): jsonb`
- Produces `public.hook_restrict_signup(event jsonb): jsonb`
- Produces `public.complete_student_onboarding(student_id text, program text, starting_term text, starting_year integer, avatar_path text): public.profiles`

- [ ] **Step 1: Add failing SQL contract assertions**

The test reads both migrations and requires every table, enum value, hook function, RLS enable statement, immutable-identity trigger, and Storage policy. It must also reject any `service_role` literal in browser JS.

- [ ] **Step 2: Run RED**

Run: `node --test tests/auth.test.js`  
Expected: FAIL with missing migration contracts.

- [ ] **Step 3: Create the profiles and RBAC migration**

Use these exact profile columns:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  student_id text unique,
  program text check (program in ('BSc in Computer Science & Engineering (CSE)', 'BSc in Computer Science (CS)')),
  starting_term text check (starting_term in ('Spring', 'Summer', 'Fall')),
  starting_year integer check (starting_year between 2001 and 2100),
  avatar_path text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Create normalized role/permission tables and seed the six approved permissions. Give `student` no admin permissions, give `admin` read/profile/status permissions, and give `super_admin` all permissions.

- [ ] **Step 4: Add the auth-user profile trigger and immutable identity trigger**

The create trigger copies only Google/admin-auth metadata into `profiles`. The update trigger raises an exception when a browser-authenticated caller changes `full_name` or `email`; server-side Admin API changes remain possible only through the privileged function.

- [ ] **Step 5: Add the Before User Created Hook**

Allow only:

```text
provider = google AND lower(email) ends with @g.bracu.ac.bd
OR
provider = email AND app_metadata.created_by_admin = true
   AND app_metadata.app_role IN (admin, super_admin)
```

Reject everything else with `Please use your official BRAC University G-Suite email`. Grant execution only to `supabase_auth_admin` and revoke it from `anon`, `authenticated`, and `public`.

- [ ] **Step 6: Add Custom Access Token Hook and RLS authorization helper**

Claims must include `app_role`, `app_permissions`, and `account_status`. RLS must query canonical database state when privileged writes occur instead of trusting unrefreshed client UI state.

- [ ] **Step 7: Add tracker and Storage policies**

- Active students can select/insert/update only `course_tracker_data.user_id = auth.uid()`.
- Suspended users cannot read/write tracker or profile data.
- Students cannot directly update `status`, roles, permissions, `full_name`, or `email`; the onboarding RPC alone may perform a validated `pending` to `active` transition for the caller.
- The `profile-photos` bucket is private.
- Authenticated users can select/insert/update/delete only objects whose first folder is their own UUID.
- Upload metadata must be readable by the uploader so Storage `INSERT ... RETURNING` succeeds.

- [ ] **Step 8: Run migration contract tests**

Run: `node --test tests/auth.test.js`  
Expected: PASS.

- [ ] **Step 9: When Supabase CLI is available, run database verification**

Run: `supabase db reset`  
Expected: both migrations apply without SQL errors and seeded roles/permissions exist.

---

### Task 3: Shared Supabase client and access guards

**Files:**
- Create: `js/supabase-client.js`
- Create: `js/access.js`
- Create: `tests/access.test.js`

**Interfaces:**
- Produces `BracuSupabase.getClient(): SupabaseClient`
- Produces `BracuSupabase.getSessionContext(): Promise<{ session, user, profile, role, permissions }>`
- Produces `BracuAccess.requireMainAccess(): Promise<AccessContext>`
- Produces `BracuAccess.requireAdminAccess(): Promise<AccessContext>`
- Produces `BracuAccess.signOutAndRedirect(): Promise<void>`

- [ ] **Step 1: Write failing gate tests**

Test these outcomes with injected clients:

- missing session on main page redirects to `auth.html`;
- active onboarded student enters `index.html`;
- pending student returns to onboarding;
- suspended user signs out and receives a clear error;
- student cannot enter `admin.html`;
- admin without the requested permission cannot execute a protected action;
- `?preview=1` returns preview context without calling Supabase.

- [ ] **Step 2: Run RED**

Run: `node --test tests/access.test.js`  
Expected: FAIL because the access modules are missing.

- [ ] **Step 3: Implement one lazily created client**

`getClient()` validates public configuration, calls `window.supabase.createClient` once, and never accepts credentials from localStorage or form inputs.

- [ ] **Step 4: Implement guarded context resolution**

Use `auth.getSession()` for boot and `auth.getUser()` before sensitive identity-dependent actions. Fetch `profiles`, role, permissions, and status; route only after those checks complete.

- [ ] **Step 5: Run GREEN and syntax checks**

Run: `node --test tests/access.test.js && node --check js/supabase-client.js && node --check js/access.js`  
Expected: PASS.

---

### Task 4: Centered authentication page, compact navigation, and Vanta lifecycle

**Files:**
- Create: `auth.html`
- Create: `css/auth.css`
- Create: `js/auth.js`
- Extend: `tests/auth.test.js`

**Interfaces:**
- Consumes: `AuthCore`, `BracuSupabase`, `BRACU_CONFIG`
- Produces: auth views `student-login`, `student-signup`, `student-onboarding`, `admin-login`, `admin-recovery`
- Produces: `initAuthVanta()`, `destroyAuthVanta()`, `setAuthView(view)`

- [ ] **Step 1: Add failing HTML/CSS/JS contract tests**

Require top-left brand without tagline, top-right Preview/Admin/theme controls, no `Student | Admin` role tabs, approved copy, exact button label `Let's begin`, Vanta/Three pinned URLs, reduced-motion block, and no inline success paragraph.

- [ ] **Step 2: Run RED**

Run: `node --test tests/auth.test.js`  
Expected: FAIL because auth page files are missing.

- [ ] **Step 3: Build semantic centered auth shell**

- `Preview` links to `index.html?preview=1`.
- `Admin` swaps the card to admin login and provides a clear Back to Student action.
- Theme selection persists in the same theme preference used by the main tracker.
- Login has no subtitle/domain note.
- Sign-up subtitle is exactly `Sign-up with your G-suit account.`

- [ ] **Step 4: Implement Vanta NET**

Pin:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.net.min.js"></script>
```

Use `points: 20`, `maxDistance: 30`, `spacing: 17`, `showDots: true`, mouse/touch controls, theme-specific colors, `setOptions()` on theme change, `resize()` after layout changes, and `destroy()` on `pagehide`. Skip Vanta for reduced motion and show a static themed background.

- [ ] **Step 5: Add responsive/auth accessibility styles**

At 640px and below, keep brand and compact navigation on one wrapping top row where possible, prevent overlap, allow page scrolling, keep a minimum 44px hit target, and constrain the auth card to `min(100% - 20px, 520px)`.

- [ ] **Step 6: Run GREEN and syntax checks**

Run: `node --test tests/auth.test.js && node --check js/auth.js`  
Expected: PASS.

---

### Task 5: Student Google OAuth, onboarding, modern photo control, and toast transition

**Files:**
- Modify: `auth.html`
- Modify: `css/auth.css`
- Modify: `js/auth.js`
- Extend: `tests/auth.test.js`

**Interfaces:**
- Produces: `startStudentGoogleAuth(intent): Promise<void>`
- Produces: `completeStudentOAuth(): Promise<void>`
- Produces: `uploadProfilePhoto(file, userId): Promise<string | null>`
- Produces: `submitOnboarding(form): Promise<void>`

- [ ] **Step 1: Add failing behavior tests for OAuth intent and onboarding payload**

Assert `signInWithOAuth({ provider: 'google' })`, redirect allow-list target, exact domain error, two exact program values, required student/term/year fields, and immutable name/email omission from update payload.

- [ ] **Step 2: Run RED**

Run: `node --test tests/auth.test.js`  
Expected: FAIL on missing handlers/payload contracts.

- [ ] **Step 3: Implement Google OAuth and return routing**

Store only the short-lived intent (`login` or `signup`) in `sessionStorage`. After return, validate the server-authenticated email, fetch profile/status, then route returning users or show onboarding. On invalid domain, sign out and show the exact required error.

- [ ] **Step 4: Implement onboarding controls**

- Display Google name/email without editable inputs and without `Google · locked`.
- Use main-site chevron SVG, `padding-right: 42px`, and `background-position: right 14px center` for Program, Term, and Year.
- Program values must be the approved CSE and CS labels.
- Button label must be `Let's begin`.

- [ ] **Step 5: Implement the custom photo picker**

Accept JPEG/PNG/WebP, reject non-images, cap original input at 5 MB, crop/compress client-side to a maximum 512×512 image, preview it, and support Replace/Remove. Upload to `<uid>/avatar.webp` only after final onboarding submission.

- [ ] **Step 6: Submit profile through the validated onboarding RPC**

Upload photo first, then call `complete_student_onboarding` with only student ID, program, term, year, and avatar path. The database function verifies `auth.uid()`, Google provider/domain, current `pending` status, and every allowed value before setting `status='active'` and `onboarding_completed=true`. If the RPC fails after upload, remove the just-uploaded object. Never update name/email or expose direct status-update permission to students.

- [ ] **Step 7: Show the approved toast and redirect**

Render a floating `role="status"` toast with title `You’re in,` and supporting text `Let's create your academic roadmap...`; after its visible transition completes, route to `index.html`.

- [ ] **Step 8: Run GREEN**

Run: `node --test tests/auth.test.js`  
Expected: PASS.

---

### Task 6: Administrator password login, Turnstile, and recovery

**Files:**
- Modify: `auth.html`
- Modify: `css/auth.css`
- Modify: `js/auth.js`
- Extend: `tests/auth.test.js`

**Interfaces:**
- Produces: `submitAdminLogin({ email, password, captchaToken }): Promise<void>`
- Produces: `requestAdminPasswordReset(email): Promise<void>`
- Produces: `completeAdminPasswordRecovery(password): Promise<void>`

- [ ] **Step 1: Add failing admin-auth tests**

Require email, password, visibility toggle, Turnstile token, Forgot Password, no admin sign-up markup, role/status validation after password auth, and redirect only to `admin.html`.

- [ ] **Step 2: Run RED**

Run: `node --test tests/auth.test.js`  
Expected: FAIL on missing admin flow.

- [ ] **Step 3: Implement password login with CAPTCHA**

Call `signInWithPassword({ email, password, options: { captchaToken } })`, then fetch canonical profile/role/status. Sign out immediately if the account is not active admin/super-admin.

- [ ] **Step 4: Implement administrator-only recovery**

Use `resetPasswordForEmail` with `auth.html?mode=admin&recovery=1` and handle the Supabase password-recovery event. Recovery copy must never imply a student password account.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/auth.test.js`  
Expected: PASS.

---

### Task 7: Secure server-only Admin Access Edge Function

**Files:**
- Create: `supabase/functions/admin-access/index.ts`
- Create: `supabase/functions/admin-access/deno.json`
- Create: `tests/admin.test.js`

**Interfaces:**
- Consumes JSON `{ action, payload }`
- Supports actions `list-accounts`, `create-admin`, `update-admin`, `set-account-status`, `set-role`, `set-user-permissions`, `get-profile-summary`
- Returns `{ data, error, requestId }`

- [ ] **Step 1: Add failing Edge Function contract tests**

Require caller JWT verification before service-client construction, per-action permission checks, payload allowlists, audit inserts, no password logging, and no permissive CORS origin.

- [ ] **Step 2: Run RED**

Run: `node --test tests/admin.test.js`  
Expected: FAIL because the function is missing.

- [ ] **Step 3: Implement caller authentication and authorization**

Read the bearer token, resolve it with a user-scoped Supabase client, load the caller's active profile and canonical permissions, and reject before creating/using the secret-key client when unauthorized.

- [ ] **Step 4: Implement account listing and summaries**

Return only required fields: id, full name, email, student ID, program, starting semester, role, status, onboarding state, avatar path, created date, last sign-in date. Paginate and filter server-side.

- [ ] **Step 5: Implement privileged mutations**

- `create-admin` is super-admin-only, calls `auth.admin.createUser`, sets `app_metadata.created_by_admin=true`, never returns password, and clears password references before logging.
- `set-account-status` updates profile status and uses `auth.admin.updateUserById` with a long `ban_duration` for suspension or `none` for reactivation.
- Role and permission changes are super-admin-only.
- Every successful/failed privileged mutation writes `admin_audit_log` with actor, target, action, safe before/after values, timestamp, and request ID.

- [ ] **Step 6: Run GREEN and type-check locally when Supabase CLI is available**

Run: `node --test tests/admin.test.js`  
Expected: PASS.

Run: `supabase functions serve admin-access`  
Expected: function starts without import/type errors.

---

### Task 8: First-phase responsive Admin Panel

**Files:**
- Create: `admin.html`
- Create: `css/admin.css`
- Create: `js/admin.js`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Consumes: `BracuAccess.requireAdminAccess()`
- Consumes: `supabase.functions.invoke('admin-access', { body })`
- Produces: user/admin tabs, search/filter, profile drawer, access editor, status editor, create-admin dialog

- [ ] **Step 1: Add failing Admin Panel contracts**

Require Users/Admins views, status/role filters, profile summary, permission controls, accessible dialogs, loading/empty/error states, sign out, and super-admin-only create/edit controls.

- [ ] **Step 2: Run RED**

Run: `node --test tests/admin.test.js`  
Expected: FAIL on missing frontend files.

- [ ] **Step 3: Build guarded page and data loaders**

Do not render account data until `requireAdminAccess()` passes. Use server pagination and abort stale searches. Render permissions from returned canonical values, not hard-coded UI assumptions.

- [ ] **Step 4: Build access/status actions**

Require an explicit confirmation before suspension, role changes, permission changes, and admin creation. Disable duplicate submissions and refresh only the affected record after success.

- [ ] **Step 5: Add responsive layouts**

- Desktop: table plus side profile drawer.
- Tablet: horizontally scrollable table with sticky first column or card list when narrower.
- Mobile: account cards, full-screen detail sheet, 44px controls, no page-width overflow.

- [ ] **Step 6: Run GREEN**

Run: `node --test tests/admin.test.js && node --check js/admin.js`  
Expected: PASS.

---

### Task 9: Authenticated main-site boot, read-only Preview, scoped local data, and automatic sync

**Files:**
- Create: `js/preview.js`
- Modify: `index.html`
- Modify: `js/storage.js`
- Modify: `js/app.js`
- Modify: `js/data.js`
- Modify: `css/style.css`
- Extend: `tests/access.test.js`

**Interfaces:**
- Produces: `createFreshAuthenticatedState(profile)`
- Produces: `loadUserState(userId)` / `saveUserState(userId, state)`
- Produces: `findLegacyMigrationCandidate(email)`
- Produces: `PreviewMode.createSanitizedState()` / `PreviewMode.applyLockdown()`
- Produces: `queueCloudSync(state)` / `flushCloudSync()`

- [ ] **Step 1: Add failing state/gate/preview tests**

Test user-scoped keys, no personal default profile/history for new users, matching-email-only legacy migration, preview sanitization, mutation lockdown, no Supabase calls in preview, guarded boot ordering, and debounced per-user upserts.

- [ ] **Step 2: Run RED**

Run: `node --test tests/access.test.js`  
Expected: FAIL on missing scoped storage and preview behavior.

- [ ] **Step 3: Scope local state without deleting legacy data**

Use key `bracuCsCourseTracker.v2:<user-id>`. Keep `bracuCsCourseTracker.v1` untouched. A new user gets catalog/department/grade/faculty defaults, an authenticated profile, and an empty semester list.

- [ ] **Step 4: Implement safe legacy migration**

Offer migration only when all are true:

- no v2 user state;
- no cloud tracker row;
- legacy profile email normalized equals session email;
- user confirms the migration.

Copy legacy data to v2/cloud only after confirmation; never delete v1 automatically.

- [ ] **Step 5: Guard main boot before `init()`**

Change the current unconditional `DOMContentLoaded` init so it awaits `BracuAccess.requireMainAccess()`. Render nothing sensitive while the access state is unresolved.

- [ ] **Step 6: Implement sanitized Preview mode**

Use a generic `BRACU Student` identity, no student ID/email/photo, and sample academic progress. Hide/disable Add/Edit/Delete/Save/Settings/Dashboard-edit/Import/Reset/Cloud/PDF-personal actions. Add a visible Preview banner with Return to Login.

- [ ] **Step 7: Replace manual cloud identity with automatic per-user sync**

Load `course_tracker_data.data` before first render. Save locally immediately; debounce cloud upsert after mutations; expose last-sync state and retry. Flush pending sync on `pagehide` when possible without blocking navigation.

- [ ] **Step 8: Run GREEN and the existing regression suite**

Run: `node --test tests/*.test.js`  
Expected: all auth/access tests and all existing footer/interaction/motion tests pass.

---

### Task 10: Main Dashboard identity and Settings integration

**Files:**
- Modify: `js/app.js`
- Modify: `css/style.css`
- Extend: `tests/access.test.js`

**Interfaces:**
- Consumes authenticated `profile` and `BracuAccess.signOutAndRedirect()`
- Produces read-only identity summary and account/sync Settings panel

- [ ] **Step 1: Add failing integration contracts**

Require dashboard name/email to be display-only, profile update payload to omit them, modern photo controls, global select chevrons at main-site spacing, no Cloud URL/key/password inputs, and visible Sync now/Sign out actions.

- [ ] **Step 2: Run RED**

Run: `node --test tests/access.test.js`  
Expected: FAIL on current editable identity and manual Cloud Sync markup.

- [ ] **Step 3: Update Dashboard profile editing**

Name/email are rendered as non-editable identity rows. Student ID, program, starting semester, and photo remain editable under the same server validation/RLS rules used by onboarding.

- [ ] **Step 4: Replace Cloud Sync settings**

Remove Supabase URL, key, email/password sign-up/login, Upload, and Pull forms. Render current account, cloud status, last successful sync, Sync now, and Sign out.

- [ ] **Step 5: Align select and photo controls**

Use the main-site chevron at `right 14px center` with at least `42px` right padding. Reuse the onboarding photo-control pattern so orientation and actions are consistent.

- [ ] **Step 6: Run GREEN and regression suite**

Run: `node --test tests/*.test.js`  
Expected: all tests pass.

---

### Task 11: Setup documentation, full verification, and approval evidence

**Files:**
- Create: `docs/AUTH_SETUP.md`
- Modify: `README.md`
- Modify: `SELF_CHECK.md`

- [ ] **Step 1: Document exact external setup**

Include Google OAuth origins/redirects, Supabase redirect allow-list, migration order, hook enablement, private bucket verification, Turnstile keys, Edge Function secrets/deploy command, public config fields, and trusted first-super-admin creation. Explicitly state that secret/service keys never enter `js/config.js`.

- [ ] **Step 2: Run complete automated verification**

```powershell
node --test tests/*.test.js
node --check js/data.js
node --check js/storage.js
node --check js/gpa.js
node --check js/prerequisites.js
node --check js/roadmap.js
node --check js/motion.js
node --check js/auth-core.js
node --check js/supabase-client.js
node --check js/access.js
node --check js/auth.js
node --check js/preview.js
node --check js/admin.js
node --check js/app.js
```

Expected: zero test failures and zero syntax errors.

- [ ] **Step 3: Run browser matrix**

Verify auth, onboarding, preview, main tracker, and Admin Panel at 360×800, 390×844, 768×1024, 1024×768, 1280×800, and 1440×900 in light/dark themes. Confirm no horizontal overflow, Vanta lifecycle, static reduced-motion fallback, keyboard focus order, exact copy, custom select arrows, photo Replace/Remove, toast transition, session redirects, and existing roadmap/modal/dot-grid behavior.

- [ ] **Step 4: Run authenticated security scenarios against a configured Supabase project**

- non-BRACU Google signup is rejected server-side;
- BRACU Google signup reaches onboarding;
- returning student reaches main tracker;
- student cannot read other profiles/tracker rows or enter Admin Panel;
- suspended user cannot authenticate/use data;
- admin without permission is rejected by Edge Function;
- super admin can create admin, change permissions/status, and receives an audit row;
- browser source contains no secret/service key;
- private avatar cannot be read by another user.

- [ ] **Step 5: Re-run the complete automated suite after browser/security fixes**

Run: `node --test tests/*.test.js` plus every `node --check` command above.  
Expected: zero failures before completion is reported.

---

## Execution prerequisites

Implementation can begin after plan approval. Live OAuth/Admin verification additionally requires the user to supply or configure:

1. Supabase project URL and publishable key.
2. Google OAuth client ID/secret and allowed origins/redirects.
3. Cloudflare Turnstile site/secret keys.
4. Permission to apply SQL migrations and deploy the `admin-access` Edge Function.
5. Initial trusted super-admin identity.
