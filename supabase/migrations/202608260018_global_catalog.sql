begin;

-- Shared catalog records are additive: deleting a catalog row only stops future
-- distribution and never mutates a user's existing local/cloud tracker data.
create table public.catalog_departments (
  id text primary key check (
    id = upper(regexp_replace(btrim(id), '[[:space:]]+', '', 'g'))
    and id ~ '^[A-Z][A-Z0-9_-]{1,15}$'
  ),
  name text not null check (char_length(btrim(name)) between 1 and 180),
  color text not null default 'gray' check (color ~ '^[a-z][a-z0-9-]{0,31}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_courses (
  code text primary key check (
    code = upper(regexp_replace(btrim(code), '[[:space:]]+', '', 'g'))
    and code ~ '^[A-Z]{2,6}[0-9]{2,4}[A-Z]?$'
  ),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  credits numeric(3,1) not null check (credits >= 0 and credits <= 20),
  department text not null references public.catalog_departments(id) on delete restrict,
  category text not null check (category ~ '^[a-z0-9][a-z0-9-]{0,49}$'),
  roadmap_level integer check (roadmap_level between 1 and 30),
  roadmap_order integer check (roadmap_order between 1 and 100),
  hard_prerequisites text[] not null default '{}',
  soft_prerequisites text[] not null default '{}',
  source_note text check (source_note is null or char_length(source_note) <= 500),
  is_roadmap_slot boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    cardinality(hard_prerequisites) <= 30
    and (
      cardinality(hard_prerequisites) = 0
      or array_to_string(hard_prerequisites, ',') ~ '^[A-Z]{2,6}[0-9]{2,4}[A-Z]?(,[A-Z]{2,6}[0-9]{2,4}[A-Z]?)*$'
    )
    and not (code = any(hard_prerequisites))
  ),
  check (
    cardinality(soft_prerequisites) <= 30
    and (
      cardinality(soft_prerequisites) = 0
      or array_to_string(soft_prerequisites, ',') ~ '^[A-Z]{2,6}[0-9]{2,4}[A-Z]?(,[A-Z]{2,6}[0-9]{2,4}[A-Z]?)*$'
    )
    and not (code = any(soft_prerequisites))
  )
);

create index catalog_courses_department_idx on public.catalog_courses(department);
create index catalog_courses_created_by_idx on public.catalog_courses(created_by);
create index catalog_courses_hard_prerequisites_gin_idx
on public.catalog_courses using gin (hard_prerequisites);
create index catalog_courses_soft_prerequisites_gin_idx
on public.catalog_courses using gin (soft_prerequisites);

create table public.catalog_faculties (
  initial text primary key check (
    initial = upper(regexp_replace(btrim(initial), '[[:space:]]+', '', 'g'))
    and initial ~ '^[A-Z][A-Z0-9]{1,9}$'
  ),
  name text not null check (char_length(btrim(name)) between 1 and 180),
  email text check (
    email is null
    or (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
  ),
  department text not null references public.catalog_departments(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_faculties_department_idx on public.catalog_faculties(department);
create index catalog_faculties_created_by_idx on public.catalog_faculties(created_by);
create index catalog_departments_created_by_idx on public.catalog_departments(created_by);

alter table public.catalog_departments enable row level security;
alter table public.catalog_courses enable row level security;
alter table public.catalog_faculties enable row level security;

revoke all on table public.catalog_departments from public, anon, authenticated;
revoke all on table public.catalog_courses from public, anon, authenticated;
revoke all on table public.catalog_faculties from public, anon, authenticated;
grant select (id, name, color) on table public.catalog_departments to authenticated;
grant select (
  code, title, credits, department, category, roadmap_level, roadmap_order,
  hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot
) on table public.catalog_courses to authenticated;
grant select (initial, name, email, department) on table public.catalog_faculties to authenticated;
grant select, insert, update, delete on table public.catalog_departments to service_role;
grant select, insert, update, delete on table public.catalog_courses to service_role;
grant select, insert, update, delete on table public.catalog_faculties to service_role;

create policy catalog_departments_select_active on public.catalog_departments
for select to authenticated
using ((select public.current_account_active((select auth.uid()))));

create policy catalog_courses_select_active on public.catalog_courses
for select to authenticated
using ((select public.current_account_active((select auth.uid()))));

create policy catalog_faculties_select_active on public.catalog_faculties
for select to authenticated
using ((select public.current_account_active((select auth.uid()))));

insert into public.app_permissions (name, description)
values ('catalog.manage', 'Manage shared departments, courses, and faculty')
on conflict (name) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.app_roles role
join public.app_permissions permission on permission.name = 'catalog.manage'
where role.name = 'super_admin'
on conflict do nothing;

-- Catalog mutation and its successful audit record share one transaction.
-- Only the server-side Edge Function service credential may execute this RPC.
create or replace function public.mutate_global_catalog(
  catalog_action text,
  catalog_kind text,
  catalog_item jsonb,
  actor_id uuid,
  audit_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_access jsonb;
  input_key text;
  before_item jsonb;
  after_item jsonb;
  hard_codes text[] := array[]::text[];
  soft_codes text[] := array[]::text[];
  result jsonb;
begin
  if catalog_action not in ('upsert', 'delete')
     or catalog_kind not in ('department', 'course', 'faculty')
     or catalog_item is null
     or jsonb_typeof(catalog_item) <> 'object'
     or actor_id is null
     or audit_request_id is null then
    raise exception 'Invalid global catalog request';
  end if;

  perform pg_advisory_xact_lock(202608260018);

  actor_access := public.admin_effective_access(actor_id);
  if actor_access is null
     or actor_access->>'status' <> 'active'
     or actor_access->>'role' not in ('admin', 'super_admin')
     or not coalesce((actor_access->'permissions') ? 'catalog.manage', false) then
    raise exception 'Catalog management access is required.';
  end if;

  input_key := case catalog_kind
    when 'department' then catalog_item->>'id'
    when 'course' then catalog_item->>'code'
    else catalog_item->>'initial'
  end;
  if input_key is null or input_key = '' then
    raise exception 'Invalid global catalog request';
  end if;

  if catalog_action = 'upsert' then
    if catalog_kind = 'department' then
      select to_jsonb(department) into before_item
      from public.catalog_departments department
      where department.id = input_key
      for update;

      insert into public.catalog_departments (id, name, color, created_by)
      values (input_key, catalog_item->>'name', coalesce(catalog_item->>'color', 'gray'), actor_id)
      on conflict (id) do update
      set name = excluded.name,
          color = excluded.color,
          updated_at = now()
      returning jsonb_build_object(
        'id', id, 'name', name, 'color', color, 'created_by', created_by,
        'created_at', created_at, 'updated_at', updated_at
      ) into after_item;

    elsif catalog_kind = 'faculty' then
      if not exists (
        select 1 from public.catalog_departments department
        where department.id = catalog_item->>'department'
      ) then
        raise exception 'The selected department does not exist.';
      end if;
      select to_jsonb(faculty) into before_item
      from public.catalog_faculties faculty
      where faculty.initial = input_key
      for update;

      insert into public.catalog_faculties (initial, name, email, department, created_by)
      values (
        input_key, catalog_item->>'name', nullif(catalog_item->>'email', ''),
        catalog_item->>'department', actor_id
      )
      on conflict (initial) do update
      set name = excluded.name,
          email = excluded.email,
          department = excluded.department,
          updated_at = now()
      returning jsonb_build_object(
        'initial', initial, 'name', name, 'email', email, 'department', department,
        'created_by', created_by, 'created_at', created_at, 'updated_at', updated_at
      ) into after_item;

    else
      if jsonb_typeof(coalesce(catalog_item->'hard_prerequisites', '[]'::jsonb)) <> 'array'
         or jsonb_typeof(coalesce(catalog_item->'soft_prerequisites', '[]'::jsonb)) <> 'array' then
        raise exception 'Invalid course prerequisites';
      end if;
      select coalesce(array_agg(code), array[]::text[]) into hard_codes
      from jsonb_array_elements_text(coalesce(catalog_item->'hard_prerequisites', '[]'::jsonb)) codes(code);
      select coalesce(array_agg(code), array[]::text[]) into soft_codes
      from jsonb_array_elements_text(coalesce(catalog_item->'soft_prerequisites', '[]'::jsonb)) codes(code);
      if input_key = any(hard_codes) or input_key = any(soft_codes) then
        raise exception 'A course cannot require itself.';
      end if;
      if exists (
        select 1
        from unnest(hard_codes || soft_codes) required_course(code)
        where not exists (
          select 1 from public.catalog_courses existing_course
          where existing_course.code = required_course.code
        )
      ) then
        raise exception 'Every course prerequisite must already exist in the global catalog.';
      end if;
      if not exists (
        select 1 from public.catalog_departments department
        where department.id = catalog_item->>'department'
      ) then
        raise exception 'The selected department does not exist.';
      end if;
      select to_jsonb(course) into before_item
      from public.catalog_courses course
      where course.code = input_key
      for update;

      insert into public.catalog_courses (
        code, title, credits, department, category, roadmap_level, roadmap_order,
        hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot, created_by
      ) values (
        input_key, catalog_item->>'title', (catalog_item->>'credits')::numeric,
        catalog_item->>'department', catalog_item->>'category',
        nullif(catalog_item->>'roadmap_level', '')::integer,
        nullif(catalog_item->>'roadmap_order', '')::integer,
        hard_codes, soft_codes, nullif(catalog_item->>'source_note', ''),
        coalesce((catalog_item->>'is_roadmap_slot')::boolean, false), actor_id
      )
      on conflict (code) do update
      set title = excluded.title,
          credits = excluded.credits,
          department = excluded.department,
          category = excluded.category,
          roadmap_level = excluded.roadmap_level,
          roadmap_order = excluded.roadmap_order,
          hard_prerequisites = excluded.hard_prerequisites,
          soft_prerequisites = excluded.soft_prerequisites,
          source_note = excluded.source_note,
          is_roadmap_slot = excluded.is_roadmap_slot,
          updated_at = now()
      returning jsonb_build_object(
        'code', code, 'title', title, 'credits', credits, 'department', department,
        'category', category, 'roadmap_level', roadmap_level, 'roadmap_order', roadmap_order,
        'hard_prerequisites', hard_prerequisites, 'soft_prerequisites', soft_prerequisites,
        'source_note', source_note, 'is_roadmap_slot', is_roadmap_slot,
        'created_by', created_by, 'created_at', created_at, 'updated_at', updated_at
      ) into after_item;
    end if;

    result := jsonb_build_object('kind', catalog_kind, 'item', after_item);
  else
    if catalog_kind = 'department' then
      select to_jsonb(department) into before_item
      from public.catalog_departments department
      where department.id = input_key
      for update;
      if exists (select 1 from public.catalog_courses course where course.department = input_key)
         or exists (select 1 from public.catalog_faculties faculty where faculty.department = input_key) then
        raise exception 'Catalog item is referenced by another catalog record.';
      end if;
      delete from public.catalog_departments where id = input_key;
    elsif catalog_kind = 'faculty' then
      select to_jsonb(faculty) into before_item
      from public.catalog_faculties faculty
      where faculty.initial = input_key
      for update;
      delete from public.catalog_faculties where initial = input_key;
    else
      select to_jsonb(selected_course) into before_item
      from public.catalog_courses selected_course
      where selected_course.code = input_key
      for update;
      if exists (
        select 1 from public.catalog_courses course
        where course.hard_prerequisites @> array[input_key]
           or course.soft_prerequisites @> array[input_key]
      ) then
        raise exception 'Catalog item is referenced by another catalog record.';
      end if;
      delete from public.catalog_courses where code = input_key;
    end if;

    if before_item is null then
      raise exception 'The global catalog item was not found.';
    end if;
    result := jsonb_build_object('kind', catalog_kind, 'key', input_key, 'deleted', true);
  end if;

  insert into public.admin_audit_log (
    actor_id, target_id, action, succeeded, before_values, after_values, request_id
  ) values (
    actor_id, null, catalog_action || '-catalog-item', true,
    jsonb_build_object('kind', catalog_kind, 'item', before_item), result, audit_request_id
  );
  return result;
end;
$$;

revoke all on function public.mutate_global_catalog(text, text, jsonb, uuid, uuid)
from public, anon, authenticated;
grant execute on function public.mutate_global_catalog(text, text, jsonb, uuid, uuid)
to service_role;

-- This forward-only replacement extends the authoritative allowlist without
-- editing the deployed migration that introduced the access function.
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
    'support.read', 'support.manage', 'maintenance.manage', 'catalog.manage'
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

revoke all on function public.set_account_access(uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.set_account_access(uuid, text, text[]) to service_role;

alter table public.admin_rate_limits
  drop constraint if exists admin_rate_limits_action_name_check;
alter table public.admin_rate_limits
  add constraint admin_rate_limits_action_name_check check (action_name in (
    'create-admin', 'update-user-identity', 'update-admin-identity', 'delete-account',
    'set-account-status', 'set-role', 'set-user-permissions',
    'upsert-catalog-item', 'delete-catalog-item'
  ));

create or replace function public.consume_admin_rate_limit(
  actor_id uuid,
  action_name text,
  window_seconds integer,
  max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  input_actor_id constant uuid := $1;
  input_action_name constant text := $2;
  allowed boolean;
begin
  if input_actor_id is null
     or input_action_name is null
     or input_action_name not in (
       'create-admin', 'update-user-identity', 'update-admin-identity', 'delete-account',
       'set-account-status', 'set-role', 'set-user-permissions',
       'upsert-catalog-item', 'delete-catalog-item'
     )
     or window_seconds is null or window_seconds < 1 or window_seconds > 3600
     or max_requests is null or max_requests < 1 or max_requests > 100 then
    raise exception 'Invalid administrator rate limit parameters';
  end if;

  insert into public.admin_rate_limits as limits
    (actor_id, action_name, window_started_at, request_count, updated_at)
  values (input_actor_id, input_action_name, now(), 1, now())
  on conflict on constraint admin_rate_limits_pkey do update
  set window_started_at = case
        when limits.window_started_at <= now() - make_interval(secs => window_seconds)
          then now()
        else limits.window_started_at
      end,
      request_count = case
        when limits.window_started_at <= now() - make_interval(secs => window_seconds)
          then 1
        else least(limits.request_count + 1, max_requests + 1)
      end,
      last_blocked_at = case
        when limits.window_started_at <= now() - make_interval(secs => window_seconds)
          then null
        when limits.request_count >= max_requests
          then now()
        else limits.last_blocked_at
      end,
      updated_at = now()
  returning request_count <= max_requests into allowed;

  return allowed;
end;
$$;

revoke all on function public.consume_admin_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_admin_rate_limit(uuid, text, integer, integer) to service_role;

notify pgrst, 'reload schema';

commit;
