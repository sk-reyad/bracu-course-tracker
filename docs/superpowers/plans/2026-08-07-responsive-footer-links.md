# Responsive Footer Links Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arrange footer navigation and contact destinations in compact horizontal rows on large screens and controlled responsive grids on smaller screens, while removing the credit underlines and decorative watermark.

**Architecture:** Keep the existing footer HTML structure and links. Use a two-area CSS grid for large desktop, a one-column shell with wrapping horizontal link rows for laptop/tablet, a two-column link grid for mobile, and a one-column link grid for narrow mobile.

**Tech Stack:** Static HTML, CSS media queries, Node.js built-in test runner.

## Global Constraints

- The heading must be exactly `Contact Me`.
- Existing link destinations, icons, footer copy, JavaScript behavior, and non-footer features must remain unchanged.
- The `.footer-shell::before` watermark must be removed.
- `SK Reyad Ali` and `BRAC University` must have no underline in normal or hover states.
- The footer must not introduce horizontal overflow at any supported viewport.
- No new runtime dependency.

---

### Task 1: Responsive footer layout and decoration cleanup

**Files:**
- Modify: `tests/footer.test.js`
- Modify: `index.html:178`
- Modify: `css/style.css:2208-2505`

**Interfaces:**
- Consumes: existing `.footer-main`, `.footer-brand-block`, `.footer-link-group`, `.footer-contact-group`, and `.footer-bottom` markup.
- Produces: responsive footer presentation only; no JavaScript API or data changes.

- [ ] **Step 1: Add failing footer regression assertions**

Update `tests/footer.test.js` so it reads `css/style.css` and asserts:

```js
assert.match(footer, /<h3>Contact Me<\/h3>/);
assert.doesNotMatch(styles, /\.footer-shell::before/);
assert.match(styles, /\.footer-brand-block\s*{[^}]*grid-row:\s*1 \/ span 2/s);
assert.match(styles, /\.footer-link-group\s*{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap/s);
assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.footer-link-group\s*{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(styles, /@media \(max-width: 380px\)[\s\S]*?\.footer-link-group\s*{[^}]*grid-template-columns:\s*1fr/);
```

Extract the `.footer-bottom a` rule and assert `text-decoration: none`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/footer.test.js`

Expected: FAIL because the current heading still contains a colon, the watermark rule still exists, footer groups still use `display: grid`, and credit links are explicitly underlined.

- [ ] **Step 3: Implement the minimal HTML and CSS changes**

In `index.html`, change only:

```html
<h3>Contact Me</h3>
```

In `css/style.css`:

- Delete the complete `.footer-shell::before` rule.
- Change `.footer-main` to two columns with the brand block spanning two rows.
- Change `.footer-link-group` to a wrapping horizontal flex row with fixed, uniform gaps.
- At `max-width: 1180px`, switch `.footer-main` to one column and reset the brand row span.
- At `max-width: 640px`, make link groups a two-column grid, with headings and the email link spanning the full row.
- Add `max-width: 380px` footer rules that use one link column.
- Replace footer credit underline properties with `text-decoration: none` and keep hover limited to color.

- [ ] **Step 4: Run focused and full automated verification**

Run:

```powershell
node --test tests/footer.test.js
node --test
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Expected: all footer tests pass and every JavaScript syntax check exits 0.

- [ ] **Step 5: Verify responsive rendering**

Open the local page and inspect these viewports:

- `1440 × 900`: brand left, Navigate and Contact Me as horizontal rows on the right.
- `1024 × 768`: brand full-width, both link groups horizontal and wrapping only at item boundaries.
- `768 × 1024`: tablet layout remains readable without footer-local overflow.
- `390 × 844`: two-column link grids, full-width email.
- `360 × 800`: narrow-mobile one-column link grids.

At every viewport confirm `footer.scrollWidth === footer.clientWidth`, credit links have computed `text-decoration-line: none`, and `.footer-shell::before` has no content.

- [ ] **Step 6: Final review**

Re-read the approved design, inspect the changed footer rules for obsolete selectors, and confirm that no link destination, icon, JavaScript behavior, or non-footer feature changed.
