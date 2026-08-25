begin;

-- SQL-created tables do not receive Data API privileges automatically.
-- RLS remains the row-level authorization boundary for every grant below.
grant select, update on table public.profiles to authenticated;

grant select on table public.app_roles to authenticated;
grant select on table public.app_permissions to authenticated;
grant select on table public.role_permissions to authenticated;
grant select on table public.user_roles to authenticated;
grant select on table public.user_permissions to authenticated;
grant select on table public.admin_audit_log to authenticated;

grant select, insert, update, delete on table public.course_tracker_data to authenticated;

commit;
