# Degree Plan Integration Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** Use superpowers:executing-plans to implement these tasks. Work in the existing authorized workspace; it has no Git commits and cannot supply a worktree base. Do not reset existing files or publish external changes.

**Goal:** Integrate the approved Degree Plan into Settings using actual tracker attempts, with slower edge navigation.

**Architecture:** A shared course definition module supplies the approved membership and missing catalog entries. A pure calculation module assigns each course to at most one credit requirement. A DOM view renders these results inside Settings, reusing the approved demo design and the site's theme.

**Tech Stack:** Existing static HTML/CSS/JavaScript, CommonJS-compatible pure modules, node:test, Playwright.

**Spec:** User-approved Degree Plan demo at `C:/Users/SK Reyad Ali/.codex/visualizations/2026/08/06/019fd80f-64ac-7011-8c50-20e6048f666c/degree-plan-demo.html` and corrections in this task. Latest instruction approves main-site integration and slower navigation.

## Global constraints

- Preserve semesters, grades, faculties, personal data, authentication and cloud sync behavior.
- Keep the approved course titles, stream membership, order and short status-only display.
- ENG091/MAT092 are zero credit. ENG103 has the parenthetical freshman restriction.
- Completed, current, selected, remaining order; A–Z inside each status/group.
- Stream minima total 10 courses (2,2,3,2,1). BNG103/HUM103 and EMB101 must occupy compulsory positions.
- Extras from completed individual streams 2–5 reserve GenEd slots; no Stream 1 or CSE-department extras in GenEd.
- Non-CSE electives reach Program Elective only after three completed GenEd electives. A course must never contribute credit twice.
- First completed CSE elective occupies the pinned CSE slot; later electives fill six other slots. Current/planned courses reserve unfilled slots without contributing completed credit.
- Overall requirement credit ceiling 124 = 39 + 12 + 48 + 21 + 4. GPA uses actual final counted attempts, not demo constants.
- Keep approved alternatives and old completed legacy records visible; do not offer legacy-only records as new choices.
- Navigation slide duration 800ms, icon centered and click-to-close after hover. Reduced motion fades without sliding. Touch/keyboard dismissal must work.

## Task 1: Shared course data and real allocation

Files: `js/degree-plan-data.js`, `js/degree-plan.js`, `js/data.js`, `tests/degree-plan.test.js`.

Interface:
```js
BracuDegreePlanData.mergeCourses(existingCourses); // returns complete local reference catalog
BracuDegreePlan.calculate(state); // {streams, gened, sections, programElective, overall, allocations}
```

- [x] Copy approved definitions into the shared module, normalizing ENG103 and SOC201/ANT202 aliases; preserve existing prerequisite/roadmap metadata when enriching courses.
- [x] Test empty data, completed/current/planned sorting, retakes/F/P/zero-credit attempts, mandatory minima, extras, GenEd precedence, alternatives and CSE490 variants.
- [x] Calculate final attempts and completed requirements without changing input state. Use semester chronology to choose the first completion; display order must not affect allocation.
- [x] Validate with `node --test tests/degree-plan.test.js`.

## Task 2: Settings view and navigation

Files: `js/degree-plan-view.js`, `css/degree-plan.css`, `index.html`, `js/app.js`, approved demo fragment and generated preview.

Interface:
```js
BracuDegreePlanView.render(document.getElementById('degreePlanEditor'), state);
```

- [x] Add Degree Plan between Faculty List and Grade Scale; equal-width tabs and Backup & Restore label.
- [x] Render the actual calculated model; escape all user-originated text. No scenario picker or hardcoded progress/GPA.
- [x] Preserve expanded groups across state refresh; hide/close navigation when switching Settings tabs or closing Settings.
- [x] Adapt the approved CSS to main-site variables and modal scrolling. Shared right-hand pill alignment, readable type, responsive rows and source/contact links.
- [x] Slow both approved preview and main-site navigation to 800ms, keeping reduced-motion support.

## Task 3: Catalog and roadmap consistency

Files: `js/app.js`, `js/roadmap.js`, `scripts/catalog-source-config.mjs`, relevant tests.

- [x] Make missing approved courses available to Add Courses and the tracker catalog using local reference data; preserve server/user-owned fields.
- [x] Use actual Program Elective allocations for roadmap slots and reserve the first completed CSE elective for CSE-ELECTIVE.
- [x] Keep CSE490 variants distinct from one another; suppress a duplicate generic parent where a variant replaces it.
- [x] Align catalog import metadata with the approved course lists without running remote migrations or changing live database records.

## Task 4: Verification and handoff

Files: `tests/degree-plan-browser.cjs`, `BRAIN.md`, `SELF_CHECK.md`.

- [x] Run syntax checks and existing `node --test tests/*.test.js` suite.
- [x] Exercise main-site Settings against isolated sample state: empty, actual existing attempts, extras/GenEd, retakes, selected/ongoing electives, and CSE490 roadmap placement.
- [x] Verify tab switching, mouse hover/click/leave, keyboard and touch navigation, refresh after edits, desktop/mobile layout and escaped course names.
- [x] Update existing project notes with implemented behavior and tests; keep live database/deployment status explicit.
- [x] Open local main-site preview so the integrated result is reviewable.
