# Shutter Out Horizontal Button Hover Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Objective

Replace the current Inner Glow treatment on every button family with one consistent Shutter Out Horizontal hover effect. Preserve all application behavior, responsive layouts, card spotlight behavior, the 65% Dot Grid, modal lifecycle, and navigation-link styling.

## Approved Decisions

- Apply Shutter Out Horizontal to `.primary-btn`, `.secondary-btn`, `.ghost-btn`, `.danger-btn`, `.icon-button`, and `.tab-btn`.
- Do not change `.nav-links a`; navbar links retain their current hover treatment.
- Use an exact hover duration of `260ms` (`0.26s`).
- Use the existing `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` token.
- Remove the button Inner Glow; do not add a replacement glow or hover scale.
- Keep the existing `120ms` active press feedback.
- Add an `x` Lucide icon to Cancel actions.
- Add a `trash-2` Lucide icon to Delete and Remove actions.
- In dark theme, use dark foreground text on the bright primary button surface so the label and icon remain legible.

## Visual Architecture

Each button receives one pointer-transparent `::before` fill layer. The layer is clipped by the button's existing radius and expands horizontally from the center using `transform: scaleX(0.02)` to `transform: scaleX(1)`. The button becomes an isolated stacking context with `overflow: hidden`; the fill layer sits behind the existing text and Lucide icon so no markup wrapper is required.

The shared button tokens change from glow-oriented values to fill-oriented values:

- `--hover-fill`: the semantic shutter surface.
- `--hover-text`: the foreground color used while the shutter is open.

Variant mapping:

- Primary: stronger blue fill; theme-appropriate foreground.
- Secondary: primary blue fill; high-contrast foreground.
- Ghost/Cancel: neutral ash fill; theme text foreground.
- Danger/Delete/Remove: red fill; high-contrast foreground.
- Icon: primary-soft/primary fill appropriate to its context.
- Tab: primary fill; high-contrast foreground. Active tabs retain their selected state.

## Interaction States

- Hover animation runs only inside `@media (hover: hover) and (pointer: fine)`.
- Disabled buttons never animate or change hover colors.
- Keyboard focus retains the existing focus indication and does not trigger shutter movement.
- `prefers-reduced-motion: reduce` makes the shutter change effectively immediate (`1ms`) and disables the active transform.
- The hover transition is interruptible because it uses CSS transitions rather than keyframes.

## Dark Theme Contrast

Dark theme's `--primary` is a light blue (`#6ea8ff`). Primary buttons therefore use a dark foreground token derived from the dark theme background/text system instead of white. Hover foreground colors are paired with their actual semantic fill so icons and labels meet readable contrast in both themes.

## Icon Coverage

Static and dynamically rendered controls are both in scope:

- `index.html`: Cancel semester.
- `js/app.js`: Cancel semester edit, Cancel profile edit, Cancel course modal, Cancel department modal.
- `js/app.js`: Delete semester, Delete faculty, Remove attempt, Remove course, and Remove department.

Lucide is already initialized by the application, so no new dependency or JavaScript icon system is introduced.

## Testing and Verification

- Update interaction-layer tests so they fail against Inner Glow and require the shutter tokens, pseudo-layer, `260ms`, semantic variant colors, fine-pointer gating, disabled gating, and reduced-motion handling.
- Add markup assertions for all Cancel and Delete/Remove icon-bearing controls.
- Verify all existing footer, motion, Dot Grid, spotlight, and modal tests still pass.
- Run JavaScript syntax checks for `js/app.js`, `js/motion.js`, and `js/roadmap.js`.
- Run the motion anti-pattern scan for `transition: all`, `ease-in`, and `scale(0)`.
- Browser-check Light/Dark themes and 1280px, 1024px, 768px, and 360px widths.
- Confirm no document horizontal overflow, Roadmap keeps `overflow-y: hidden`, disabled buttons do not animate, and browser console has no warnings or errors.

## Non-Goals

- No navbar redesign.
- No changes to card spotlight colors or movement.
- No changes to Dot Grid intensity or modal behavior.
- No dependency installation.
- No unrelated CSS cleanup or component refactor.
