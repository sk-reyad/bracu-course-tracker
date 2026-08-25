begin;

grant select, update
on table public.profiles
to service_role;

grant select
on table
  public.app_roles,
  public.app_permissions,
  public.role_permissions
to service_role;

grant select, insert, update, delete
on table public.user_roles, public.user_permissions
to service_role;

grant insert
on table public.admin_audit_log
to service_role;

grant usage, select
on sequence public.admin_audit_log_id_seq
to service_role;

commit;
