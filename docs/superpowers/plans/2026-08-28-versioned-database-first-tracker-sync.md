# Versioned Database-First Tracker Sync Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace last-write-wins tracker backup sync with one-request, revision-checked, snapshot-backed Supabase persistence.

**Architecture:** Supabase `course_tracker_data` is canonical and localStorage is a user-scoped cache with separate pending-sync metadata. A single transactional RPC validates ownership, rejects conflicts and accidental blank overwrites, snapshots the previous revision, and keeps the newest 20 snapshots.

**Tech Stack:** Static JavaScript, Supabase JS v2, PostgreSQL/PLpgSQL, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-versioned-database-first-tracker-sync-design.md`

## Global Constraints

- Preserve the deployed Google Identity Services login flow and current UI design.
- Preserve every existing `course_tracker_data.data` value during migration.
- Keep normal load to one tracker-row request and save to one debounced RPC request.
- Never expose a service-role key or accept caller-supplied user ownership.
- Retain only the newest 20 prior revisions per user.

---

### Task 1: Define sync behavior with failing tests

**Files:**
- Modify: `tests/access.test.js`
- Modify: `tests/security.test.js`

**Interfaces:**
- Consumes: existing `createStorageManager` and `createTrackerBoot` factories.
- Produces: tested contracts for sync metadata, canonical load selection, RPC writes, conflicts, and explicit destructive reset.

- [ ] Add behavioral tests for pending metadata and database-first source selection.
- [ ] Add boot tests asserting one `data, revision, updated_at` read and one `save_course_tracker_state` RPC.
- [ ] Add migration security/retention contract tests.
- [ ] Run `node --test tests/access.test.js tests/security.test.js` and verify the new tests fail for missing behavior.

### Task 2: Add the versioned Supabase persistence migration

**Files:**
- Create: `supabase/migrations/202608280022_versioned_tracker_storage.sql`

**Interfaces:**
- Produces: `save_course_tracker_state(p_expected_revision bigint, p_data jsonb, p_allow_destructive boolean)` returning `revision` and `updated_at`.

- [ ] Add `course_tracker_data.revision` without rewriting existing data.
- [ ] Create the RLS-protected history table and `(user_id, revision desc)` index.
- [ ] Implement atomic validation, row locking, conflict rejection, blank-overwrite guard, snapshot insertion, revision increment, and 20-snapshot pruning.
- [ ] Revoke direct authenticated mutations and grant only current-row/history reads plus RPC execution.
- [ ] Run the focused tests and verify the SQL contract tests pass.

### Task 3: Add local pending-sync metadata

**Files:**
- Modify: `js/storage.js`
- Modify: `tests/access.test.js`

**Interfaces:**
- Produces: `getSyncMeta(userId)`, `markSyncPending(userId, baseRevision)`, and `markSyncComplete(userId, revision)`.

- [ ] Store metadata under a separate user-scoped key, never inside exported academic data.
- [ ] Normalize invalid metadata to `{ revision: 0, pending: false }`.
- [ ] Verify tests pass for pending, completion, malformed storage, and user isolation.

### Task 4: Replace upsert sync with revision-checked database-first boot

**Files:**
- Modify: `js/app-boot.js`
- Modify: `js/app.js`
- Modify: `tests/access.test.js`

**Interfaces:**
- Consumes: RPC and storage metadata from Tasks 2-3.
- Produces: queued `queueCloudSync(state, options)` and immediate `syncNow(state, options)` using the active revision.

- [ ] Load the current cloud row once and choose cloud unless a compatible local write is pending.
- [ ] Preserve incompatible pending local data as a visible conflict without writing it automatically.
- [ ] Mark pending before debounce; clear it only after RPC success and cache the returned revision.
- [ ] Send `p_allow_destructive = true` only from confirmed Reset and explicit backup import paths.
- [ ] Surface conflict-specific sync copy without exposing internal database errors.
- [ ] Run focused tests and JavaScript syntax checks.

### Task 5: Verify security, regression safety, and deployment package

**Files:**
- Modify: `docs/SETUP.md`
- Create: `github-upload/github-upload-versioned-database-sync/` runtime and migration copies.

**Interfaces:**
- Consumes: completed implementation.
- Produces: exact user-upload package and Supabase migration instructions.

- [ ] Document applying migration 022 before uploading frontend files.
- [ ] Run `node --check` for modified JavaScript.
- [ ] Run `node --test tests/*.test.js` and require zero failures.
- [ ] Review RLS, grants, ownership derivation, payload validation, error exposure, and snapshot retention.
- [ ] Hash-compare the upload package with source files and list the exact deployment order.
