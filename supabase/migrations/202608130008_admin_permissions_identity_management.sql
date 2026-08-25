begin;

insert into public.app_permissions (name, description)
values ('users.identity.manage', 'Change student names and G-Suite emails')
on conflict (name) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.app_roles role
join public.app_permissions permission on permission.name = 'users.identity.manage'
where role.name = 'super_admin'
on conflict do nothing;

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
  current_role text;
  current_status text;
  active_super_admin_count bigint;
  manageable_permissions constant text[] := array[
    'profiles.read', 'users.read', 'users.identity.manage',
    'users.status.manage', 'admins.read', 'admins.manage', 'permissions.manage'
  ]::text[];
begin
  if target_user is null then
    raise exception 'Target user is required';
  end if;

  if target_role is null or target_role not in ('student', 'admin', 'super_admin') then
    raise exception 'Invalid account role';
  end if;

  if exists (
    select 1
    from unnest(coalesce(target_permissions, array[]::text[])) as supplied(permission_code)
    where supplied.permission_code <> all(manageable_permissions)
  ) then
    raise exception 'Unknown permission code';
  end if;

  perform pg_advisory_xact_lock(202608130008);

  select role.name, profile.status
    into current_role, current_status
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.id = target_user;

  if current_role is null then
    raise exception 'Target account is unavailable';
  end if;

  select count(*)
    into active_super_admin_count
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.status = 'active'
    and role.name = 'super_admin';

  if current_role = 'super_admin'
     and current_status = 'active'
     and target_role <> 'super_admin'
     and active_super_admin_count <= 1 then
    raise exception 'The last active Super Admin cannot be suspended or demoted.';
  end if;

  if target_role = 'super_admin' then
    target_permissions := manageable_permissions;
  end if;

  select role.id
    into selected_role_id
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
  where permission.name = any(array[
    'profiles.read', 'users.read', 'users.identity.manage',
    'users.status.manage', 'admins.read', 'admins.manage', 'permissions.manage'
  ]::text[])
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
  current_role text;
  current_status text;
  active_super_admin_count bigint;
begin
  if target_user is null then
    raise exception 'Target user is required';
  end if;

  if target_status is null or target_status not in ('active', 'suspended') then
    raise exception 'Invalid account status';
  end if;

  perform pg_advisory_xact_lock(202608130008);

  select role.name, profile.status
    into current_role, current_status
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.id = target_user;

  if current_role is null then
    raise exception 'Target account is unavailable';
  end if;

  select count(*)
    into active_super_admin_count
  from public.profiles profile
  join public.user_roles user_role on user_role.user_id = profile.id
  join public.app_roles role on role.id = user_role.role_id
  where profile.status = 'active'
    and role.name = 'super_admin';

  if current_role = 'super_admin'
     and current_status = 'active'
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

create or replace function public.provision_admin_account(
  target_user uuid,
  target_full_name text,
  target_email text,
  target_role text,
  target_permissions text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user is null then
    raise exception 'Target user is required';
  end if;

  if target_role is null or target_role not in ('admin', 'super_admin') then
    raise exception 'Administrator role must be admin or super_admin';
  end if;

  insert into public.profiles (id, full_name, email, status, onboarding_completed)
  values (target_user, target_full_name, lower(target_email), 'active', true)
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      status = excluded.status,
      onboarding_completed = excluded.onboarding_completed,
      updated_at = now();

  perform public.set_account_access(target_user, target_role, target_permissions);

  return public.admin_effective_access(target_user);
end;
$$;

revoke all on function public.provision_admin_account(uuid, text, text, text, text[]) from public, anon, authenticated;
revoke all on function public.set_account_access(uuid, text, text[]) from public, anon, authenticated;
revoke all on function public.set_account_status_guarded(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_effective_access(uuid) from public, anon, authenticated;

grant execute on function public.provision_admin_account(uuid, text, text, text, text[]) to service_role;
grant execute on function public.set_account_access(uuid, text, text[]) to service_role;
grant execute on function public.set_account_status_guarded(uuid, text) to service_role;
grant execute on function public.admin_effective_access(uuid) to service_role;

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

-- Existing foreign keys already cascade account cleanup through auth.users or profiles.
select
  source_table::regclass as source_table,
  target_table::regclass as target_table,
  delete_action
from (
  select
    constraint_row.conrelid as source_table,
    constraint_row.confrelid as target_table,
    constraint_row.confdeltype as delete_action
  from pg_constraint constraint_row
  where constraint_row.contype = 'f'
    and constraint_row.conrelid in (
      'public.profiles'::regclass,
      'public.login_events'::regclass,
      'public.course_tracker_data'::regclass,
      'public.user_roles'::regclass,
      'public.user_permissions'::regclass
    )
) cascade_constraints
where delete_action = 'c';

notify pgrst, 'reload schema';

commit;
