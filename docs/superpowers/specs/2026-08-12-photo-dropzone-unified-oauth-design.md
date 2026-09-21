# Responsive Photo Dropzone and Unified Google Access Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Polish the first-time student onboarding flow without changing its security model. The profile-photo control must remain readable and stable on every supported screen, accept both file-picker and drag-and-drop input, and never show the empty-state icon beside a selected preview. Student authentication will use one honest Google entry point instead of separate Log in and Sign up modes that invoke the same OAuth operation.

## Scope

- Replace the student Log in / Sign up tabs with one unified Google-access presentation.
- Route an existing active student to the tracker and a first-time approved BRACU student to onboarding using the existing profile state.
- Redesign the optional profile-photo control as a responsive dropzone.
- Preserve the exact JPEG, PNG, WebP, and 5 MB validation rules.
- Preserve the existing private Storage upload, compression, cleanup-on-failure, onboarding RPC, theme, reduced-motion, and accessibility behavior.
- Do not change admin authentication, BRACU-domain enforcement, database roles, RLS, or profile identity rules.

## Unified Student Authentication

The student card will show its heading and a single `Continue with Google` button. The student mode tabs and the client-side authentication-intent storage will be removed because both modes currently call the same Supabase `signInWithOAuth()` flow.

After the OAuth callback:

1. Validate the authenticated user and exact `@g.bracu.ac.bd` suffix as before.
2. Read the canonical profile and role.
3. Send an active, onboarded student to the tracker.
4. Show onboarding for a pending first-time student.
5. Continue rejecting personal Google accounts and suspended accounts through the existing controls.

This treats social OAuth as one access path while keeping login and first-time registration outcomes explicit through profile state.

## Photo Dropzone Structure

The control will have three stable regions:

1. **Media slot:** contains the placeholder icon and selected preview in the same fixed-size area. Explicit hidden-state CSS guarantees that only one can render.
2. **Copy area:** shows the title and either the supported-format hint or the selected filename. The hint may wrap; long filenames may break or truncate without forcing horizontal overflow.
3. **Action area:** contains Choose/Replace and Remove controls. Actions remain aligned beside the copy on wide layouts and wrap predictably on narrow layouts.

The whole control is the visual drop target. Dragging a file over it adds a clear theme-aware active state without moving surrounding content.

## File Interaction

A single photo-selection helper will process files from both the native file input and a drop event:

1. Extract one file.
2. Run the existing type and size validation.
3. Revoke any previous object URL.
4. Set the selected file and create a preview URL.
5. Toggle preview, placeholder, filename, Replace, and Remove states atomically.

Invalid or empty drops do not retain a stale preview. Drag events prevent the browser from opening the image. Removing a photo resets the complete control to its initial state.

## Responsive and Accessible Behavior

- Desktop and tablet layouts retain a compact horizontal control.
- Mobile layouts use explicit grid areas so preview, copy, and actions never auto-flow into unintended rows.
- Very narrow screens may hide only the Choose/Replace text while retaining its upload icon and accessible label.
- The native file input remains keyboard-accessible through its label.
- The dropzone exposes instructions and state without relying on color alone.
- Dragging is an enhancement; touch and keyboard users retain the normal picker.
- Focus styling, dark theme contrast, and reduced-motion behavior remain consistent with the current auth page.

## Error Handling and Cleanup

- Existing user-facing validation messages remain unchanged.
- Dropping multiple files uses only the first file.
- Unsupported or oversized files reset the selection and show the corresponding validation message.
- Object URLs are revoked on replace, remove, and page teardown to prevent leaks.
- Upload/RPC failure continues deleting the newly uploaded private object.

## Verification

Automated tests will cover:

- Removal of mode tabs and authentication-intent branching.
- One Google OAuth entry path with existing post-auth routing unchanged.
- Shared picker/drop file handling and validation.
- Drop-event browser-default prevention and drag-state cleanup.
- Mutually exclusive preview and placeholder rendering.
- Responsive CSS contracts for wrapping, stable grid regions, and no horizontal overflow.

Manual verification will cover light/dark themes at desktop, tablet, and mobile widths; keyboard selection; valid/invalid picker input; valid/invalid drops; replace/remove behavior; first-time BRACU onboarding; returning-student routing; and personal-account rejection.
