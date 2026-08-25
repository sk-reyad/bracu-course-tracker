begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  student_id text unique,
  program text check (program in ('BSc in Computer Science & Engineering (CSE)', 'BSc in Computer Science (CS)')),
  starting_term text check (starting_term in ('Spring', 'Summer', 'Fall')),
  starting_year integer check (starting_year between 2001 and 2100),
  avatar_path text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_roles (
  id bigint generated always as identity primary key,
  name text not null unique check (name in ('student', 'admin', 'super_admin'))
);

create table public.app_permissions (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text not null default ''
);

create table public.role_permissions (
  role_id bigint not null references public.app_roles(id) on delete cascade,
  permission_id bigint not null references public.app_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id bigint not null references public.app_roles(id),
  updated_at timestamptz not null default now()
);

create table public.user_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_id bigint not null references public.app_permissions(id) on delete cascade,
  granted boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, permission_id)
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  action text not null,
  succeeded boolean not null,
  before_values jsonb not null default '{}'::jsonb,
  after_values jsonb not null default '{}'::jsonb,
  request_id uuid not null,
  created_at timestamptz not null default now()
);

insert into public.app_roles (name)
values ('student'), ('admin'), ('super_admin')
on conflict (name) do nothing;

insert into public.app_permissions (name, description)
values
  ('profiles.read', 'Read account profile summaries'),
  ('users.read', 'List student accounts'),
  ('users.status.manage', 'Suspend and reactivate accounts'),
  ('admins.read', 'List administrator accounts'),
  ('admins.manage', 'Create and edit administrators'),
  ('permissions.manage', 'Assign roles and permission overrides')
on conflict (name) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.app_roles role
join public.app_permissions permission on
  (role.name = 'admin' and permission.name in ('profiles.read', 'users.read', 'users.status.manage', 'admins.read'))
  or role.name = 'super_admin'
on conflict do nothing;

create or replace function public.current_account_active(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and status = 'active'
  );
$$;

create or replace function public.current_app_role(check_user uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role.name
    from public.user_roles ur
    join public.app_roles role on role.id = ur.role_id
    where ur.user_id = check_user
  ), 'student');
$$;

create or replace function public.profile_asset_access_allowed(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and status in ('pending', 'active')
  );
$$;

create or replace function public.authorize(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_account_active(auth.uid()) and exists (
    select 1
    from public.app_permissions permission
    where permission.name = permission_name
      and coalesce(
        (
          select override.granted
          from public.user_permissions override
          where override.user_id = auth.uid()
            and override.permission_id = permission.id
        ),
        exists (
          select 1
          from public.user_roles ur
          join public.role_permissions rp on rp.role_id = ur.role_id
          where ur.user_id = auth.uid()
            and rp.permission_id = permission.id
        )
      )
  );
$$;

revoke all on function public.current_account_active(uuid) from public;
revoke all on function public.current_app_role(uuid) from public;
revoke all on function public.profile_asset_access_allowed(uuid) from public;
revoke all on function public.authorize(text) from public;
grant execute on function public.current_account_active(uuid) to authenticated;
grant execute on function public.current_app_role(uuid) to authenticated;
grant execute on function public.profile_asset_access_allowed(uuid) to authenticated;
grant execute on function public.authorize(text) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_app_meta_data->>'app_role', 'student');
  is_admin boolean := coalesce((new.raw_app_meta_data->>'created_by_admin')::boolean, false)
    and requested_role in ('admin', 'super_admin');
  selected_role_id bigint;
begin
  if not is_admin then requested_role := 'student'; end if;

  insert into public.profiles (
    id, full_name, email, status, onboarding_completed
  ) values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    lower(new.email),
    case when is_admin then 'active' else 'pending' end,
    is_admin
  );

  select id into selected_role_id from public.app_roles where name = requested_role;
  insert into public.user_roles (user_id, role_id) values (new.id, selected_role_id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.immutable_profile_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id then
    if new.full_name is distinct from old.full_name or new.email is distinct from old.email then
      raise exception 'Google-provided name and email cannot be changed';
    end if;
    if (new.status is distinct from old.status or new.onboarding_completed is distinct from old.onboarding_completed)
      and coalesce(current_setting('app.onboarding_rpc', true), '') <> 'true' then
      raise exception 'Account status can only be changed through an authorized server action';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_identity_and_status
before update on public.profiles
for each row execute function public.immutable_profile_identity();

create or replace function public.hook_restrict_signup(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  signup_email text := lower(coalesce(event->'user'->>'email', ''));
  provider text := coalesce(event->'user'->'app_metadata'->>'provider', '');
  created_by_admin boolean := coalesce((event->'user'->'app_metadata'->>'created_by_admin')::boolean, false);
  requested_role text := coalesce(event->'user'->'app_metadata'->>'app_role', '');
begin
  if provider = 'google' and signup_email like '%@g.bracu.ac.bd'
    and split_part(signup_email, '@', 2) = 'g.bracu.ac.bd' then
    return '{}'::jsonb;
  end if;

  if provider = 'email' and created_by_admin and requested_role in ('admin', 'super_admin') then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Please use you official BRAC University G-suite email'
    )
  );
end;
$$;

grant execute on function public.hook_restrict_signup(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup(jsonb) from authenticated, anon, public;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb := event->'claims';
  token_role text := 'student';
  token_status text := 'pending';
  token_permissions jsonb := '[]'::jsonb;
begin
  select public.current_app_role((event->>'user_id')::uuid), profile.status
    into token_role, token_status
  from public.profiles profile
  where profile.id = (event->>'user_id')::uuid;

  select coalesce(jsonb_agg(permission.name order by permission.name), '[]'::jsonb)
    into token_permissions
  from public.app_permissions permission
  where coalesce(
    (
      select override.granted from public.user_permissions override
      where override.user_id = (event->>'user_id')::uuid
        and override.permission_id = permission.id
    ),
    exists (
      select 1 from public.user_roles ur
      join public.role_permissions rp on rp.role_id = ur.role_id
      where ur.user_id = (event->>'user_id')::uuid
        and rp.permission_id = permission.id
    )
  );

  claims := jsonb_set(claims, '{app_role}', to_jsonb(coalesce(token_role, 'student')), true);
  claims := jsonb_set(claims, '{app_permissions}', token_permissions, true);
  claims := jsonb_set(claims, '{account_status}', to_jsonb(coalesce(token_status, 'pending')), true);
  return jsonb_build_object('claims', claims);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles, public.app_roles, public.app_permissions, public.role_permissions, public.user_roles, public.user_permissions to supabase_auth_admin;

create or replace function public.complete_student_onboarding(
  student_id text,
  program text,
  starting_term text,
  starting_year integer,
  avatar_path text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  caller_provider text;
  result public.profiles;
begin
  if caller is null then raise exception 'Authentication required'; end if;

  select lower(users.email), users.raw_app_meta_data->>'provider'
    into caller_email, caller_provider
  from auth.users users where users.id = caller;

  if caller_provider <> 'google' or split_part(caller_email, '@', 2) <> 'g.bracu.ac.bd' then
    raise exception 'Please use you official BRAC University G-suite email';
  end if;
  if nullif(btrim(student_id), '') is null then raise exception 'Student ID is required'; end if;
  if program not in ('BSc in Computer Science & Engineering (CSE)', 'BSc in Computer Science (CS)') then raise exception 'Invalid program'; end if;
  if starting_term not in ('Spring', 'Summer', 'Fall') then raise exception 'Invalid starting term'; end if;
  if starting_year not between 2001 and 2100 then raise exception 'Invalid starting year'; end if;
  if not exists (select 1 from public.profiles where id = caller and status = 'pending' and not onboarding_completed) then
    raise exception 'Onboarding is unavailable for this account';
  end if;

  perform set_config('app.onboarding_rpc', 'true', true);
  update public.profiles
  set student_id = btrim(complete_student_onboarding.student_id),
      program = complete_student_onboarding.program,
      starting_term = complete_student_onboarding.starting_term,
      starting_year = complete_student_onboarding.starting_year,
      avatar_path = nullif(btrim(complete_student_onboarding.avatar_path), ''),
      status = 'active',
      onboarding_completed = true,
      updated_at = now()
  where id = caller
  returning * into result;
  return result;
end;
$$;

revoke all on function public.complete_student_onboarding(text, text, text, integer, text) from public;
grant execute on function public.complete_student_onboarding(text, text, text, integer, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.app_roles enable row level security;
alter table public.app_permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.admin_audit_log enable row level security;

create policy profiles_select_authorized on public.profiles
for select to authenticated
using ((id = auth.uid() and status in ('pending', 'active')) or public.authorize('profiles.read'));

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid() and status in ('pending', 'active'))
with check (id = auth.uid());

create policy roles_read_authorized on public.app_roles
for select to authenticated using (public.authorize('admins.read') or public.authorize('users.read'));
create policy permissions_read_authorized on public.app_permissions
for select to authenticated using (public.authorize('admins.read') or public.authorize('users.read'));
create policy role_permissions_read_authorized on public.role_permissions
for select to authenticated using (public.authorize('admins.read') or public.authorize('users.read'));
create policy user_roles_read_self_or_authorized on public.user_roles
for select to authenticated using (user_id = auth.uid() or public.authorize('users.read') or public.authorize('admins.read'));
create policy user_permissions_read_self_or_authorized on public.user_permissions
for select to authenticated using (user_id = auth.uid() or public.authorize('permissions.manage'));
create policy audit_read_super_admin on public.admin_audit_log
for select to authenticated using (public.authorize('permissions.manage'));

commit;
