# Admin Authentication and Login Metrics Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix authenticated Admin Panel actions and add accurate per-session daily, weekly, monthly, total login metrics plus first-registration data to Users and Admins views.

**Architecture:** The browser explicitly attaches the current Supabase bearer token to every Admin Edge Function invocation. A protected PostgreSQL RPC records one event for the JWT session, an aggregate view calculates Asia/Dhaka periods, and the Edge Function merges metrics only for the current page of accounts.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, Supabase JavaScript SDK, PostgreSQL migrations/RLS, Supabase Edge Functions (Deno/TypeScript).

## Global Constraints

- Page refresh and token refresh must not increment login counts.
- Daily, weekly, and monthly boundaries use `Asia/Dhaka`.
- Historical login counts start at migration deployment; do not fabricate prior events.
- Edge Function service credentials remain server-only.
- Users and Admins views expose the same metric fields.
- Admin select chevrons must match `css/style.css` native select styling exactly.
- No existing role, permission, account-status, onboarding, pagination, search, or responsive behavior may be removed.

---

### Task 1: Authenticated Admin Edge Function requests

**Files:**
- Modify: `tests/admin.test.js`
- Modify: `js/admin.js`

**Interfaces:**
- Consumes: `client.auth.getSession(): Promise<{data:{session},error}>`
- Produces: `createAdminController().invokeAction(action, payload)` with an explicit `Authorization` header.

- [ ] **Step 1: Write a failing controller test**

Add a client stub whose `auth.getSession()` returns `{ access_token: 'admin-token' }`; assert the invoke options equal:

```js
{
  body: { action: 'list-accounts', payload: { page: 1 } },
  headers: { Authorization: 'Bearer admin-token' }
}
```

Add a second assertion that a null session rejects with `/session has expired/i` and does not call the Edge Function.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/admin.test.js`

Expected: the header/session tests fail because the controller does not call `auth.getSession()`.

- [ ] **Step 3: Implement minimal token resolution**

In `createAdminController`, resolve the current session immediately before each request, reject missing tokens, and pass:

```js
headers: { Authorization: `Bearer ${session.access_token}` }
```

Keep timeout cleanup and `normalizeAdminError()` unchanged.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/admin.test.js`

Expected: authenticated, expired-session, timeout, and normalized-error tests pass.

### Task 2: Per-session login event schema and recorder

**Files:**
- Create: `supabase/migrations/202608130007_login_session_metrics.sql`
- Modify: `tests/auth.test.js`
- Modify: `js/supabase-client.js`

**Interfaces:**
- Produces: `public.record_login_event()` RPC with no browser arguments.
- Produces: `public.admin_account_login_metrics(user_id, daily_login_count, weekly_login_count, monthly_login_count, total_login_count)`.
- Consumes: Supabase JWT claims `sub`/`auth.uid()` and `session_id`.

- [ ] **Step 1: Write failing schema and client tests**

Assert the migration contains:

```sql
unique (user_id, session_id)
auth.uid()
auth.jwt() ->> 'session_id'
at time zone 'Asia/Dhaka'
```

Assert anonymous/public privileges are revoked and only `authenticated` can execute the recorder while `service_role` can read the metrics view. Add a client test proving repeated `getSessionContext()` calls for one access token call `rpc('record_login_event')` once.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/auth.test.js`

Expected: migration and recorder tests fail because neither exists.

- [ ] **Step 3: Create the migration**

Create `login_events` with `user_id uuid references public.profiles(id) on delete cascade`, `session_id uuid`, `signed_in_at timestamptz default now()`, and the composite unique constraint. Enable RLS, expose no table policy to browsers, create the security-definer recorder with fixed `search_path`, and create a security-invoker aggregate view using filtered counts in `Asia/Dhaka`.

- [ ] **Step 4: Add best-effort centralized recording**

In `js/supabase-client.js`, keep an in-memory key for the last access token. After a session is found, call `current.rpc('record_login_event')` once per token and catch the error so analytics cannot block access.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/auth.test.js`

Expected: schema, privilege, deduplication, and all existing authentication tests pass.

### Task 3: Merge metrics into Admin account responses

**Files:**
- Modify: `tests/admin.test.js`
- Modify: `supabase/functions/admin-access/index.ts`
- Modify: `supabase/migrations/202608130007_login_session_metrics.sql`

**Interfaces:**
- Consumes: `admin_account_login_metrics` rows for current page account IDs.
- Produces: every `list-accounts` account with four numeric `*_login_count` properties.

- [ ] **Step 1: Write failing Edge Function contract tests**

Assert `listAccounts()` queries `admin_account_login_metrics`, limits with `.in('user_id', accountIds)`, and returns zero for accounts without rows. Assert the migration grants only `service_role` the required view/table read access.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/admin.test.js`

Expected: metrics-query assertions fail.

- [ ] **Step 3: Implement current-page merge**

After the profiles query succeeds, collect account IDs, query the metrics view for only those IDs, map by `user_id`, and merge numeric defaults:

```ts
{
  daily_login_count: 0,
  weekly_login_count: 0,
  monthly_login_count: 0,
  total_login_count: 0
}
```

Throw the database error rather than silently returning inaccurate metrics.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/admin.test.js`

Expected: Edge Function security, account query, and metrics tests pass.

### Task 4: Admin table/card metrics and aligned filters

**Files:**
- Modify: `tests/admin.test.js`
- Modify: `admin.html`
- Modify: `js/admin.js`
- Modify: `css/admin.css`

**Interfaces:**
- Consumes: the four numeric metrics returned by `list-accounts`.
- Produces: responsive desktop columns and mobile metric labels.

- [ ] **Step 1: Write failing markup/style tests**

Require `Search`, `First registered`, `Daily`, `Weekly`, `Monthly`, and `Total` headers. Assert `accountMarkup()` renders all four values in desktop and mobile modes. Assert Admin CSS contains the same 12x8 chevron data URI, `padding-right:30px`, and `background-position:right 9px center` as `css/style.css`; assert refresh uses `align-self:end`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/admin.test.js`

Expected: new labels, metrics, and CSS contract assertions fail.

- [ ] **Step 3: Update semantic HTML and rendering**

Add `<span>Search</span>` inside the search label. Rename Registered to First registered and add four login headers. Extend desktop rows and mobile cards with labelled metrics; use zero as a valid value rather than replacing it with a dash.

- [ ] **Step 4: Match the main select and filter layout**

Remove `.admin-search{display:block!important}`. Give all filter labels the same grid behavior, set the refresh button to `align-self:end`, and copy the main page's native select replacement to Admin filters, dialog selects, and drawer selects. Increase the table minimum width and preserve horizontal scrolling.

- [ ] **Step 5: Verify GREEN**

Run: `node --test tests/admin.test.js`

Expected: markup, responsive, authentication, and styling tests pass.

### Task 5: Full verification and deployment readiness

**Files:**
- Modify: `docs/SETUP.md`

**Interfaces:**
- Consumes: migration `202608130007` and the updated `admin-access` function.
- Produces: exact Supabase apply/deploy order and verified local artifacts.

- [ ] **Step 1: Run the complete suite**

Run: `node --test tests`

Expected: every test passes with zero failures.

- [ ] **Step 2: Run syntax checks**

Run:

```powershell
node --check js/admin.js
node --check js/supabase-client.js
node --check js/auth.js
```

Expected: all commands exit 0.

- [ ] **Step 3: Update setup instructions**

Document this order: apply migration `202608130007_login_session_metrics.sql`, deploy `admin-access`, sign out/in once to create the first tracked session, then verify Users and Admins counts. Explicitly state that tracking begins at deployment.

- [ ] **Step 4: Browser verification**

Open `http://localhost:4173/admin.html` with the existing authenticated session. Verify initial load, refresh, Create Admin request authorization, Search/Status/Role alignment, matching select arrows, metrics in Users/Admins, and layouts at 1280px, 768px, and 360px in light and dark themes.

- [ ] **Step 5: Record environment limitation**

This workspace is not a Git repository, so no commit step is possible. Report migration/deployment status separately from local code verification.
