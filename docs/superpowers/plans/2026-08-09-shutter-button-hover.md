# Shutter Out Horizontal Button Hover Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace button Inner Glow with a consistent `260ms` Shutter Out Horizontal effect, correct dark-theme button contrast, and add Cancel/Delete/Remove icons without changing application behavior.

**Architecture:** Keep the change CSS-first and dependency-free. A shared button `::before` layer will animate `scaleX(0.02)` to `scaleX(1)` using the existing `--ease-out` token, while per-variant CSS variables supply semantic fill and foreground colors. Existing static and template-rendered button markup will receive Lucide placeholders; the application's existing `refreshIcons()` lifecycle will render them.

**Tech Stack:** Vanilla HTML, CSS custom properties and transitions, vanilla JavaScript template strings, Lucide UMD already present, Node.js built-in test runner.

## Global Constraints

- Hover duration is exactly `260ms` (`0.26s`).
- All `.primary-btn`, `.secondary-btn`, `.ghost-btn`, `.danger-btn`, `.icon-button`, and `.tab-btn` controls use Shutter Out Horizontal.
- `.nav-links a` keeps its current hover treatment.
- No button Inner Glow, replacement glow, or hover scale is allowed.
- Existing `120ms` active press feedback remains.
- Cancel uses Lucide `x`; Delete and Remove use Lucide `trash-2`.
- Dark-theme bright primary surfaces use a dark readable foreground.
- Hover motion is fine-pointer-only; disabled controls do not react.
- Reduced Motion uses an effectively immediate `1ms` state change and no active transform.
- Preserve the 65% Dot Grid, modal Canvas lifecycle, adaptive card spotlight, Roadmap `overflow-y: hidden`, footer, themes, responsiveness, and all features.
- Add no dependency and perform no unrelated refactor.
- This workspace is not a Git repository; execution must use explicit verification checkpoints and must not claim commits.

## File Structure

- `css/style.css`: owns shared shutter geometry, duration, semantic hover tokens, dark-theme foreground tokens, pointer gating, and reduced-motion behavior.
- `index.html`: owns the static Cancel semester icon.
- `js/app.js`: owns icons inside dynamically rendered Cancel, Delete, and Remove controls.
- `tests/interaction-layer.test.js`: owns source-level contracts for shutter CSS, dark contrast, interaction gating, and icon coverage.
- Existing `tests/motion.test.js` and `tests/footer.test.js`: regression coverage; no behavior changes planned.

---

### Task 1: Lock the shutter and icon contracts with failing tests

**Files:**
- Modify: `tests/interaction-layer.test.js:1-76`
- Test: `tests/interaction-layer.test.js`

**Interfaces:**
- Consumes: `styles`, `appScript`, `interactionLayer`, and `ruleBody(selector)` already defined in the test file.
- Produces: executable contracts for the CSS and markup changes in Tasks 2 and 3.

- [ ] **Step 1: Add the page source and replace the Inner Glow test**

Add the static page source beside `styles` and `appScript`:

```js
const pageHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
```

Replace `button hover uses semantic inner glow without the former outer pulse` with:

```js
test("buttons use the approved 260ms horizontal shutter without inner glow", () => {
  const buttonBase = styles.match(/\.icon-button,\s*\.primary-btn,\s*\.secondary-btn,\s*\.ghost-btn,\s*\.danger-btn,\s*\.tab-btn\s*{([^}]*)}/s)?.[1] || "";
  const shutterLayer = styles.match(/\.icon-button::before,[\s\S]*?\.tab-btn::before\s*{([^}]*)}/s)?.[1] || "";

  assert.match(buttonBase, /--hover-fill:/);
  assert.match(buttonBase, /--hover-text:/);
  assert.match(buttonBase, /isolation:\s*isolate/);
  assert.match(buttonBase, /overflow:\s*hidden/);
  assert.match(shutterLayer, /transform:\s*scaleX\(0\.02\)/);
  assert.match(shutterLayer, /transition:\s*transform 260ms var\(--ease-out\)/);
  assert.match(interactionLayer, /\.tab-btn:not\(:disabled\):hover::before\s*{[^}]*transform:\s*scaleX\(1\)/s);
  assert.doesNotMatch(interactionLayer, /\.primary-btn[^}]*inset 0 0 16px/s);
  assert.doesNotMatch(interactionLayer, /\.danger-btn[^}]*inset 0 0 16px/s);
  assert.doesNotMatch(interactionLayer, /transform:\s*scale\(1\.02\)/);
});
```

- [ ] **Step 2: Add semantic contrast and accessibility tests**

```js
test("shutter variants keep semantic colors and accessible interaction gates", () => {
  assert.match(styles, /--on-primary:\s*#fff/);
  assert.match(ruleBody('[data-theme="dark"]'), /--on-primary:\s*#071222/);
  assert.match(ruleBody(".primary-btn"), /--hover-fill:\s*var\(--primary-strong\)/);
  assert.match(ruleBody(".secondary-btn"), /--hover-fill:\s*var\(--primary\)/);
  assert.match(ruleBody(".ghost-btn"), /--hover-fill:\s*var\(--ash-soft\)/);
  assert.match(ruleBody(".danger-btn"), /--hover-fill:\s*var\(--red\)/);
  assert.match(interactionLayer, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(interactionLayer, /\.primary-btn:not\(:disabled\):hover::before/);
  assert.match(interactionLayer, /\.danger-btn:not\(:disabled\):hover::before/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.tab-btn::before[\s\S]*transition-duration:\s*1ms !important/);
});
```

- [ ] **Step 3: Add exact icon coverage tests**

```js
test("cancel and destructive actions render the approved Lucide icons", () => {
  assert.match(pageHtml, /id="cancelSemesterBtn"[^>]*><i data-lucide="x"><\/i> Cancel<\/button>/);

  for (const action of ["cancel-semester-edit", "cancel-profile-edit"]) {
    assert.match(appScript, new RegExp(`data-action="${action}"[^>]*><i data-lucide="x"><\\/i> Cancel`));
  }
  assert.match(appScript, /data-close-modal="courseModal"[^>]*><i data-lucide="x"><\/i> Cancel/);
  assert.match(appScript, /data-close-modal="departmentModal"[^>]*><i data-lucide="x"><\/i> Cancel/);

  for (const action of ["delete-semester", "delete-attempt", "remove-course", "delete-faculty", "remove-department"]) {
    assert.match(appScript, new RegExp(`data-action="${action}"[^>]*><i data-lucide="trash-2"><\\/i>`));
  }
});
```

- [ ] **Step 4: Run the focused test and verify RED**

Run:

```powershell
node --test tests\interaction-layer.test.js
```

Expected: the three new/updated tests fail because `--hover-fill`, the shutter pseudo-layer, `260ms`, dark foreground token, and requested icons do not yet exist.

- [ ] **Step 5: Record the checkpoint**

Record the failing test names and expected reasons in the execution commentary. Do not commit because this directory has no Git metadata.

---

### Task 2: Replace button Inner Glow with the shared shutter layer

**Files:**
- Modify: `css/style.css:1-55`
- Modify: `css/style.css:341-406`
- Modify: `css/style.css:2576-2679`
- Test: `tests/interaction-layer.test.js`

**Interfaces:**
- Consumes: existing `--primary`, `--primary-strong`, `--ash-soft`, `--red`, `--text`, and `--ease-out` tokens.
- Produces: `--on-primary`, `--on-danger`, `--hover-fill`, and `--hover-text`; shared button `::before` shutter behavior.

- [ ] **Step 1: Add theme foreground tokens**

Add to `:root` after the primary tokens and to `[data-theme="dark"]` after its primary tokens:

```css
:root {
  --on-primary: #fff;
  --on-danger: #fff;
}

[data-theme="dark"] {
  --on-primary: #071222;
  --on-danger: #071222;
}
```

Keep these declarations inside the existing blocks rather than creating duplicate selectors.

- [ ] **Step 2: Replace glow tokens and add the shutter base**

Update the shared button family rule and add the pseudo-layer immediately after it:

```css
.icon-button,
.primary-btn,
.secondary-btn,
.ghost-btn,
.danger-btn,
.tab-btn {
  --hover-fill: var(--primary);
  --hover-text: var(--on-primary);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 15px;
  transition: transform 180ms var(--ease-out), border-color 260ms ease, color 260ms ease;
}

.icon-button::before,
.primary-btn::before,
.secondary-btn::before,
.ghost-btn::before,
.danger-btn::before,
.tab-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background: var(--hover-fill);
  transform: scaleX(0.02);
  transform-origin: center;
  transition: transform 260ms var(--ease-out);
}
```

- [ ] **Step 3: Assign semantic variant tokens**

Use the existing variant selectors:

```css
.icon-button {
  --hover-fill: var(--primary-soft);
  --hover-text: var(--primary-strong);
}

.primary-btn {
  --hover-fill: var(--primary-strong);
  --hover-text: var(--on-primary);
  color: var(--on-primary);
}

.secondary-btn {
  --hover-fill: var(--primary);
  --hover-text: var(--on-primary);
}

.ghost-btn {
  --hover-fill: var(--ash-soft);
  --hover-text: var(--text);
}

.danger-btn {
  --hover-fill: var(--red);
  --hover-text: var(--on-danger);
}

.tab-btn {
  --hover-fill: var(--primary);
  --hover-text: var(--on-primary);
}
```

Do not change the selected `.tab-btn.active` surface.

- [ ] **Step 4: Replace the button portion of the modern interaction layer**

Leave `.nav-links a:hover` and all card-hover rules unchanged. Replace only the button Inner Glow rules with:

```css
@media (hover: hover) and (pointer: fine) {
  .icon-button:not(:disabled):hover,
  .primary-btn:not(:disabled):hover,
  .secondary-btn:not(:disabled):hover,
  .ghost-btn:not(:disabled):hover,
  .danger-btn:not(:disabled):hover,
  .tab-btn:not(:disabled):hover {
    color: var(--hover-text);
    border-color: var(--hover-fill);
    box-shadow: none;
  }

  .icon-button:not(:disabled):hover::before,
  .primary-btn:not(:disabled):hover::before,
  .secondary-btn:not(:disabled):hover::before,
  .ghost-btn:not(:disabled):hover::before,
  .danger-btn:not(:disabled):hover::before,
  .tab-btn:not(:disabled):hover::before {
    transform: scaleX(1);
  }
}
```

Remove the now-redundant `.danger-btn`, `.header-actions .icon-button`, and `.primary-btn` hover overrides from this media block.

- [ ] **Step 5: Extend Reduced Motion to the shutter layers**

Add the six button pseudo-elements to the existing reduced-motion duration list:

```css
.icon-button::before,
.primary-btn::before,
.secondary-btn::before,
.ghost-btn::before,
.danger-btn::before,
.tab-btn::before {
  transition-duration: 1ms !important;
}
```

Keep the existing active-transform suppression. Do not add keyboard-focus motion.

- [ ] **Step 6: Run the focused test**

Run:

```powershell
node --test tests\interaction-layer.test.js
```

Expected: shutter and contrast assertions pass; icon coverage remains RED until Task 3.

- [ ] **Step 7: Record the checkpoint**

Report which assertions turned GREEN and which icon assertions intentionally remain RED. Do not commit because this directory has no Git metadata.

---

### Task 3: Add Cancel and destructive-action icons

**Files:**
- Modify: `index.html:76`
- Modify: `js/app.js:243-244`
- Modify: `js/app.js:374`
- Modify: `js/app.js:428`
- Modify: `js/app.js:468`
- Modify: `js/app.js:632`
- Modify: `js/app.js:807`
- Modify: `js/app.js:844`
- Test: `tests/interaction-layer.test.js`

**Interfaces:**
- Consumes: existing Lucide UMD script, `refreshIcons()`, and current button event attributes.
- Produces: decorative `<i data-lucide="x"></i>` and `<i data-lucide="trash-2"></i>` placeholders without changing labels, IDs, types, or action attributes.

- [ ] **Step 1: Add the static Cancel icon**

Change only the contents of `#cancelSemesterBtn`:

```html
<button class="ghost-btn" id="cancelSemesterBtn" type="button"><i data-lucide="x"></i> Cancel</button>
```

- [ ] **Step 2: Add icons to dynamic Cancel controls**

Use the following content while preserving every surrounding attribute:

```html
<i data-lucide="x"></i> Cancel
```

Apply it to `cancel-semester-edit`, `cancel-profile-edit`, the course modal Cancel button, and the department modal Cancel button.

- [ ] **Step 3: Add icons to dynamic Delete and Remove controls**

Prefix the visible label of `delete-semester`, `delete-attempt`, `remove-course`, `delete-faculty`, and `remove-department` with:

```html
<i data-lucide="trash-2"></i>
```

Examples:

```html
<button class="danger-btn small-btn" type="button" data-action="delete-semester" data-semester-id="${semester.id}"><i data-lucide="trash-2"></i> Delete</button>
<button class="danger-btn small-btn path-remove-btn" type="button" data-action="delete-attempt" data-semester-id="${semester.id}" data-attempt-id="${attempt.id}"><i data-lucide="trash-2"></i> Remove</button>
```

Do not add the trash icon to `Reset all data`; its label is outside the approved Delete/Remove wording.

- [ ] **Step 4: Run focused tests and syntax checks**

Run:

```powershell
node --test tests\interaction-layer.test.js
node --check js\app.js
```

Expected: all interaction-layer tests pass and `js/app.js` syntax exits `0`.

- [ ] **Step 5: Record the checkpoint**

Report the focused test count and syntax result. Do not commit because this directory has no Git metadata.

---

### Task 4: Full regression, motion review, and browser verification

**Files:**
- Verify: `css/style.css`
- Verify: `index.html`
- Verify: `js/app.js`
- Verify: `js/motion.js`
- Verify: `js/roadmap.js`
- Verify: `tests/footer.test.js`
- Verify: `tests/motion.test.js`
- Verify: `tests/interaction-layer.test.js`

**Interfaces:**
- Consumes: completed shutter CSS and icon markup from Tasks 2 and 3.
- Produces: verification evidence for behavior, accessibility, responsiveness, and regression safety.

- [ ] **Step 1: Run the full automated suite**

Run:

```powershell
node --test tests\footer.test.js tests\motion.test.js tests\interaction-layer.test.js
```

Expected: all tests pass with `0` failures.

- [ ] **Step 2: Run all JavaScript syntax checks**

```powershell
node --check js\app.js
node --check js\motion.js
node --check js\roadmap.js
```

Expected: all commands exit `0` with no output.

- [ ] **Step 3: Run the motion anti-pattern scan**

```powershell
rg --pcre2 -n "transition:\s*all|ease-in(?!-out)|scale\(0\)" css js
```

Expected: no matches. `scaleX(0.02)` is allowed and must remain.

- [ ] **Step 4: Run an independent focused review**

Use `review-animations` and `requesting-code-review` against the approved spec. The review must explicitly check `260ms`, interruption, fine-pointer gating, disabled controls, reduced motion, semantic fill/foreground pairing, no button glow, and unchanged navbar/card interactions. Fix every Critical or Important finding using a new RED-GREEN test cycle.

- [ ] **Step 5: Browser-check Light theme at desktop and mobile widths**

At 1280px, 1024px, 768px, and 360px:

- Hover Primary, Secondary/Edit, Ghost/Cancel, Danger/Delete, Icon, and Tab controls.
- Confirm the fill expands horizontally from the center in `260ms`.
- Confirm there is no inset glow and no hover scale.
- Confirm Cancel shows `x`; Delete and Remove show `trash-2`.
- Confirm `document.documentElement.scrollWidth === document.documentElement.clientWidth` after layout settles.
- Confirm `getComputedStyle(#roadmapWrapper).overflowY === "hidden"`.

- [ ] **Step 6: Browser-check Dark theme and state gates**

- Confirm the bright primary surface uses a dark readable label/icon.
- Confirm hover foreground stays readable on every semantic fill.
- Confirm a disabled button does not open the shutter or change colors.
- Confirm Settings and Dashboard retain one Dot Grid Canvas and readable translucent panels.
- Confirm the browser console contains no warnings or errors.

- [ ] **Step 7: Verify Reduced Motion**

With `prefers-reduced-motion: reduce`, confirm the shutter state change is effectively immediate, active transform is disabled, and no other motion/feature changes occur.

- [ ] **Step 8: Run a fresh final suite after any review fixes**

```powershell
node --test tests\footer.test.js tests\motion.test.js tests\interaction-layer.test.js
node --check js\app.js
node --check js\motion.js
node --check js\roadmap.js
```

Expected: all tests and syntax checks pass with no temporary verification files or local test server left running.

- [ ] **Step 9: Hand off the verified workspace**

Report changed files, exact passing test count, browser widths/themes checked, Reduced Motion result, reviewer verdict, and the absence of Git metadata. Do not claim a commit, push, or PR.
