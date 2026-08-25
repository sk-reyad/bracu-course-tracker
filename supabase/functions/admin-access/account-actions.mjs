import {
  PERMISSION_BUNDLES,
  assertPermissionSubset,
  assertTargetAllowed,
  expandPermissionKeys
} from './account-policy.mjs';
import '../../../shared/password-policy.js';

const { assertAdminPassword } = globalThis.BracuPasswordPolicy;

function pickAllowed(source, keys) {
  return Object.fromEntries(keys.filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]]));
}

function safeAuditValue(value) {
  const safe = structuredClone(value || {});
  delete safe.password;
  delete safe.captchaToken;
  return safe;
}

function errorMessage(error) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return error == null ? null : String(error);
}

export function assertAdministratorActor(actor) {
  if (!actor || !['admin', 'super_admin'].includes(String(actor.role || ''))) {
    throw new Error('An administrator account is required for this action.');
  }
}

function normalizedPermissions(permissions) {
  return [...new Set(Array.isArray(permissions) ? permissions.map(String) : [])].sort();
}

function permissionsMatch(actual, expected) {
  const normalizedActual = normalizedPermissions(actual);
  const normalizedExpected = normalizedPermissions(expected);
  return normalizedActual.length === normalizedExpected.length
    && normalizedActual.every((permission, index) => permission === normalizedExpected[index]);
}

function profileRole(profile) {
  const relation = Array.isArray(profile?.user_roles) ? profile.user_roles[0] : profile?.user_roles;
  const role = Array.isArray(relation?.app_roles) ? relation.app_roles[0]?.name : relation?.app_roles?.name;
  return String(role || 'student');
}

async function loadTargetProfile(admin, id) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_path, status, user_roles(app_roles(name))')
    .eq('id', id)
    .single();
  if (error || !data) throw error || new Error('Could not load the target account.');
  return { profile: data, role: profileRole(data) };
}

function validateIdentity(fullName, email, targetRole) {
  const normalizedName = String(fullName || '').trim();
  if (!normalizedName) throw new Error('Full name is required.');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (targetRole === 'student' && !normalizedEmail.endsWith('@g.bracu.ac.bd')) {
    throw new Error('Please use an official BRAC University G-Suite email.');
  }
  return { fullName: normalizedName, email: normalizedEmail };
}

export async function restorePreviousIdentity(admin, id, before) {
  const { error } = await admin.auth.admin.updateUserById(id, {
    email: before.email,
    user_metadata: { full_name: before.fullName }
  });
  return { restored: !error, error: error?.message || null };
}

async function updateIdentity({ admin, payload, actor, audit, targetRoles, requiredPermission }) {
  const input = pickAllowed(payload, ['id', 'fullName', 'email']);
  const id = String(input.id || '');
  if (!id) throw new Error('Account ID is required.');
  audit.targetId = id;

  const { profile, role: targetRole } = await loadTargetProfile(admin, id);
  assertTargetAllowed({
    actorId: actor.id,
    actorRole: actor.role,
    actorPermissions: actor.permissions,
    requiredPermission,
    targetId: id,
    targetRole,
    operation: 'identity'
  });
  if (!targetRoles.includes(targetRole)) {
    const expected = targetRoles.length === 1 ? 'Student account' : 'administrator account';
    throw new Error(`This action requires an ${expected}.`);
  }

  const identity = validateIdentity(input.fullName, input.email, targetRole);
  const { data: authData, error: authReadError } = await admin.auth.admin.getUserById(id);
  if (authReadError || !authData?.user) throw authReadError || new Error('Could not load the Auth identity.');
  const previousAuth = {
    email: String(authData.user.email || profile.email || ''),
    fullName: String(authData.user.user_metadata?.full_name || profile.full_name || '')
  };
  audit.beforeValues = {
    id,
    fullName: String(profile.full_name || ''),
    email: String(profile.email || ''),
    role: targetRole,
    auth: previousAuth
  };
  audit.afterValues = { id, ...identity, role: targetRole };

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    email: identity.email,
    user_metadata: { full_name: identity.fullName }
  });
  if (authError) throw authError;

  const { error: profileError } = await admin
    .from('profiles')
    .update({ email: identity.email, full_name: identity.fullName })
    .eq('id', id);
  if (profileError) {
    let rollback;
    try {
      rollback = await restorePreviousIdentity(admin, id, previousAuth);
    } catch (error) {
      rollback = { restored: false, error: errorMessage(error) };
    }
    audit.afterValues = { ...audit.afterValues, rollback };
    throw profileError;
  }

  return { id, ...identity };
}

export async function updateUserIdentity(context) {
  if (!['admin', 'super_admin'].includes(context.actor.role)) {
    throw new Error('Only an administrator can update Student identity.');
  }
  return updateIdentity({
    ...context,
    targetRoles: ['student'],
    requiredPermission: 'users.identity.manage'
  });
}

export async function updateAdminIdentity(context) {
  if (context.actor.role !== 'super_admin') throw new Error('Only a Super Admin can update administrator identity.');
  return updateIdentity({
    ...context,
    targetRoles: ['admin', 'super_admin'],
    requiredPermission: 'admins.manage'
  });
}

export async function deleteAccount({ admin, payload, actor, audit }) {
  const input = pickAllowed(payload, ['id', 'confirmationEmail']);
  const id = String(input.id || '');
  if (!id) throw new Error('Account ID is required.');
  audit.targetId = id;
  if (actor.role !== 'super_admin') throw new Error('Only a Super Admin can delete an account.');

  const { profile, role: targetRole } = await loadTargetProfile(admin, id);
  assertTargetAllowed({
    actorId: actor.id,
    actorRole: actor.role,
    actorPermissions: actor.permissions,
    requiredPermission: 'permissions.manage',
    targetId: id,
    targetRole,
    operation: 'delete'
  });
  const confirmationEmail = String(input.confirmationEmail || '').trim().toLowerCase();
  if (confirmationEmail !== String(profile.email || '').trim().toLowerCase()) {
    throw new Error('Confirmation email does not match the target account.');
  }

  audit.beforeValues = { deleted_target_id: id, email: profile.email, role: targetRole };
  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) throw deleteError;
  audit.targetId = null;

  let avatarCleanupError = null;
  if (profile.avatar_path) {
    try {
      const { error } = await admin.storage.from('profile-photos').remove([profile.avatar_path]);
      avatarCleanupError = error?.message || null;
    } catch (error) {
      avatarCleanupError = errorMessage(error);
    }
  }
  audit.afterValues = {
    deleted_target_id: id,
    deleted: true,
    avatar_path: profile.avatar_path || null,
    avatar_cleanup_error: avatarCleanupError
  };
  return { id, deleted: true, avatarCleanupError };
}

async function countActiveSuperAdmins(admin) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, user_roles!inner(app_roles!inner(name))')
    .eq('status', 'active')
    .eq('user_roles.app_roles.name', 'super_admin');
  if (error) throw error;
  return (data || []).length;
}

async function assertCanReduceSuperAdmin(admin, actorId, targetId, targetRole, targetStatus) {
  if (targetRole !== 'super_admin' || targetStatus !== 'active') return;
  const activeSuperAdminCount = await countActiveSuperAdmins(admin);
  if (targetId === actorId || activeSuperAdminCount <= 1) {
    throw new Error('The last active Super Admin cannot be suspended or demoted.');
  }
}

export async function writeMutationAudit(
  admin,
  actorId,
  targetId,
  action,
  succeeded,
  beforeValues,
  afterValues,
  requestId
) {
  const { error } = await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    target_id: targetId,
    action,
    succeeded,
    before_values: safeAuditValue(beforeValues),
    after_values: safeAuditValue(afterValues),
    request_id: requestId
  });
  if (error) throw new Error(errorMessage(error) || 'Could not write the administrator audit record.');
}

export async function createAdministrator({ admin, payload, actor, audit }) {
  assertAdministratorActor(actor);
  const input = pickAllowed(payload, ['email', 'password', 'fullName', 'role', 'permissions']);
  const email = String(input.email || '').trim().toLowerCase();
  const password = assertAdminPassword(input.password);
  const fullName = String(input.fullName || '').trim();
  const role = String(input.role || 'admin');
  if (!email || !fullName) {
    throw new Error('Name and email are required.');
  }
  if (!['admin', 'super_admin'].includes(role)) {
    throw new Error('Administrator role must be Admin or Super Admin.');
  }

  const permissionKeys = Array.isArray(input.permissions) ? input.permissions.map(String) : ['view_profiles'];
  const internalPermissions = role === 'super_admin'
    ? expandPermissionKeys(Object.keys(PERMISSION_BUNDLES))
    : expandPermissionKeys(permissionKeys);
  if (actor.role !== 'super_admin') {
    if (role !== 'admin') throw new Error('Only a Super Admin can create a Super Admin.');
    assertPermissionSubset(internalPermissions, actor.permissions);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { created_by_admin: true, app_role: role }
  });
  if (error || !data.user) throw error || new Error('Administrator account could not be created.');

  const createdUser = data.user;
  audit.targetId = createdUser.id;
  audit.afterValues = {
    id: createdUser.id,
    fullName,
    email: createdUser.email || email,
    role,
    permissions: internalPermissions,
    permission_keys: permissionKeys
  };
  try {
    const { data: provisioned, error: provisionError } = await admin.rpc('provision_admin_account', {
      target_user: createdUser.id,
      target_full_name: fullName,
      target_email: email,
      target_role: role,
      target_permissions: internalPermissions
    });
    if (provisionError || !provisioned) {
      throw provisionError || new Error('Administrator provisioning could not be completed.');
    }

    const { data: verified, error: verifyError } = await admin.rpc('admin_effective_access', {
      target_user: createdUser.id
    });
    if (verifyError || verified?.role !== role || verified?.status !== 'active') {
      throw new Error('Administrator provisioning could not be verified.');
    }
    if (!permissionsMatch(verified.permissions, internalPermissions)) {
      throw new Error('Administrator permissions could not be verified.');
    }
    audit.afterValues = {
      id: createdUser.id,
      fullName,
      email: createdUser.email || email,
      role: String(verified.role),
      permissions: Array.isArray(verified.permissions) ? verified.permissions.map(String) : [],
      permission_keys: permissionKeys
    };
  } catch (provisioningError) {
    let compensationError = null;
    try {
      const { error: deleteError } = await admin.auth.admin.deleteUser(createdUser.id);
      compensationError = deleteError;
    } catch (error) {
      compensationError = error;
    }
    const compensated = !compensationError;
    if (compensated) audit.targetId = null;
    audit.afterValues = {
      ...audit.afterValues,
      deleted_target_id: createdUser.id,
      compensated,
      compensation_error: errorMessage(compensationError)
    };
    throw provisioningError;
  }

  return { id: createdUser.id, email: createdUser.email, role, permissions: permissionKeys };
}

export async function setAccountRole({ admin, payload, actor, audit }) {
  assertAdministratorActor(actor);
  const input = pickAllowed(payload, ['id', 'role']);
  const id = String(input.id || '');
  const role = String(input.role || '');
  if (!id || !['student', 'admin', 'super_admin'].includes(role)) {
    throw new Error('A valid account and role are required.');
  }

  const { data: currentAccess, error: currentError } = await admin.rpc('admin_effective_access', {
    target_user: id
  });
  if (currentError || !currentAccess) throw new Error('Could not verify the target account access.');
  const currentRole = String(currentAccess.role || 'student');
  const currentPermissions = Array.isArray(currentAccess.permissions)
    ? currentAccess.permissions.map(String)
    : [];
  const currentStatus = String(currentAccess.status || 'active');
  assertTargetAllowed({
    actorId: actor.id,
    actorRole: actor.role,
    actorPermissions: actor.permissions,
    requiredPermission: 'permissions.manage',
    targetId: id,
    targetRole: currentRole,
    operation: 'access'
  });
  if (actor.role !== 'super_admin') {
    if (role !== 'student') throw new Error('Only a Super Admin can grant administrator access.');
    assertPermissionSubset(currentPermissions, actor.permissions);
  }
  if (currentRole === 'super_admin' && role !== 'super_admin') {
    await assertCanReduceSuperAdmin(admin, actor.id, id, currentRole, currentStatus);
  }

  const requestedPermissions = role === 'super_admin'
    ? expandPermissionKeys(Object.keys(PERMISSION_BUNDLES))
    : role === 'student' ? [] : currentPermissions;
  audit.targetId = id;
  audit.beforeValues = { id, role: currentRole, permissions: currentPermissions };
  const { data: access, error: accessError } = await admin.rpc('set_account_access', {
    target_user: id,
    target_role: role,
    target_permissions: requestedPermissions
  });
  if (accessError || !access) throw accessError || new Error('Could not update the account role.');
  audit.afterValues = {
    id,
    role: String(access.role || role),
    permissions: Array.isArray(access.permissions) ? access.permissions.map(String) : []
  };
  return audit.afterValues;
}

export async function setAccountPermissions({ admin, payload, actor, audit }) {
  assertAdministratorActor(actor);
  const input = pickAllowed(payload, ['id', 'role', 'permissions']);
  const id = String(input.id || '');
  if (!id) throw new Error('Account ID is required.');

  const permissionKeys = Array.isArray(input.permissions) ? input.permissions.map(String) : [];
  const { data: currentAccess, error: currentError } = await admin.rpc('admin_effective_access', {
    target_user: id
  });
  if (currentError || !currentAccess) throw new Error('Could not verify the target account access.');
  const currentRole = String(currentAccess.role || 'student');
  const currentPermissions = Array.isArray(currentAccess.permissions)
    ? currentAccess.permissions.map(String)
    : [];
  const currentStatus = String(currentAccess.status || 'active');
  const role = input.role ? String(input.role) : currentRole;
  if (!['student', 'admin', 'super_admin'].includes(role)) {
    throw new Error('A valid account role is required.');
  }

  assertTargetAllowed({
    actorId: actor.id,
    actorRole: actor.role,
    actorPermissions: actor.permissions,
    requiredPermission: 'permissions.manage',
    targetId: id,
    targetRole: currentRole,
    operation: 'access'
  });
  const internalPermissions = role === 'super_admin'
    ? expandPermissionKeys(Object.keys(PERMISSION_BUNDLES))
    : expandPermissionKeys(permissionKeys);
  if (role === 'student' && internalPermissions.length) {
    throw new Error('Student accounts cannot receive administrator permissions.');
  }
  if (actor.role !== 'super_admin') {
    if (role !== 'student') throw new Error('Only a Super Admin can grant administrator access.');
    assertPermissionSubset(internalPermissions, actor.permissions);
  }
  if (currentRole === 'super_admin' && role !== 'super_admin') {
    await assertCanReduceSuperAdmin(admin, actor.id, id, currentRole, currentStatus);
  }
  audit.targetId = id;
  audit.beforeValues = { id, role: currentRole, permissions: currentPermissions };
  const { data: access, error: accessError } = await admin.rpc('set_account_access', {
    target_user: id,
    target_role: role,
    target_permissions: internalPermissions
  });
  if (accessError || !access) throw accessError || new Error('Could not update account access.');
  audit.afterValues = {
    id,
    role: String(access.role || role),
    permissions: Array.isArray(access.permissions) ? access.permissions.map(String) : [],
    permission_keys: permissionKeys
  };
  return {
    id,
    role: access.role || role,
    permissions: permissionKeys,
    effective_permissions: access.permissions || []
  };
}

export async function setAccountStatus({ admin, payload, actor, audit }) {
  assertAdministratorActor(actor);
  const input = pickAllowed(payload, ['id', 'status']);
  const id = String(input.id || '');
  const status = String(input.status || '');
  if (!id || !['active', 'suspended'].includes(status)) {
    throw new Error('A valid account and status are required.');
  }
  audit.targetId = id;

  const { profile, role: targetRole } = await loadTargetProfile(admin, id);
  assertTargetAllowed({
    actorId: actor.id,
    actorRole: actor.role,
    actorPermissions: actor.permissions,
    requiredPermission: 'users.status.manage',
    targetId: id,
    targetRole,
    operation: 'status'
  });
  if (targetRole === 'super_admin' && status === 'suspended' && profile.status === 'active') {
    await assertCanReduceSuperAdmin(admin, actor.id, id, targetRole, profile.status);
  }

  audit.beforeValues = { id, status: profile.status, role: targetRole };
  const { data: guardedStatus, error: profileError } = await admin.rpc('set_account_status_guarded', {
    target_user: id,
    target_status: status
  });
  if (profileError || !guardedStatus) throw profileError || new Error('Could not update the account status.');
  const ban_duration = status === 'suspended' ? '876000h' : 'none';
  const { error: authError } = await admin.auth.admin.updateUserById(id, { ban_duration });
  if (authError) {
    let rollback;
    try {
      const { data, error } = await admin.rpc('set_account_status_guarded', {
        target_user: id,
        target_status: String(profile.status)
      });
      rollback = {
        restored: !error && data?.status === profile.status,
        status: String(profile.status),
        error: errorMessage(error)
      };
    } catch (error) {
      rollback = { restored: false, status: String(profile.status), error: errorMessage(error) };
    }
    audit.afterValues = { id, status, role: targetRole, rollback };
    throw authError;
  }
  audit.afterValues = { id, status, role: targetRole };
  return { id, status };
}
