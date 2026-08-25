begin;

create table public.admin_rate_limits (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action_name text not null check (action_name in (
    'create-admin',
    'update-user-identity',
    'update-admin-identity',
    'delete-account',
    'set-account-status',
    'set-role',
    'set-user-permissions'
  )),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0),
  last_blocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (actor_id, action_name)
);

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
       'create-admin',
       'update-user-identity',
       'update-admin-identity',
       'delete-account',
       'set-account-status',
       'set-role',
       'set-user-permissions'
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

alter table public.admin_rate_limits enable row level security;

revoke all on table public.admin_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_rate_limits to service_role;

revoke all on function public.consume_admin_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_admin_rate_limit(uuid, text, integer, integer) to service_role;

commit;
