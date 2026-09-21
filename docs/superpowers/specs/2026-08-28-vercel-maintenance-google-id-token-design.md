# Vercel Maintenance Recovery and Google ID-Token Sign-In Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Keep the public site available when Vercel is configured correctly, stop the maintenance page from bouncing between routes when it is not, and make student Google sign-in originate from `https://bracu-course-tracker.vercel.app` without exposing the Supabase project URL in the account chooser.

## Approved architecture

Vercel middleware remains the production authority for maintenance mode. It continues to fail closed when `SUPABASE_URL` or `SUPABASE_PUBLISHABLE_KEY` is missing, but the maintenance document no longer redirects itself back to the public site. Its **Check again** action explicitly navigates to `index.html`, allowing middleware to make one fresh decision without creating an automatic redirect cycle.

Student authentication uses Google Identity Services in popup mode. Google returns an ID token to the browser callback, and the existing Supabase client exchanges it with `signInWithIdToken({ provider: "google", token })`. The existing database signup hook, exact `@g.bracu.ac.bd` check, account status checks, onboarding, and post-auth routing remain authoritative.

## Configuration boundaries

- `SUPABASE_URL` remains `https://eeorkgnbhxenaszdxtti.supabase.co`; it must never be replaced with the Vercel frontend URL.
- `SUPABASE_PUBLISHABLE_KEY` and the Google Web Client ID are public browser-safe identifiers.
- The Google Client Secret remains only in Supabase Authentication provider settings and must never enter GitHub, `js/config.js`, or Vercel frontend variables.
- Google Cloud must authorize `https://bracu-course-tracker.vercel.app` as a JavaScript origin.
- Supabase Authentication URL Configuration must use the Vercel deployment as Site URL and allow `https://bracu-course-tracker.vercel.app/**` for recovery callbacks.

## User experience

- The student entry surface keeps a single **Continue with Google** action rendered by Google.
- A missing Google Client ID produces a safe configuration message without exposing internal details.
- Authentication failures remain on the student entry view and remain retryable.
- Existing sessions still resume through the current session verification flow.
- The maintenance page remains stable until the user presses **Check again**.

## Verification

- Unit tests verify the exact ID-token exchange payload, empty-token rejection, and Google button callback wiring.
- A runtime-style test verifies that **Check again** navigates to `index.html`.
- Routing tests verify that maintenance-off never causes an automatic exit from `maintenance.html`.
- The full Node test suite and JavaScript syntax checks must pass before handoff.
