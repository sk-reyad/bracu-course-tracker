# Admin Permissions and Identity Management Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

**Date:** 2026-08-13  
**Status:** Written specification review pending  
**Project:** BRACU Course Tracker

## Goal

Fix incorrectly provisioned administrator accounts, let a super administrator choose a new administrator's access during creation, replace technical permission codes with clear English controls, add guarded identity editing, and add super-admin-only account deletion without weakening the current authentication or audit boundaries.

## Confirmed current defect

The current `create-admin` action creates a Supabase Auth user with role metadata and then returns immediately. The database trigger may run before that metadata is available in the form expected by the trigger. A newly created administrator can therefore keep the trigger defaults:

- role: `student`;
- status: `pending`;
- onboarding: incomplete.

The fix will not depend on trigger timing. After creating the Auth user, the Edge Function will explicitly provision the application profile, selected role, account status, onboarding state, and permission overrides. The result will be verified before success is returned.

For administrators:

- status is `active` immediately after successful creation;
- role is the selected `admin` or `super_admin` role;
- student onboarding is not required;
- the Admin table shows `Not required` in the Onboarding column instead of `Pending`.

## Permission model

Internal permission codes remain in the database and Edge Function, but they are never shown in the interface. The UI uses the following short English labels and descriptions:

| UI option | Helper text | Internal mapping |
| --- | --- | --- |
| View profiles | View names, emails, and academic details. | `users.read` and `profiles.read` |
| Edit user details | Change student names and G-Suite emails. | `users.identity.manage` |
| Manage user status | Suspend or reactivate students. | `users.status.manage` |
| View admins | View admin accounts and access. | `admins.read` and `profiles.read` |
| Create admins | Create new admin accounts. | `admins.manage` |
| Manage permissions | Change roles and access. | `permissions.manage` |

`View profiles` is one user-facing control even though it represents two internal read permissions. Both internal permissions are saved together.

### Role behavior

- **Student:** Admin permissions are unavailable and disabled.
- **Admin:** Access is determined by the explicitly selected permission controls.
- **Super admin:** All permissions are enabled automatically and locked.

New Admin accounts start with only `View profiles` selected. The creator must intentionally grant any additional access. This is the least-privilege default.

Existing accounts continue to resolve effective access from role defaults plus explicit user overrides. When an authorized actor saves the new permission form, every manageable permission is stored as an explicit `granted = true` or `granted = false` override. This prevents an unchecked option from being silently re-enabled by an Admin role default.

## Authorization boundaries

All privileged checks occur again inside the Edge Function. Hiding or disabling a browser control is not considered authorization.

### Admin

An Admin may:

- view users when `View profiles` is granted;
- edit a Student's name and official G-Suite email when `Edit user details` is granted;
- suspend or reactivate Student accounts when `Manage user status` is granted;
- view administrators when `View admins` is granted;
- create an `admin` account when `Create admins` is granted;
- change roles and permissions when `Manage permissions` is granted, subject to the anti-escalation rules below.

An Admin may not:

- edit an Admin or Super Admin's name or email;
- delete any account;
- create, promote, demote, suspend, or otherwise modify a Super Admin;
- grant a permission the actor does not currently possess;
- create a Super Admin.

### Super Admin

A Super Admin may:

- perform every Admin operation;
- edit Student, Admin, and Super Admin names and emails;
- create Admin or Super Admin accounts;
- assign all available permissions;
- delete Student and Admin accounts;
- manage roles and access.

Safety guards still apply:

- a Super Admin account cannot be deleted in this release;
- a Super Admin cannot suspend or demote their own active account;
- the last active Super Admin cannot be suspended or demoted;
- a target Super Admin cannot be changed by a normal Admin.
- an Admin cannot change their own role or permissions.

## Create Administrator flow

The Create Administrator dialog contains:

- Full name;
- Email;
- Temporary password;
- Role;
- friendly permission controls with the approved English helper text.

Behavior:

1. Selecting `Admin` enables the permission controls and starts with only `View profiles` selected.
2. Selecting `Super admin` checks every permission and locks the controls. This role option is visible only to a Super Admin.
3. A normal Admin with `Create admins` can create only an `Admin` and can grant only a subset of the permissions they possess.
4. The Edge Function validates the role, permissions, email, password, and caller authority independently.
5. Supabase Auth creates the user.
6. A transaction-safe database routine explicitly sets the profile to active, marks student onboarding as not required, assigns the selected role, and writes the complete true/false permission override set.
7. The Edge Function reads the account back and verifies role, status, and permissions.
8. If database provisioning or verification fails, the newly created Auth user is deleted as compensation and the action returns an error.
9. The operation, selected role, selected permissions, target ID, actor ID, and success state are written to `admin_audit_log`; passwords are never logged.

## Existing affected Admin repair

A guarded one-time migration repairs only accounts that have a successful `create-admin` audit record but still have the incorrect `student` role, `pending` status, or incomplete onboarding state.

The repair:

- matches by the audit log's exact `target_id`;
- restores the role recorded by the successful create action;
- sets the account to `active`;
- sets onboarding complete for the non-Student account;
- gives a repaired Admin the least-privilege `View profiles` permission set when the earlier audit has no explicit permission selection;
- does not modify ordinary Student accounts;
- does not run repeatedly in the application.

The migration includes a verification query listing every repaired target. It is not an automatic recurring reset.

## Profile drawer design

The Access section keeps the Role selector and replaces raw codes with the six friendly permission controls. Each control shows:

- the short English label;
- one short English sentence describing the granted access;
- its current effective state.

The UI does not display internal permission codes.

Additional changes:

- `Save access` becomes `Save permissions`;
- a Student role disables all Admin permission controls;
- a Super Admin role checks and locks all permissions;
- a loading state prevents duplicate saves;
- success appears as a non-blocking toast;
- server validation errors remain visible inside the drawer;
- changing role or permissions requires confirmation.

## Identity editing

The Profile section gains an `Edit details` action when the caller is authorized for the target account.

Editable fields:

- full name;
- email.

Rules:

- Student emails must end exactly with `@g.bracu.ac.bd`;
- Admin emails may use any valid email domain;
- duplicate emails are rejected;
- blank names and invalid email formats are rejected;
- normal Admins can edit only Student identities and require `Edit user details`;
- only Super Admins can edit Admin or Super Admin identities.

The requested email change updates the Supabase Auth user's canonical email and the profile email. It does not relink the account to a different Google identity. If a different Google account must own the profile, that is a separate account-transfer workflow and is outside this release.

An identity update changes both Supabase Auth and `public.profiles`:

1. Read and retain the existing Auth and profile identity values.
2. Validate the target role, caller authority, email domain, and uniqueness.
3. Update the Supabase Auth user.
4. Update the profile row.
5. If the profile update fails, attempt to restore the previous Auth values.
6. Record before/after values and rollback outcome in the audit log.

The browser never receives a service-role key. The Edge Function performs every Auth Admin API operation.

## Account deletion

Deletion is available only to a Super Admin in a visually separated `Danger zone` inside the profile drawer.

The confirmation dialog requires the actor to type the target email exactly. The server also receives and validates that confirmation value; client confirmation alone is insufficient.

Deletion rules:

- a normal Admin cannot delete any account;
- a Super Admin can delete a Student or Admin;
- self-deletion is blocked;
- every Super Admin target is protected from deletion;
- all target role and status checks are repeated server-side immediately before deletion.

Deletion removes:

- the Supabase Auth user;
- the profile and role/permission rows through foreign-key cascades;
- tracker data;
- login event history;
- the private profile-photo object.

The Edge Function captures the avatar path before deleting the Auth user, deletes the Auth account, then removes the private object with the service-role client. If avatar cleanup fails after the account deletion, the account remains deleted and the orphaned path plus request ID is written to the audit log for manual cleanup.

Because `admin_audit_log.target_id` is cleared when its referenced Auth user is deleted, a successful deletion audit stores a null foreign-key target and preserves the deleted user ID, email, and role inside the audit JSON. A failed deletion may retain the still-existing target ID normally.

## Edge Function actions

The Admin Edge Function adds or refines these explicit actions:

- `create-admin` — create and provision an Admin or Super Admin;
- `update-user-identity` — edit a Student identity with `users.identity.manage`;
- `update-admin-identity` — Super Admin only;
- `delete-account` — Super Admin only;
- `set-role` — permission-controlled with hierarchy guards;
- `set-user-permissions` — save explicit effective permission overrides;
- existing list, summary, status, and audit behavior remains.

Hard role checks protect Super Admin-only actions even if a normal Admin somehow receives a similarly named permission.

## Data and migration changes

The database migration will:

- add `users.identity.manage` to `app_permissions`;
- preserve the existing permission rows and role relationships;
- add or update the atomic Admin provisioning database routine;
- ensure account-related foreign keys cascade where deletion requires it;
- use the existing audit JSON fields to record partial cleanup or rollback results;
- run the guarded repair for previously audited, incorrectly provisioned Admin accounts;
- include verification queries for permissions, roles, account status, onboarding state, and repair targets.

No recurring job resets roles, status, onboarding, or permissions.

## Responsive and accessible behavior

- The Create Administrator dialog and Profile drawer work at 360, 390, 768, 1024, 1280, and 1440 pixels.
- Permission rows wrap descriptions without horizontal overflow.
- Labels remain associated with controls.
- Disabled and locked states are conveyed with text, not color alone.
- Dialog focus is trapped and returns to the opening control when closed.
- Destructive confirmation uses `role="alertdialog"` semantics.
- Toasts use `role="status"`; blocking errors use `role="alert"`.
- All controls remain keyboard accessible in light and dark themes.

## Error handling

- Provisioning failure removes the partially created Auth account before returning an error.
- A failed identity update attempts compensating rollback and returns a request ID.
- Permission escalation attempts return `Permission denied.` without partial writes.
- Duplicate email, invalid G-Suite domain, self-delete, and last-Super-Admin violations return specific user-facing messages.
- Every privileged mutation records success or failure in the audit log without passwords or service credentials.

## Verification and acceptance criteria

Automated tests must prove:

1. A newly created Admin is `admin`, `active`, and does not show Student onboarding as pending.
2. Provisioning failure removes the newly created Auth user.
3. The guarded repair touches only targets backed by successful `create-admin` audit records.
4. Permission controls use the approved English labels and helper text and never render technical codes.
5. `View profiles` saves both internal read permissions together.
6. Unchecked permissions produce explicit false overrides and cannot leak back through role defaults.
7. An Admin cannot grant permissions they do not possess or create a Super Admin.
8. Only an authorized Admin or Super Admin can edit a Student identity.
9. Only a Super Admin can edit an Admin identity or delete an account.
10. Self-deletion, every Super Admin deletion, and last-active-Super-Admin suspension or demotion are blocked.
11. Identity changes update Auth and profile data; a profile failure triggers Auth rollback.
12. Student email edits reject addresses outside `@g.bracu.ac.bd`.
13. Typed-email deletion confirmation is validated on the server.
14. Audit rows omit passwords and record mutation outcomes.
15. The drawer and creation dialog remain usable at all required responsive widths in both themes.

Verification also includes the complete existing Node test suite, JavaScript/TypeScript syntax checks, Supabase migration verification queries, and signed-in browser checks for Admin and Super Admin capabilities.

## Out of scope

- User-facing self-service email changes;
- bulk account deletion or bulk permission changes;
- custom named roles beyond `student`, `admin`, and `super_admin`;
- automatic invitation emails or forced first-login password reset;
- editing a Google provider identity itself;
- restoring a deleted account.
