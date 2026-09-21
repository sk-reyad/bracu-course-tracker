# Zero-scale button shutter design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Decision

Replace the shared button shutter resting state `scaleX(0.02) + opacity: 0` with the user-selected `scaleX(0)`. Remove the shutter-specific opacity and delayed-opacity transition entirely.

## Scope

- Applies to `.icon-button`, `.primary-btn`, `.secondary-btn`, `.ghost-btn`, `.danger-btn`, and `.tab-btn` pseudo-layers.
- Preserve `transform-origin: center`, `transform 260ms var(--ease-out)`, semantic hover colors, fine-pointer gating, disabled gating, active feedback, and reduced-motion handling.
- Do not change Navbar hover, cards, Dot Grid, layout, icons, or JavaScript behavior.

## Rejected alternatives

- `scaleX(0.02) + opacity: 0`: explicitly rejected by the user because it did not feel smooth.
- `clip-path`: unnecessary for a transform-only effect and outside the requested implementation.

## Verification

- A regression contract must fail while the opacity workaround remains and pass only when the resting layer is `scaleX(0)` with no shutter opacity transition.
- Run the complete test suite and JavaScript syntax checks.
- Render Light and Dark themes to confirm no idle center line and inspect the computed zero-scale state.
