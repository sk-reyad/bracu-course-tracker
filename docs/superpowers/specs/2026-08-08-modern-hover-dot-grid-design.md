# Modern Hover and Dot Grid Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Approved direction

- Use Outline Pulse for navigation links and all existing button families.
- Preserve semantic meaning: primary stays blue, secondary/edit stays blue-soft, ghost/cancel stays neutral, and danger/delete stays red.
- Use Cursor Spotlight on course-related cards without replacing their existing status backgrounds.
- Replace the decorative code watermark with a lightweight fixed Canvas Dot Grid at 65% intensity.
- Keep the current vanilla HTML/CSS/JavaScript stack; do not add React, GSAP, or another animation dependency.

## Motion behavior

- Hover motion is frequent feedback, so it must remain subtle and complete within 220ms.
- Hover transforms run only when `(hover: hover) and (pointer: fine)` is true.
- Button press feedback uses `scale(0.97)` for 120ms.
- Course spotlight follows the pointer using element-local coordinates and resets to the centre when the pointer leaves.
- Dot Grid uses `dotSize: 4`, `proximity: 170`, `shockRadius: 300`, `shockStrength: 6`, and intensity `0.65`.
- Reduced-motion mode keeps a static grid and color feedback but removes pointer displacement, shockwave, card lift, and button scaling.

## Safety and compatibility

- Existing click, submit, edit, delete, cancel, modal, theme, roadmap and report behavior must remain unchanged.
- The Canvas is decorative (`aria-hidden="true"`, `pointer-events: none`) and must never create an inner scrollbar.
- Light and dark themes receive separate Dot Grid colors.
- Rendering pauses while the document is hidden and caps device pixel ratio at 1.5.
- Layout must remain free of horizontal overflow at 360px, 736px, and 1024px.
