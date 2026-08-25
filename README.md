# BRACU Course Tracker

A responsive academic roadmap, semester, prerequisite, CGPA, report, and cloud-synced progress tracker for BRAC University students.

## What is included

- Google-only student sign-in/sign-up restricted to `@g.bracu.ac.bd`
- First-time onboarding with immutable Google name/email, student ID, program, starting semester, and optional private profile photo
- Separate password-based admin login with Turnstile protection; no public admin sign-up
- Role- and permission-aware Admin Panel for users/admins, account status, profile summaries, roles, permissions, and admin creation
- Per-user local storage plus RLS-protected Supabase cloud sync
- Anonymous, sanitized, read-only Preview mode through `index.html?preview=1`
- Light/dark themes, responsive layouts, reduced-motion support, roadmap, course management, reports, and backups

## Local preview

Serve the project over HTTP; do not open the HTML files through `file://`.

```powershell
node scripts/dev-server.js 4173
```

Then open:

- Auth: `http://localhost:4173/auth.html`
- Preview: `http://localhost:4173/index.html?preview=1`
- Main tracker: `http://localhost:4173/index.html`
- Admin: `http://localhost:4173/admin.html`

The main tracker and Admin Panel require the Supabase schema and authentication setup. Preview mode does not contact Supabase.

## Tests

```powershell
node --test tests/*.test.js
```

## Supabase and deployment

Follow [docs/SETUP.md](docs/SETUP.md) in order. It covers migrations, Google OAuth, Auth Hooks, Turnstile, the initial super-admin, Edge Function deployment, redirect URLs, and production verification.

## Security notes

- `js/config.js` contains only browser-safe public configuration.
- Never place a Supabase secret key, legacy service-role key, Google client secret, database password, or Turnstile secret in browser JavaScript or Git.
- All tracker rows and profile-photo objects are protected by owner-scoped RLS policies.
- Admin mutations run only through the authenticated and permission-checked `admin-access` Edge Function.
