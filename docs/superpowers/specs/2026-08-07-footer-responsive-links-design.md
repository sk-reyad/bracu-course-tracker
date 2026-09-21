# Responsive Footer Links Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Reduce unused footer space by arranging the Navigate and Contact Me links horizontally while keeping the footer readable, balanced, and overflow-free on desktop, laptop, tablet, mobile, and narrow mobile screens.

## Approved content

- Keep the existing brand title, tagline, version, destinations, icons, copyright, and disclaimer.
- Change the heading from `Contact Me:` to `Contact Me`.
- Remove the decorative `</> const async API git` watermark.
- Remove underlines from the `SK Reyad Ali` and `BRAC University` links, including hover state.

## Responsive layout

### Large desktop

- Use a two-area grid: the brand block on the left and two compact link rows on the right.
- The brand block spans the Navigate and Contact Me rows.
- Each link row uses consistent horizontal and vertical gaps.

### Laptop

- Preserve the two-area layout while space permits.
- Allow links to wrap only at controlled item boundaries with consistent gaps; link text must not overlap or clip.

### Tablet

- Move the brand block to a full-width first row.
- Keep Navigate and Contact Me as separate horizontal, wrapping rows below it.

### Mobile

- Use a two-column link grid.
- Headings span the full row.
- The email link spans the full row because it is longer than the profile labels.

### Narrow mobile

- Switch link groups to one column when two columns no longer fit comfortably.
- The footer must not introduce horizontal overflow at any breakpoint.

## Scope

- Change only `index.html`, footer-related rules in `css/style.css`, and footer regression tests.
- Do not change link destinations, icons, JavaScript behavior, header Settings access, or non-footer features.

## Verification

- Add failing regression coverage before production edits for the heading, removed watermark, removed underline, and responsive layout hooks.
- Run the complete Node test suite and JavaScript syntax checks.
- Visually verify representative desktop, laptop/tablet, mobile, and narrow-mobile viewports.
