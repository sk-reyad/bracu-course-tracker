# DATA MODEL

## Document contract

- Purpose: Logical persistence and effective migration contracts.
- Read this when: changing schema, RPCs, storage, sync or catalog persistence.
- Update this when: a migration or client-state change affects data/access contracts.
- Primary sources of truth: [migrations](../supabase/migrations), [storage.js](../js/storage.js), [catalog.js](../js/catalog.js), [profile.js](../js/profile.js).

## Evidence boundary

This describes the **accumulated repository migration chain**, not an introspection of the hosted database. A deployed project's applied migration history and platform-managed grants must be checked separately. Later SQL overrides earlier grants/policies; a policy alone does not grant table privileges.

## Persistence layers

| Layer | Contract |
| --- | --- |
| Browser tracker | bracuCsCourseTracker.v2:<user UUID>; personal state, never a universal shared user key |
| Legacy browser state | bracuCsCourseTracker.v1; only considered for matching normalized email; legacy copy retained |
| Sync metadata | bracuCsCourseTracker.sync.v1:<user UUID>; pending/revision/protocol metadata |
| Theme | bracuCourseTracker.theme; independent preference |
| Auth session | Supabase client uses persistSession, autoRefreshToken and detectSessionInUrl |
| PostgreSQL | Canonical profiles, roles, reference catalog, revisioned personal tracker and support |
| Storage | Private profile-photos bucket; 5 MiB; JPEG/PNG/WebP; first path segment is owner UUID |
| Export | JSON backup and PDF contain personal academic information; user-controlled copies |

## Important entities

All tables below are in public unless qualified. Migration numbers are the terminal sequence in the filenames, not independent version guarantees.

| Entity / key | Important fields, relationships and constraints | Access / migration |
| --- | --- | --- |
| profiles / id UUID | FK auth.users cascade; unique email/student_id; full_name; program CS/CSE; starting_term Spring/Summer/Fall; year 2001–2100; pending/active/suspended; onboarding_completed; avatar_path/preference google/custom/none | Own pending/active read; permission+AAL2 cross-user branches; student mutation only validated RPC; 001,004,005,012,015,017 |
| app_roles / identity id | Unique student/admin/super_admin | Permission/AAL2 reads; server writes; 001,003,015 |
| app_permissions / identity id | Unique permission name and description | Permission/AAL2 reads; 001,008,011,018 |
| role_permissions / (role_id,permission_id) | FKs to roles/permissions cascade | Role defaults; administrative reads; 001,015 |
| user_roles / user_id | One role per Auth user; role FK, updated_at | Own mapping or permitted AAL2 reads; server mutation; 001,005,008,012,015 |
| user_permissions / (user_id,permission_id) | Explicit granted boolean overrides role default | Own or AAL2 permissions.manage reads; server mutation; 001,008,015 |
| admin_audit_log / identity id | actor/target Auth FK set null; action, succeeded, before/after JSON, request UUID, time | AAL2 permissions.manage read; server insert; 001,006,015 |
| course_tracker_data / user_id | Auth FK cascade; data JSONB; revision >0; created/updated timestamps | Own active SELECT; RPC-only browser writes; 002,022 |
| course_tracker_data_history / (user_id,revision) | Auth FK cascade; prior data/time; positive revision | Own active SELECT; RPC snapshots/pruning; 022 |
| login_events / identity id | Profile FK cascade; session_id; unique(user_id,session_id); signed_in_at | No browser table access; record_login_event RPC; 007 |
| admin_account_login_metrics / view | security_invoker view groups daily/weekly/monthly/total by user, Asia/Dhaka boundaries | Service-role SELECT only; 007 |
| site_settings / id='global' | maintenance_enabled/message, updated_by Auth FK set null, updated_at | Public SELECT; server writes despite policy definitions; 011,015 |
| support_tickets / UUID id | Nullable requester Auth FK set null; name 2–100, email 3–254, message 4–4000; source maintenance/auth/dashboard; status active/working_on_it/solved/cancelled; notification pending/sent/failed | Own active or AAL2 support.read SELECT; Edge writes; 011,015 |
| support_replies / UUID id | ticket FK cascade; author Auth FK set null; body 1–4000; delivery dashboard/mailto; timestamps | Own ticket or AAL2 support.read SELECT; Edge writes; 011,015 |
| support_rate_limits / key_hash | Window start, positive request_count, updated_at | Service-only consume RPC/table; 011 |
| admin_rate_limits / (actor_id,action_name) | Auth FK cascade; constrained action; window, count, last_blocked_at | Service-only consume RPC/table; 013,018 |
| catalog_departments / text id | Normalized uppercase id; name/color; creator FK set null; timestamps | Active authenticated public-column SELECT; service writes; 018,025 |
| catalog_courses / text code | Normalized code, title, nullable credits 0–20, department FK restrict, category, roadmap position, prerequisite arrays, source_note, slot flag, visibility | Active authenticated public-column SELECT; service mutation; 018,020,023,024,025 |
| catalog_faculties / text initial | Normalized initial; name, optional email, department FK restrict, creator/timestamps | Active authenticated public-column SELECT; service mutation; 018,025 |
| storage.objects / managed | Objects in profile-photos owner folder; not an application-owned table | Own pending/active SELECT/INSERT/UPDATE/DELETE policies; 002,012 |

Relevant indexes: profile status/created and trigram name/email/student ID; user_roles(role_id,user_id); login_events(user_id,signed_in_at); tracker history(user_id,revision DESC); support status/created, requester/created, ticket/reply time; catalog department/creator, GIN prerequisite arrays, visibility/code. See 010,011,018,020,022 for definitions; do not create duplicate indexes from this summary.

## Effective read/write matrix

"Admin" below means qualifying permission **and AAL2**, not merely a role claim.

| Data | Anonymous | Own authenticated context | Other-user administrative access | Browser direct writes |
| --- | --- | --- | --- | --- |
| Profile | No application read grant | Pending/active self | Student profiles.read; admins admins.read | No; profile RPC |
| Tracker/history | No | Active owner | No general admin branch | No; save RPC |
| Catalog public columns | No | Active accounts | Same reference read; admin full list via Edge | No |
| Role/permission metadata | No | Own user mapping/overrides where policy permits | Specific AAL2 permission policies | No |
| Tickets/replies | No | Active requester | support.read | No; Edge actions |
| Site settings | SELECT | SELECT | Same read | No; maintenance Edge action |
| Audit | No | No general self access | permissions.manage | No |
| Login/rate tables | No | Restricted RPC only | Service operations | No |
| Photo objects | No public bucket | Pending/active owner folder | No general admin photo-read policy | Own object API within policy |

Table privileges, column grants and RLS intersect. Migration 015's support/site mutation policies do **not** undo 011's write revocations. Supabase service credentials are privileged; every Edge path must impose its own authorization.

## Functions, hooks and triggers

| Routine | Purpose / execution boundary |
| --- | --- |
| current_account_active, current_app_role, profile_asset_access_allowed | SECURITY DEFINER helpers with empty search_path; authenticated self lookup, service/Auth cross-user exception in 012 |
| authorize(text) | Active account plus user override (including false) before role default; authenticated caller permission check |
| hook_restrict_signup(jsonb) | Auth hook only: official Google domain or server-marked admin account; not browser executable |
| custom_access_token_hook(jsonb) | Auth hook only; direct protected role/override lookup; adds app_role, app_permissions, account_status; 016 |
| handle_new_auth_user / on_auth_user_created | Auth insert trigger provisions profile and role; browser execute revoked by 014 |
| immutable_profile_identity / profiles_protect_identity_and_status | Before-update identity/status guard, updated_at; student onboarding uses guarded flag |
| complete_student_onboarding / update_student_profile | Authenticated six-argument validated student RPCs; Google/domain/status/identity/photo checks; 004,012,017 |
| record_login_event() | Authenticated SECURITY DEFINER insert keyed by verified auth.uid and session claim, deduplicated; 007 |
| save_course_tracker_state(bigint,jsonb,boolean) | Authenticated owner-only SECURITY DEFINER save; details below; 022 |
| admin_effective_access, set_account_access, set_account_status_guarded, provision_admin_account, admin_list_accounts | Service-only admin helpers; do not expose as browser RPCs; 008–012,018 |
| consume_support_rate_limit / consume_admin_rate_limit | Service-only counters; 011,013,018 |
| mutate_global_catalog | Service-only SECURITY DEFINER with actor checks and atomic successful audit; 018,020 |
| support_touch_updated_at | Ticket/reply timestamp trigger; not a user editing API |

Do not assume every trigger helper has the same EXECUTE grants: inspect each declaration/revocation and platform defaults before exposure analysis. Important definer routines pin search_path; review both body and grants.

## Tracker JSON and concurrency

State contains profile, courses, departments, faculties, gradeScale, semesters and settings. Semester courses are attempts containing stable id/code/status and grade/faculty metadata. settings includes theme, catalog/faculty versions, cloudSync, lastUpdated and intentional reset metadata when used. This is not a normalized per-attempt SQL table.

Backup validation limits: 2 MiB file; at most 1,000 courses, 100 departments, 2,000 faculties, 100 semesters and 500 attempts per semester; identifier checks. SQL independently limits serialized JSON to 2,097,152 bytes and checks object/semester/attempt container shape. It does not reproduce every client academic validation.

Save protocol:
1. Derive owner from auth.uid; reject missing/inactive identity.
2. Require nonnegative expected revision and valid JSON.
3. Take per-user advisory transaction lock; read current row FOR UPDATE.
4. First save requires revision 0 and creates revision 1.
5. Existing save requires exact revision; mismatch raises 40001/tracker_revision_conflict.
6. Block nonempty-to-zero-attempt overwrite unless explicit p_allow_destructive.
7. Snapshot old revision; increment; retain newest 20 history records.

Browser resolution preserves pending local work, detects base-revision conflicts, otherwise prefers cloud. One-time legacy recovery can preserve academic history when cloud is empty and not explicitly reset. Failed cloud read must not be mistaken for permission to overwrite the server. See access/security tests.

## Catalog sources and evolution

- js/degree-plan-data.js owns current requirement definitions and supplemental membership; js/data.js holds bundled reference/sample records.
- scripts/catalog-source-config.mjs combines curriculum classification, PDF supplements, alternatives and degree-plan data.
- scripts/catalog-workbook-reader.mjs expects external workbook sheets/ranges; scripts/catalog-import.mjs generates SQL. Source workbook availability is not guaranteed by checkout.
- Runtime catalog.js merges global records with personal state; shared deletion stops distribution, not personal history deletion.
- 020 allows unknown/null credits and parenthesized code suffixes, adds curriculum/search_only visibility.
- 023 grants SELECT(visibility); 024 adds alternative; 025 canonicalizes MNS→MPS and GED/SGE→GENED without editing tracker JSON.
- Avoid inferring prerequisite referential integrity from array columns; inspect RPC validation and compatibility helpers.

## Migration policy

Filenames use a 12-digit ordered date/sequence prefix followed by a descriptive suffix and .sql. Current chain runs 001 through 027; always list the live directory before choosing the next filename. Foundational schema: 001–008; admin hardening/performance: 009–010; support: 011; access/rate/claim/copy hardening: 012–017; catalog: 018–021,023–025; revisioned tracker: 022; TRUNCATE hardening: 026–027.

026 revokes existing TRUNCATE on its explicit 12-table list only. 027 changes future public-table defaults for creator postgres only; it does not cover every creator or managed Storage schema.

Use a new forward migration by default, not an edit to applied history. Review existing rows, constraints, ownership, indexes, grants, RLS, definer search_path, RPC callers and deployment order. There is no general automatic down-migration system. See [Deployment](DEPLOYMENT.md) and the [database-migration skill](../.agents/skills/database-migration/SKILL.md).

