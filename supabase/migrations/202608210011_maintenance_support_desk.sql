begin;

insert into public.app_permissions (name, description)
values
  ('support.read', 'View support tickets and replies.'),
  ('support.manage', 'Update support tickets and add replies.'),
  ('maintenance.manage', 'Turn website maintenance mode on or off.')
on conflict (name) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.app_roles role
join public.app_permissions permission on permission.name in ('support.read', 'support.manage')
where role.name = 'admin'
on conflict do nothing;

-- Keep the authoritative access RPC in sync with the expanded permission catalog.
-- provision_admin_account delegates to this function, so existing provisioning remains atomic.
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

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.app_roles role
cross join public.app_permissions permission
where role.name = 'super_admin'
  and permission.name in ('support.read', 'support.manage', 'maintenance.manage')
on conflict do nothing;

create table public.site_settings (
  id text primary key check (id = 'global'),
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'BRACU Course Tracker is temporarily unavailable while we complete an update. Please check back shortly.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values ('global') on conflict (id) do nothing;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  requester_name text not null check (char_length(requester_name) between 2 and 100),
  requester_email text not null check (char_length(requester_email) between 3 and 254),
  message text not null check (char_length(message) between 4 and 4000),
  source text not null check (source in ('maintenance', 'auth', 'dashboard')),
  status text not null default 'active' check (status in ('active', 'working_on_it', 'solved', 'cancelled')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  delivery_method text not null check (delivery_method in ('dashboard', 'mailto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now()
);

create or replace function public.consume_support_rate_limit(
  rate_key text,
  window_seconds integer,
  max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if rate_key is null or length(rate_key) < 16
     or window_seconds < 1 or max_requests < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.support_rate_limits as limits
    (key_hash, window_started_at, request_count, updated_at)
  values (rate_key, now(), 1, now())
  on conflict (key_hash) do update
  set window_started_at = case
        when limits.window_started_at <= now() - make_interval(secs => window_seconds)
          then now()
        else limits.window_started_at
      end,
      request_count = case
        when limits.window_started_at <= now() - make_interval(secs => window_seconds)
          then 1
        else limits.request_count + 1
      end,
      updated_at = now()
  returning request_count <= max_requests into allowed;

  return allowed;
end;
$$;

create index support_tickets_status_created_idx on public.support_tickets (status, created_at desc);
create index support_tickets_created_idx on public.support_tickets (created_at desc);
create index support_tickets_requester_created_idx on public.support_tickets (requester_user_id, created_at desc);
create index support_replies_ticket_created_idx on public.support_replies (ticket_id, created_at asc);

create or replace function public.support_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger support_tickets_touch_updated_at before update on public.support_tickets
for each row execute function public.support_touch_updated_at();
create trigger support_replies_touch_updated_at before update on public.support_replies
for each row execute function public.support_touch_updated_at();

alter table public.site_settings enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_replies enable row level security;
alter table public.support_rate_limits enable row level security;

create policy site_settings_read_public on public.site_settings
for select to anon, authenticated using (id = 'global');
create policy site_settings_manage_authorized on public.site_settings
for update to authenticated using (public.authorize('maintenance.manage'))
with check (public.authorize('maintenance.manage'));

create policy support_tickets_read_own on public.support_tickets
for select to authenticated using (auth.uid() = requester_user_id);
create policy support_tickets_read_authorized on public.support_tickets
for select to authenticated using (public.authorize('support.read'));
create policy support_tickets_manage_authorized on public.support_tickets
for update to authenticated using (public.authorize('support.manage'))
with check (public.authorize('support.manage'));

create policy support_replies_read_own on public.support_replies
for select to authenticated using (
  exists (
    select 1 from public.support_tickets ticket
    where ticket.id = ticket_id and auth.uid() = ticket.requester_user_id
  )
);
create policy support_replies_read_authorized on public.support_replies
for select to authenticated using (public.authorize('support.read'));
create policy support_replies_manage_authorized on public.support_replies
for all to authenticated using (public.authorize('support.manage'))
with check (public.authorize('support.manage'));

grant select on public.site_settings to anon, authenticated;
grant select on public.support_tickets, public.support_replies to authenticated;
grant select, insert, update, delete on public.site_settings, public.support_tickets, public.support_replies to service_role;
grant select, insert, update, delete on public.support_rate_limits to service_role;
revoke insert, update, delete on public.site_settings from public, anon, authenticated;
revoke insert, update, delete on public.support_tickets from public, anon, authenticated;
revoke insert, update, delete on public.support_replies from public, anon, authenticated;
revoke all on function public.consume_support_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_support_rate_limit(text, integer, integer) to service_role;

commit;
