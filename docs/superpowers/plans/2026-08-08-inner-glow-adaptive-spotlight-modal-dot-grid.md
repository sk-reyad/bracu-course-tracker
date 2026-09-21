# Inner Glow, Adaptive Spotlight, and Modal Dot Grid Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Outline Pulse with Inner Glow, make card spotlights status-aware, and keep the existing 65% Dot Grid working inside full-screen modals without changing application features.

**Architecture:** CSS semantic tokens will drive Inner Glow and card spotlight colors. Two small DOM helpers in `js/motion.js` will move the existing Canvas into the active modal and restore it when the modal closes; `js/app.js` will call those helpers from the existing modal lifecycle. No duplicate Canvas, animation library, or application-state change is required.

**Tech Stack:** HTML5, CSS custom properties and transitions, vanilla JavaScript, Canvas 2D, Node.js built-in test runner.

## Global Constraints

- Preserve every data, navigation, form, report, storage, and academic-planning feature.
- Keep Dot Grid interaction intensity at exactly `0.65`.
- Use the existing light/dark semantic color tokens.
- Hover motion must be gated by `(hover: hover) and (pointer: fine)`.
- Live `prefers-reduced-motion` behavior must remain supported.
- Do not add React, GSAP, Motion, or another dependency.
- Preserve Roadmap horizontal scrolling and `overflow-y: hidden`.
- The workspace has no Git repository metadata, so use verified test checkpoints instead of commit steps.

---

### Task 1: Inner Glow and Adaptive Spotlight CSS

**Files:**
- Create: `tests/interaction-layer.test.js`
- Modify: `css/style.css:353-439, 600-675, 1088-1123, 1362-1376, 2588-2689`

**Interfaces:**
- Consumes: existing `--primary`, `--blue`, `--green`, `--yellow`, `--ash`, `--red`, and matching soft tokens.
- Produces: `--hover-color`, `--hover-soft`, and `--spotlight-color` CSS custom properties.

- [ ] **Step 1: Write failing static regression tests**

Create `tests/interaction-layer.test.js` using `node:test`, `node:assert/strict`, and `fs.readFileSync`. Assert:

```js
assert.doesNotMatch(styles, /\.icon-button::after,\s*\.primary-btn::after/);
assert.match(styles, /box-shadow:\s*inset 0 0 16px var\(--hover-soft\)/);
assert.doesNotMatch(interactionLayer, /transform:\s*scale\(1\.02\)/);
assert.match(styles, /\.course-card\s*{[^}]*--spotlight-color:\s*var\(--primary\)/s);
assert.match(styles, /\[data-status="completed"\][^{]*{[^}]*--spotlight-color:\s*var\(--green\)/s);
assert.match(styles, /\[data-status="current"\][^{]*{[^}]*--spotlight-color:\s*var\(--blue\)/s);
assert.match(styles, /\[data-status="planned"\][^{]*{[^}]*--spotlight-color:\s*var\(--yellow\)/s);
assert.match(styles, /\[data-status="(?:omitted|not-taken)"\][^{]*{[^}]*--spotlight-color:\s*var\(--ash\)/s);
assert.match(styles, /radial-gradient\([^;]*var\(--spotlight-color\)/s);
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test tests\interaction-layer.test.js`

Expected: failures for the current pulse pseudo-element, missing Inner Glow, and missing status color tokens.

- [ ] **Step 3: Replace Outline Pulse with Inner Glow**

In `css/style.css`:

- Rename pulse tokens to `--hover-color` and `--hover-soft`.
- Remove the button-family `::after` pulse layer.
- Remove hover `scale(1.02)` and outer ring shadows.
- Apply semantic inset glow:

```css
box-shadow:
  inset 0 0 16px var(--hover-soft),
  0 5px 14px color-mix(in srgb, var(--hover-color) 14%, transparent);
```

- Apply the same restrained Inner Glow language to navigation links.
- Keep the existing active press and reduced-motion reset.

- [ ] **Step 4: Add adaptive spotlight tokens**

Set `--spotlight-color: var(--primary)` on all three card families, override it for each status, and update both the radial gradient and hover border to use `var(--spotlight-color)`.

- [ ] **Step 5: Run CSS regression tests and existing motion tests**

Run: `node --test tests\interaction-layer.test.js tests\motion.test.js`

Expected: all tests pass.

### Task 2: Single-Canvas Modal Hosting

**Files:**
- Modify: `js/motion.js:1-327`
- Modify: `js/app.js:878-879`
- Modify: `css/style.css:1712-1740`
- Modify: `tests/motion.test.js`
- Test: `tests/interaction-layer.test.js`

**Interfaces:**
- Produces: `mountDotGridInModal(modal, documentObject = document): boolean`.
- Produces: `restoreDotGridHost(documentObject = document): boolean`.
- Consumes: the single `#dotGridBackground` Canvas and `.modal-backdrop:not([hidden])` elements.

- [ ] **Step 1: Write failing Canvas-host tests**

Extend `tests/motion.test.js` with fake `body`, modal, and document objects. Assert that `mountDotGridInModal` prepends the existing Canvas to the modal, and `restoreDotGridHost` prepends it to the last still-open modal or back to `body` when none remain.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests\motion.test.js`

Expected: failure because the two helper exports do not exist.

- [ ] **Step 3: Implement the minimal DOM helpers**

Add to `js/motion.js`:

```js
function mountDotGridInModal(modal, documentObject = document) {
  const canvas = documentObject.getElementById("dotGridBackground");
  if (!modal || !canvas) return false;
  modal.prepend(canvas);
  return true;
}

function restoreDotGridHost(documentObject = document) {
  const canvas = documentObject.getElementById("dotGridBackground");
  if (!canvas) return false;
  const openModals = documentObject.querySelectorAll(".modal-backdrop:not([hidden])");
  const host = openModals[openModals.length - 1] || documentObject.body;
  host.prepend(canvas);
  return true;
}
```

Export both helpers for Node tests.

- [ ] **Step 4: Connect the existing modal lifecycle**

Update `openModal` to unhide the modal and mount the Canvas. Update `closeModal` to hide the modal and restore the Canvas to another open modal or `body`. Keep `refreshIcons()` unchanged.

- [ ] **Step 5: Add modal stacking CSS**

Add `isolation: isolate` to `.modal-backdrop`; make direct Canvas children `z-index: 0`; give `.modal-panel` and `.wide-modal` `position: relative`, `z-index: 1`, and a theme-aware translucent `color-mix` surface. Preserve layout, scrolling, radius, and shadow.

- [ ] **Step 6: Run modal and CSS tests**

Run: `node --test tests\motion.test.js tests\interaction-layer.test.js`

Expected: all tests pass.

### Task 3: Full Verification and Motion Review

**Files:**
- Verify: `index.html`
- Verify: `css/style.css`
- Verify: `js/motion.js`
- Verify: `js/app.js`
- Verify: `tests/*.test.js`

**Interfaces:**
- Consumes: completed Inner Glow, adaptive spotlight, and Canvas modal hosting.
- Produces: verified production-ready implementation.

- [ ] **Step 1: Run the full automated suite**

Run: `node --test tests\footer.test.js tests\motion.test.js tests\interaction-layer.test.js`

Expected: all tests pass.

- [ ] **Step 2: Run syntax and forbidden-motion audits**

Run:

```powershell
node --check js\motion.js
node --check js\app.js
node --check js\roadmap.js
rg --pcre2 -n "transition:\s*all|ease-in(?!-out)|scale\(0\)" css js
```

Expected: syntax checks pass and the audit finds no forbidden patterns.

- [ ] **Step 3: Browser-test functionality and responsive layouts**

Verify at 360px, 768px, 1024px, and desktop width:

- Inner Glow on navigation, icon, primary, secondary, ghost, danger, and tab controls.
- Green, blue, yellow, and ash card spotlights in light and dark themes.
- Settings and Dashboard both show the same interactive Dot Grid.
- Closing each modal restores the Canvas to the main page.
- No persistent horizontal page overflow.
- Roadmap keeps `overflow-x: auto` and `overflow-y: hidden`.
- Browser console contains no errors.

- [ ] **Step 4: Perform focused motion review**

Check hover frequency, semantic color consistency, reduced motion, interruption behavior, touch gating, and idle Canvas scheduling. Resolve every blocking finding and rerun the affected tests.
