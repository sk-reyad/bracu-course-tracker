begin;

-- Browser clients may read their profile, but profile mutations must use the
-- validated onboarding/profile RPCs. Privileged identity changes use service_role.
revoke update on table public.profiles from authenticated;

-- Prevent low-privilege profile viewers from discovering administrator records
-- through the Data API. Administrator visibility requires admins.read.
drop policy if exists profiles_select_authorized on public.profiles;
create policy profiles_select_authorized on public.profiles
for select to authenticated
using (
  (id = auth.uid() and status in ('pending', 'active'))
  or (
    public.authorize('profiles.read')
    and exists (
      select 1
      from public.user_roles target_user_role
      join public.app_roles target_role on target_role.id = target_user_role.role_id
      where target_user_role.user_id = profiles.id
        and target_role.name = 'student'
    )
  )
  or (
    public.authorize('admins.read')
    and exists (
      select 1
      from public.user_roles target_user_role
      join public.app_roles target_role on target_role.id = target_user_role.role_id
      where target_user_role.user_id = profiles.id
        and target_role.name in ('admin', 'super_admin')
    )
  )
);

drop policy if exists user_roles_read_self_or_authorized on public.user_roles;
create policy user_roles_read_self_or_authorized on public.user_roles
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.authorize('users.read')
    and exists (
      select 1
      from public.app_roles target_role
      where target_role.id = user_roles.role_id
        and target_role.name = 'student'
    )
  )
  or (
    public.authorize('admins.read')
    and exists (
      select 1
      from public.app_roles target_role
      where target_role.id = user_roles.role_id
        and target_role.name in ('admin', 'super_admin')
    )
  )
);

-- These RLS helpers remain executable by authenticated users, but an ordinary
-- session can now ask only about itself. Auth hooks and service_role retain the
-- cross-user lookup needed for token creation and server administration.
create or replace function public.current_account_active(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    check_user = auth.uid()
    or coalesce(current_setting('role', true), '') in ('service_role', 'supabase_auth_admin')
  ) and exists (
    select 1 from public.profiles
    where id = check_user and status = 'active'
  );
$$;

create or replace function public.current_app_role(check_user uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when check_user = auth.uid()
      or coalesce(current_setting('role', true), '') in ('service_role', 'supabase_auth_admin')
    then coalesce((
      select role.name
      from public.user_roles user_role
      join public.app_roles role on role.id = user_role.role_id
      where user_role.user_id = check_user
    ), 'student')
    else 'student'
  end;
$$;

create or replace function public.profile_asset_access_allowed(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    check_user = auth.uid()
    or coalesce(current_setting('role', true), '') in ('service_role', 'supabase_auth_admin')
  ) and exists (
    select 1 from public.profiles
    where id = check_user and status in ('pending', 'active')
  );
$$;

-- `current_role` is a PostgreSQL context keyword. Using it as a PL/pgSQL
-- variable made the deployed guard ambiguous and triggered database lint.
create or replace function public.set_account_access(
  target_user uuid,
  target_role text,
  target_permissions text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role_id bigint;
  existing_role_name text;
  existing_status text;
  active_super_admin_count bigint;
  manageable_permissions constant text[] := array[
    'profiles.read', 'users.read', 'users.identity.manage',
    'users.status.manage', 'admins.read', 'admins.manage', 'permissions.manage',
    'support.read', 'support.manage', 'maintenance.manage'
  ]::text[];
begin
  if target_user is null then
    raise exception 'Target user is required';
  end if;
  if target_role is null or target_role not in ('student', 'admin', 'super_admin') then
    raise exception 'Invalid account role';
  end if;
  if target_role = 'student'
     and cardinality(coalesce(target_permissions, array[]::text[])) > 0 then
    raise exception 'Student accounts cannot receive administrator permissions';
  end if;
  if exists (
    select 1
    from unnest(coalesce(target_permissions, array[]::text[])) as supplied(permission_code)
    where supplied.permission_code <> all(manageable_permissions)
  ) then
    raise exception 'Unknown permission code';
  end if;

  perform pg_advisory_xact_lock(202608140009);
  select role.name, profile.status
    into existing_role_name, existing_status
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.id = target_user;

  if existing_role_name is null then
    raise exception 'Target account is unavailable';
  end if;

  select count(*)
    into active_super_admin_count
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.status = 'active'
    and role.name = 'super_admin';

  if existing_role_name = 'super_admin'
     and existing_status = 'active'
     and target_role <> 'super_admin'
     and active_super_admin_count <= 1 then
    raise exception 'The last active Super Admin cannot be suspended or demoted.';
  end if;

  if target_role = 'super_admin' then
    target_permissions := manageable_permissions;
  end if;

  select role.id into selected_role_id
  from public.app_roles role
  where role.name = target_role;
  if selected_role_id is null then
    raise exception 'Configured account role is unavailable';
  end if;

  insert into public.user_roles (user_id, role_id, updated_at)
  values (target_user, selected_role_id, now())
  on conflict (user_id)
  do update set role_id = excluded.role_id, updated_at = excluded.updated_at;

  insert into public.user_permissions (user_id, permission_id, granted, updated_at)
  select target_user, permission.id,
         permission.name = any(coalesce(target_permissions, array[]::text[])), now()
  from public.app_permissions permission
  where permission.name = any(manageable_permissions)
  on conflict (user_id, permission_id)
  do update set granted = excluded.granted, updated_at = excluded.updated_at;

  return public.admin_effective_access(target_user);
end;
$$;

create or replace function public.set_account_status_guarded(
  target_user uuid,
  target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_role_name text;
  existing_status text;
  active_super_admin_count bigint;
begin
  if target_user is null then
    raise exception 'Target user is required';
  end if;
  if target_status is null or target_status not in ('active', 'suspended') then
    raise exception 'Invalid account status';
  end if;

  perform pg_advisory_xact_lock(202608140009);
  select role.name, profile.status
    into existing_role_name, existing_status
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.id = target_user;

  if existing_role_name is null then
    raise exception 'Target account is unavailable';
  end if;

  select count(*)
    into active_super_admin_count
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.status = 'active'
    and role.name = 'super_admin';

  if existing_role_name = 'super_admin'
     and existing_status = 'active'
     and target_status = 'suspended'
     and active_super_admin_count <= 1 then
    raise exception 'The last active Super Admin cannot be suspended or demoted.';
  end if;

  update public.profiles
  set status = target_status,
      updated_at = now()
  where id = target_user;

  return public.admin_effective_access(target_user);
end;
$$;

-- Harden legacy functions created before the project adopted an empty search_path.
alter function public.authorize(text) set search_path = '';
alter function public.handle_new_auth_user() set search_path = '';
alter function public.immutable_profile_identity() set search_path = '';
alter function public.hook_restrict_signup(jsonb) set search_path = '';
alter function public.custom_access_token_hook(jsonb) set search_path = '';
alter function public.complete_student_onboarding(text, text, text, integer, text, text) set search_path = '';
alter function public.update_student_profile(text, text, text, integer, text, text) set search_path = '';

revoke all on function public.current_account_active(uuid) from public, anon;
revoke all on function public.current_app_role(uuid) from public, anon;
revoke all on function public.profile_asset_access_allowed(uuid) from public, anon;
revoke all on function public.set_account_access(uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.set_account_status_guarded(uuid, text) from public, anon, authenticated;
grant execute on function public.current_account_active(uuid) to authenticated;
grant execute on function public.current_app_role(uuid) to authenticated;
grant execute on function public.profile_asset_access_allowed(uuid) to authenticated;
grant execute on function public.set_account_access(uuid, text, text[]) to service_role;
grant execute on function public.set_account_status_guarded(uuid, text) to service_role;

notify pgrst, 'reload schema';

commit;
