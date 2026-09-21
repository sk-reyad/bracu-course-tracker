# Canonical Student Profile and Avatar Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Make the authenticated student profile consistent across onboarding, the tracker dashboard, local state, Supabase Database, and private Storage. Students must be able to use their Google G-Suite photo, replace it with a custom photo, or explicitly show no photo. The Dashboard profile starts in a safe read-only view and exposes editing only after the student presses Edit.

The work also provides a safe, manual onboarding reset for the current G-Suite test account without deleting its Supabase Auth identity.

## Confirmed Product Decisions

- Supabase `public.profiles` is the canonical source for student ID, program, starting term, starting year, and avatar selection.
- Google-provided name and email remain immutable.
- The two supported programs are:
  - `BSc in Computer Science (CS)`
  - `BSc in Computer Science & Engineering (CSE)`
- Starting Semester is edited through separate Term and Year dropdowns.
- Google profile photos are used automatically when available, but a student may explicitly hide the photo.
- Hiding or deleting a photo never changes the Google-provided name or email.
- A custom JPEG, PNG, or WebP image up to 5 MB remains available through the same responsive picker/dropzone experience used during onboarding.
- An explicit no-photo choice shows initials and must not silently fall back to the Google photo.
- The Dashboard profile is view-only until Edit is pressed. Edit is then replaced by icon-labelled Save and Cancel actions.
- The selected test strategy is an onboarding reset, not deletion of the Auth user.

## Current Defects Being Corrected

1. The database stores a private Storage path in `profiles.avatar_path`, while the tracker state mapper looks for `avatar_url`. The custom image is therefore never resolved for display.
2. A private Storage path cannot be placed directly in an `<img>` element. The app currently creates no authenticated download or time-limited URL.
3. The tracker mapper reads `start_term` and `start_year`, but the database columns are `starting_term` and `starting_year`.
4. Dashboard profile edits currently modify only the tracker JSON/local copy. They do not make `public.profiles` authoritative.
5. The editable form is always exposed and uses plain text fields and the browser's native file input instead of the validated onboarding controls.

## Canonical Data Model

Add an `avatar_preference` column to `public.profiles` with three allowed values:

- `google`: use the Google OAuth metadata photo when one exists; otherwise show initials.
- `custom`: use the private object named by `avatar_path`; a missing or unreadable object falls back to initials, not Google.
- `none`: show initials and do not request either Google or Storage imagery.

`avatar_path` represents only a custom private Storage object. It is null for `google` and `none` preferences. Existing rows with a non-null `avatar_path` are migrated to `custom`; rows without one are migrated to `google` so existing Google students gain the expected default behavior.

The Google image URL is derived at runtime from the authenticated user's trusted Supabase Auth metadata (`avatar_url` or `picture`). It is not copied into `public.profiles` or persisted inside `course_tracker_data`.

The tracker state's profile mirror contains canonical scalar values and avatar identity (`avatarPreference` and `avatarPath`) but not an expiring signed URL or object URL. Image display URLs are runtime-only values.

## Avatar Resolution State Machine

The display resolver follows this exact order:

1. If `avatar_preference` is `none`, render initials.
2. If it is `custom` and `avatar_path` exists, retrieve the private object with the authenticated Storage `download()` API, create a temporary browser object URL from the returned Blob, and render that URL.
3. If the custom object cannot be read, render initials and surface a non-blocking diagnostic; do not expose the Google photo unexpectedly.
4. If the preference is `google`, use `user_metadata.avatar_url`, then `user_metadata.picture`, then initials.

Temporary object URLs are revoked when replaced, removed, on sign-out, and on page teardown. Google-hosted images use `referrerpolicy="no-referrer"` and never bypass an explicit `none` preference.

## Onboarding Photo Experience

When a pending Google student reaches onboarding:

- The identity row continues showing the immutable name and G-Suite email.
- If Google metadata includes a photo, that image becomes the default photo preview.
- A compact trash button beside or beneath the preview changes the draft preference to `none` and immediately shows initials/empty photo state.
- The existing responsive custom-photo dropzone remains below. Selecting or dropping a valid custom file changes the draft preference to `custom` and previews that file.
- A `Use Google photo` action is available when Google metadata contains an image, allowing the student to return from `custom` or `none` to `google` before submitting.
- The existing type, size, WebP compression, focus, drag, touch, keyboard, dark-theme, and reduced-motion behavior remains intact.

`complete_student_onboarding` is extended to accept the validated avatar preference and custom path. It rejects `custom` without a caller-owned path and clears `avatar_path` for `google` or `none`.

## Dashboard Profile Presentation

The profile-details panel opens in view mode. Its header contains a top-right `Edit` button with a pencil icon. Name, email, Student ID, program, university, and starting semester appear as readable values rather than active inputs.

After Edit:

- The Edit action is replaced by Save and Cancel buttons with icons.
- Name and G-Suite email remain read-only and explicitly Google-managed.
- University remains the fixed value `BRAC University`.
- Student ID becomes an editable validated input.
- Program becomes a dropdown containing only the two confirmed programs.
- Starting Semester becomes separate Spring/Summer/Fall and year dropdowns matching onboarding.
- The photo editor reuses the onboarding dropzone behavior and exposes Google, custom, and no-photo states.

Cancel discards all scalar drafts, revokes any temporary preview URL, and restores the last canonical avatar without writing to Storage or Database. Save remains disabled/busy while work is in progress and commits only validated values.

## Profile Update and Photo Transaction Rules

A validated `update_student_profile` RPC is the application write path. It verifies the authenticated caller, active student profile, supported program, valid term/year, and caller-owned custom avatar path. It cannot update name, email, role, account status, or onboarding state.

Photo changes use failure-safe ordering:

### Replace with a custom photo

1. Validate and compress the draft locally.
2. Upload to a caller-owned, versioned path rather than overwriting the currently displayed object.
3. Commit scalar fields, `avatar_preference = 'custom'`, and the new path through the RPC.
4. Refresh the canonical profile and runtime image.
5. Delete the previous custom object through the Storage API.
6. If the RPC fails, delete the newly uploaded object and retain the previous profile.

### Hide/delete the current photo

1. Commit `avatar_preference = 'none'` and a null path.
2. Immediately render initials.
3. If the previous preference was custom, delete its object through the Storage API.
4. A cleanup failure does not redisplay the image; it is reported for retry because the canonical privacy choice is already `none`.

### Return to the Google photo

1. Commit `avatar_preference = 'google'` and a null path.
2. Resolve the current Google metadata image or initials.
3. Delete any superseded custom object through the Storage API.

Storage objects are never deleted with SQL because that can orphan the underlying file. Deletion uses the Storage API.

## State Synchronization

After onboarding or a Dashboard profile update:

1. Re-read the canonical Supabase profile.
2. Replace the corresponding scalar profile fields in tracker state.
3. Update the user-scoped local copy.
4. Queue the normal `course_tracker_data` cloud sync.
5. Refresh Dashboard and report rendering from the new state.

The merge must use `starting_term` and `starting_year` correctly. Runtime Google URLs, authenticated object URLs, signed URLs, File objects, and Blob objects are never serialized into localStorage or `course_tracker_data`.

## Onboarding Reset for Testing

The reset is an owner-operated setup procedure, not a user-facing production button.

Before reset:

1. Export tracker data if it should be recoverable.
2. Sign in as the target G-Suite user and delete any custom avatar through the Storage API or Dashboard Storage interface.
3. Verify the exact target email before running the reset transaction.

The guarded reset transaction targets only `sk.reyad.ali@g.bracu.ac.bd` and:

- clears Student ID, program, starting term/year, and custom avatar path;
- sets avatar preference back to `google`;
- sets `status = 'pending'` and `onboarding_completed = false`;
- deletes that user's `course_tracker_data` row so the approved test starts with a blank tracker;
- preserves `auth.users`, `auth.identities`, the Google link, name, email, student role, and permissions.

After reset, sign out and remove only that user's `bracuCsCourseTracker.v2:<user-id>` localStorage entry. The next Google login must route to onboarding. This reset does not re-run the Before User Created hook because the Auth identity still exists; full signup-hook testing would require the separately rejected complete-deletion option.

## Security and Privacy

- The `profile-photos` bucket remains private.
- Custom-photo reads, writes, and deletes remain scoped to the authenticated user's UUID folder by RLS.
- Browser code receives only the existing publishable key; no service-role key is introduced.
- Google name and email stay protected by the existing immutable trigger.
- A no-photo preference is persistent and cannot be bypassed by an automatic fallback.
- Profile update validation is duplicated at the UI boundary and database RPC boundary.
- Error messages do not reveal other users' profiles, Storage paths, roles, or permissions.

## Responsive and Accessible Behavior

- The view and edit layouts must work without horizontal overflow at 360, 768, 1024, and 1280 CSS pixels.
- Save, Cancel, Edit, upload, restore-Google, and delete-photo controls have visible labels or accessible names and theme-consistent Lucide icons.
- The photo delete action is large enough for touch even if its visual icon is compact.
- Program and semester select arrows use the main site's inset arrow treatment rather than the browser-default edge placement.
- Keyboard focus order follows profile details, edit controls, photo actions, Save, and Cancel.
- Destructive photo removal has an explicit accessible label; it does not rely on the trash icon alone.
- Reduced motion removes non-essential transitions without changing state visibility.

## Verification

Automated tests cover:

- migration constraints and backfill behavior for `avatar_preference`;
- onboarding and update RPC validation, caller ownership, and immutable fields;
- correct `starting_term` and `starting_year` mapping;
- Google/custom/none avatar resolution and the no-Google-fallback privacy rule;
- authenticated private-photo retrieval and object-URL cleanup;
- custom upload rollback, replacement cleanup, and no-photo cleanup behavior;
- view-to-edit, Save, and Cancel state transitions;
- the exact program and term options;
- exclusion of runtime URLs and file/blob values from persisted tracker data;
- preservation of existing OAuth, admin access, RLS, course data, and preview-mode behavior.

Manual browser verification covers:

- Google photo available and unavailable;
- selecting, dropping, replacing, hiding, restoring, saving, cancelling, refreshing, signing out, and signing back in;
- Dashboard/profile/report consistency after reload;
- private object access from the owner and rejection for another account;
- light and dark themes at mobile, tablet, laptop, and desktop widths;
- a guarded onboarding reset followed by Google login and successful onboarding completion.

## Out of Scope

- Deleting the student's Supabase Auth account.
- Re-running the Before User Created hook during the onboarding-reset test.
- Editing Google-provided name or email.
- Making profile images public.
- Copying the Google image into Supabase Storage.
- Building a general production account-deletion or reset screen.
- Expanding the Admin Panel beyond its existing user/access-management scope.
