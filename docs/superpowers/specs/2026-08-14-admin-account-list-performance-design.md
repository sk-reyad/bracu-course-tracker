# Admin Account List Performance and Drawer Spacing Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

Date: 2026-08-14  
Status: Approved approach; awaiting written-spec review  
Target: BRACU Course Tracker Admin Panel

## Goal

Make Users/Admins tab switching feel immediate without loading every account into the browser, reduce database work as account and login-history volume grows, and improve the visual spacing of the Access and Account Status cards. Existing authorization, mutation safeguards, pagination, account fields, themes, and responsive behavior must remain unchanged.

## Observed problem and evidence

Live signed-in measurements reproduced six tab switches between 1.284 and 2.815 seconds. Every switch currently clears the visible result, shows the full loading state, and invokes `list-accounts` again.

The current request path performs these operations in sequence:

1. authenticate the caller;
2. load authoritative actor access;
3. query profiles, role relations, an exact count, ordering, and pagination;
4. query login metrics for the returned account IDs;
5. merge the two result sets in the Edge Function.

There is no page cache, alternate-tab prefetch, or in-flight request deduplication. The current `AbortController` prevents stale rendering but is not passed to the remote invocation, so rapid switching can leave redundant server requests running.

## Approved architecture

### 1. One paginated database operation

Add migration `202608140010_admin_account_list_performance.sql` with a service-role-only RPC named `admin_list_accounts`.

The RPC will:

- accept validated role, status, search, offset, and limit inputs;
- filter profiles and role relations first;
- compute the exact filtered total with a window count;
- paginate before aggregating login events;
- aggregate Daily, Weekly, Monthly, and Total counts only for the current page;
- return the existing account fields plus `role_name`, metric counts, and `total_count`;
- expose no execution privilege to `anon`, `authenticated`, or `public`.

The Edge Function will keep its existing authoritative authentication, actor-role, and permission checks. Only the two sequential account/metrics data calls will be replaced by the single RPC. The browser response shape will remain compatible with the existing renderer.

### 2. Database indexes

The additive migration will create only missing indexes:

- `user_roles(role_id, user_id)` for role-filtered lists;
- `profiles(status, created_at desc)` for status filtering and ordering;
- `login_events(user_id, signed_in_at desc)` for per-page login aggregation;
- trigram search indexes for `profiles.full_name`, `profiles.email`, and `profiles.student_id` so the existing contains-search remains usable at larger scale.

The existing 25-row page size and maximum 100-row server limit remain unchanged. No endpoint may return the complete user table.

### 3. Frontend page cache and request coordination

Add a bounded in-memory cache scoped to the current Admin Panel page session.

Each key includes role/view, page, page size, normalized search, and status. Each entry stores the result and fetch time.

Rules:

- cache lifetime: 30 seconds;
- a fresh cache hit renders immediately without a loading-state flash;
- a stale entry renders immediately and refreshes in the background;
- a missing entry uses the existing accessible loading state;
- identical in-flight keys share one Promise;
- only the latest selected key may update the visible table;
- manual Refresh bypasses the cache;
- successful identity, role, permission, status, create, or delete mutations invalidate all account-list cache entries before reloading;
- background refresh failure keeps cached rows visible and shows a non-blocking error message;
- an uncached failure continues to use the existing full error state.

After the initial Users page renders, the first Admins page will be prefetched during idle time. If the initial view is Admins, Users will be prefetched instead. Prefetch is limited to the current search/status context and page 1; it never recursively prefetches more pages.

### 4. Loading presentation

Switching to prefetched/cached data must not blank the table. Background refresh will use `aria-busy` and a subtle refresh indication while keeping content readable. The full spinner is reserved for truly uncached data.

### 5. Drawer spacing correction

The Access and Account Status design will retain the current theme tokens and component style, with these scoped adjustments:

- drawer section gap: 18px;
- detail-card padding: 18px;
- Role control to permission-list gap: 14px;
- permission-list gap: 12px;
- permission option minimum height: 64px;
- permission option padding: 12px 14px;
- checkbox/copy gap: 12px;
- permission description line-height: approximately 1.45;
- Account Status action gap: 10px;
- mobile options remain full-width and use slightly compact values without dropping below 44px touch targets.

The Access section will receive a dedicated class so these changes do not unintentionally alter unrelated cards or dialogs.

## Error handling and safety

- Cache never bypasses server authorization.
- Cache contains only the current signed-in Admin page session and is not persisted to localStorage.
- Sign-out/page reload clears it naturally.
- Mutations never use cached profile/access values as server authority.
- Search input remains sanitized server-side and is passed to SQL as a parameter, not interpolated SQL.
- Migration 010 is additive; deployed migrations 001–009 will not be rewritten.
- If migration/function deployment fails, the existing deployed version remains the rollback point.

## Verification

Implementation follows TDD:

1. failing cache tests for fresh hit, stale-while-revalidate, in-flight deduplication, force refresh, invalidation, and latest-key rendering;
2. failing Edge Function test proving one account-list RPC replaces the former sequential data calls;
3. failing migration contract tests for RPC privileges, pagination-before-metrics, and required indexes;
4. failing CSS contract tests for the new scoped spacing;
5. full automated suite and JavaScript syntax checks;
6. dry-run migration 010 as the sole pending migration, then authorized migration/function deployment;
7. signed-in live measurements for cold and cached Users/Admins switching;
8. 1440, 1280, 1024, 768, 390, and 360 pixels in light and dark themes, with no page-level horizontal overflow or console errors.

No real account will be edited, suspended, or deleted during performance verification.
