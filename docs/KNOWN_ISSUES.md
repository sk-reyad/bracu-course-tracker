# KNOWN ISSUES

## Document contract

- Purpose: Verified limitations and drift register.
- Read this when: working in an affected area or investigating a documented failure.
- Update this when: an item is reproduced, resolved or disproven.
- Primary sources of truth: linked files and tests; no live production inspection implied.


## KI-001 — Optional tooling is not reproducible from a manifest

Status: Open  
Severity: Medium  
Area: Developer tooling; verified packaging limitation

Evidence: No root package.json/lockfile is checked in. [catalog-workbook-reader.mjs](../scripts/catalog-workbook-reader.mjs) imports @oai/artifact-tool; [degree-plan-browser.cjs](../tests/degree-plan-browser.cjs) requires playwright and defaults to a Windows Edge path. The workbook reader also expects external source sheets/ranges.

Impact: Plain checkout can run the built-in local server/Node tests, but cannot be assumed to run workbook import or browser tests.

Reproduction / conditions: A clean machine without these optional packages/browser/source workbook.

Workaround: Provision dependencies explicitly for the intended tool and override documented browser settings. Pure importer tests do not need to load the workbook reader.

Resolution condition: A reviewed dependency/runtime/source-artifact provisioning contract is added. Do not install unrelated dependencies during documentation-only work.

## KI-002 — Local security tests are not hosted database verification

Status: Monitoring  
Severity: Medium  
Area: Test scope; verified limitation, not a demonstrated vulnerability

Evidence: [security.test.js](../tests/security.test.js) checks SQL/source contracts; [support-mfa.test.js](../tests/support-mfa.test.js) runs the handler with external services mocked.

Impact: A green Node suite cannot verify applied hosted grants, Auth hooks, provider settings or every cross-user/API path.

Reproduction / conditions: Reviewing a release using only local Node results.

Workaround: Follow controlled staging checks in [Deployment](DEPLOYMENT.md), preserving production data.

Resolution condition: Maintain independently verified integration coverage and record its scope; never replace tests with blanket safety claims.

## KI-003 — TRUNCATE changes have intentionally limited scope

Status: Monitoring  
Severity: Low  
Area: Database privilege coverage; risk to review, not a confirmed exploit

Evidence: [026](../supabase/migrations/202609190026_revoke_client_truncate.sql) enumerates twelve public tables. [027](../supabase/migrations/202609190027_restrict_postgres_default_truncate.sql) changes future defaults only for creator postgres and explicitly leaves other creator defaults pending.

Impact: These files do not prove that every current/future or platform-managed table has equivalent grants.

Reproduction / conditions: Assessing database-wide privilege hygiene from these migrations alone.

Workaround: Inspect effective privileges with an authorized read-only catalog audit before any targeted fix; do not mutate Supabase-managed objects blindly.

Resolution condition: Review relevant creators/entities and document exact verified coverage.

## KI-004 — Local and hosted maintenance failure modes differ

Status: Monitoring  
Severity: Low  
Area: Deployment verification; intentional implementation difference

Evidence: [middleware.ts](../middleware.ts) redirects on failed settings lookup; [maintenance-guard.js](../js/maintenance-guard.js) returns on error. [dev-server.js](../scripts/dev-server.js) does not execute Vercel middleware.

Impact: Local static availability does not prove hosted maintenance configuration is correct.

Reproduction / conditions: Missing/unavailable site settings or middleware environment variables.

Workaround: Verify hosted middleware and recovery exemptions separately.

Resolution condition: Keep this distinction explicit while both mechanisms remain; change only with a scoped requirement.

## Resolved documentation drift

- The existing SETUP.md listed only early migrations and contained project/account-specific instructions. Replaced with placeholders, full-chain guidance and separate bootstrap/release responsibilities.
- README's "older setup guide" warning is removed once linked to this updated guide.
- The prior "missing docs/SETUP.md" snapshot was not true in this checkout; no missing-file issue remains.
- Historical planning documents are labeled as historical, not authoritative current operating instructions.
