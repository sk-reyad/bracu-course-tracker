# Dynamic Error and Skeleton States Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one secure dynamic error page and responsive page-specific skeleton loading states for Auth, Tracker, and Admin.

**Architecture:** A shared browser module owns the error catalog, safe status resolution, error navigation, and loading lifecycle. One `error.html` renders every full-page status; each existing page supplies its own skeleton markup while sharing CSS tokens and behavior.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS custom properties, existing Dot Grid/Vanta effects, Node test runner, Vercel static routing.

**Spec:** `docs/superpowers/specs/2026-08-21-dynamic-error-skeleton-states-design.md`

## Global Constraints

- One full-page error template only.
- Never display arbitrary query-string or raw backend error text.
- Keep recoverable form/data errors inline.
- Preserve existing features, authentication, themes, backgrounds, and responsive behavior.
- Skeleton animation must respect `prefers-reduced-motion`.
- No new runtime dependency.

---

### Task 1: Shared status catalog and safe navigation

**Files:**
- Create: `js/ui-states.js`
- Create: `tests/ui-states.test.js`

**Interfaces:**
- Produces: `resolveErrorState(code)`, `buildErrorPageModel(search, environment)`, `buildErrorUrl(options)`, `createLoadingController(options)` through `window.BracuUiStates` and CommonJS exports.

- [ ] Write failing unit tests proving known mappings, generic `4xx`/`5xx` fallbacks, invalid-code fallback, same-origin return validation, and rejection of arbitrary messages/URLs.
- [ ] Run `node --test tests/ui-states.test.js` and confirm the missing-module failure.
- [ ] Implement the frozen catalog and pure helpers. Models contain only `code`, `title`, `message`, `icon`, and allow-listed action identifiers.
- [ ] Implement the loading controller with `markReady()`, `markFailed()`, and a cancellable timeout; it must dispatch `bracu:page-ready` and never leave `aria-busy` stuck.
- [ ] Run `node --test tests/ui-states.test.js` and confirm all tests pass.

### Task 2: Dynamic branded error page

**Files:**
- Create: `error.html`
- Create: `css/ui-states.css`
- Modify: `js/ui-states.js`
- Test: `tests/ui-states.test.js`

**Interfaces:**
- Consumes: `buildErrorPageModel()` from Task 1.
- Produces: semantic `#errorCode`, `#errorTitle`, `#errorMessage`, and `#errorActions` render targets.

- [ ] Add failing DOM-contract tests for one template, semantic heading/focus target, live Dot Grid canvas, theme control, and safe actions.
- [ ] Build `error.html` with the current brand, interactive Dot Grid, theme switch, and responsive error card.
- [ ] Render the selected model from `?code=` without inserting untrusted HTML. Implement Retry, Back, Home, and Log in actions from the allow-listed model only.
- [ ] Add light/dark, focus-visible, narrow-screen, and reduced-motion styles in `css/ui-states.css`.
- [ ] Run the focused test file and syntax-check `node --check js/ui-states.js`.

### Task 3: Shared skeleton foundation and page layouts

**Files:**
- Modify: `css/ui-states.css`
- Modify: `auth.html`
- Modify: `index.html`
- Modify: `admin.html`
- Test: `tests/ui-states.test.js`
- Test: `tests/main-integration.test.js`
- Test: `tests/auth.test.js`
- Test: `tests/admin.test.js`

**Interfaces:**
- Consumes: `createLoadingController()` from Task 1.
- Produces: `.page-skeleton`, `.skeleton-auth`, `.skeleton-tracker`, `.skeleton-admin`, and compact `.skeleton-detail` patterns.

- [ ] Add failing markup/style contract tests for all three page skeleton variants, `aria-busy`, hidden live loading copy, and shared stylesheet/module inclusion.
- [ ] Add minimal semantic skeleton markup to each page, shaped like its real first meaningful layout.
- [ ] Implement translucent surfaces, theme tokens, shimmer, static reduced-motion fallback, and responsive collapse matching the supplied visual direction.
- [ ] Ensure skeleton layers do not block Dot Grid/Vanta rendering and do not cause horizontal or vertical overflow.
- [ ] Run the four focused test files.

### Task 4: Lifecycle integration for Auth, Tracker, and Admin

**Files:**
- Modify: `js/auth.js`
- Modify: `js/app.js`
- Modify: `js/admin.js`
- Modify: `js/app-boot.js`
- Test: `tests/auth.test.js`
- Test: `tests/main-integration.test.js`
- Test: `tests/admin.test.js`

**Interfaces:**
- Consumes: shared loading controller and the page skeleton markup.
- Produces: first-meaningful-render readiness signals for every page.

- [ ] Add failing tests proving Auth clears after initial view resolution, Tracker clears after `renderAll()`, and Admin clears after its first account-state render.
- [ ] Initialize the controller before asynchronous access/data work and call `markReady()` only at the documented meaningful-render point.
- [ ] Convert Admin's first-load spinner area to table/profile skeletons while keeping refresh and retry states intact.
- [ ] Ensure redirects do not flash authenticated content and failed promises call `markFailed()` or navigate instead of leaving a skeleton indefinitely.
- [ ] Run the focused tests and syntax-check all four modified scripts.

### Task 5: Access semantics, fatal failures, and real 404 routing

**Files:**
- Modify: `js/access.js`
- Modify: `js/app.js`
- Modify: `js/admin.js`
- Create: `vercel.json`
- Test: `tests/access.test.js`
- Test: `tests/main-integration.test.js`
- Test: `tests/admin.test.js`
- Test: `tests/ui-states.test.js`

**Interfaces:**
- Consumes: `buildErrorUrl({ code, surface })`.
- Produces: semantic `403` handling, fatal boot routing, and filesystem-first `404` fallback to the single template.

- [ ] Add failing tests for authenticated permission denial (`403`), fatal startup (`500`/`503`), timeout (`504`), and unknown static route configuration (`404`).
- [ ] Preserve the login redirect for ordinary unauthenticated access; route authenticated forbidden access to the dynamic `403` model.
- [ ] Map fatal boot/network failures to safe codes without exposing Supabase or browser exception text.
- [ ] Add filesystem-first Vercel routing so existing HTML/assets resolve normally and unknown document routes return `error.html?code=404` with status `404`.
- [ ] Run the five focused test files.

### Task 6: Regression, responsive, and accessibility verification

**Files:**
- Modify only if verification finds a defect in the files above.

**Interfaces:**
- Consumes: completed error and skeleton system.
- Produces: release evidence.

- [ ] Run `node --test` and require a clean full-suite result.
- [ ] Run `node --check` for every changed JavaScript file.
- [ ] Verify Auth, Tracker, Admin, `404`, `403`, `429`, `500`, and `503` at `360`, `768`, `1024`, and `1280` pixels in light and dark themes.
- [ ] Verify keyboard focus, screen-reader labels, reduced motion, Retry/Back/Home/Log in actions, no raw error leakage, and no overflow.
- [ ] Confirm existing OAuth, protected-route redirects, admin retries, Dot Grid/Vanta effects, and page scrolling still work.
