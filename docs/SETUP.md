# SETUP

## Document contract

- Purpose: Local preview and fresh-project bootstrap without production-specific credentials.
- Read this when: onboarding a developer or rebuilding an environment.
- Update this when: prerequisites, configuration, migrations, Auth hooks or bootstrap change.
- Primary sources of truth: [dev server](../scripts/dev-server.js), [config](../js/config.js), [Supabase config](../supabase/config.toml), [migrations](../supabase/migrations), [Auth](../js/auth.js), [functions](../supabase/functions).

## 1. Local preview

Use Git and Node.js. Node v24.16.0 ran the suite during this documentation bootstrap; no package.json/engine pin exists. See [Testing](TESTING.md) for runner APIs and optional browser dependencies.

```powershell
git clone https://github.com/sk-reyad/bracu-course-tracker.git
cd bracu-course-tracker
node scripts/dev-server.js 4173
```

If already in a checkout, do not clone over it. Open:
- http://localhost:4173/index.html?preview=1 — read-only sample tracker.
- http://localhost:4173/auth.html — student sign-in.
- http://localhost:4173/auth.html?mode=admin — administrator entry.
- http://localhost:4173/index.html — authenticated tracker.
- http://localhost:4173/admin.html — Admin Panel.
- http://localhost:4173/maintenance.html — maintenance surface.

The server binds loopback and maps / to auth.html. It is a development static server, not a production server or Vercel middleware emulator. Use HTTP, not file://. Do not expose the development server to untrusted networks: it serves files from the repository root.

Preview bypasses personal authentication/tracker loading; external libraries/fonts and a public maintenance read can still use networking.

## 2. Isolate authenticated development

The checked-in js/config.js has deployment-specific public values. Before authenticated development, select an authorized nonproduction Supabase project and set your own browser configuration. Do not reuse the maintainer's hosted project for write tests.

Browser field names:
- supabaseUrl and supabasePublishableKey.
- googleClientId (public Web client ID).
- turnstileSiteKey (public widget key).
- authPageUrl, appPageUrl, adminPageUrl, errorPageUrl.

Do not paste provider secrets into that file. Do not change runtime configuration as part of a documentation-only task.

## 3. Database and Storage

List the entire [migration directory](../supabase/migrations) and inspect filename order. The current chain contains 27 migrations ending in 202609190027_restrict_postgres_default_truncate.sql. The [Data model](DATA_MODEL.md) summarizes the accumulated contracts; never apply just the old first-eight-file checklist.

For an operator-approved target, Supabase CLI commands are:

```powershell
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push --dry-run
npx supabase db push
```

These are remote operations, not steps executed by this documentation task. Confirm target identity and migration history before the final push; protect credentials and backups. Existing databases may have manual migrations requiring reconciliation—do not blindly rerun SQL.

With Dashboard SQL Editor instead, run each unapplied migration separately in order, understanding its transaction boundary and recording application history. Manual SQL execution and CLI migration history are not automatically interchangeable.

The migrations create the private profile-photos bucket with size/type limits and owner policies. Verify the bucket and current effective RLS/grants rather than manually creating a public bucket.

## 4. First Super Admin, before enabling signup restriction

For a **new isolated installation**, migrations must be applied and the restrictive Before User Created hook not yet enabled:
1. Create one confirmed email/password Auth user in the Dashboard, using an account controlled by the operator and the password policy.
2. Record its exact UUID privately. Confirm its generated profiles and user_roles rows exist.
3. In a privileged Dashboard transaction, update only that UUID's profile to status=active and onboarding_completed=true; set its user_roles.role_id to the existing app_roles row named super_admin. Verify exactly that account, then commit. This is initial bootstrap, not public registration.
4. Confirm effective permissions and sign in through mode=admin; enroll/verify TOTP.
5. Create later administrators through the authorized Admin Panel.

Never run this against an arbitrary UUID or repurpose a real student's account. If the restriction hook is already enabled and blocks creation, stop and inspect the installation's existing administrator path rather than disabling production protections. Do not use manual onboarding-reset scripts for setup.

## 5. Auth hooks and Google

In Supabase Authentication configure:
- Before User Created → public.hook_restrict_signup.
- Custom Access Token → public.custom_access_token_hook.
- Google provider enabled with the matching Web client ID and provider secret kept in Supabase.
- TOTP enrollment/verification enabled.
- Password requirements and email settings consistent with supabase/config.toml.

In Google provider configuration, register the exact local and production JavaScript origins. The app uses GIS popup/ID-token sign-in, not a browser redirect through Supabase for the main student action. Keep the Supabase provider callback appropriate for your project configured where required.

Set Supabase Site URL and allowed redirects for your intended origin (local development uses http://localhost:4173 and http://localhost:4173/**). Register the production origin separately. Provider dashboard settings are not inferred from the committed TOML and need verification.

Refresh sessions after changing roles/claims. Google domain filtering in the UI is not sufficient: verify the database signup hook rejects nonofficial student signup.

## 6. Turnstile and server settings

Create a widget for the intended hostname. Public site key belongs in js/config.js; its secret belongs in Supabase Auth CAPTCHA settings and, for guest support verification, the support function's server environment.

See [Security configuration classification](SECURITY.md#configuration-classification). Required/configurable Edge names:
- SUPABASE_URL.
- SUPABASE_PUBLISHABLE_KEYS (admin expects default entry) or SUPABASE_ANON_KEY fallback.
- SUPABASE_SECRET_KEYS (admin expects default entry) or SUPABASE_SERVICE_ROLE_KEY fallback.
- ALLOWED_ORIGINS: exact comma-separated allowed origins.
- TURNSTILE_SECRET_KEY: guest support.
- SUPPORT_RATE_LIMIT_SALT: dedicated private rate-key salt recommended instead of fallback.
- WEB3FORMS_ACCESS_KEY: owner email notifications; absent configuration does not prevent durable ticket creation.

Keep values in provider secret settings, not commands in committed docs or frontend JavaScript. Do not assume a development always-pass widget is suitable for production.

## 7. Edge Functions and hosting

Deploy both function folders with their deno.json import maps and shared dependencies:

```powershell
npx supabase functions deploy admin-access --project-ref <your-project-ref>
npx supabase functions deploy support-desk --project-ref <your-project-ref>
```

support-desk's verify_jwt=false is intentional for public actions; protected handler paths must remain verified. admin-access has no local override; check gateway configuration with the installed CLI/platform. Do not bypass verification globally to resolve an error.

For Vercel set SUPABASE_URL and singular SUPABASE_PUBLISHABLE_KEY for each intended deployment environment. This public key is not a service-role credential. Redeploy after configuration changes. Follow [Deployment](DEPLOYMENT.md) for release order and rollback limits.

## 8. Verify before real use

- Run the [Node suite](TESTING.md).
- Check preview renders without personal tracker access and cannot mutate state.
- Verify official Google login, nonofficial rejection, onboarding and reload.
- Check own profile/photo and tracker restore in the correct test project.
- Verify AAL1 admin rejection, AAL2 permitted action and missing-permission rejection.
- Check support guest challenge, own history and limited admin denial.
- Test maintenance on/off with recovery access preserved.
- Use two controlled synthetic accounts for cross-user checks; never probe or overwrite another real student's data.

Common mismatches: wrong Google origin/client ID; missing hooks or migrations; support import map omitted; missing ALLOWED_ORIGINS; singular/plural key variable confusion; middleware URL pointing to the website instead of Supabase; stale tokens after role changes. No fresh hosted installation was provisioned during this documentation task.
