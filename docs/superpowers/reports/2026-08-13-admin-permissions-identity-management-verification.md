# Admin permissions and identity management verification

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

Verified from the project workspace on 2026-08-14 (Asia/Dhaka).

## Release status

**Remote migrations, the security-hardened Edge Function deployment, and non-destructive signed-in browser acceptance succeeded; final destructive/concurrency acceptance remains pending.** Migration 008 and its original function release were deployed first. A subsequent security review found and fixed three defects: Student actor/target privilege denial, exact create-access verification, and compensated status mirroring. Additive migration `202608140009_admin_access_security_hardening.sql` was then dry-run as the sole pending migration and applied successfully. The updated `admin-access` is version 6, ACTIVE, with JWT verification enabled. A fix-only re-review found no remaining Critical or Important issues. Read-only SQL content checks, mutation/destructive browser scenarios, and safe live concurrency verification are still pending, so this report does not claim full release acceptance.

## Local verification

| Command | Exit status | Result |
| --- | ---: | --- |
| `node --test tests/*.test.js` | 0 | Fresh final PASS: 155 tests, 155 passed, 0 failed, 0 skipped |
| `node --check js/admin-permissions.js` | 0 | PASS |
| `node --check js/admin.js` | 0 | PASS |
| `node --check js/access.js` | 0 | PASS |
| `deno check supabase/functions/admin-access/index.ts` | 1 | Deno is not installed; PowerShell reported `CommandNotFoundException` |
| `npx.cmd supabase functions serve admin-access --no-verify-jwt` | 1 | Supabase CLI 2.114.0 does not accept the function name as a positional argument |
| `npx.cmd supabase functions serve --no-verify-jwt` | 1 | Permitted local validation substitute could not start because Docker and Podman are unavailable |

Deno validation remains unavailable locally. The successful remote deployment supplied server-side bundling/upload validation; its Docker warning was non-blocking and did not prevent `Deployed Functions.`

## Supabase target and migration evidence

| Command | Exit status | Result |
| --- | ---: | --- |
| `npx.cmd supabase --version` | 0 | Supabase CLI 2.114.0, run through the repository's established `npx` path; no global CLI was installed |
| `npx.cmd supabase projects list --output json` | 0 | Authenticated CLI found project `eeorkgnbhxenaszdxtti` (`bracu-course-tracker`) with status `ACTIVE_HEALTHY`; it was not yet linked |
| `npx.cmd supabase link --project-ref eeorkgnbhxenaszdxtti` | 0 | Linked to the exact required project |
| `npx.cmd supabase db push --linked --dry-run` | 0 | Dry run reported exactly one pending migration: `202608130008_admin_permissions_identity_management.sql` |
| `npx.cmd supabase db push --linked` | 0 | Applied only `202608130008_admin_permissions_identity_management.sql`; output ended with `Finished supabase db push.` |
| `npx.cmd supabase migration list --linked` | 0 | Fresh read-only history shows local and remote `202608130008` matched |
| `npx.cmd supabase db push --linked --dry-run` (security hardening) | 0 | Reported additive migration `202608140009_admin_access_security_hardening.sql` as the sole pending migration |
| `npx.cmd supabase db push --linked` (security hardening) | 0 | Applied migration `202608140009_admin_access_security_hardening.sql` successfully |
| `npx.cmd supabase migration list --linked` (final) | 0 | Fresh history shows local and remote migration `202608140009` matched |

### Required post-migration SQL verification

Pending because no safe SQL query interface was available. Migration 008 is applied, but the following content results still require read-only verification:

- permission `users.identity.manage` exists;
- routines `provision_admin_account`, `set_account_access`, and `admin_effective_access` exist in `public`;
- `maisha2192003@gmail.com` resolves to role `admin`, status `active`, and `onboarding_completed = true`.

The repair is migration-only and exact-audit-target guarded. It derives target UUIDs from successful `create-admin` audit records and does not run on login, page load, Auth Hooks, triggers, scheduled jobs, or Edge Function requests.

## Edge Function deployment

| Command | Exit status | Result |
| --- | ---: | --- |
| `npx.cmd supabase functions deploy admin-access --project-ref eeorkgnbhxenaszdxtti` | 0 | `Deployed Functions.` Uploaded `deno.json`, `index.ts`, `account-actions.mjs`, `account-policy.mjs`, and `http-response.mjs`; Docker warning was non-blocking |
| `npx.cmd supabase functions list --project-ref eeorkgnbhxenaszdxtti --output json` | 0 | Initial release state: `admin-access` version 5 was `ACTIVE`, with `verify_jwt: true` |
| Updated `npx.cmd supabase functions deploy admin-access --project-ref eeorkgnbhxenaszdxtti` | 0 | Security-hardened function deployed successfully |
| Final `npx.cmd supabase functions list --project-ref eeorkgnbhxenaszdxtti --output json` | 0 | Fresh state: `admin-access` version 6 is `ACTIVE`, with `verify_jwt: true` |

The deployed version/status for this release is **version 6 / ACTIVE / JWT verification enabled**.

## Security review closeout

The security review identified three defects and the implementation was corrected with additive migration 009 plus the updated Edge Function. Fresh verification after those fixes and the responsive browser regression passed 155/155 tests and all JavaScript syntax checks. The fix-only re-review found no remaining Critical or Important issues in scope.

## Signed-in browser verification

After the human completed Admin sign-in, the in-app browser stayed at `admin.html` with the expected Super Admin identity. The following non-destructive checks passed against the live linked project:

- Users and Admins tabs loaded real account data, identity, role, status, first-registration date, onboarding state, and login counts;
- manual refresh preserved account data and produced no authentication error;
- the repaired administrator rendered `Admin`, `Active`, and `Not required`;
- Create Administrator defaulted to `View profiles` only;
- selecting Super Admin checked and disabled every permission;
- permission controls used short English names and explanations with no raw permission codes;
- Student and Admin profile drawers exposed the expected Super Admin-only identity/access controls;
- identity edit mode exposed Save/Cancel without committing changes;
- deletion required the target email and was opened/cancelled without deleting data;
- Escape closed the drawer and restored focus to the originating View button;
- the Dot Grid remained rendered in both themes and all tested widths;
- 1440, 1280, 1024, 768, 390, and 360 pixel widths passed in both light and dark themes with controls inside the viewport and zero page-level horizontal overflow;
- browser console warning/error capture remained empty.

The first responsive pass found page-level horizontal overflow at 1280 and 1024 pixels. Root-cause inspection traced it to the absolutely positioned `sr-only` span inside the 1400-pixel scrollable table's Actions header. The header now uses an accessible `aria-label` without the positioned span. A regression test failed before the markup fix, passed afterward, and the full two-theme viewport matrix then passed.

The following mutation/destructive checks remain pending because this acceptance run intentionally did not alter real accounts:

- Student identity changes persist to the next signed-in profile;
- invalid non-G-Suite Student email produces the specified live server error;
- normal Admin sessions cannot edit/delete Admin identities or grant inaccessible permissions;
- typed-email mismatch and successful account deletion behavior;
- live self and last-Super-Admin protection errors;
- successful permission/status mutations and refreshed values.

## Live last-Super-Admin concurrency verification

Pending. Migrations 008 and 009 are remote, but this task had neither an approved rollback-only transaction path nor confirmed disposable Super Admin accounts. No real Super Admin account was demoted, suspended, or otherwise endangered. The local suite includes passing tests for guarded last-active-Super-Admin status and access updates, but those tests do not replace the required two-session live verification.

## Documentation and checkpoint

`docs/SETUP.md` now documents the exact safe rollout order: full local tests, conditional link, dry run and one-time migration 008 push, object/repair verification, `admin-access` deployment, sign-out/sign-in JWT refresh, and disposable-Admin acceptance testing. It also states that the repair is migration-only, exact-audit-target guarded, and never runs on login or page load.

This workspace is not a Git repository. No repository was initialized and no commit was created; this report is the durable checkpoint.

## Manual follow-up

1. Run the three read-only SQL verification queries and record their results without exposing secrets.
2. Perform rollback-only or disposable-account two-session concurrency verification.
3. Complete the remaining mutation/destructive browser scenarios with disposable Student/Admin accounts.
