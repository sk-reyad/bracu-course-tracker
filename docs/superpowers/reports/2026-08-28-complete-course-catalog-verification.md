# Complete Course Catalog Verification

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

Date: 2026-08-28 (Asia/Dhaka)

## Verified outcome

- Imported 13 academic units and 965 unique course codes from the supplied workbook plus the PDF-only supplements.
- Collapsed 989 workbook rows into 956 unique workbook codes; 33 repeated source rows do not create duplicate catalog records.
- Added nine PDF-only codes, producing 965 unique catalog records in the generated seed.
- Classified 93 courses as `curriculum` and 872 as `search_only`.
- Existing database rows are matched by normalized course code. The seed does not overwrite their title, credits, department, prerequisites, roadmap data, or source note.
- The Student Course List receives only curriculum rows automatically.
- The Student Add Course picker searches the full catalog, filters by department, blocks normalized duplicate codes, and asks for credits only when the source has no verified credit value.
- Internal `search_only` wording is not exposed in the Student UI. Admin displays the friendly `Add Course only` label.

## Source and seed invariants

The checked-in generated migration was tested for:

- 13 unique department IDs.
- 965 course tuples and 965 unique normalized course codes.
- 93 curriculum rows.
- 872 Add Course-only rows.
- Conflict-safe insert behavior with no title overwrite.

## Security review

- Catalog tables keep RLS enabled and authenticated clients receive public-column SELECT access only.
- Browser roles cannot execute the catalog mutation RPC.
- Catalog mutations remain behind the `admin-access` Edge Function.
- The Edge Function validates the JWT, requires AAL2, checks active account status and `catalog.manage`, rate-limits privileged actions, and writes audit records.
- Mutation payloads use field allowlists and server-side validators for identifiers, categories, visibility, credits, prerequisites, text lengths, email, and booleans.
- The SECURITY DEFINER mutation RPC re-checks the actor's effective access and uses an empty search path.
- Student catalog text is HTML-escaped before dynamic rendering.
- No new secret or service-role credential is present in browser JavaScript.

## Verification commands

```text
node --test tests/*.test.js
```

Result: 294 tests passed, 0 failed, 0 skipped, exit code 0.

```text
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }
node --check scripts/catalog-import.mjs
node --check scripts/catalog-source-config.mjs
node --check scripts/catalog-workbook-reader.mjs
node --check supabase/functions/admin-access/catalog-actions.mjs
node --check supabase/functions/admin-access/admin-rate-limit.mjs
```

Result: every syntax check exited successfully.

## Manual deployment order

1. Upload/commit the repository files listed below to GitHub.
2. Apply `202608280020_catalog_course_visibility.sql` in Supabase.
3. Apply `202608280021_seed_complete_course_catalog.sql` in Supabase.
4. Deploy the updated `admin-access` Edge Function.
5. Deploy the frontend only after the migrations and Edge Function are live.

Applying the frontend before migration 020 can make the new `visibility` field unavailable. Applying migration 021 before migration 020 will fail because the seed depends on the new nullable-credit and visibility schema.

## GitHub upload list

Runtime/frontend:

- `admin.html`
- `index.html`
- `css/admin.css`
- `css/style.css`
- `js/admin-catalog.js`
- `js/app-boot.js`
- `js/app.js`
- `js/catalog.js`

Supabase:

- `supabase/functions/admin-access/catalog-actions.mjs`
- `supabase/functions/admin-access/index.ts`
- `supabase/migrations/202608280020_catalog_course_visibility.sql`
- `supabase/migrations/202608280021_seed_complete_course_catalog.sql`

Reproducible import tooling:

- `scripts/catalog-import.mjs`
- `scripts/catalog-source-config.mjs`
- `scripts/catalog-workbook-reader.mjs`

Tests and documentation:

- `tests/admin.test.js`
- `tests/catalog-import.test.js`
- `tests/catalog.test.js`
- `tests/interaction-layer.test.js`
- `tests/main-integration.test.js`
- `tests/security.test.js`
- `docs/superpowers/specs/2026-08-28-complete-course-catalog-design.md`
- `docs/superpowers/plans/2026-08-28-complete-course-catalog.md`
- `docs/superpowers/reports/2026-08-28-complete-course-catalog-verification.md`

## Deployment state

- Supabase migrations 020 and 021 were applied to project `eeorkgnbhxenaszdxtti` and verified in the remote migration history.
- The `admin-access` Edge Function was deployed and verified ACTIVE as version 17.
- GitHub upload remains user-managed.
- Frontend production deployment remains pending because the local Vercel CLI is logged out and the repository is not locally linked to a Vercel project. If GitHub integration is enabled, the user's GitHub commit will trigger it automatically.
