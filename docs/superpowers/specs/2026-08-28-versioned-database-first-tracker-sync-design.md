# Versioned Database-First Tracker Sync Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Make Supabase the canonical tracker store without adding another normal-load request, while preserving fast local UI updates and preventing stale or blank browser data from destroying saved academic history.

## Data model

- `course_tracker_data` remains one JSONB row per `user_id` and gains a positive `revision`.
- `course_tracker_data_history` stores the previous state and revision before each successful update.
- History is private through RLS and retains the newest 20 snapshots per user.
- Existing rows begin at revision 1; no existing `data` value is rewritten by the migration.

## Save protocol

The browser calls one `save_course_tracker_state(expected_revision, data, allow_destructive)` RPC. The transaction authenticates `auth.uid()`, locks the current row, validates the JSON shape and 2 MB limit, rejects revision conflicts, snapshots the previous state, increments the revision, and prunes old history.

Normal saves cannot replace a state containing attempts with a zero-attempt state. Only the already-confirmed Reset action and an explicit backup import may send `allow_destructive = true`.

## Load and offline behavior

- A normal load reads only `data`, `revision`, and `updated_at` from the user's row.
- When a cloud row exists and there is no pending local write, cloud wins.
- A local pending write records its base revision outside the tracker JSON. If the base revision still matches cloud after reload, local is displayed and retried.
- If another device advanced the revision, the local copy is preserved but automatic overwrite is blocked and the UI reports a sync conflict.
- If no cloud row exists, a populated same-user local state is migrated once with expected revision 0. Otherwise the user receives a fresh state and no blank row is created automatically.

## Security and performance

- Direct authenticated insert/update/delete on tracker rows is revoked; mutations use the validated RPC.
- RLS permits each active user to select only their own current row and history.
- The RPC never accepts a user ID; it derives ownership from `auth.uid()`.
- Normal loading remains one indexed primary-key query. Saving remains one debounced network request.
