# Admin Authentication and Login Metrics Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Scope

Fix the Admin Panel authentication regression shared by refresh and Create Admin, align the filter controls, match the main website's select chevron, and add registration/login metrics to both Users and Admins views.

## Confirmed root cause

`createAdminController().invokeAction()` calls the `admin-access` Edge Function without an explicit `Authorization` header. The Edge Function correctly rejects requests without a bearer token, which is why refresh and Create Admin can return `Authentication required.`. Every privileged request must resolve the current Supabase session and attach its access token.

## Authentication request design

- Before every Admin Edge Function request, call `client.auth.getSession()`.
- Require `session.access_token`; otherwise throw `Your admin session has expired. Please sign in again.`
- Send `Authorization: Bearer <access_token>` in `client.functions.invoke()`.
- Keep the existing request timeout and server error normalization.
- Use the same controller path for list, refresh, Create Admin, drawer, role, permission, and status actions so the fix covers every privileged action.

## Login tracking design

- Add `public.login_events` with one row per Supabase Auth session.
- Uniqueness is `(user_id, session_id)`, so page reloads, multiple page visits, and token refreshes do not inflate counts.
- Add `public.record_login_event()` as an authenticated, security-definer RPC. It reads `auth.uid()` and the JWT `session_id`; the browser never supplies another user's ID.
- Call the RPC from the shared session-context path. A local in-memory guard avoids repeated calls within one page, while the database unique constraint protects across pages and tabs.
- Login analytics must not block application access if the metrics RPC is temporarily unavailable.
- Aggregate Daily, Weekly, and Monthly counts using `Asia/Dhaka`; Total counts all tracked sessions.
- Existing historical logins cannot be reconstructed. Counts begin after this migration is deployed.

## Admin data design

- Keep `profiles.created_at` as First registered.
- The Edge Function loads login aggregates only for the accounts on the current page and merges these fields into each account:
  - `daily_login_count`
  - `weekly_login_count`
  - `monthly_login_count`
  - `total_login_count`
- Both Users and Admins tabs use the same response and markup.
- Desktop table columns: Account, Role, Status, Program, First registered, Daily, Weekly, Monthly, Total, Onboarding, Actions.
- Mobile cards show the four counts as compact labelled metrics and retain First registered.

## Filter and select design

- Add a visible `Search` label above the search input.
- Search, Status, and Role inputs share the same label gap and 44px control height.
- The refresh button uses `align-self: end`, making its lower edge match the controls' lower edge; it is not visually pushed below them.
- Admin selects copy the main page's current native-select replacement exactly: 12x8 SVG chevron, `padding-right: 30px`, `background-position: right 9px center`, and native appearance disabled.
- Apply the select style to filters, Create Admin, and the profile drawer in both themes.

## Error handling

- Missing local session produces a clear expired-session message instead of the Edge Function's generic authentication error.
- Server permission and database errors remain visible through the existing normalized error path.
- Login tracking failures do not sign out or block a valid account.

## Verification

- Unit/static tests prove the bearer header, missing-session error, metrics schema, session deduplication, Edge Function merge, five requested data fields, filter label, and select styling.
- Run the complete Node test suite and JavaScript syntax checks.
- Browser-check Admin Panel in light and dark themes at desktop, tablet, and mobile widths, including refresh and Create Admin with a signed-in session.
