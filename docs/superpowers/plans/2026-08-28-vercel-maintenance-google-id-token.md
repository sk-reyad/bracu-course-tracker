# Vercel Maintenance Recovery and Google ID-Token Sign-In Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the production maintenance redirect loop and replace redirect-based student Google OAuth with Vercel-origin Google ID-token sign-in.

**Architecture:** Vercel middleware remains fail-closed and authoritative, while the maintenance page becomes user-driven instead of auto-bouncing. Google Identity Services renders the student button and supplies an ID token that the existing Supabase client exchanges for the same verified application session used by onboarding and routing.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Google Identity Services, Supabase Auth JavaScript v2, Vercel middleware, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-vercel-maintenance-google-id-token-design.md`

## Global Constraints

- Keep `SUPABASE_URL` pointed at the Supabase project; never substitute the Vercel frontend origin.
- Keep the Google Client Secret server-side in Supabase provider settings.
- Preserve the exact `@g.bracu.ac.bd` enforcement, signup hook, onboarding, admin authentication, and recovery flows.
- Do not perform GitHub upload or Vercel deployment; the user owns those steps.
- Use failing tests before each production behavior change.

---

### Task 1: Make maintenance recovery loop-safe

**Files:**
- Modify: `tests/support-core.test.js`
- Modify: `tests/maintenance-support.test.js`
- Modify: `js/support-core.js`
- Modify: `js/maintenance-preview.js`

**Interfaces:**
- Consumes: `BracuSupportCore.maintenanceDestination({ enabled, pathname, search })`
- Produces: a maintenance page that stays stable until `#maintenanceRetry` navigates to `index.html`

- [ ] **Step 1: Write the failing routing test**

Change the maintenance-off assertion to require no automatic destination:

```js
assert.equal(
  maintenanceDestination({ enabled: false, pathname: "/maintenance.html", search: "" }),
  null,
);
```

- [ ] **Step 2: Write the failing Check again behavior test**

Execute `js/maintenance-preview.js` in a controlled VM document, invoke the registered click callback, and assert the observable navigation target is `index.html`.

- [ ] **Step 3: Run focused tests and confirm RED**

Run:

```powershell
node --test tests/support-core.test.js tests/maintenance-support.test.js
```

Expected: the old automatic `index.html` destination and reload behavior fail the new assertions.

- [ ] **Step 4: Implement the minimal loop-safe behavior**

Remove the disabled-maintenance redirect branch from `maintenanceDestination` and change the retry click handler to:

```js
retryButton?.addEventListener("click", () =>
  root.location.assign("index.html"),
);
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run the same focused command and require zero failures.

### Task 2: Exchange Google ID tokens for Supabase sessions

**Files:**
- Modify: `tests/auth.test.js`
- Modify: `js/auth.js`

**Interfaces:**
- Consumes: Google credential response `{ credential: string }`
- Produces: `signInStudentWithGoogleIdToken(credential)` and `mountGoogleIdentityButton(options)`

- [ ] **Step 1: Write failing controller tests**

Require the controller to call:

```js
client.auth.signInWithIdToken({ provider: "google", token: "google-id-token" });
```

Also require an empty credential to fail before any Supabase call and a Supabase error to be surfaced.

- [ ] **Step 2: Write a failing Google boundary test**

Use a complete Google Identity Services test double, verify `initialize` receives the configured Web Client ID, verify `renderButton` receives the actual container, and invoke the registered callback to assert that the literal credential reaches the application callback.

- [ ] **Step 3: Run the auth test and confirm RED**

Run:

```powershell
node --test tests/auth.test.js
```

Expected: the ID-token controller and Google mount function do not exist yet.

- [ ] **Step 4: Implement the minimal auth service behavior**

Add strict non-empty credential validation, call `signInWithIdToken`, reuse `completeStudentOAuth()` for authoritative account checks, and expose a focused Google button mounting function that reports missing configuration safely.

- [ ] **Step 5: Run the auth test and confirm GREEN**

Run the focused auth test and require zero failures.

### Task 3: Wire the official Google button and production CSP

**Files:**
- Modify: `auth.html`
- Modify: `css/auth.css`
- Modify: `js/config.js`
- Modify: `js/auth.js`
- Modify: `vercel.json`
- Modify: `tests/auth.test.js`
- Modify: `tests/security.test.js`

**Interfaces:**
- Consumes: `BRACU_CONFIG.googleClientId`, `google.accounts.id`, and the Task 2 auth service
- Produces: one responsive Google-rendered student sign-in action on the Vercel origin

- [ ] **Step 1: Write failing browser-wiring and security tests**

Require the auth document to load `https://accounts.google.com/gsi/client`, require an official button host, require the CSP to allow the Google script/frame/connect endpoints, and require browser source to contain no Google Client Secret.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```powershell
node --test tests/auth.test.js tests/security.test.js
```

- [ ] **Step 3: Implement browser wiring**

Replace the handcrafted Google button with a responsive host, mount Google Identity Services during auth boot, pass the returned token through Task 2, and render onboarding or final routing with the existing session result. Add `googleClientId` as a public empty configuration value ready for the user's Web Client ID.

- [ ] **Step 4: Update the CSP**

Allow only the documented Google Identity Services script, connection, and frame origins while retaining the existing restrictive policy.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run the same focused command and require zero failures.

### Task 4: Document the user-owned production configuration

**Files:**
- Modify: `docs/SETUP.md`

**Interfaces:**
- Consumes: the deployed Vercel URL, Supabase project URL, publishable key, and Google Web Client ID
- Produces: exact dashboard steps for maintenance recovery and branded Google sign-in

- [ ] **Step 1: Document Vercel maintenance variables**

Record the exact variable names, values, Production/Preview scope, and mandatory redeploy step.

- [ ] **Step 2: Document Supabase URLs**

Record the Site URL and wildcard Redirect URL required by the live Vercel deployment and admin recovery.

- [ ] **Step 3: Document Google Identity Services**

Record the authorized JavaScript origin, where to copy the public Web Client ID, where to place it in `js/config.js`, and the rule that the Client Secret remains only in Supabase.

### Task 5: Full verification and handoff

**Files:**
- Verify all modified runtime, test, and documentation files

**Interfaces:**
- Consumes: all previous task outputs
- Produces: a verified upload list and a user-side step-by-step tutorial

- [ ] **Step 1: Run all tests**

```powershell
node --test tests/*.test.js
```

- [ ] **Step 2: Run syntax checks**

```powershell
node --check js/auth.js
node --check js/maintenance-preview.js
node --check js/support-core.js
```

- [ ] **Step 3: Review the final diff**

Confirm no secret, unrelated refactor, deployment action, or user-owned file replacement entered the change.

- [ ] **Step 4: Hand off**

Give the exact changed-file upload list, the unresolved public Google Client ID slot, and ordered Vercel, Supabase, Google Cloud, redeploy, and smoke-test instructions.
