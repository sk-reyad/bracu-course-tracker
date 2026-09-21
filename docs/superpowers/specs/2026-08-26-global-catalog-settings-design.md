# Global Catalog and Settings Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Make faculty editing explicit, present BRACU's grade scale as immutable, and let authorized administrators manage shared departments, courses, and faculty without overwriting user-owned data.

## Student Settings

- Faculty rows are read-only by default. Edit opens one row at a time and exposes Save, Cancel, and Delete.
- Save validates a required name and initial, a valid optional email, a known department, and a case-insensitive unique initial.
- Grade Scale is a responsive semantic table backed only by `DEFAULT_DATA.gradeScale`; imported or legacy custom scales are replaced by the canonical scale.

## Global Catalog

- Supabase stores departments, courses, and faculty in separate normalized tables.
- Active authenticated users may read catalog rows. Browser roles cannot mutate them.
- Mutations use the existing `admin-access` Edge Function and require AAL2 plus `catalog.manage`.
- Super Admin receives `catalog.manage` by role. Admin receives it only through an explicit permission override.

## Merge Rules

- Course identity is normalized `code`; department identity is normalized `id`; faculty identity is normalized `initial`.
- Existing user data wins when the same key exists.
- A missing global item is injected without overwriting user fields.
- User deletion of a global item records a tombstone so it does not return.
- Admin deletion stops future distribution but never deletes an existing user's data.
- Catalog read failure is non-blocking; the local/cloud user copy remains usable.

## Security and Verification

- Server-side allowlists validate every kind and field; writes are rate-limited and audited.
- RLS and grants enforce read-only client access.
- Tests cover immutable grading, explicit faculty editing, merge precedence, tombstones, permission visibility, Edge authorization, and responsive UI.
