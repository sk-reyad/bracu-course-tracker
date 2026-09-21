# Authentication and Admin Access Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

**Date:** 2026-08-12  
**Status:** Approval pending  
**Project:** BRACU Course Tracker

## Goal

Add a modern, responsive authentication gateway that matches the existing BRACU Course Tracker visual system, requires official BRAC University Google accounts for students, provides password-only access for pre-created administrators, protects the main tracker behind a session gate, and delivers the first secure Admin Panel slice.

## Approved visual direction

- Use the centered authentication-card direction.
- Do not show a full-width navbar.
- Show only the `CS` logo and `BRACU Course Tracker` at the top-left; do not show a tagline there.
- Show a compact modern navigation group at the top-right with:
  - `Preview`
  - `Admin`
  - theme switch
- `Preview` opens a sanitized, read-only demo of the complete tracker.
- `Admin` changes the centered card to the admin password-login view.
- Remove the existing `Student | Admin` selector from the card.
- Keep `Log in | Sign up` only for the student experience.
- Use the Vanta NET effect on the authentication page with pinned Vanta and Three.js versions, theme-matched colors, touch/mouse interaction, lifecycle cleanup, and a static reduced-motion fallback.

## Student authentication

- Students can authenticate only with Google through Supabase OAuth.
- A student email must end exactly with `@g.bracu.ac.bd`.
- Reject other domains with the exact required copy:
  - `Please use your official BRAC University G-Suite email`
- Enforce this twice:
  - in the client for immediate feedback;
  - in a Supabase Before User Created Hook so direct API calls cannot bypass it.
- Student Login copy removes:
  - `Continue with your official BRACU account.`
  - `Only accounts ending in @g.bracu.ac.bd are accepted.`
- Student Sign-up supporting copy is:
  - `Sign-up with your G-suit account.`
- Student Sign-up removes:
  - `Only accounts ending in @g.bracu.ac.bd are accepted.`
- Google supplies name and email. Those fields remain immutable in both the UI and database.
- The visual `Google · locked` badge is removed.
- A returning student with a completed profile goes directly to the main tracker.
- A first-time student is routed to onboarding.

## Student onboarding

Required fields:

- Student ID
- Program:
  - `BSc in Computer Science & Engineering (CSE)`
  - `BSc in Computer Science (CS)`
- Starting semester term:
  - Spring
  - Summer
  - Fall
- Starting year

Optional field:

- Profile photo

The custom dropdown chevrons, padding, alignment, focus ring, and theme colors must match the existing main-site select controls. The photo control replaces the native file presentation with an icon-led control, filename, preview, Replace, and Remove actions. It validates image type and size before upload.

The onboarding action label is:

- `Let's begin`

Successful onboarding displays a floating toast rather than an inline message:

- Title: `You’re in,`
- Supporting copy: `Let's create your academic roadmap...`

After the toast, the user is routed to the main tracker.

## Administrator authentication

- There is no administrator sign-up UI or public administrator-registration endpoint.
- Administrators authenticate with an email and password that a super administrator created beforehand.
- Admin emails may be outside `@g.bracu.ac.bd`.
- The admin form contains email, password, password visibility, Cloudflare Turnstile, Forgot Password, and Sign In.
- Passwords are stored only by Supabase Auth and are never written to Postgres application tables, localStorage, logs, or client configuration.
- Admin creation and privileged changes run only in a Supabase Edge Function with a server-side secret key.
- The browser contains only the Supabase URL and publishable key.

## First Admin Panel release

The first release contains:

- Users list
- Administrators list
- Search and filters for role and account status
- Profile summary drawer/card
- Role and permission display
- Account status management
- Access management
- Super-admin-only administrator creation and editing
- Sign out
- An audit record for every privileged change

Initial permissions:

- `profiles.read`
- `users.read`
- `users.status.manage`
- `admins.read`
- `admins.manage`
- `permissions.manage`

Roles:

- `student`
- `admin`
- `super_admin`

Account statuses:

- `pending`
- `active`
- `suspended`

Suspension is enforced in application RLS and mirrored to Supabase Auth through the server-only Admin API.

## Main tracker integration

- `index.html` is inaccessible without a valid active session, except for explicit read-only Preview mode.
- Preview mode never exposes the current user's identity or cloud data.
- Preview mode uses a generic profile and sanitized demo academic data.
- All mutation controls, Settings, Dashboard editing, cloud writes, import/reset, and PDF data that could expose a real account are disabled or sanitized in Preview mode.
- Authenticated tracker state is local-first and user-scoped.
- Cloud writes are debounced and stored in the existing `course_tracker_data` row for the authenticated user.
- A cloud row is loaded before the first full render.
- Legacy `bracuCsCourseTracker.v1` data is never deleted automatically.
- Legacy data is offered for migration only when its profile email matches the authenticated email and no scoped/cloud data exists.
- New users receive the course catalog and settings defaults, but not the existing owner's personal profile or semester history.
- The Settings Cloud Sync tab no longer exposes project URL, publishable key, student password sign-up, or manual identity controls. It becomes account/sync status with Sync now and Sign out.
- Main Dashboard name/email are read-only and come from the authenticated profile.

## Data model and security

Database objects:

- `profiles`
- `app_roles`
- `app_permissions`
- `role_permissions`
- `user_roles`
- `user_permissions`
- `admin_audit_log`
- existing `course_tracker_data`
- private Storage bucket `profile-photos`

Security controls:

- RLS on every application table.
- Students can read/update only their own allowed profile fields and tracker row.
- A trigger blocks client changes to Google name/email.
- Student onboarding completes through a narrowly scoped database function that validates the authenticated Google identity and required fields before changing `pending` to `active`; students cannot directly edit their own role or account status.
- Admin reads and writes require both an active account and the exact permission.
- A Custom Access Token Hook includes application role, permissions, and status in the JWT.
- A Before User Created Hook permits:
  - Google users with `@g.bracu.ac.bd`;
  - server-created email/password administrators carrying protected app metadata.
- Storage paths are scoped as `<user-id>/avatar.<extension>` and protected by ownership/path RLS.
- The Edge Function independently verifies the caller and permission before using the Admin API.
- No service/secret key is committed or sent to the browser.

## Responsive and accessibility behavior

- Test widths: 360, 390, 768, 1024, 1280, and 1440 pixels.
- Compact top controls wrap without overlap.
- The centered card remains within the viewport and uses page scrolling when its content grows.
- Forms have associated labels, visible focus, keyboard operation, status announcements, and non-color-only errors.
- Toasts use `role="status"`; blocking errors use `role="alert"`.
- Vanta is decorative and ignored by assistive technology.
- `prefers-reduced-motion: reduce` disables the animated Vanta scene and uses a static themed background.

## External setup required before live authentication works

- Supabase project URL
- Supabase publishable key
- Google OAuth client ID and secret configured in Supabase
- Production and localhost redirect URLs configured in Google and Supabase
- Cloudflare Turnstile site key and secret configured in Supabase Auth
- One initial `super_admin` user created through a trusted server/dashboard workflow

## Out of scope for this release

- A full analytics/operations Admin Panel
- Student password authentication
- Administrator self-registration
- Social providers other than Google
- Editing Google-provided name/email
- Public profile-photo access
