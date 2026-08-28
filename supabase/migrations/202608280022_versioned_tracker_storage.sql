begin;

alter table public.course_tracker_data
add column if not exists revision bigint not null default 1
check (revision > 0);

create table if not exists public.course_tracker_data_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null check (revision > 0),
  data jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, revision)
);

create index if not exists course_tracker_data_history_user_revision_idx
on public.course_tracker_data_history (user_id, revision desc);

alter table public.course_tracker_data_history enable row level security;

drop policy if exists tracker_select_own_active on public.course_tracker_data;
create policy tracker_select_own_active on public.course_tracker_data
for select to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_account_active()
);

drop policy if exists tracker_insert_own_active on public.course_tracker_data;
drop policy if exists tracker_update_own_active on public.course_tracker_data;
drop policy if exists tracker_delete_own_active on public.course_tracker_data;

drop policy if exists tracker_history_select_own_active
on public.course_tracker_data_history;
create policy tracker_history_select_own_active
on public.course_tracker_data_history
for select to authenticated
using (
  (select auth.uid()) = user_id
  and public.current_account_active()
);

create or replace function public.save_course_tracker_state(
  p_expected_revision bigint,
  p_data jsonb,
  p_allow_destructive boolean default false
)
returns table (new_revision bigint, saved_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current public.course_tracker_data%rowtype;
  v_now timestamptz := statement_timestamp();
  v_current_attempts bigint := 0;
  v_incoming_attempts bigint := 0;
  v_next_revision bigint;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'tracker_authentication_required';
  end if;

  if not public.current_account_active() then
    raise exception using
      errcode = '42501',
      message = 'tracker_account_inactive';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using
      errcode = '22023',
      message = 'tracker_invalid_revision';
  end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'tracker_invalid_state';
  end if;

  if octet_length(p_data::text) > 2097152 then
    raise exception using
      errcode = '22023',
      message = 'tracker_state_too_large';
  end if;

  if p_data ? 'semesters'
    and jsonb_typeof(p_data -> 'semesters') <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'tracker_invalid_semesters';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_data -> 'semesters', '[]'::jsonb))
      as semester(value)
    where jsonb_typeof(semester.value) <> 'object'
  ) then
    raise exception using
      errcode = '22023',
      message = 'tracker_invalid_semesters';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_data -> 'semesters', '[]'::jsonb))
      as semester(value)
    where semester.value ? 'courses'
      and jsonb_typeof(semester.value -> 'courses') <> 'array'
  ) then
    raise exception using
      errcode = '22023',
      message = 'tracker_invalid_courses';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_data -> 'semesters', '[]'::jsonb))
      as semester(value)
    cross join lateral jsonb_array_elements(
      coalesce(semester.value -> 'courses', '[]'::jsonb)
    ) as attempt(value)
    where jsonb_typeof(attempt.value) <> 'object'
  ) then
    raise exception using
      errcode = '22023',
      message = 'tracker_invalid_courses';
  end if;

  select count(*)
  into v_incoming_attempts
  from jsonb_array_elements(coalesce(p_data -> 'semesters', '[]'::jsonb))
    as semester(value)
  cross join lateral jsonb_array_elements(
    coalesce(semester.value -> 'courses', '[]'::jsonb)
  ) as attempt(value);

  -- A row cannot be locked before its first insert. A per-user transaction
  -- lock closes that race while still allowing different users to save in
  -- parallel.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text, 0)
  );

  select *
  into v_current
  from public.course_tracker_data
  where user_id = v_user_id
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception using
        errcode = '40001',
        message = 'tracker_revision_conflict';
    end if;

    insert into public.course_tracker_data
      (user_id, data, revision, created_at, updated_at)
    values
      (v_user_id, p_data, 1, v_now, v_now);

    return query select 1::bigint, v_now;
    return;
  end if;

  if p_expected_revision <> v_current.revision then
    raise exception using
      errcode = '40001',
      message = 'tracker_revision_conflict';
  end if;

  select count(*)
  into v_current_attempts
  from jsonb_array_elements(
    coalesce(v_current.data -> 'semesters', '[]'::jsonb)
  ) as semester(value)
  cross join lateral jsonb_array_elements(
    coalesce(semester.value -> 'courses', '[]'::jsonb)
  ) as attempt(value);

  if v_current_attempts > 0
    and v_incoming_attempts = 0
    and not coalesce(p_allow_destructive, false) then
    raise exception using
      errcode = '22023',
      message = 'tracker_blank_overwrite_blocked';
  end if;

  insert into public.course_tracker_data_history
    (user_id, revision, data, created_at)
  values
    (v_user_id, v_current.revision, v_current.data, v_now)
  on conflict (user_id, revision) do nothing;

  v_next_revision := v_current.revision + 1;

  update public.course_tracker_data
  set data = p_data,
      revision = v_next_revision,
      updated_at = v_now
  where user_id = v_user_id;

  delete from public.course_tracker_data_history as history
  where history.user_id = v_user_id
    and history.revision in (
      select stale.revision
      from public.course_tracker_data_history as stale
      where stale.user_id = v_user_id
      order by stale.revision desc
      offset 20
    );

  return query select v_next_revision, v_now;
end;
$$;

revoke insert, update, delete on table public.course_tracker_data from anon;
revoke insert, update, delete on table public.course_tracker_data from authenticated;
grant select on table public.course_tracker_data to authenticated;

revoke all on table public.course_tracker_data_history from anon, authenticated;
grant select on table public.course_tracker_data_history to authenticated;

revoke all on function public.save_course_tracker_state(bigint, jsonb, boolean)
from public, anon, authenticated;
grant execute on function public.save_course_tracker_state(bigint, jsonb, boolean) to authenticated;

commit;
