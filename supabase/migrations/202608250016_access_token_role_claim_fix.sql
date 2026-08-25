begin;

-- The access-token hook is invoked by Supabase Auth, not by the signing-in
-- user. Calling the caller-sensitive role helper from this context can fall back
-- to `student` even when the protected role mapping is administrative.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  token_role text := 'student';
  token_status text := 'pending';
  token_permissions jsonb := '[]'::jsonb;
begin
  select app_role.name, profile.status
    into token_role, token_status
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles app_role on app_role.id = user_role.role_id
  where profile.id = (event->>'user_id')::uuid;

  select coalesce(jsonb_agg(permission.name order by permission.name), '[]'::jsonb)
    into token_permissions
  from public.app_permissions permission
  where coalesce(
    (
      select permission_override.granted
      from public.user_permissions permission_override
      where permission_override.user_id = (event->>'user_id')::uuid
        and permission_override.permission_id = permission.id
    ),
    exists (
      select 1
      from public.user_roles user_role
      join public.role_permissions role_permission
        on role_permission.role_id = user_role.role_id
      where user_role.user_id = (event->>'user_id')::uuid
        and role_permission.permission_id = permission.id
    )
  );

  claims := jsonb_set(claims, '{app_role}', to_jsonb(coalesce(token_role, 'student')), true);
  claims := jsonb_set(claims, '{app_permissions}', token_permissions, true);
  claims := jsonb_set(claims, '{account_status}', to_jsonb(coalesce(token_status, 'pending')), true);

  return jsonb_build_object('claims', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb)
from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb)
to supabase_auth_admin;

commit;
