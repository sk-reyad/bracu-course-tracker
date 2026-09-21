# Modern Hover and Dot Grid Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved Outline Pulse, Cursor Spotlight and 65% Canvas Dot Grid while preserving every current feature.

**Architecture:** A focused `js/motion.js` owns pure motion calculations plus browser initialization. Existing HTML only gains the decorative canvas and script reference; existing CSS classes gain semantic hover styling without changing their event contracts.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Canvas 2D, Node.js built-in test runner.

## Global Constraints

- Dot Grid intensity is exactly `0.65`.
- No React, GSAP, animation library, or new runtime dependency.
- Existing application behavior and data flow remain unchanged.
- Hover transforms are pointer-gated and reduced-motion safe.
- The workspace has no Git repository, so implementation checkpoints are verified by tests and diffs rather than commits.

---

### Task 1: Motion calculation contract

**Files:**
- Create: `tests/motion.test.js`
- Create: `js/motion.js`

**Interfaces:**
- Produces: `DOT_GRID_CONFIG`, `buildDotGridPoints(width, height, config)`, `calculateDotTarget(point, pointer, speed, config)`, and `getSpotlightPosition(rect, clientX, clientY)`.
- Consumes: no application state.

- [ ] **Step 1: Write the failing behavior tests**

```js
test("dot grid uses the approved 65 percent interaction intensity", () => {
  const target = calculateDotTarget({ ox: 50, oy: 50 }, { x: 60, y: 50 }, 0, DOT_GRID_CONFIG);
  assert.equal(DOT_GRID_CONFIG.intensity, 0.65);
  assert.ok(target.x < 50);
});

test("spotlight coordinates are local to the hovered card", () => {
  assert.deepEqual(getSpotlightPosition({ left: 40, top: 25 }, 75, 55), { x: 35, y: 30 });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/motion.test.js`
Expected: FAIL because `js/motion.js` does not exist.

- [ ] **Step 3: Implement the minimal pure functions**

```js
const DOT_GRID_CONFIG = Object.freeze({ dotSize: 4, gap: 18, proximity: 170, shockRadius: 300, shockStrength: 6, intensity: 0.65 });
function getSpotlightPosition(rect, clientX, clientY) { return { x: clientX - rect.left, y: clientY - rect.top }; }
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/motion.test.js`
Expected: all motion calculation tests pass.

### Task 2: Canvas Dot Grid integration

**Files:**
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `js/motion.js`
- Modify: `tests/motion.test.js`

**Interfaces:**
- Consumes: `DOT_GRID_CONFIG` and CSS variables `--dot-grid-base`, `--dot-grid-active`.
- Produces: `initDotGrid(canvas)` and a decorative `#dotGridBackground` canvas.

- [ ] **Step 1: Add failing lifecycle tests**

Create a controlled fake Canvas/document environment and assert that initialization sizes the canvas, builds points, honors reduced motion, and pauses interaction when hidden.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/motion.test.js`
Expected: FAIL because `initDotGrid` is missing.

- [ ] **Step 3: Implement the Canvas renderer and HTML/CSS hook**

Add `<canvas id="dotGridBackground" class="dot-grid-background" aria-hidden="true"></canvas>` immediately after `<body>`, initialize it from `motion.js`, cap DPR at 1.5, use one animation frame loop, and observe theme/visibility/resize changes.

- [ ] **Step 4: Remove the superseded code watermark**

Delete the `body::before` and dark-theme watermark rules so only the approved Dot Grid remains.

- [ ] **Step 5: Run focused and regression tests**

Run: `node --test tests/motion.test.js tests/footer.test.js`
Expected: all tests pass.

### Task 3: Outline Pulse and Cursor Spotlight

**Files:**
- Modify: `css/style.css`
- Modify: `js/motion.js`
- Modify: `tests/motion.test.js`

**Interfaces:**
- Consumes: existing `.nav-links a`, `.icon-button`, `.primary-btn`, `.secondary-btn`, `.ghost-btn`, `.danger-btn`, `.course-card`, `.path-course-card`, and `.list-course-card` elements.
- Produces: `initCardSpotlights(root)` with delegated pointer tracking.

- [ ] **Step 1: Add failing delegated spotlight tests**

Assert local pointer coordinates, previous-card reset, and no transform motion under reduced-motion preference.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/motion.test.js`
Expected: FAIL because the card controller is missing.

- [ ] **Step 3: Add semantic Outline Pulse CSS**

Use each existing button family's semantic accent, a `scale(0.96)` outline ring transitioning to `scale(1)` in 220ms, and `scale(0.97)` press feedback in 120ms. Keep navigation pulse compatible with its existing active underline.

- [ ] **Step 4: Add Cursor Spotlight CSS and delegated pointer logic**

Render a pointer-transparent radial-gradient overlay from `--spotlight-x` and `--spotlight-y`; retain the underlying status gradient and current card content stacking.

- [ ] **Step 5: Add pointer and reduced-motion gates**

Place hover transforms inside `@media (hover: hover) and (pointer: fine)` and remove movement in `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 6: Run focused and regression tests**

Run: `node --test tests/motion.test.js tests/footer.test.js`
Expected: all tests pass with no warnings.

### Task 4: Browser and syntax verification

**Files:**
- Verify: `index.html`, `css/style.css`, `js/motion.js`, existing app scripts.

- [ ] **Step 1: Run JavaScript syntax checks**

Run: `node --check js/motion.js` and `node --check js/app.js`.
Expected: both commands exit 0.

- [ ] **Step 2: Run the full automated suite**

Run: `node --test tests/*.test.js`.
Expected: zero failures.

- [ ] **Step 3: Inspect the production page in light and dark themes**

Verify Dot Grid color/theme updates, button semantic hover states, card-local spotlight, click shockwave, and unchanged modal/navigation actions.

- [ ] **Step 4: Inspect responsive and accessibility modes**

Verify 1024px, 736px, and 360px without horizontal page overflow; emulate reduced motion and confirm the grid becomes static and transforms are removed.

- [ ] **Step 5: Review the final diff against the approved design**

Confirm every changed production line maps to Outline Pulse, Cursor Spotlight, 65% Dot Grid, theme support, responsive support, or reduced-motion safety.
