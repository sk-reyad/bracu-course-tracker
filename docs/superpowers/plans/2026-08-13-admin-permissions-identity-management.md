# Admin Permissions and Identity Management Implementation Plan

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Admin account provisioning and add friendly granular permissions, guarded identity editing, and Super-Admin-only Student/Admin deletion.

**Architecture:** A new idempotent SQL migration adds the permission and transaction-safe service-only routines. The `admin-access` Edge Function remains the only browser-facing privileged API and applies hard hierarchy checks before using Supabase Auth Admin APIs. The Admin Panel renders a shared friendly permission catalog, while the server maps those UI keys to internal database permissions and writes explicit true/false overrides.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, Supabase Postgres/RLS, Supabase Auth Admin API, Supabase Edge Functions (Deno TypeScript), Lucide icons.

## Global Constraints

- Internal permission codes must never be visible in the UI.
- Permission labels and helper text must be short English copy exactly as specified in Task 5.
- New Admins must be `active`, have the requested role, and show onboarding as `Not required`.
- Students' edited emails must end exactly with `@g.bracu.ac.bd`.
- Admin email changes update both Supabase Auth and `public.profiles`.
- Only Super Admins may edit Admin identities or delete Student/Admin accounts.
- Super Admin accounts cannot be deleted in this release.
- Self-demotion/suspension and last-active-Super-Admin demotion/suspension are blocked.
- Normal Admins cannot grant access they do not possess and cannot create Super Admins.
- Service-role and secret keys must never enter browser code, audit payloads, or logs.
- Every privileged mutation must write a success/failure audit entry without passwords.
- Required responsive widths: 360, 390, 768, 1024, 1280, and 1440 pixels in light and dark themes.
- The workspace is not currently a Git repository. Do not initialize Git without user authorization; the conditional commit checkpoints below are skipped unless execution occurs in a Git-enabled copy.

## File Structure

- Create `supabase/migrations/202608130008_admin_permissions_identity_management.sql`: permission seed, service-only access/provisioning functions, explicit overrides, cascades, and guarded repair.
- Create `supabase/functions/admin-access/account-policy.mjs`: pure permission expansion and hierarchy validation used by the Edge Function and Node tests.
- Modify `supabase/functions/admin-access/index.ts`: new actions, explicit Admin provisioning, identity synchronization/rollback, deletion, audit, and effective-access responses.
- Create `js/admin-permissions.js`: browser/Node-friendly catalog containing only friendly labels, helper text, and UI keys.
- Modify `admin.html`: load the catalog, extend Create Administrator, add identity/delete dialogs, and add a toast region.
- Modify `js/admin.js`: capabilities, friendly permission rendering, creation payloads, effective states, identity editing, deletion, onboarding copy, and focus/state management.
- Modify `css/admin.css`: permission cards, locked states, identity forms, danger zone, confirmation dialog, toast, and responsive behavior.
- Modify `tests/admin.test.js`: UI, Edge Function, policy, provisioning, rollback, deletion, and security contracts.
- Modify `tests/auth.test.js`: migration permission/function/repair/cascade contracts.
- Modify `docs/SETUP.md`: migration/deployment/verification sequence and one-time repair explanation.

---

### Task 1: Database permission, atomic access routines, and guarded repair

**Files:**
- Create: `supabase/migrations/202608130008_admin_permissions_identity_management.sql`
- Modify: `tests/auth.test.js`

**Interfaces:**
- Produces: `public.provision_admin_account(uuid,text,text,text,text[]) returns jsonb`
- Produces: `public.set_account_access(uuid,text,text[]) returns jsonb`
- Produces: `public.admin_effective_access(uuid) returns jsonb`
- Produces: internal permission `users.identity.manage`
- Consumes: existing `profiles`, `app_roles`, `app_permissions`, `role_permissions`, `user_roles`, `user_permissions`, and `admin_audit_log`

- [ ] **Step 1: Write the failing migration contract tests**

Add `const root = path.join(__dirname, '..');` beside the existing imports in `tests/auth.test.js`, then add a test that reads migration `202608130008_admin_permissions_identity_management.sql` and asserts the exact security and repair requirements:

```js
test('admin identity migration adds service-only atomic provisioning and guarded repair', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '202608130008_admin_permissions_identity_management.sql'), 'utf8');
  assert.match(sql, /users\.identity\.manage/i);
  assert.match(sql, /create or replace function public\.provision_admin_account\s*\(/i);
  assert.match(sql, /create or replace function public\.set_account_access\s*\(/i);
  assert.match(sql, /create or replace function public\.admin_effective_access\s*\(/i);
  assert.match(sql, /granted\s*=\s*excluded\.granted/i);
  assert.match(sql, /action\s*=\s*'create-admin'/i);
  assert.match(sql, /audit\.succeeded\s*=\s*true/i);
  assert.match(sql, /audit\.target_id\s+is\s+not\s+null/i);
  assert.match(sql, /grant execute on function public\.provision_admin_account[^;]+to service_role/i);
  assert.doesNotMatch(sql, /grant execute on function public\.(?:provision_admin_account|set_account_access|admin_effective_access)[^;]+to\s+(?:anon|authenticated|public)/i);
  assert.match(sql, /notify pgrst, 'reload schema'/i);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test tests/auth.test.js
```

Expected: FAIL because migration `202608130008_admin_permissions_identity_management.sql` does not exist.

- [ ] **Step 3: Add the permission and service-only routines**

Create an idempotent migration beginning with `begin;`. Seed the new permission and define the manageable code set in each routine:

```sql
insert into public.app_permissions (name, description)
values ('users.identity.manage', 'Change student names and G-Suite emails')
on conflict (name) do update set description = excluded.description;

create or replace function public.admin_effective_access(target_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'role', role.name,
    'status', profile.status,
    'permissions', coalesce((
      select jsonb_agg(permission.name order by permission.name)
      from public.app_permissions permission
      where coalesce(
        (select override.granted
         from public.user_permissions override
         where override.user_id = target_user
           and override.permission_id = permission.id),
        exists (
          select 1
          from public.role_permissions rp
          where rp.role_id = user_role.role_id
            and rp.permission_id = permission.id
        )
      )
    ), '[]'::jsonb)
  )
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.id = target_user;
$$;
```

Implement `set_account_access` so one database transaction changes role and all seven internal permission rows. The function must validate `target_role in ('student','admin','super_admin')`, reject unknown permission codes, upsert `user_roles`, and upsert every manageable permission with `granted = permission.name = any(target_permissions)`:

```sql
insert into public.user_permissions (user_id, permission_id, granted, updated_at)
select target_user, permission.id,
       permission.name = any(coalesce(target_permissions, array[]::text[])), now()
from public.app_permissions permission
where permission.name = any(array[
  'profiles.read', 'users.read', 'users.identity.manage',
  'users.status.manage', 'admins.read', 'admins.manage', 'permissions.manage'
]::text[])
on conflict (user_id, permission_id)
do update set granted = excluded.granted, updated_at = excluded.updated_at;
```

When `target_role = 'super_admin'`, ignore the supplied subset and set every manageable permission to true before the upsert. This keeps Super Admin access automatic even if a malformed service-side call supplies an incomplete array.

Implement `provision_admin_account` as a security-definer PL/pgSQL wrapper that:

1. validates role `admin` or `super_admin`;
2. inserts or updates `profiles(id, full_name, email, status, onboarding_completed)` to `active/true`;
3. calls `set_account_access`;
4. returns `admin_effective_access(target_user)`.

Revoke all three routines from `public`, `anon`, and `authenticated`; grant execute only to `service_role`.

- [ ] **Step 4: Add the guarded one-time repair and cascade verification**

Build the repair source only from successful `create-admin` audit rows and exact target IDs:

```sql
with latest_create as (
  select distinct on (audit.target_id)
    audit.target_id,
    case when audit.after_values->>'role' = 'super_admin' then 'super_admin' else 'admin' end as repaired_role,
    case
      when jsonb_typeof(audit.after_values->'permissions') = 'array'
        then array(select jsonb_array_elements_text(audit.after_values->'permissions'))
      else array['profiles.read', 'users.read']::text[]
    end as repaired_permissions
  from public.admin_audit_log audit
  where audit.action = 'create-admin'
    and audit.succeeded = true
    and audit.target_id is not null
  order by audit.target_id, audit.created_at desc
)
select public.provision_admin_account(
  profile.id,
  profile.full_name,
  profile.email,
  latest_create.repaired_role,
  latest_create.repaired_permissions
)
from latest_create
join public.profiles profile on profile.id = latest_create.target_id
join public.user_roles user_role on user_role.user_id = profile.id
join public.app_roles role on role.id = user_role.role_id
where role.name = 'student'
   or profile.status = 'pending'
   or profile.onboarding_completed = false;
```

Do not add a trigger, scheduled job, or runtime reset. Verify existing account tables already cascade from `auth.users`; add only missing constraints needed for `login_events`/tracker/role/permission cleanup. End with `notify pgrst, 'reload schema'; commit;` and a read-only verification query.

- [ ] **Step 5: Run the focused migration tests and verify GREEN**

Run:

```powershell
node --test tests/auth.test.js
```

Expected: all `tests/auth.test.js` tests PASS.

- [ ] **Step 6: Version-control checkpoint**

If execution is in a Git-enabled copy:

```powershell
git add supabase/migrations/202608130008_admin_permissions_identity_management.sql tests/auth.test.js
git commit -m "feat: add atomic admin access migration"
```

In the current non-Git workspace, record the two changed paths in the execution report and continue without initializing Git.

---

### Task 2: Pure server permission and hierarchy policy

**Files:**
- Create: `supabase/functions/admin-access/account-policy.mjs`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Produces: `PERMISSION_BUNDLES: Record<string, readonly string[]>`
- Produces: `expandPermissionKeys(keys: unknown): string[]`
- Produces: `assertPermissionSubset(requested: string[], actor: string[]): void`
- Produces: `assertTargetAllowed({ actorId, actorRole, targetId, targetRole, operation }): void`
- Consumes: UI permission keys `view_profiles`, `edit_user_details`, `manage_user_status`, `view_admins`, `create_admins`, `manage_permissions`

- [ ] **Step 1: Write failing unit tests for permission expansion and hierarchy**

Add `const root = path.join(__dirname, '..');` beside `functionPath` in `tests/admin.test.js`, then append tests using dynamic import:

```js
test('account policy expands friendly permission keys without privilege escalation', async () => {
  const policy = await import(pathToFileURL(path.join(root, 'supabase', 'functions', 'admin-access', 'account-policy.mjs')).href);
  assert.deepEqual(policy.expandPermissionKeys(['view_profiles', 'edit_user_details']), [
    'profiles.read', 'users.read', 'users.identity.manage'
  ]);
  assert.throws(
    () => policy.assertPermissionSubset(['admins.manage'], ['users.read']),
    /cannot grant access/i
  );
});

test('account policy enforces the admin hierarchy', async () => {
  const policy = await import(pathToFileURL(path.join(root, 'supabase', 'functions', 'admin-access', 'account-policy.mjs')).href);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', targetId: 'super-1', targetRole: 'super_admin', operation: 'update'
  }), /Super Admin/i);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', targetId: 'admin-1', targetRole: 'admin', operation: 'access'
  }), /own role or permissions/i);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'super-1', actorRole: 'super_admin', targetId: 'super-2', targetRole: 'super_admin', operation: 'delete'
  }), /cannot be deleted/i);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
node --test tests/admin.test.js
```

Expected: FAIL because `account-policy.mjs` does not exist.

- [ ] **Step 3: Implement the pure policy module**

Create the exact catalog and deterministic expansion:

```js
export const PERMISSION_BUNDLES = Object.freeze({
  view_profiles: Object.freeze(['profiles.read', 'users.read']),
  edit_user_details: Object.freeze(['users.identity.manage']),
  manage_user_status: Object.freeze(['users.status.manage']),
  view_admins: Object.freeze(['admins.read', 'profiles.read']),
  create_admins: Object.freeze(['admins.manage']),
  manage_permissions: Object.freeze(['permissions.manage'])
});

export function expandPermissionKeys(keys) {
  if (!Array.isArray(keys)) throw new Error('Permissions must be an array.');
  const unknown = keys.filter(key => !Object.hasOwn(PERMISSION_BUNDLES, String(key)));
  if (unknown.length) throw new Error('Unknown permission selection.');
  return [...new Set(keys.flatMap(key => PERMISSION_BUNDLES[String(key)]))].sort();
}

export function assertPermissionSubset(requested, actor) {
  const allowed = new Set(actor);
  if (requested.some(permission => !allowed.has(permission))) {
    throw new Error('You cannot grant access that you do not have.');
  }
}

export function assertTargetAllowed({ actorId, actorRole, targetId, targetRole, operation }) {
  if (operation === 'delete' && targetRole === 'super_admin') throw new Error('Super Admin accounts cannot be deleted.');
  if (actorRole !== 'super_admin' && targetRole === 'super_admin') throw new Error('Only a Super Admin can modify another Super Admin.');
  if (operation === 'access' && actorId === targetId) throw new Error('You cannot change your own role or permissions.');
  if (operation === 'delete' && actorId === targetId) throw new Error('You cannot delete your own account.');
}
```

Keep this module free of Deno, Supabase, DOM, and environment dependencies so Node can test it directly.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
node --test tests/admin.test.js
```

Expected: all current and new Admin tests PASS.

- [ ] **Step 5: Version-control checkpoint**

If Git is available:

```powershell
git add supabase/functions/admin-access/account-policy.mjs tests/admin.test.js
git commit -m "feat: define admin hierarchy policy"
```

Otherwise record both paths in the execution report.

---

### Task 3: Edge Function explicit Admin provisioning and effective access

**Files:**
- Modify: `supabase/functions/admin-access/index.ts`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Consumes: `expandPermissionKeys`, `assertPermissionSubset`, `assertTargetAllowed`
- Consumes: `provision_admin_account`, `set_account_access`, `admin_effective_access`
- Produces: `create-admin` payload `{ fullName, email, password, role, permissions: string[] }`
- Produces: profile-summary field `effective_permissions: string[]`

Define one mutable request-scoped audit carrier so rollback and post-delete details reach the existing outer audit writer:

```ts
type MutationAudit = {
  targetId: string | null;
  beforeValues: Record<string, unknown>;
  afterValues: Record<string, unknown>;
};
```

Every mutation receives this object and updates it. The success and catch branches call `writeAudit` with these fields instead of always writing `{}` and the raw request payload.

- [ ] **Step 1: Add failing contracts for explicit provisioning and compensation**

Add assertions that `createAdmin` calls the provisioning RPC, verifies its result, and deletes the Auth user on failure:

```js
test('create-admin explicitly provisions and compensates failed database setup', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  const createIndex = source.indexOf('auth.admin.createUser');
  const provisionIndex = source.indexOf('rpc("provision_admin_account"');
  const verifyIndex = source.indexOf('admin_effective_access');
  const compensateIndex = source.indexOf('auth.admin.deleteUser');
  assert.ok(createIndex >= 0);
  assert.ok(provisionIndex > createIndex);
  assert.ok(verifyIndex > provisionIndex);
  assert.ok(compensateIndex > createIndex);
  assert.match(source, /permissions:\s*permissionKeys/i);
});
```

Update the approved action test to include `update-user-identity`, `update-admin-identity`, and `delete-account`, while replacing legacy `update-admin` after Task 4.

- [ ] **Step 2: Run focused tests and verify RED**

Run `node --test tests/admin.test.js`.

Expected: FAIL because explicit provisioning/verification is absent.

- [ ] **Step 3: Load authoritative actor context after base authorization**

Import the policy helpers. After caller JWT verification and the existing `authorize` RPC succeed—but only after the secret client is created—load:

```ts
const { data: actorAccess, error: actorError } = await admin.rpc("admin_effective_access", {
  target_user: userData.user.id
});
if (actorError || !actorAccess) throw new Error("Could not verify administrator access.");
const actorRole = String(actorAccess.role || "student");
const actorPermissions = Array.isArray(actorAccess.permissions)
  ? actorAccess.permissions.map(String)
  : [];
```

Use this authoritative database result for hierarchy/subset checks; do not trust role or permissions supplied by the browser.

- [ ] **Step 4: Replace trigger-dependent Admin creation**

Change `createAdmin` to accept actor context and permission keys. Validate:

```ts
const permissionKeys = Array.isArray(input.permissions) ? input.permissions.map(String) : ["view_profiles"];
const internalPermissions = role === "super_admin"
  ? expandPermissionKeys(Object.keys(PERMISSION_BUNDLES))
  : expandPermissionKeys(permissionKeys);
if (actorRole !== "super_admin") {
  if (role !== "admin") throw new Error("Only a Super Admin can create a Super Admin.");
  assertPermissionSubset(internalPermissions, actorPermissions);
}
```

After `auth.admin.createUser`, call:

```ts
const { data: provisioned, error: provisionError } = await admin.rpc("provision_admin_account", {
  target_user: createdUser.id,
  target_full_name: fullName,
  target_email: email,
  target_role: role,
  target_permissions: internalPermissions
});
if (provisionError) throw provisionError;

const { data: verified, error: verifyError } = await admin.rpc("admin_effective_access", {
  target_user: createdUser.id
});
if (verifyError || verified?.role !== role || verified?.status !== "active") {
  throw new Error("Administrator provisioning could not be verified.");
}
```

Wrap database provisioning/verification in `try/catch`; on failure call `admin.auth.admin.deleteUser(createdUser.id)` before rethrowing. Include `permissions: permissionKeys` in the safe audit result, never the password.

- [ ] **Step 5: Return effective permissions from profile summary and save access atomically**

After loading the profile, call `admin_effective_access` and return:

```ts
return {
  ...profile,
  effective_permissions: access.permissions || []
};
```

Change `set-user-permissions` to accept friendly permission keys, expand them server-side, enforce subset rules for normal Admins, and call `set_account_access` once with the current/requested role. Remove the current delete-then-positive-only insert behavior.

- [ ] **Step 6: Run focused tests and syntax checks**

Run:

```powershell
node --test tests/admin.test.js
node --check js/admin.js
```

Expected: PASS. The TypeScript file is verified with Deno in Task 8 after the complete action set exists.

- [ ] **Step 7: Version-control checkpoint**

If Git is available:

```powershell
git add supabase/functions/admin-access/index.ts tests/admin.test.js
git commit -m "fix: provision administrator accounts explicitly"
```

Otherwise record both paths in the execution report.

---

### Task 4: Identity synchronization, hierarchy guards, and deletion

**Files:**
- Modify: `supabase/functions/admin-access/index.ts`
- Modify: `supabase/functions/admin-access/account-policy.mjs`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Produces: `update-user-identity` payload `{ id, fullName, email }`
- Produces: `update-admin-identity` payload `{ id, fullName, email }`
- Produces: `delete-account` payload `{ id, confirmationEmail }`
- Consumes: exact target role/status and actor role/effective permissions from the database

- [ ] **Step 1: Write failing identity/deletion security tests**

Add source and pure-policy tests covering:

```js
test('identity and deletion actions enforce server-side role boundaries and rollback', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  for (const action of ['update-user-identity', 'update-admin-identity', 'delete-account']) {
    assert.match(source, new RegExp(`"${action}"`));
  }
  assert.match(source, /@g\.bracu\.ac\.bd/);
  assert.match(source, /auth\.admin\.updateUserById/);
  assert.match(source, /restorePreviousIdentity/);
  assert.match(source, /confirmationEmail/);
  assert.match(source, /last active Super Admin/i);
  assert.match(source, /storage\.from\("profile-photos"\)\.remove/);
  assert.match(source, /deleted_target_id/);
  assert.match(source, /audit\.targetId\s*=\s*null/);
});
```

Add policy tests proving normal Admins can target Students only when the relevant permission is present and that Super Admin deletion is always rejected.

- [ ] **Step 2: Run focused tests and verify RED**

Run `node --test tests/admin.test.js`.

Expected: FAIL because the three actions and rollback helper do not exist.

- [ ] **Step 3: Implement role-aware identity updates**

Replace `update-admin` with two explicit actions. Load the target profile and target role before mutation. Apply:

```ts
function validateIdentity(fullName: string, email: string, targetRole: string) {
  if (!fullName.trim()) throw new Error("Full name is required.");
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
  if (targetRole === "student" && !normalizedEmail.endsWith("@g.bracu.ac.bd")) {
    throw new Error("Please use an official BRAC University G-Suite email.");
  }
  return { fullName: fullName.trim(), email: normalizedEmail };
}
```

For `update-user-identity`, require `users.identity.manage` and target role `student`. For `update-admin-identity`, require hard `actorRole === 'super_admin'` and target role `admin` or `super_admin`.

Map `update-user-identity` to `users.identity.manage`, `update-admin-identity` to `admins.manage` plus the hard Super Admin check, and `delete-account` to `permissions.manage` plus the hard Super Admin check. These base permissions must pass before the privileged client is constructed.

Read previous Auth/profile values, update Auth, then profile. Implement:

```ts
async function restorePreviousIdentity(admin: SupabaseClient, id: string, before: { email: string; fullName: string }) {
  const { error } = await admin.auth.admin.updateUserById(id, {
    email: before.email,
    user_metadata: { full_name: before.fullName }
  });
  return { restored: !error, error: error?.message || null };
}
```

If the profile update fails, call this helper, attach rollback outcome to the failure audit values, and return the request ID.

- [ ] **Step 4: Implement protected account deletion**

Require `actorRole === 'super_admin'`. Load the target profile, role, avatar path, and exact email. Reject self-target and every `super_admin` target. Reject unless `confirmationEmail.trim().toLowerCase() === profile.email`.

Delete the Auth user:

```ts
const { error: deleteError } = await admin.auth.admin.deleteUser(id);
if (deleteError) throw deleteError;
```

Rely on verified cascades for profiles, tracker data, login events, roles, and overrides. Then remove the captured avatar object:

```ts
let avatarCleanupError: string | null = null;
if (profile.avatar_path) {
  const { error } = await admin.storage.from("profile-photos").remove([profile.avatar_path]);
  avatarCleanupError = error?.message || null;
}
return { id, deleted: true, avatarCleanupError };
```

Audit the cleanup error and request ID without reversing successful account deletion.

Before deletion, place `{ deleted_target_id: id, email: profile.email, role: targetRole }` in `audit.beforeValues`. After successful Auth deletion, set `audit.targetId = null` before `writeAudit`; otherwise the `admin_audit_log.target_id` foreign key would reference a deleted Auth user and the audit insert would fail. A failed deletion keeps the existing target ID.

- [ ] **Step 5: Add last-active-Super-Admin guards to status and role changes**

Before suspending or demoting a Super Admin, count other `active` Super Admin profiles through `user_roles/app_roles`. Reject when the actor targets self or the target is the last active Super Admin:

```ts
if (targetRole === "super_admin" && (targetId === actorId || activeSuperAdminCount <= 1)) {
  throw new Error("The last active Super Admin cannot be suspended or demoted.");
}
```

Normal Admins must never reach this branch for a Super Admin target; the hierarchy policy rejects them first.

- [ ] **Step 6: Run focused tests and syntax checks**

Run:

```powershell
node --test tests/admin.test.js
node --test tests/auth.test.js
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If Git is available:

```powershell
git add supabase/functions/admin-access/index.ts supabase/functions/admin-access/account-policy.mjs tests/admin.test.js
git commit -m "feat: add protected identity and deletion actions"
```

Otherwise record the paths in the execution report.

---

### Task 5: Friendly permission catalog and Create Administrator controls

**Files:**
- Create: `js/admin-permissions.js`
- Modify: `admin.html`
- Modify: `js/admin.js`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Produces: `AdminPermissions.CATALOG`
- Produces: `AdminPermissions.keysForCodes(codes: string[]): string[]`
- Produces: Create Admin payload permission keys consumed by Task 3
- Consumes: authenticated `state.context.role` and `state.context.permissions`

- [ ] **Step 1: Write failing copy/catalog/render tests**

Add:

```js
test('Admin permission UI uses short English copy and hides technical codes', () => {
  const Permissions = require('../js/admin-permissions.js');
  assert.deepEqual(Permissions.CATALOG.map(item => [item.label, item.description]), [
    ['View profiles', 'View names, emails, and academic details.'],
    ['Edit user details', 'Change student names and G-Suite emails.'],
    ['Manage user status', 'Suspend or reactivate students.'],
    ['View admins', 'View admin accounts and access.'],
    ['Create admins', 'Create new admin accounts.'],
    ['Manage permissions', 'Change roles and access.']
  ]);
  const js = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
  assert.doesNotMatch(js, /<span>\$\{permission\}<\/span>/);
  assert.match(js, /Save permissions/);
});
```

Also assert `admin.html` loads `js/admin-permissions.js` before `js/admin.js` and contains `id="createAdminPermissions"`.

- [ ] **Step 2: Run focused tests and verify RED**

Run `node --test tests/admin.test.js`.

Expected: FAIL because the catalog and form container do not exist.

- [ ] **Step 3: Create the browser/Node permission catalog**

Use the existing UMD pattern:

```js
(function exposeAdminPermissions(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AdminPermissions = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildAdminPermissions() {
  "use strict";
  const CATALOG = Object.freeze([
    { key: "view_profiles", label: "View profiles", description: "View names, emails, and academic details.", codes: ["profiles.read", "users.read"] },
    { key: "edit_user_details", label: "Edit user details", description: "Change student names and G-Suite emails.", codes: ["users.identity.manage"] },
    { key: "manage_user_status", label: "Manage user status", description: "Suspend or reactivate students.", codes: ["users.status.manage"] },
    { key: "view_admins", label: "View admins", description: "View admin accounts and access.", codes: ["admins.read", "profiles.read"] },
    { key: "create_admins", label: "Create admins", description: "Create new admin accounts.", codes: ["admins.manage"] },
    { key: "manage_permissions", label: "Manage permissions", description: "Change roles and access.", codes: ["permissions.manage"] }
  ]);
  function keysForCodes(codes) {
    const set = new Set(codes || []);
    return CATALOG.filter(item => item.codes.every(code => set.has(code))).map(item => item.key);
  }
  return Object.freeze({ CATALOG, keysForCodes });
});
```

- [ ] **Step 4: Extend Create Administrator markup and behavior**

Add a fieldset after Role:

```html
<fieldset class="permission-fieldset">
  <legend>Permissions</legend>
  <div id="createAdminPermissions" class="permission-list"></div>
</fieldset>
```

Render each catalog item with checkbox, label, and description. Default only `view_profiles` checked. When Role is `super_admin`, check/lock all. Hide the Super Admin option from normal Admins. Disable any permission the normal Admin does not effectively own.

Submit:

```js
const payload = Object.fromEntries(new FormData(event.currentTarget));
payload.permissions = Array.from(
  document.querySelectorAll('#createAdminPermissions input:checked'),
  input => input.value
);
await controller.invokeAction('create-admin', payload);
```

Reset role, checked state, locked state, and errors every time the dialog closes.

- [ ] **Step 5: Run focused tests and syntax checks**

Run:

```powershell
node --test tests/admin.test.js
node --check js/admin-permissions.js
node --check js/admin.js
```

Expected: PASS.

- [ ] **Step 6: Version-control checkpoint**

If Git is available:

```powershell
git add js/admin-permissions.js admin.html js/admin.js tests/admin.test.js
git commit -m "feat: add friendly admin permission controls"
```

Otherwise record all four paths in the execution report.

---

### Task 6: Profile drawer identity editing, access saving, and deletion UI

**Files:**
- Modify: `admin.html`
- Modify: `js/admin.js`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Consumes: `profile.effective_permissions`, target role, caller capabilities
- Consumes: `update-user-identity`, `update-admin-identity`, `delete-account`
- Produces: drawer actions `Edit details`, `Save permissions`, and Super-Admin-only `Delete account`

- [ ] **Step 1: Write failing drawer behavior tests**

Assert:

```js
test('profile drawer exposes friendly access, guarded identity editing, and typed deletion', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
  assert.match(html, /id="deleteAccountDialog"[^>]*aria-labelledby="deleteAccountTitle"/);
  assert.match(html, /id="adminToast"[^>]*role="status"/);
  assert.match(js, /Edit details/);
  assert.match(js, /Save permissions/);
  assert.match(js, /update-user-identity/);
  assert.match(js, /update-admin-identity/);
  assert.match(js, /delete-account/);
  assert.match(js, /confirmationEmail/);
  assert.match(js, /Not required/);
});
```

Add unit assertions for `getAdminCapabilities` including `manageUserIdentity` and Super Admin-only `manageAdminIdentity/deleteAccounts`.

- [ ] **Step 2: Run focused tests and verify RED**

Run `node --test tests/admin.test.js`.

Expected: FAIL because the dialogs/actions/capabilities are absent.

- [ ] **Step 3: Expand capability derivation without trusting the UI**

Return:

```js
return {
  readUsers: superAdmin || permissions.has('users.read'),
  readAdmins: superAdmin || permissions.has('admins.read'),
  manageStatus: superAdmin || permissions.has('users.status.manage'),
  manageUserIdentity: superAdmin || permissions.has('users.identity.manage'),
  manageAdmins: superAdmin || permissions.has('admins.manage'),
  managePermissions: superAdmin || permissions.has('permissions.manage'),
  manageAdminIdentity: superAdmin,
  deleteAccounts: superAdmin
};
```

These values control presentation only; Task 4 remains the security boundary.

- [ ] **Step 4: Render effective friendly permissions and save atomically**

Use `profile.effective_permissions`, not positive-only `user_permissions`, to select catalog keys. Render catalog labels/descriptions and role-based disabled/locked states. On save, send one `set-user-permissions` request with `{ id, role, permissions: selectedKeys }`; do not issue separate role and permission requests.

Change the button copy to `Save permissions`. Show a toast on success and reload both drawer and table.

- [ ] **Step 5: Add identity editing UI**

In the Profile card, show `Edit details` only when:

- target is Student and caller has `manageUserIdentity`; or
- target is Admin/Super Admin and caller has `manageAdminIdentity`.

Switch the card into labelled name/email inputs with Save and Cancel controls. Submit `update-user-identity` for Students and `update-admin-identity` otherwise. Disable controls during request, show inline server errors, update the drawer title/table on success, and restore read-only values on Cancel.

- [ ] **Step 6: Add Super-Admin-only typed deletion dialog**

Add:

```html
<dialog id="deleteAccountDialog" class="admin-dialog danger-dialog" aria-labelledby="deleteAccountTitle">
  <form id="deleteAccountForm" method="dialog">
    <h2 id="deleteAccountTitle">Delete account?</h2>
    <p>This permanently removes the account and tracker data.</p>
    <label>Type the account email to confirm
      <input id="deleteConfirmationEmail" name="confirmationEmail" type="email" required autocomplete="off" />
    </label>
    <p id="deleteAccountError" class="dialog-error" role="alert" hidden></p>
    <div class="dialog-actions">
      <button id="cancelDeleteAccount" class="admin-secondary" type="button">Cancel</button>
      <button class="admin-danger" type="submit"><i data-lucide="trash-2"></i>Delete account</button>
    </div>
  </form>
</dialog>
<div id="adminToast" class="admin-toast" role="status" aria-live="polite" hidden></div>
```

Show `Delete account` only for Super Admin callers and Student/Admin targets. Pass exact `{ id, confirmationEmail }`, close the drawer after success, show a toast, and refresh the current list.

- [ ] **Step 7: Display Admin onboarding correctly**

In desktop and mobile account markup, compute:

```js
const onboarding = role === 'student'
  ? (account.onboarding_completed ? 'Complete' : 'Pending')
  : 'Not required';
```

Render that value everywhere instead of checking only the boolean.

- [ ] **Step 8: Run focused tests and syntax checks**

Run:

```powershell
node --test tests/admin.test.js tests/access.test.js
node --check js/admin.js
```

Expected: PASS.

- [ ] **Step 9: Version-control checkpoint**

If Git is available:

```powershell
git add admin.html js/admin.js tests/admin.test.js
git commit -m "feat: add guarded account management UI"
```

Otherwise record the paths in the execution report.

---

### Task 7: Responsive styling, accessible states, and motion-safe feedback

**Files:**
- Modify: `css/admin.css`
- Modify: `js/admin.js`
- Modify: `tests/admin.test.js`

**Interfaces:**
- Consumes: `.permission-option`, `.permission-option-copy`, `.permission-locked`, `.danger-zone`, `.admin-danger`, `.admin-toast`
- Produces: responsive, keyboard-visible, theme-aware presentation for Tasks 5–6

- [ ] **Step 1: Write failing CSS/accessibility contracts**

Add assertions for:

```js
test('Admin permission and danger controls are responsive and accessible', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'admin.css'), 'utf8');
  assert.match(css, /\.permission-option-copy\s*{[^}]*min-width:\s*0/s);
  assert.match(css, /\.permission-option-copy\s+small\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.danger-zone/);
  assert.match(css, /\.admin-danger/);
  assert.match(css, /\.admin-toast/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.permission-option/s);
  assert.match(css, /:focus-visible/);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run `node --test tests/admin.test.js`.

Expected: FAIL because the new selectors do not exist.

- [ ] **Step 3: Style permission rows and locked states**

Use a two-column checkbox/copy layout that can shrink safely:

```css
.permission-option{min-height:58px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:10px;background:var(--surface)}
.permission-option-copy{min-width:0;display:grid;gap:3px;color:var(--ink)}
.permission-option-copy strong{font-size:.84rem}
.permission-option-copy small{color:var(--muted);font-size:.74rem;line-height:1.35;overflow-wrap:anywhere}
.permission-option.permission-locked{opacity:.72}
.permission-option input{margin-top:3px}
```

Use theme variables only; no hard-coded light-only surfaces.

- [ ] **Step 4: Style edit, danger, toast, and mobile dialogs**

Add danger styling using the existing semantic `--danger`, but keep neutral theme surfaces until hover/focus. Add a fixed toast above mobile safe areas, `max-width: min(380px, calc(100% - 24px))`, and no horizontal overflow. At `max-width:640px`, stack edit/delete actions and keep every target at least 44px high.

Add `:focus-visible` rings for permission inputs/buttons and keep the global reduced-motion block effective for the toast/dialog transitions.

- [ ] **Step 5: Keep focus and announcements correct**

Use native `<dialog>` focus containment for create/delete dialogs. For the custom profile drawer, store the opener, focus the close button after opening, cycle Tab between visible focusable controls, close on Escape, and return focus to the opener. Set `aria-busy="true"` during saves/deletes and restore it in `finally`.

- [ ] **Step 6: Run focused tests and syntax checks**

Run:

```powershell
node --test tests/admin.test.js
node --check js/admin.js
```

Expected: PASS.

- [ ] **Step 7: Version-control checkpoint**

If Git is available:

```powershell
git add css/admin.css js/admin.js tests/admin.test.js
git commit -m "style: polish responsive admin access controls"
```

Otherwise record the paths in the execution report.

---

### Task 8: Full verification, Supabase deployment, and setup documentation

**Files:**
- Modify: `docs/SETUP.md`
- Create: `docs/superpowers/reports/2026-08-13-admin-permissions-identity-management-verification.md`
- Test: all files under `tests/`

**Interfaces:**
- Consumes: migration `202608130008`, completed Edge Function, Admin UI
- Produces: remote migration/function deployment evidence and browser verification record

- [ ] **Step 1: Update setup documentation**

Document this exact safe order:

1. Run the full local tests.
2. Link Supabase project `eeorkgnbhxenaszdxtti` if it is not already linked.
3. Apply migration `202608130008_admin_permissions_identity_management.sql` once.
4. Verify the new permission/routines and repaired targets.
5. Deploy `admin-access`.
6. Sign out/in to refresh JWT claims.
7. Test new Admin creation and account management with a disposable Admin.

State clearly that the repair is migration-only, exact-audit-target guarded, and never runs on each login/page load.

- [ ] **Step 2: Run the complete local verification suite**

Run:

```powershell
node --test tests/*.test.js
node --check js/admin-permissions.js
node --check js/admin.js
node --check js/access.js
```

Expected: complete suite PASS with zero failures; all three syntax checks exit 0.

- [ ] **Step 3: Check the Edge Function with Deno**

Run:

```powershell
deno check supabase/functions/admin-access/index.ts
```

Expected: exit 0. If Deno is unavailable, use the configured Supabase CLI function serve/deploy validation and record the substitution explicitly.

- [ ] **Step 4: Apply the migration to the linked Supabase project**

After user/network approval, run the repository's established Supabase CLI flow:

```powershell
supabase db push --linked
```

Expected: migration `202608130008_admin_permissions_identity_management.sql` is applied once with no SQL error.

Run read-only verification in SQL Editor or CLI:

```sql
select name from public.app_permissions where name = 'users.identity.manage';
select routine_name from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('provision_admin_account','set_account_access','admin_effective_access');
select profile.email, role.name, profile.status, profile.onboarding_completed
from public.profiles profile
join public.user_roles ur on ur.user_id = profile.id
join public.app_roles role on role.id = ur.role_id
where profile.email = 'maisha2192003@gmail.com';
```

Expected: permission exists, three routines exist, and the affected Admin is `admin`, `active`, `true`.

- [ ] **Step 5: Deploy the Edge Function**

After user/network approval:

```powershell
supabase functions deploy admin-access --project-ref eeorkgnbhxenaszdxtti
```

Expected: deployment succeeds and the function reports ACTIVE.

- [ ] **Step 6: Browser verification in a signed-in session**

At 1440/1280/1024/768/390/360 widths, verify light and dark themes:

- existing affected Admin displays Admin/Active/Not required;
- new Admin creation defaults to View profiles only;
- Super Admin selection locks all permissions;
- normal Admin cannot see/choose Super Admin or grant inaccessible permissions;
- raw codes never appear;
- Student identity edit updates both table and subsequent signed-in profile;
- invalid non-G-Suite Student email shows the specified error;
- Admin identity edit and deletion are absent for normal Admins;
- typed email mismatch blocks deletion;
- successful deletion removes the row after refresh;
- self/last-Super-Admin protections return clear errors;
- drawer/dialog keyboard focus and Escape behavior work;
- no horizontal overflow or console errors occur.

- [ ] **Step 7: Write the verification report**

Record:

- each command and exit status;
- migration version and remote result;
- deployed Edge Function version/status;
- browser widths/themes tested;
- affected Admin repair result;
- any limitations or manual follow-up.

Do not claim completion if remote migration, deployment, or signed-in browser checks were skipped; mark them explicitly pending.

- [ ] **Step 8: Final version-control checkpoint**

If Git is available:

```powershell
git add docs/SETUP.md docs/superpowers/reports/2026-08-13-admin-permissions-identity-management-verification.md
git commit -m "docs: verify admin identity management release"
```

In the current non-Git workspace, leave the report as the durable checkpoint and do not initialize Git.
