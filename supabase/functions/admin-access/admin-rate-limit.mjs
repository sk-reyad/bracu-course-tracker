const STRICT_ACTIONS = new Set([
  'create-admin',
  'delete-account',
  'update-admin-identity'
]);

const STANDARD_ACTIONS = new Set([
  'update-user-identity',
  'set-account-status',
  'set-role',
  'set-user-permissions'
]);

export class AdminRateLimitExceededError extends Error {
  constructor(retryAfterSeconds) {
    super('Too many administrator changes. Please try again later.');
    this.name = 'AdminRateLimitExceededError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isAdminRateLimitExceeded(error) {
  return error instanceof AdminRateLimitExceededError;
}

export function adminRateLimitForAction(action) {
  if (STRICT_ACTIONS.has(action)) return { windowSeconds: 600, maxRequests: 5 };
  if (STANDARD_ACTIONS.has(action)) return { windowSeconds: 300, maxRequests: 20 };
  return null;
}

export async function enforceAdminRateLimit(admin, actorId, action) {
  const limit = adminRateLimitForAction(action);
  if (!limit) return;

  const { data, error } = await admin.rpc('consume_admin_rate_limit', {
    actor_id: actorId,
    action_name: action,
    window_seconds: limit.windowSeconds,
    max_requests: limit.maxRequests
  });
  if (error) throw new Error('Could not verify the administrator request limit.');
  if (data !== true) throw new AdminRateLimitExceededError(limit.windowSeconds);
}
