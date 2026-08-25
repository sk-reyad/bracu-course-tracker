begin;

create extension if not exists pg_trgm with schema extensions;

create index if not exists user_roles_role_user_idx
  on public.user_roles (role_id, user_id);

create index if not exists profiles_status_created_idx
  on public.profiles (status, created_at desc);

create index if not exists login_events_user_signed_in_idx
  on public.login_events (user_id, signed_in_at desc);

create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name extensions.gin_trgm_ops);

create index if not exists profiles_email_trgm_idx
  on public.profiles using gin (email extensions.gin_trgm_ops);

create index if not exists profiles_student_id_trgm_idx
  on public.profiles using gin (student_id extensions.gin_trgm_ops)
  where student_id is not null;

create or replace function public.admin_list_accounts(
  target_role text default null,
  target_status text default null,
  target_search text default null,
  page_offset integer default 0,
  page_limit integer default 25
)
returns table (
  id uuid,
  full_name text,
  email text,
  student_id text,
  program text,
  starting_term text,
  starting_year integer,
  avatar_path text,
  status text,
  onboarding_completed boolean,
  created_at timestamptz,
  role_name text,
  daily_login_count bigint,
  weekly_login_count bigint,
  monthly_login_count bigint,
  total_login_count bigint,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with filtered as materialized (
    select
      profile.id,
      profile.full_name,
      profile.email,
      profile.student_id,
      profile.program,
      profile.starting_term,
      profile.starting_year,
      profile.avatar_path,
      profile.status,
      profile.onboarding_completed,
      profile.created_at,
      role.name as role_name,
      count(*) over ()::bigint as total_count
    from public.profiles profile
    join public.user_roles user_role on user_role.user_id = profile.id
    join public.app_roles role on role.id = user_role.role_id
    where (target_role is null or role.name = target_role)
      and (target_status is null or profile.status = target_status)
      and (
        target_search is null
        or profile.full_name ilike '%' || target_search || '%'
        or profile.email ilike '%' || target_search || '%'
        or profile.student_id ilike '%' || target_search || '%'
      )
    order by profile.created_at desc, profile.id
    offset greatest(page_offset, 0)
    limit least(greatest(page_limit, 10), 100)
  )
  select
    filtered.id,
    filtered.full_name,
    filtered.email,
    filtered.student_id,
    filtered.program,
    filtered.starting_term,
    filtered.starting_year,
    filtered.avatar_path,
    filtered.status,
    filtered.onboarding_completed,
    filtered.created_at,
    filtered.role_name,
    coalesce(metrics.daily_login_count, 0)::bigint,
    coalesce(metrics.weekly_login_count, 0)::bigint,
    coalesce(metrics.monthly_login_count, 0)::bigint,
    coalesce(metrics.total_login_count, 0)::bigint,
    filtered.total_count
  from filtered
  left join lateral (
    select
      count(event.id) filter (
        where (event.signed_in_at at time zone 'Asia/Dhaka')::date =
          (now() at time zone 'Asia/Dhaka')::date
      )::bigint as daily_login_count,
      count(event.id) filter (
        where date_trunc('week', event.signed_in_at at time zone 'Asia/Dhaka') =
          date_trunc('week', now() at time zone 'Asia/Dhaka')
      )::bigint as weekly_login_count,
      count(event.id) filter (
        where date_trunc('month', event.signed_in_at at time zone 'Asia/Dhaka') =
          date_trunc('month', now() at time zone 'Asia/Dhaka')
      )::bigint as monthly_login_count,
      count(event.id)::bigint as total_login_count
    from public.login_events event
    where event.user_id = filtered.id
  ) metrics on true
  order by filtered.created_at desc, filtered.id;
$$;

revoke all on function public.admin_list_accounts(text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.admin_list_accounts(text, text, text, integer, integer)
  to service_role;

notify pgrst, 'reload schema';

commit;
