# Catalog Consolidation, Stream Filters, and Dashboard Sign-out Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate legacy departments without academic-data loss, support alternative course equivalency, add curriculum filters and stream details, and relocate student sign-out.

**Architecture:** Keep stable database category slugs and normalized identities, adding an `alternative` catalog visibility and pure helper functions for presentation/equivalency. Use an idempotent browser state migration for user snapshots and one forward-only transactional Supabase catalog migration. UI behavior consumes the same helpers so Roadmap, Course List, Add Courses, and navigation stay consistent.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Node `node:test`, PostgreSQL/Supabase RLS.

**Spec:** `docs/superpowers/specs/2026-08-29-catalog-consolidation-streams-dashboard-design.md`

## Global Constraints

- Never delete or rename semester attempts, grades, faculty selections, profiles, or revision history.
- Never edit a deployed migration; add named forward migrations `024 — Catalog Alternative Visibility` and `025 — Canonical Catalog Consolidation`.
- Every Supabase query is supplied with a user-visible name.
- Keep catalog browser access read-only and subject to the existing active-account RLS policy.
- Preserve stable category slugs; presentation labels are aliases.

---

### Task 1: Catalog partitions, equivalency, and curriculum fields

**Files:**
- Modify: `tests/catalog.test.js`
- Modify: `js/catalog.js`
- Modify: `js/roadmap.js`

**Interfaces:**
- Produces: `ALTERNATIVE_EQUIVALENCES`, `curriculumFieldForCategory(category)`, `matchesCurriculumField(category, field)`, `resolveAlternativeReplacement(state, code)`.

- [x] Add failing tests proving alternatives are searchable but excluded from curriculum, field aliases match, and alternative pairs replace only CSE110/CSE260.
- [x] Run `node --test tests/catalog.test.js` and confirm the new assertions fail for missing behavior.
- [x] Implement the pure helpers and Roadmap replacement metadata.
- [x] Re-run `node --test tests/catalog.test.js` and confirm it passes.

### Task 2: Lossless department and catalog migration

**Files:**
- Modify: `tests/access.test.js`
- Modify: `tests/catalog-import.test.js`
- Modify: `tests/security.test.js`
- Modify: `js/data.js`
- Modify: `js/storage.js`
- Modify: `scripts/catalog-source-config.mjs`
- Modify: `scripts/catalog-import.mjs`
- Create: `supabase/migrations/202608290024_catalog_alternative_visibility.sql`
- Create: `supabase/migrations/202608290025_canonical_catalog_consolidation.sql`

**Interfaces:**
- Produces: `catalogDataVersion = 2`, MNS/GED/SGE canonicalization, `visibility = 'alternative'`.

- [x] Add failing tests for idempotent department remapping, duplicate preservation rules, unchanged semester history, importer canonicalization, and migration privilege/RLS boundaries.
- [x] Run the three focused test files and confirm failures are caused by the missing migration.
- [x] Implement default/source normalization and state migration without filtering semester attempts.
- [x] Add ordered forward transactions: extend visibility, then create canonical departments, remap children, remove legacy rows, and mark the twelve alternative codes.
- [x] Run focused tests until green.

### Task 3: Course List filter and stream details

**Files:**
- Modify: `tests/main-integration.test.js`
- Modify: `tests/interaction-layer.test.js`
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: catalog curriculum-field helpers.
- Produces: `curriculumFieldFilter`, accessible stream detail trigger, and See more navigation.

- [x] Add failing markup/behavior tests for all approved filter options, compact labels, full detail copy, and filter navigation.
- [x] Run focused tests and confirm the new assertions fail.
- [x] Add the filter control and state-preserving renderer.
- [x] Add keyboard/click stream details and See more behavior that opens Course List with the correct filter.
- [x] Add responsive/focus styling and re-run focused tests.

### Task 4: Dashboard sign-out relocation and release verification

**Files:**
- Modify: `tests/main-integration.test.js`
- Modify: `tests/interaction-layer.test.js`
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/style.css`

**Interfaces:**
- Preserves: existing `accountSignOutBtn` event behavior.

- [x] Add failing tests that Cloud Sync has no sign-out and Dashboard footer owns the control after support content.
- [x] Run focused tests and confirm failure.
- [x] Move the button, retain preview disabling, and add bottom-right/mobile styles.
- [ ] Run focused tests, then `node --test tests/*.test.js`.
- [ ] Security-review the SQL and browser output, then create a hash-verified upload package containing only changed deployable files and tests.
