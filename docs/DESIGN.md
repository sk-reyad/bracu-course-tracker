# DESIGN

## Document contract

- Purpose: Existing visual and interaction contracts, not a new brand system.
- Read this when: changing UI, themes, responsive layout, motion or accessibility.
- Update this when: reusable tokens, components, states or breakpoints change.
- Primary sources of truth: [styles](../css), [HTML](../index.html), [motion](../js/motion.js), [UI states](../js/ui-states.js), [Degree Plan view](../js/degree-plan-view.js).

## Visual language and ownership

Blue-led surfaces, rounded cards, restrained borders/shadows, status colors, dot-grid backgrounds and light/dark variants are visible throughout. The implementation has page-specific token families, not a single universal component framework. See [Architecture](ARCHITECTURE.md) for stylesheet entry-point ownership.

| Role | Tracker tokens (css/style.css) | Light → dark |
| --- | --- | --- |
| Page | --bg | #eef4fb → #071222 |
| Surface | --surface / --surface-soft | #fbfdff / #eaf3ff → #0e1d30 / #122842 |
| Text | --text / --muted | #0d1b2a / #5d6b7f → #f1f6ff / #a8b6c9 |
| Border | --border | #d6e0ef → #243a56 |
| Action | --primary / --on-primary | #1457b7 / white → #6ea8ff / #071222 |
| Semantic states | --green, --blue, --yellow, --red, --ash and matching -soft tokens | Separate dark overrides; preserve text plus color |
| Shape | --radius-lg / --radius-md | 22px / 16px |
| Elevation | --shadow / --soft-shadow | Page-specific RGBA shadows; dark overrides |
| Header / easing | --header-height / --ease-out | 74px / cubic-bezier(0.23,1,0.32,1) |

Auth uses --auth-ink, --auth-muted, --auth-blue, --auth-line, --auth-card, --auth-danger and --auth-success. Admin uses --ink, --blue, --blue2, --line, --surface2, --danger, --success and --warning. Do not substitute similarly named tokens between pages without checking their owning stylesheet.

Degree Plan scopes --dp-* aliases to #degreePlanEditor and maps them to tracker tokens. Avoid global selectors for its cards, tables or navigation.

## Typography, layout and controls

Inter/system-ui is the body stack; tracker headings use --font-heading with Space Grotesk. Preserve fallbacks when remote fonts fail. Layout uses flex/grid, rem-based gaps, fixed/pill radii and responsive clamp values; there is no enforced universal spacing scale.

- Tracker: header/navigation, dashboard cards, semester cards, course tables and horizontally complex roadmap areas.
- Auth: responsive identity/onboarding forms, avatar controls, theme toggle and optional animated background.
- Admin: search/filter toolbar, horizontally scrollable account table, pagination, role/status pills, permission groups and account dialogs.
- Support: widget/panel states and admin ticket cards; maintenance switch has visible focus styling.
- Degree Plan: settings tab, requirement sections/meters, status pills, expandable groups, tables becoming labeled cards at narrow widths.
- Reports: separate print/PDF layout; report-pdf.js exports A4 portrait, scale 2, with semester/planned page-break avoidance.
- Legal and maintenance: dedicated stylesheet families; do not load main tracker CSS merely to borrow one component.

Primary/secondary/destructive actions already have local patterns. Reuse the owning page's button classes and disabled/loading behavior. Do not represent a destructive action as a neutral primary action. Forms need labels, validation messages, busy states and recovery from request failures.

## Responsive map

These are actual width thresholds; multiple rules at a threshold may refine different components. Read the whole cascade before moving one.

| Stylesheet | max-width thresholds in px |
| --- | --- |
| style.css | 1180, 900, 780, 700, 640, 460, 430, 380 |
| auth.css | 640, 420, 380 |
| admin.css | 900, 640 |
| degree-plan.css | 980, 760, 620, 380 |
| support.css | 560 (also low-height landscape rules) |
| admin-support.css | 720, 480 |
| ui-states.css | 640 |
| legal.css | 820, 560 |
| maintenance-preview.css | 900, 720, 430 plus height conditions |
| maintenance.css | 720, 640, 480 plus height/landscape conditions |

Auth/admin use min-width 320px. Degree Plan coarse-pointer rules increase interaction targets to 44px; do not claim that all controls everywhere meet this target. The later repeated Degree Plan rules intentionally override earlier definitions—inspect cascade order, not just the first media query.

## State and accessibility contract

- Preserve page-specific skeletons, aria-live/status messages, meaningful empty states and safe error actions.
- ui-states.js owns normalized errors and allow-listed retry destinations; do not render arbitrary URL error text.
- Keep keyboard focus visibility, semantic buttons, labels, dialog roles and aria-expanded state synchronized with interaction.
- Preserve theme parity with [data-theme="dark"]; theme storage is shared across surfaces.
- Do not claim WCAG compliance solely from ARIA attributes. Check keyboard operation, focus restoration, zoom, contrast and screen-reader messaging for the changed component.
- Preserve table labels when narrow layouts become cards; avoid overflow that hides essential actions.
- Empty/loading/error are different states; a request failure must not look like an empty successful result.

## Motion

motion.js and page CSS own enhancement effects. Hover-specific effects are gated for fine pointers. prefers-reduced-motion rules suppress/reduce transitions and animation; Degree Plan retains a short opacity transition but removes transforms/rotating-icon motion. Do not promise "all motion disabled" without checking each surface. Make content usable without animation or Vanta initialization.

## Before introducing a new visual pattern

1. Search for an existing button/form/dialog/status/skeleton solving the same need.
2. Choose the owning stylesheet and reuse its tokens rather than duplicating colors.
3. Check desktop, narrow viewport, dark/light, keyboard and reduced-motion states.
4. Add/update the relevant [tests](TESTING.md); browser geometry needs browser verification, not only a CSS regex assertion.
5. Update this file only if the reusable contract changed.

