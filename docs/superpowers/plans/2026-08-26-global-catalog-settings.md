# Global Catalog and Settings Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add controlled faculty editing, immutable BRACU grading, and a permission-protected Supabase global catalog that preserves user-owned data.

**Architecture:** Pure catalog helpers own normalization, user-first merge, and tombstones. Student boot reads global rows opportunistically; Admin writes go through the AAL2-protected `admin-access` Edge Function. Migration 018 adds normalized tables, read-only RLS, and `catalog.manage`.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, Supabase PostgreSQL/RLS, Deno Edge Functions.

**Spec:** `docs/superpowers/specs/2026-08-26-global-catalog-settings-design.md`

## Global Constraints

- Existing user data wins conflicts; course conflicts use normalized course code.
- User deletion of global items persists through tombstones.
- Global catalog failure never blocks login.
- Grade scale is the canonical `DEFAULT_DATA.gradeScale` and cannot be edited.
- Super Admin always manages catalog; Admin needs explicit `catalog.manage`.
- Browser clients never receive catalog mutation grants.

---

### Task 1: Canonical grade scale and explicit faculty editor

**Files:** Modify `js/storage.js`, `js/app.js`, `css/style.css`; test `tests/access.test.js`, `tests/main-integration.test.js`, `tests/interaction-layer.test.js`.

- [ ] Write failing tests for canonical grade migration, non-editable grade table, and Faculty Edit/Save/Cancel/Delete controls.
- [ ] Run targeted tests and confirm expected failures.
- [ ] Implement canonical grade restoration, controlled faculty editing, validation, and responsive styles.
- [ ] Re-run targeted tests until green.

### Task 2: Pure catalog merge and boot integration

**Files:** Create `js/catalog.js`, `tests/catalog.test.js`; modify `index.html`, `js/storage.js`, `js/app-boot.js`, `js/app.js`.

- [ ] Write failing tests for normalized keys, user precedence, idempotence, tombstones, and offline fallback.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Implement `normalizeCatalogKey`, `mergeGlobalCatalog`, `markCatalogDeleted`, and `fetchGlobalCatalog`.
- [ ] Integrate the authenticated boot read and deletion tombstones.
- [ ] Re-run catalog and access tests until green.

### Task 3: Database schema, permission, and secure mutations

**Files:** Create `supabase/migrations/202608260018_global_catalog.sql`, `supabase/functions/admin-access/catalog-actions.mjs`; modify `supabase/functions/admin-access/index.ts`, `account-policy.mjs`, `admin-rate-limit.mjs`; test `tests/admin.test.js`, `tests/security.test.js`, `tests/auth.test.js`.

- [ ] Write failing SQL/Edge authorization and validation tests.
- [ ] Confirm the tests fail because migration/actions do not exist.
- [ ] Add normalized catalog tables, SELECT-only RLS/grants, `catalog.manage`, authoritative access-function update, validated Edge CRUD, rate limiting, and auditing.
- [ ] Re-run backend/security tests until green.

### Task 4: Admin Catalog UI

**Files:** Create `js/admin-catalog.js`; modify `admin.html`, `js/admin.js`, `js/admin-permissions.js`, `js/admin-support.js`, `css/admin.css`; test `tests/admin.test.js`, `tests/admin-performance.test.js`.

- [ ] Write failing tests for capability/permission visibility, navigation, forms, read-only rows, and Edit/Save/Cancel/Delete.
- [ ] Confirm expected failures.
- [ ] Implement responsive Departments/Courses/Faculty catalog views and loading/error/empty states.
- [ ] Re-run Admin tests until green.

### Task 5: Full verification and review

**Files:** All changed files.

- [ ] Run syntax checks and `node --test tests`.
- [ ] Verify light/dark layouts at mobile, tablet, and desktop widths.
- [ ] Run database, security, and code reviews; fix all material findings.
- [ ] Re-run the complete suite and report migration/deployment steps.
