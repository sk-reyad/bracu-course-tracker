-- Security Fix 01 — Revoke Unnecessary TRUNCATE Permissions
-- Records the fix already applied manually and verified on the live project.
-- Changes privileges only; does not delete rows or alter other privileges.
-- Forward-only security fix: do not automatically restore unsafe grants.
BEGIN;

REVOKE TRUNCATE ON TABLE
  public.admin_audit_log,
  public.app_permissions,
  public.app_roles,
  public.course_tracker_data,
  public.profiles,
  public.role_permissions,
  public.site_settings,
  public.support_rate_limits,
  public.support_replies,
  public.support_tickets,
  public.user_permissions,
  public.user_roles
FROM PUBLIC, anon, authenticated;

COMMIT;

