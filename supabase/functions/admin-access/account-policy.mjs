export const PERMISSION_BUNDLES = Object.freeze({
  view_profiles: Object.freeze(['profiles.read', 'users.read']),
  edit_user_details: Object.freeze(['users.identity.manage']),
  manage_user_status: Object.freeze(['users.status.manage']),
  view_admins: Object.freeze(['admins.read', 'profiles.read']),
  create_admins: Object.freeze(['admins.manage']),
  manage_permissions: Object.freeze(['permissions.manage']),
  view_support: Object.freeze(['support.read']),
  manage_support: Object.freeze(['support.read', 'support.manage']),
  manage_maintenance: Object.freeze(['maintenance.manage'])
});

export function accountListPermission(payload = {}) {
  return String(payload.role || '') === 'student' ? 'users.read' : 'admins.read';
}

export function assertProfileSummaryAllowed(targetRole, actorPermissions = []) {
  if (['admin', 'super_admin'].includes(String(targetRole || ''))
      && !actorPermissions.includes('admins.read')) {
    throw new Error('Viewing administrator accounts requires administrator-list access.');
  }
}

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

export function assertTargetAllowed({
  actorId,
  actorRole,
  actorPermissions = [],
  requiredPermission = null,
  targetId,
  targetRole,
  operation
}) {
  if (operation === 'delete' && targetRole === 'super_admin') throw new Error('Super Admin accounts cannot be deleted.');
  if (operation === 'access' && actorId === targetId) throw new Error('You cannot change your own role or permissions.');
  if (operation === 'delete' && actorId === targetId) throw new Error('You cannot delete your own account.');
  if (actorRole !== 'super_admin' && targetRole !== 'student') {
    throw new Error('Only a Super Admin can modify administrator accounts.');
  }
  if (actorRole !== 'super_admin' && requiredPermission && !actorPermissions.includes(requiredPermission)) {
    throw new Error('Permission denied for this account action.');
  }
}
