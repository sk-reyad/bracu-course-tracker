# TESTING

## Document contract

- Purpose: Exact test entry points, coverage ownership and limitations.
- Read this when: changing behavior or assessing completion.
- Update this when: commands, fixtures, runner requirements or test responsibilities change.
- Primary sources of truth: [tests](../tests), [browser test](../tests/degree-plan-browser.cjs), [dev server](../scripts/dev-server.js).

## Runner and prerequisites

The main suite uses node:test and node:assert/strict. Most files are CommonJS; VM contexts exercise browser globals and static source assertions guard markup/SQL/security structure. ESM helpers are dynamically imported. support-mfa.test.js strips TypeScript and executes the real handler with external services mocked.

Node v24.16.0 was used successfully for the documentation bootstrap. There is no checked-in package.json or pinned Node engine. Use a runtime providing node:module stripTypeScriptTypes; do not assume an older Node release can run the MFA harness.

From repository root:

```powershell
node --test tests/*.test.js
node --test tests/access.test.js tests/security.test.js
node --test tests/catalog.test.js tests/catalog-import.test.js tests/faculty-data.test.js tests/prerequisites.test.js
node --test tests/support-core.test.js tests/support-mfa.test.js tests/maintenance-support.test.js
node --check js/app-boot.js
node --check scripts/catalog-import.mjs
```

These .test.js files do not require production credentials. The deliberate malformed-storage fixture can emit a parse warning while tests still pass; use the exit code and final test totals, not warning presence alone.

## Inventory

All filenames below are relative to tests/.

| File | Contract protected |
| --- | --- |
| access.test.js | Page access, AAL, personal storage, recovery, conflicts and boot |
| auth.test.js | Google/admin/onboarding auth behavior and markup |
| admin.test.js | Permissions, actor/target actions, UI and backend contracts |
| admin-performance.test.js | Bounded account listing, pagination and search implementation |
| security.test.js | CSP, policy/grant/RPC boundaries, safe errors and related negative paths |
| password-policy.test.js | Shared/function password rules and parity |
| catalog.test.js | Normalization, visibility, merging and admin catalog behavior |
| catalog-import.test.js | Pure importer/deduplication/classification/SQL generation |
| faculty-data.test.js | Faculty reference/migration behavior |
| degree-plan.test.js | Requirements, allocations, alternatives, variants and escaped rendering |
| prerequisites.test.js | Hard/soft eligibility and recognized alternatives |
| profile.test.js | Canonical fields, avatar handling and profile persistence |
| support-core.test.js | Support validation and helpers |
| support-mfa.test.js | Real handler with mocks: AAL, permission and public/student exceptions |
| maintenance-support.test.js | Maintenance routing, support and middleware/source contracts |
| main-integration.test.js | Main page/module wiring, catalog picker, navigation and state integration |
| ui-states.test.js | Safe error models, skeleton lifecycle and page integration |
| interaction-layer.test.js | Interaction affordances and state hooks |
| motion.test.js | Motion layer and reduced-motion contracts |
| report-pdf.test.js | PDF options, library integration and report rendering contracts |
| deployment-hygiene.test.js | Ignore patterns and retired-artifact assertions |
| legal-pages.test.js | Legal surface structure/content |
| footer.test.js | Footer/navigation layout contracts |
| copy-quality.test.js | Approved user-facing wording |
| degree-plan-browser.cjs | Separate Playwright geometry/interaction/viewport test, not in wildcard suite |

## Change → minimum test mapping

Run each row with node --test followed by the listed tests/ filenames.

| If changing | Minimum files | Also consider |
| --- | --- | --- |
| Auth/profile identity | auth.test.js, access.test.js, profile.test.js, security.test.js | Password/MFA and real provider smoke |
| Admin action/RBAC | admin.test.js, admin-performance.test.js, security.test.js | Limited-permission/AAL1 hosted checks |
| Tracker sync/backup | access.test.js, security.test.js, main-integration.test.js | Two-device conflict and existing backup fixtures |
| Catalog/reference/import | catalog.test.js, catalog-import.test.js, faculty-data.test.js, prerequisites.test.js | degree-plan.test.js and admin tests |
| Academic calculation | degree-plan.test.js, prerequisites.test.js, main-integration.test.js | PDF/roadmap checks and zero-credit/retake cases |
| Support/maintenance | support-core.test.js, support-mfa.test.js, maintenance-support.test.js | Auth/admin and real challenge behavior |
| UI/animation | interaction-layer.test.js, motion.test.js, ui-states.test.js | Owning domain test and browser smoke |
| Hosting/config | deployment-hygiene.test.js, security.test.js, maintenance-support.test.js | Production header/route verification |
| Broad/high-risk change | Entire wildcard suite | Browser plus separately authorized staging checks |

## Optional browser check

degree-plan-browser.cjs requires an externally available Playwright installation and browser executable. Defaults are an Edge path on Windows and port 4176; override using environment variables. Two-terminal example after provisioning those prerequisites:

```powershell
node scripts/dev-server.js 4176
```

```powershell
$env:DEGREE_PLAN_URL = 'http://127.0.0.1:4176/index.html?preview=1'
$env:BROWSER_PATH = '<absolute-browser-executable>'
node tests/degree-plan-browser.cjs
```

The test uses require('playwright'); make it resolvable locally (or via NODE_PATH to an existing installation). No reproducible dependency manifest is checked in. External CDN availability can affect this browser run. Do not replace production config or supply real accounts to make it pass.

## Expectations and limitations

Add regression tests near the owning domain; use synthetic deterministic fixtures. Preserve intentionally static assertions for security/structure, but test observable behavior where practical. An intended semantic change needs explained test updates, not weakened assertions.

The Node suite does not apply SQL to PostgreSQL, validate every hosted RLS policy, prove CDN behavior or cover full OAuth/MFA flows. Passing it is not deployment certification. Browser rendering and real provider checks remain separate.

Record failures as introduced, pre-existing, or environmental based on evidence. Do not change unrelated runtime code in a documentation task to make a suite green. Report skipped checks explicitly. See [release-check](../.agents/skills/release-check/SKILL.md).

