# Dynamic Error and Skeleton States Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Add one branded, dynamic full-page error experience and page-specific skeleton loading states for Auth, Tracker, and Admin without duplicating pages or exposing raw backend errors.

## Architecture

- `error.html` is the only full-page error template. A shared allow-listed catalog converts a status code into safe title, copy, icon, and actions.
- Known statuses receive tailored copy. Unknown `4xx` and `5xx` values fall back to generic client/server models; invalid values fall back to `500`.
- Recoverable validation, upload, and row-level request errors remain inline or in toasts. Full-page navigation is reserved for route, access, session, or fatal boot failures.
- `404` routing serves the same `error.html` template with a real `404` response. Application errors navigate to `error.html?code=<status>&from=<surface>`.
- Auth, Tracker, and Admin each render a layout-matched skeleton. All use one shared visual foundation and lifecycle API.

## Full-page States

Tailored models: `400`, `401`, `403`, `404`, `408`, `409`, `410`, `413`, `415`, `422`, `429`, `500`, `502`, `503`, and `504`.

- `401`: login action.
- `403`: back/home actions.
- `404` and `410`: home/back actions.
- `408`, `429`, `500`, `502`, `503`, `504`: retry when a safe return target exists, plus home.
- `400`, `409`, `413`, `415`, `422`: normally inline; the catalog still supports a full-page fallback.
- Other `4xx` and `5xx`: safe generic copy, never raw query-string or server text.

## Error Safety

- Only status code and an allow-listed surface key may affect rendering.
- Do not render arbitrary `message`, markup, or return URLs from query parameters.
- A return action may use same-origin history/referrer only; otherwise it falls back to the appropriate local page.
- Authentication and authorization keep their semantic distinction: unauthenticated routes go to login/`401`; authenticated users without permission receive `403`.

## Skeleton System

- Auth: top identity/nav placeholders and a centered authentication-card skeleton.
- Tracker: header/navigation, summary controls, semester/card rows, and report-area placeholders.
- Admin: header, filters, tabs, and table-row placeholders; drawer/profile loading reuses the compact skeleton pattern.
- Skeletons preserve the live Dot Grid/Vanta background behind translucent surfaces.
- Light and dark tokens match the existing themes. Animation is a subtle shimmer; `prefers-reduced-motion: reduce` uses a static treatment.
- Skeletons are `aria-hidden`; the page container exposes `aria-busy`. Screen readers receive a short live loading label.
- The skeleton disappears only after the first meaningful render, not merely after `DOMContentLoaded`.

## Failure and Timeout Behavior

- Fatal boot failures leave no permanent skeleton. They resolve to an inline recoverable state or the dynamic error page.
- A guarded timeout changes prolonged loading into a retryable `504` state.
- Existing data-level retry states remain available after the initial page shell has loaded.

## Responsive and Visual Rules

- Validate at `360`, `768`, `1024`, and `1280` pixels in both themes.
- No horizontal overflow, layout shift, or trapped page scrolling.
- Error actions wrap or stack on narrow screens and retain visible keyboard focus.
- Dot Grid remains non-blocking (`pointer-events: none`) and reduced-motion safe.

## Deployment Boundary

The application can provide a real custom `404` through static routing. Application-level `5xx` failures use the dynamic page. Vercel platform-level custom `5xx` pages may depend on hosting plan support and are not treated as guaranteed by this implementation.
