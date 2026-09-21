# Complete Course Catalog Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import all verified academic units and unique workbook courses without duplicates, show only CS degree-plan courses by default, and expose every other course through Add Course search.

**Architecture:** A reproducible workbook importer collapses source rows by normalized course code and generates a data-only seed migration. `catalog_courses.visibility` separates curriculum rows from Add Course-only rows; catalog helpers keep the full searchable catalog apart from the user's visible course collection. Admin and Student UI consume those helpers while existing AAL2 Edge mutations remain the only write path.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, `@oai/artifact-tool`, Supabase PostgreSQL/RLS, Deno Edge Functions.

**Spec:** `docs/superpowers/specs/2026-08-28-complete-course-catalog-design.md`

## Global Constraints

- Normalize course identity by compact uppercase code and never create duplicate codes.
- Preserve existing course titles, credits, prerequisites, roadmap data, and user overrides.
- Store all 13 academic units, 956 unique workbook codes, and nine PDF-only curriculum codes (965 unique source codes before conflicts) in the global catalog.
- Show PDF curriculum courses automatically; expose other catalog courses only through Add Course search.
- Display `Add Course only` only in Admin; never display “Search-only catalog” to students.
- Never invent credits for workbook-only courses.
- Keep authenticated catalog access read-only and Admin mutations AAL2-protected, rate-limited, validated, and audited.

---

### Task 1: Duplicate-safe source importer and forward migrations

**Files:**
- Create: `scripts/catalog-import.mjs`
- Create: `scripts/catalog-source-config.mjs`
- Create: `tests/catalog-import.test.js`
- Create: `supabase/migrations/202608280020_catalog_course_visibility.sql`
- Generate: `supabase/migrations/202608280021_seed_complete_course_catalog.sql`

**Interfaces:**
- Consumes: workbook rows shaped as `{ unit, shortForm, unitType, category, code, title, notes }`.
- Produces: `normalizeCourseCode(value)`, `deduplicateCourseRows(rows)`, `buildCatalogSeed({ units, rows, curriculum })`, and a conflict-safe SQL migration.

- [x] **Step 1: Write failing importer tests** for compact uppercase codes, one row per code, non-SGE ownership precedence, nullable credits, and PDF visibility/category overrides.
- [x] **Step 2: Run `node --test tests/catalog-import.test.js`** and confirm failure because the importer module does not exist.
- [x] **Step 3: Implement the importer helpers** with deterministic sorting and SQL escaping; use literal fixture expectations independent of importer internals.
- [x] **Step 4: Re-run the focused test** and confirm all importer behavior passes.
- [x] **Step 5: Add migration 020** with nullable credits, `visibility text not null default 'curriculum'`, a two-value check constraint, updated RPC return/write fields, and a documented forward rollback migration strategy.
- [x] **Step 6: Generate migration 021 from the supplied workbook and PDF-only supplements** using `ON CONFLICT` rules that never duplicate or overwrite existing base course data, then assert 13 unit IDs, 956 workbook codes, nine PDF-only codes, and 965 unique course insert tuples.
- [x] **Step 7: Run importer and migration/security tests** and stop this segment only when green.

### Task 2: Catalog contracts, Admin filtering, friendly categories, and real errors

**Files:**
- Modify: `js/catalog.js`
- Modify: `js/admin-catalog.js`
- Modify: `admin.html`
- Modify: `css/admin.css`
- Modify: `supabase/functions/admin-access/catalog-actions.mjs`
- Modify: `supabase/functions/admin-access/index.ts`
- Test: `tests/catalog.test.js`
- Test: `tests/admin.test.js`
- Test: `tests/security.test.js`

**Interfaces:**
- Consumes: course rows containing `visibility` and nullable `credits`.
- Produces: `slugifyCategoryLabel(value)`, visibility-aware `filterCatalogItems`, normalized public rows, and Admin form payloads with `visibility`.

- [x] **Step 1: Write failing tests** for visibility normalization/filtering, friendly category slug conversion, `Add Course only` Admin copy, nullable credits, and extraction of a JSON Edge error response.
- [x] **Step 2: Run focused Catalog/Admin/Security tests** and confirm the new assertions fail for missing behavior.
- [x] **Step 3: Extend catalog and Edge contracts** to read, validate, mutate, audit, and return visibility without broadening grants.
- [x] **Step 4: Implement Admin filters and form controls** with friendly category labels, custom category conversion, and user-facing server errors.
- [x] **Step 5: Re-run focused tests** and stop this segment only when green.

### Task 3: Student curriculum list and searchable Add Course picker

**Files:**
- Modify: `js/catalog.js`
- Modify: `js/app-boot.js`
- Modify: `js/app.js`
- Modify: `index.html`
- Modify: `css/style.css`
- Test: `tests/catalog.test.js`
- Test: `tests/main-integration.test.js`
- Test: `tests/interaction-layer.test.js`

**Interfaces:**
- Consumes: the full global course catalog and current user state.
- Produces: `partitionCatalogCourses(rows)`, `availableCatalogCourses`, and a modal picker that copies one selected course into user-owned `state.courses`.

- [x] **Step 1: Write failing tests** proving curriculum rows merge into the default list, search-only rows stay searchable but hidden, existing user codes win, duplicate Add is blocked, and unknown credits are required.
- [x] **Step 2: Run focused tests** and confirm failures are caused by absent partition/picker behavior.
- [x] **Step 3: Pass the full catalog separately through boot** while merging only curriculum rows into the visible user collection.
- [x] **Step 4: Replace the blank Add Course editor path with the approved searchable picker** and keep the existing editor for editing an already-added course.
- [x] **Step 5: Add responsive styles and accessible modal behavior** including focus, Escape, labels, empty results, and no student-facing search-only badge.
- [x] **Step 6: Re-run focused tests** and stop this segment only when green.

### Task 4: Full verification, security review, and deployment handoff

**Files:**
- Modify only files required by verified findings.
- Create: `docs/superpowers/reports/2026-08-28-complete-course-catalog-verification.md`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: a green test suite, review findings resolved, and exact GitHub/Supabase deployment order.

- [x] **Step 1: Run syntax checks and `node --test tests/*.test.js`** with no warnings or failures.
- [x] **Step 2: Run migration, duplicate-count, and generated-seed invariants** against the checked-in artifacts.
- [x] **Step 3: Review changed code for authorization, injection, validation, accessibility, and responsive regressions**; fix every material finding with a failing regression test first.
- [x] **Step 4: Re-run the complete suite** and record exact commands/results in the verification report.
- [x] **Step 5: List files for manual GitHub upload and the required order: migrations, Edge Function, then frontend deployment.**
