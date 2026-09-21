# Onboarding Avatar Layout Refinement

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Refine the student onboarding photo experience so the identity row is the single avatar preview surface, the upload control stays compact and icon-led, and the full onboarding card fits ordinary phone and desktop viewports without an unnecessary page scrollbar.

## Confirmed Visual Behavior

The identity avatar beside the immutable Google name and email is the only place that renders an actual photo preview.

| Draft state | Identity avatar | Identity overlay action | Lower uploader media | Lower uploader delete |
| --- | --- | --- | --- | --- |
| `google` with provider photo | Google photo | Visible; changes the draft to `none` | Image-upload icon | Hidden |
| `google` without provider photo | Initials | Hidden | Image-upload icon | Hidden |
| `custom` | Selected custom preview | Hidden | Image-upload icon, never the photo | Visible; removes the custom draft and changes preference to `none` |
| `none` | Initials | Hidden | Image-upload icon | Hidden |

The lower `Use Google photo` action is removed. Removing a photo never changes the immutable name or email. The database avatar preferences remain `google`, `custom`, and `none`; this change only refines the onboarding draft controls and presentation.

## Identity Overlay Control

When a Google provider photo is active, a compact circular trash-icon button overlaps the avatar at its bottom-right edge. Its placement follows the supplied reference only as a layering cue; its shape, spacing, color, and elevation use the BRACU Course Tracker design tokens.

- The button uses a theme-adaptive soft surface/primary treatment, not a semantic danger/red treatment.
- Its resting opacity is approximately `0.72`, high enough to remain clearly discoverable.
- Hover and keyboard focus raise opacity to `1`.
- Focus remains visibly outlined, the accessible name is `Remove Google profile photo`, and the control stays usable on touch screens.
- The overlay appears only while the active draft is the Google provider photo. A custom preview is removed with the lower custom-photo delete button, avoiding two controls with conflicting ownership.

## Lower Upload Control

The lower control remains the picker and drag/drop target. Its media slot always renders the themed image-upload icon; it never duplicates Google or custom imagery.

- Google/default state: image icon, supported-format hint, and `Choose photo`.
- Custom state: image icon, selected filename, `Replace`, and the existing lower trash button.
- None state: image icon, supported-format hint, and `Choose photo`.
- `Use Google photo` markup, event handling, and styling are removed.
- JPEG, PNG, WebP, 5 MB validation, WebP compression, and drag/drop behavior are preserved.

At phone widths the media/copy content occupies the first row and actions occupy a full-width second row. Copy receives a real minimum width and normal line wrapping, preventing one-character vertical wrapping.

## Height and Scroll Behavior

The onboarding view receives a compact vertical rhythm: reduced top/bottom main padding, smaller heading/identity spacing, and tighter form gaps while preserving touch targets and readable grouping. The Vanta layer remains fixed and must not contribute document overflow.

The implementation must remove the unnecessary scrollbar at the currently tested onboarding viewport and other normal 360/768/1024/1280 layouts. It must not apply a blanket `overflow-y: hidden` that could clip controls on unusually short screens; those screens retain natural scrolling for accessibility.

## State Transitions

1. On OAuth resume, create the avatar draft from the canonical profile and Google user metadata.
2. If the draft is `google`, render the Google photo only in the identity avatar and show the overlay removal button.
3. Choosing or dropping a custom file changes the draft to `custom`, previews it in the identity avatar, updates filename/action copy below, and exposes only the lower custom delete action.
4. The Google overlay or lower custom delete changes the draft to `none`, revokes any selected-file object URL, renders initials above, and restores the icon/hint state below.
5. Submission continues through the shared profile service with no runtime image URL persisted.

## Testing and Acceptance

- Add a failing contract test before production edits.
- Assert the identity overlay button exists with its accessible label.
- Assert `useGooglePhoto`, its event handler, and its styling are absent.
- Assert the lower photo media contains only the placeholder icon and never the preview image.
- Assert JavaScript sends Google/custom imagery only to the identity image element.
- Assert custom delete remains available only for a custom draft.
- Assert responsive CSS switches the uploader to two rows before copy can collapse.
- Verify the onboarding view at 360, 420, 768, 1024, and 1280 CSS pixels in light and dark themes, with no horizontal overflow and no unnecessary vertical scrollbar at normal viewport heights.
- Run the full automated suite and JavaScript syntax checks before completion.

## Out of Scope

- Dashboard avatar controls and layout.
- Google account profile changes.
- Supabase schema, Storage policy, Auth Hook, or RPC changes.
- Any new dependency or global redesign of authentication pages.
