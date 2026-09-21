# Photo Dropzone and Unified Google Access Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace misleading student login/signup tabs with one Google OAuth entry point and deliver a responsive, accessible profile-photo dropzone with correct preview state.

**Architecture:** Keep Supabase OAuth, profile-state routing, upload compression, private Storage, and onboarding RPC unchanged. Simplify the auth controller to one OAuth start method, and add one shared photo-candidate helper so picker and drop events run the same validation and preview transition. Use explicit CSS grid areas and native `[hidden]` rules to make the dropzone deterministic across viewport sizes.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Supabase JavaScript v2, Lucide, Node.js built-in test runner.

## Global Constraints

- Existing active students route to the tracker; pending first-time approved BRACU students route to onboarding.
- Only the exact `@g.bracu.ac.bd` suffix is accepted.
- Preserve JPEG, PNG, and WebP validation with a maximum size of 5 MB.
- Preserve private Storage upload, WebP compression, cleanup-on-failure, onboarding RPC, dark/light themes, reduced motion, and admin authentication.
- Drag-and-drop must be progressive enhancement; file-picker and keyboard access remain available.
- Do not add dependencies or expose server credentials.

---

### Task 1: Unify Student Google Authentication

**Files:**
- Modify: `tests/auth.test.js`
- Modify: `auth.html`
- Modify: `js/auth.js`
- Modify: `js/auth-core.js`

**Interfaces:**
- Consumes: `createAuthController({ client, authCore, config, location, getSessionContext, uploadPhoto })`.
- Produces: `controller.startStudentGoogleAuth(): Promise<void>` and the existing `completeStudentOAuth()` profile-state router.

- [ ] **Step 1: Write the failing controller and markup tests**

Replace the intent-storage assertion with a single-flow contract:

```js
test('student Google access uses one OAuth entry point without login or signup intent', async () => {
  let request;
  const controller = AuthPageServices.createAuthController({
    client: { auth: { signInWithOAuth: async input => { request = input; return {}; } } },
    authCore: AuthCore,
    config: { authPageUrl: 'auth.html' },
    location: { href: 'http://localhost:4173/auth.html' },
    getSessionContext: async () => null
  });
  await controller.startStudentGoogleAuth();
  assert.equal(request.provider, 'google');
  assert.equal(request.options.redirectTo, 'http://localhost:4173/auth.html');
  assert.equal(AuthPageServices.AUTH_INTENT_KEY, undefined);
});
```

Extend the auth-page contract to assert that `studentModeTabs`, `studentLoginTab`, and `studentSignupTab` are absent while `studentGoogleButton` remains present.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/auth.test.js`

Expected: FAIL because `AUTH_INTENT_KEY` and mode tabs still exist.

- [ ] **Step 3: Implement the unified entry point**

In `auth.html`, remove the student mode tablist. Keep one heading and one `Continue with Google` button.

In `js/auth.js`:

```js
async function startStudentGoogleAuth() {
  const redirectTo = new URL(config.authPageUrl || "auth.html", currentLocation.href).href;
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });
  if (error) throw error;
}
```

Remove `AUTH_INTENT_KEY`, `sessionStore`, `studentMode`, `setStudentMode()`, mode-tab bindings, and mode-query initialization. Keep `completeStudentOAuth()` unchanged so canonical role/profile state still selects onboarding or dashboard.

Remove unused student-mode copy logic from `js/auth-core.js` only after confirming no other caller remains.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/auth.test.js`

Expected: all auth tests PASS.

### Task 2: Share Photo Validation Between Picker and Drop

**Files:**
- Modify: `tests/auth.test.js`
- Modify: `js/auth.js`

**Interfaces:**
- Consumes: `validatePhotoFile(file)`.
- Produces: `selectPhotoCandidate(files): { file: File|null, valid: boolean, error: string }` and page-level `applySelectedPhoto(file)`.

- [ ] **Step 1: Write failing pure-behavior tests**

```js
test('photo candidate selection uses the first dropped file and existing validation', () => {
  const valid = { type: 'image/png', size: 100, name: 'avatar.png' };
  const extra = { type: 'image/jpeg', size: 100, name: 'extra.jpg' };
  assert.deepEqual(AuthPageServices.selectPhotoCandidate([valid, extra]), {
    file: valid, valid: true, error: ''
  });
  assert.equal(AuthPageServices.selectPhotoCandidate([]).file, null);
  assert.equal(AuthPageServices.selectPhotoCandidate([{ type: 'text/plain', size: 1 }]).valid, false);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/auth.test.js`

Expected: FAIL because `selectPhotoCandidate` does not exist.

- [ ] **Step 3: Implement shared candidate and preview state**

Add the pure helper:

```js
function selectPhotoCandidate(files) {
  const file = files && files[0] ? files[0] : null;
  const result = validatePhotoFile(file);
  return { file, valid: result.valid, error: result.error };
}
```

Expose it from `AuthPageServices`. In the page initializer, add `applySelectedPhoto(file)` that revokes the prior URL, validates through `selectPhotoCandidate([file])`, resets on invalid/empty input, and atomically toggles preview, placeholder, filename, Replace, and Remove state.

Use `applySelectedPhoto()` from both input `change` and drop handlers. Revoke the final object URL on `pagehide` before destroying Vanta.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/auth.test.js`

Expected: all auth tests PASS.

### Task 3: Build the Responsive Accessible Dropzone

**Files:**
- Modify: `tests/auth.test.js`
- Modify: `auth.html`
- Modify: `css/auth.css`
- Modify: `js/auth.js`

**Interfaces:**
- Consumes: DOM ids `photoDropzone`, `photoPreview`, `photoPlaceholder`, `photoFilename`, `photoActionLabel`, `profilePhoto`, and `removePhoto`.
- Produces: `data-dragging="true|false"` visual state and picker/drop parity.

- [ ] **Step 1: Write failing structural and interaction tests**

Add assertions that:

```js
assert.match(html, /id="photoDropzone"/);
assert.match(html, /aria-describedby="photoFilename"/);
assert.match(source, /addEventListener\("dragover"/);
assert.match(source, /addEventListener\("drop"/);
assert.match(source, /preventDefault\(\)/);
assert.match(css, /\.photo-placeholder\[hidden\],\s*#photoPreview\[hidden\]\s*\{\s*display:\s*none\s*!important/);
assert.match(css, /grid-template-areas/);
assert.match(css, /\.photo-copy small[^}]*white-space:\s*normal/s);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/auth.test.js`

Expected: FAIL because dropzone markup, drag listeners, hidden override, and wrapping rules do not exist.

- [ ] **Step 3: Implement semantic dropzone markup**

Give the control `id="photoDropzone"`, `aria-describedby="photoFilename"`, and a concise accessible instruction. Keep the file input and label intact. Group Choose/Replace and Remove in `.photo-actions` so CSS owns their placement.

- [ ] **Step 4: Implement drag-state events**

Handle `dragenter` and `dragover` with `preventDefault()` and `data-dragging="true"`. Handle `dragleave` only when the pointer leaves the dropzone, and handle `drop` with `preventDefault()`, state cleanup, and `applySelectedPhoto(event.dataTransfer.files[0])`. Prevent default browser file navigation for every accepted drag stage.

- [ ] **Step 5: Implement deterministic responsive CSS**

Use named areas:

```css
.photo-control {
  grid-template-columns: 48px minmax(0, 1fr) auto;
  grid-template-areas: "media copy actions";
}
.photo-media { grid-area: media; }
.photo-copy { grid-area: copy; }
.photo-actions { grid-area: actions; }
.photo-placeholder[hidden], #photoPreview[hidden] { display: none !important; }
.photo-copy small { white-space: normal; overflow-wrap: anywhere; line-height: 1.35; }
```

At the mobile breakpoint, retain the three named regions and allow `.photo-actions` to wrap without changing source order. Add a theme-aware `[data-dragging="true"]` border/background state and no motion-dependent feedback.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test tests/auth.test.js`

Expected: all auth tests PASS.

### Task 4: Full Verification and Live Browser Review

**Files:**
- Verify: `auth.html`
- Verify: `css/auth.css`
- Verify: `js/auth.js`
- Verify: `js/auth-core.js`
- Verify: `tests/auth.test.js`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: verified auth page with no known regression.

- [ ] **Step 1: Run the full automated suite and syntax checks**

Run:

```powershell
node --test tests/*.test.js
node --check js/auth.js
node --check js/auth-core.js
node --check js/supabase-client.js
```

Expected: zero failed tests and zero syntax errors.

- [ ] **Step 2: Verify the live page at responsive widths**

Reload `http://localhost:4173/auth.html`. Check light and dark themes at desktop, tablet, and mobile widths. Verify no horizontal overflow, readable format hint, one Google button, and no Log in/Sign up mode tabs.

- [ ] **Step 3: Verify photo interactions**

Use a valid image through the picker and drag/drop. Confirm the placeholder disappears, exactly one preview remains, filename and Replace/Remove actions align, replacing revokes the old preview, and removing restores the initial hint. Verify invalid type and over-5-MB errors.

- [ ] **Step 4: Verify authentication routing boundaries**

Confirm a pending official BRACU student sees onboarding, an active onboarded student reaches the tracker, and a personal Google account is rejected. Do not submit credentials or change external account state during automated verification.

- [ ] **Step 5: Record limitations**

If interactive OAuth account selection cannot be safely automated, report that authentication routing remains covered by unit tests and identify the exact manual check left for the user.
