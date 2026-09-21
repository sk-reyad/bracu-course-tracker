# DEPLOYMENT

## Document contract

- Purpose: Safe release and recovery workflow.
- Read this when: preparing releases, migrations, function deployments or incident recovery.
- Update this when: deployment configuration, compatibility order or verification changes.
- Primary sources of truth: [Vercel config](../vercel.json), [middleware](../middleware.ts), [ignore rules](../.vercelignore), [Supabase](../supabase), [deployment tests](../tests/deployment-hygiene.test.js).

## Runtime and configuration

Static HTML/CSS/JS on Vercel; middleware.ts checks maintenance state; Auth/data/Storage/functions are hosted by Supabase. There is no checked-in automated GitHub Actions release pipeline or root dependency/build manifest. Do not promise automatic migrations or function deployments on Git push.

Public browser configuration, Supabase provider/hooks and function secrets are separate configuration surfaces. See [Setup](SETUP.md) and [Security](SECURITY.md#configuration-classification). Vercel needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in each intended Production/Preview environment. A Vercel Preview does not automatically provision an isolated Supabase database.

## Vercel behavior

- Filesystem routes precede a 404 fallback to error.html?code=404&source=tracker.
- Security headers apply through vercel.json; inspect CSP allowances when adding dependencies.
- Maintenance checks only GET/HEAD matching paths; assets/css/js/supabase and specified infrastructure paths are excluded by matcher.
- Admin, admin-mode auth, maintenance, privacy and terms are exempt.
- Missing configuration, failed fetch, invalid settings or timeout redirects to maintenance.
- The local static server does not execute middleware or reproduce hosted headers.
- .vercelignore excludes docs, tests, backend sources, local tool state and Markdown; exclusions are packaging controls, not authorization. Inspect actual deployment output for new paths.

## Release procedure

1. Inspect status/diff and untracked files; preserve unrelated work. Apply [release-check](../.agents/skills/release-check/SKILL.md).
2. Classify schema/RPC/Edge/client compatibility. Inspect the entire ordered migration chain and target history; verify backups and recovery owner before production mutation.
3. Run targeted tests then full Node suite; inspect frontend/script syntax. No local pass substitutes for hosted checks.
4. For compatible additive changes, apply reviewed migrations first, then dependent Edge Functions, then frontend. For breaking changes, design an explicit staged expansion/migration/contraction sequence; do not assume this order is universally safe.
5. Deploy function folders with deno.json and shared modules. Verify each handler's gateway/auth mode; support public branches are intentional.
6. Deploy frontend/config for the correct environment. Changing settings requires redeployment where the platform captures them at build/deploy time.
7. Run post-deploy verification below. Record which checks ran and which were skipped.
8. Do not commit, push, deploy, apply SQL or toggle maintenance merely because a local readiness check passed; each external write must be in the requested scope.

## Post-deploy checks

| Surface | Check |
| --- | --- |
| Routes/headers | Known pages and 404; actual security response headers; CSP console errors |
| Preview | Sanitized sample data, editing disabled, no personal tracker loading |
| Student Auth | Official domain allowed; nonofficial signup rejected; onboarding validation |
| Tracker | Own reload and save; backups; pending/conflict behavior using test data |
| Catalog/Degree Plan | Shared references, own collection preservation, alternatives/elective allocation |
| Profile/photo | Own upload/download/update; cross-user denial with controlled fixtures |
| Admin | AAL1 denied, AAL2 permitted action, missing permission/role denied; do not use the sole Super Admin for destructive tests |
| Support | Guest Turnstile; authenticated canonical identity; own history; admin permission/MFA |
| Maintenance | Enabled redirect, admin/legal recovery paths, disabled re-entry |
| Mobile/theme | Responsive actions, dark/light, keyboard focus and reduced motion |

Use nonproduction synthetic fixtures for destructive/negative write tests. Production acceptance should be read-only unless an explicit controlled test is authorized.

## Failed and partial deployments

- Stop dependent rollout after migration failure. Inspect transaction state and migration history; not every historical file is wrapped identically.
- Preserve pending local tracker data and backups. Do not "repair sync" with blanket deletion or RLS disabling.
- Frontend/Edge rollback is only safe if old code still matches the current schema and security expectations.
- SQL has no universal down-migration mechanism. Prefer reviewed forward repair; data restoration needs an actual verified backup and scoped authorization.
- 026/027 are privilege hardening: do not restore broad grants as an automatic rollback.
- Auth API changes and audit writes are not always one transaction; examine side effects before retrying a mutation.
- Maintenance is not a database/API write lock. Keep server authorization and recovery access intact.
- Never run project deletion, database reset or manual account-reset scripts as a routine release step.

See [Known issues](KNOWN_ISSUES.md) for deployment reproducibility gaps. Hosted deployment and recovery have not been executed by this documentation task.
