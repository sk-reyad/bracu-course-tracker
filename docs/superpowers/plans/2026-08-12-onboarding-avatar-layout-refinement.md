# Onboarding Avatar Layout Refinement Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the identity row the only avatar preview, keep the lower uploader icon-led, separate Google and custom removal controls, fix mobile text wrapping, and eliminate unnecessary onboarding-page scrolling at normal viewport heights.

**Architecture:** Preserve the existing `BracuProfile` avatar draft and Supabase submission flow. Refine only onboarding markup, draft rendering, event bindings, and auth-page responsive CSS; Dashboard behavior and database interfaces remain unchanged.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node test runner, Lucide icons.

## Global Constraints

- The identity avatar is the only actual photo preview surface.
- The lower uploader always renders an image-upload icon and never a photo.
- The upper overlay removes an active Google provider photo; the lower trash removes an active custom draft.
- The overlay uses theme-adaptive surface/primary colors, resting opacity `0.72`, and hover/focus opacity `1`.
- Remove `Use Google photo` from markup, styling, and JavaScript.
- Preserve JPEG/PNG/WebP, 5 MB validation, compression, drag/drop, immutable identity, and Supabase avatar-preference behavior.
- Do not hide essential content with global `overflow-y: hidden`.

---

### Task 1: Lock the revised avatar and responsive contracts

**Files:**
- Modify: `tests/auth.test.js`

**Interfaces:**
- Consumes: existing static `auth.html`, `css/auth.css`, and `js/auth.js` contracts.
- Produces: regression coverage for `removeGooglePhoto`, icon-only lower media, absence of `useGooglePhoto`, source-specific delete visibility, and compact responsive layout.

- [ ] **Step 1: Replace the old Google-restore expectations with failing revised contracts**

Assert that:

```js
assert.match(html, /id="removeGooglePhoto"[^>]*aria-label="Remove Google profile photo"/);
assert.doesNotMatch(html, /id="useGooglePhoto"/);
assert.doesNotMatch(js, /useGooglePhoto/);
assert.match(js, /removeGooglePhoto[\s\S]*chooseNone\(\)/);
assert.match(js, /const lowerPreviewUrl\s*=\s*""/);
assert.match(css, /\.identity-avatar-remove[\s\S]*opacity:\s*\.72/);
assert.match(css, /\.identity-avatar-remove[^}]*background:[^;}]*var\(--auth-soft\)/s);
assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*grid-template-areas:\s*"media copy"\s*"actions actions"/);
assert.doesNotMatch(css, /body[^}]*overflow-y:\s*hidden/s);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/auth.test.js`

Expected: FAIL because the overlay does not exist, lower media duplicates the photo, and `useGooglePhoto` is still wired.

### Task 2: Implement source-specific avatar presentation and actions

**Files:**
- Modify: `auth.html`
- Modify: `js/auth.js`
- Modify: `css/auth.css`

**Interfaces:**
- Consumes: `BracuProfile.createAvatarDraft()`, `chooseCustom(file)`, and `chooseNone()`.
- Produces: `#removeGooglePhoto`, a source-neutral lower icon, source-specific custom delete, and identity-only previews.

- [ ] **Step 1: Update markup**

Wrap the identity avatar and overlay button in a positioned media wrapper, add:

```html
<button id="removeGooglePhoto" type="button" aria-label="Remove Google profile photo">
  <i data-lucide="trash-2"></i>
</button>
```

Remove `#useGooglePhoto`. Keep `#photoPreview` only if needed for compatibility but never render a photo into the lower media; preferably remove it and leave `#photoPlaceholder` with `image-plus`.

- [ ] **Step 2: Update the renderer and events**

In `renderOnboardingAvatar()`:

```js
const identityDisplayUrl = draft.avatarPreference === "google" ? googleUrl : customUrl;
const lowerPreviewUrl = "";
```

Render `identityDisplayUrl` only into `#onboardingIdentityImage`. Keep the lower placeholder visible, reset its icon markup through Lucide, show `#removeGooglePhoto` only for an active Google photo, and show `#removePhoto` only for an active custom file. Remove the `useGooglePhoto` listener. Bind `removeGooglePhoto` to clear the selected-file URL, call `chooseNone()`, and rerender.

- [ ] **Step 3: Add themed overlay and responsive layout**

Style the media wrapper as `position: relative`; place the circular overlay bottom-right with `opacity: .72`, `background: var(--auth-soft)`, theme-readable icon/border, visible focus, and fine-pointer hover opacity `1`.

At `max-width: 640px`, switch `.photo-control` to:

```css
grid-template-columns: 48px minmax(0, 1fr);
grid-template-areas:
  "media copy"
  "actions actions";
```

Give actions full width, keep copy wrapping normally, and tighten onboarding-only main/card/form spacing enough to fit normal-height viewports. Preserve natural scrolling on unusually short screens.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/auth.test.js tests/profile.test.js`

Expected: all focused tests PASS.

### Task 3: Verify regression and rendered layout

**Files:**
- Verify: `auth.html`, `css/auth.css`, `js/auth.js`

**Interfaces:**
- Consumes: completed Tasks 1–2.
- Produces: final automated and rendered evidence.

- [ ] **Step 1: Run the full suite and syntax checks**

Run:

```powershell
node --test tests/*.test.js
node --check js/auth.js
node --check js/profile.js
```

Expected: zero failures and zero syntax errors.

- [ ] **Step 2: Verify the live onboarding page**

At 360, 420, 768, 1024, and 1280 CSS pixels in light and dark themes, confirm no horizontal overflow, no one-character vertical copy, no duplicate photo, correct source-specific delete controls, and no unnecessary page scrollbar at normal viewport heights. Confirm the console has no errors.
