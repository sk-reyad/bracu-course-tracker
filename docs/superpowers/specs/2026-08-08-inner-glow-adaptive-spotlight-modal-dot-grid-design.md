# Inner Glow, Adaptive Spotlight, and Modal Dot Grid Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Refine the approved motion layer without changing application behavior:

1. Replace the current Outline Pulse hover with the user-selected **Inner Glow** effect.
2. Make course-card spotlight colors match each card's academic status color.
3. Keep the existing 65% Dot Grid visible and interactive inside Settings, Dashboard, and other full-screen modals.

No data model, navigation, form, report, storage, or academic-planning feature will change.

## 1. Inner Glow Buttons and Navigation

### Scope

Apply one consistent Inner Glow language to:

- Header icon buttons
- Navigation links
- Primary, secondary, ghost, danger, and tab buttons
- Dynamically rendered Edit, Save, Cancel, Delete, and Remove actions

### Behavior

- Remove the outer pulse ring and hover scale-up.
- On hover, strengthen the semantic border and add a restrained inset glow plus a small depth shadow.
- Preserve semantic colors:
  - Primary and navigation: primary blue
  - Secondary/Edit: blue
  - Ghost/Cancel: ash/neutral
  - Danger/Delete/Remove: red
- Preserve the short active press response, focus accessibility, disabled behavior, and touch behavior.
- Gate hover styling behind `(hover: hover) and (pointer: fine)`.
- Under reduced motion, keep color feedback but remove transform-based press movement.

The effect will use CSS transitions only, with named properties and the existing motion tokens. It will not add a library or JavaScript animation loop.

## 2. Status-Adaptive Card Spotlight

Introduce one card-level `--spotlight-color` token. The existing cursor-position logic remains unchanged; only the visual color source changes.

### Mapping

- `completed` → `--green`
- `current` → `--blue`
- `planned` → `--yellow`
- `omitted` and `not-taken` → `--ash`
- Cards without a status → `--primary`

The radial spotlight and hover border will both use this token. Existing light/dark theme tokens already provide appropriate variants, so no fixed light-only or dark-only colors will be introduced.

## 3. Dot Grid Inside Full-Screen Modals

### Root Cause

The Dot Grid Canvas continues running, but `.modal-backdrop` uses a fully opaque `var(--bg)` surface at a higher stacking level. Settings and Dashboard therefore hide the Canvas rather than stopping it.

### Design

Reuse the existing single Canvas instead of creating another renderer:

- When a modal opens, move `#dotGridBackground` into that modal backdrop as its first child.
- Keep the Canvas fixed to the viewport and below modal content.
- Give the modal backdrop an isolated stacking context.
- Keep the backdrop opaque enough to hide the underlying page.
- Make the modal panel a highly readable translucent surface so the Dot Grid remains subtle but visible behind it.
- When the modal closes, move the same Canvas back to the start of `<body>`.

The existing Canvas controller, pointer listeners, theme handling, 65% intensity, idle-frame stopping, and reduced-motion handling remain unchanged during reparenting.

## Responsive and Accessibility Requirements

- No horizontal page overflow at 360px, 768px, 1024px, or desktop widths.
- Modal content remains readable in light and dark themes.
- Hover effects do not run on touch-only devices.
- Keyboard focus remains visible and is not replaced by hover-only feedback.
- Reduced-motion changes continue to apply live without a page reload.
- Roadmap retains horizontal scrolling and no internal vertical scrollbar.

## Verification

### Automated

- Add regression coverage for removal of the outer pulse layer.
- Assert status-to-spotlight color mappings.
- Assert the same Canvas is reparented on modal open and restored on close.
- Retain all existing footer and motion tests.
- Run JavaScript syntax checks and the full test suite.

### Browser

- Verify Inner Glow on primary, secondary, ghost, danger, icon, tab, and navigation controls.
- Verify green, blue, yellow, and ash spotlight colors in light and dark themes.
- Open and close Settings and Dashboard, confirming the Dot Grid remains visible and interactive.
- Check 360px, 768px, 1024px, and desktop layouts.
- Confirm zero browser-console errors.

## Expected Visual Change

Buttons will feel quieter and more integrated because the external ring disappears and the feedback moves inside the control. Card hover color will match card meaning instead of always appearing blue. Settings and Dashboard will retain the same animated Dot Grid identity as the main page without adding a second Canvas or a second animation loop.
