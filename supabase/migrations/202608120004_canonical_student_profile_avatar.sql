begin;

alter table public.profiles
  add column if not exists avatar_preference text;

update public.profiles
set avatar_preference = case
  when nullif(btrim(avatar_path), '') is null then 'google'
  else 'custom'
end
where avatar_preference is null;

alter table public.profiles
  alter column avatar_preference set default 'google',
  alter column avatar_preference set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_preference_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_preference_check
      check (avatar_preference in ('google', 'custom', 'none'));
  end if;
end;
$$;

drop function if exists public.complete_student_onboarding(text, text, text, integer, text);
drop function if exists public.complete_student_onboarding(text, text, text, integer, text, text);

create or replace function public.complete_student_onboarding(
  student_id text,
  program text,
  starting_term text,
  starting_year integer,
  avatar_preference text default 'google',
  avatar_path text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  caller_provider text;
  normalized_preference text := lower(btrim(coalesce(complete_student_onboarding.avatar_preference, '')));
  normalized_path text := nullif(btrim(complete_student_onboarding.avatar_path), '');
  result public.profiles;
begin
  if caller is null then raise exception 'Authentication required'; end if;

  select lower(users.email), users.raw_app_meta_data->>'provider'
    into caller_email, caller_provider
  from auth.users users
  where users.id = caller;

  if caller_provider <> 'google' or split_part(caller_email, '@', 2) <> 'g.bracu.ac.bd' then
    raise exception 'Please use you official BRAC University G-suite email';
  end if;
  if public.current_app_role(caller) <> 'student' then raise exception 'Student access required'; end if;
  if nullif(btrim(complete_student_onboarding.student_id), '') is null then raise exception 'Student ID is required'; end if;
  if complete_student_onboarding.program not in ('BSc in Computer Science & Engineering (CSE)', 'BSc in Computer Science (CS)') then raise exception 'Invalid program'; end if;
  if complete_student_onboarding.starting_term not in ('Spring', 'Summer', 'Fall') then raise exception 'Invalid starting term'; end if;
  if complete_student_onboarding.starting_year not between 2001 and 2100 then raise exception 'Invalid starting year'; end if;
  if normalized_preference not in ('google', 'custom', 'none') then raise exception 'Invalid avatar preference'; end if;

  if normalized_preference = 'custom' then
    if normalized_path is null or split_part(normalized_path, '/', 1) <> caller::text then
      raise exception 'Invalid custom avatar path';
    end if;
    if not exists (
      select 1
      from storage.objects object
      where object.bucket_id = 'profile-photos'
        and object.name = normalized_path
        and object.owner_id = caller::text
    ) then
      raise exception 'Custom avatar was not uploaded by this account';
    end if;
  else
    normalized_path := null;
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = caller
      and profile.status = 'pending'
      and not profile.onboarding_completed
  ) then
    raise exception 'Onboarding is unavailable for this account';
  end if;

  perform set_config('app.onboarding_rpc', 'true', true);
  update public.profiles profile
  set student_id = btrim(complete_student_onboarding.student_id),
      program = complete_student_onboarding.program,
      starting_term = complete_student_onboarding.starting_term,
      starting_year = complete_student_onboarding.starting_year,
      avatar_preference = normalized_preference,
      avatar_path = normalized_path,
      status = 'active',
      onboarding_completed = true,
      updated_at = now()
  where profile.id = caller
  returning profile.* into result;

  return result;
end;
$$;

revoke all on function public.complete_student_onboarding(text, text, text, integer, text, text) from public;
grant execute on function public.complete_student_onboarding(text, text, text, integer, text, text) to authenticated;

create or replace function public.update_student_profile(
  student_id text,
  program text,
  starting_term text,
  starting_year integer,
  avatar_preference text,
  avatar_path text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  caller uuid := auth.uid();
  normalized_preference text := lower(btrim(coalesce(update_student_profile.avatar_preference, '')));
  normalized_path text := nullif(btrim(update_student_profile.avatar_path), '');
  result public.profiles;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if public.current_app_role(caller) <> 'student' then raise exception 'Student access required'; end if;
  if nullif(btrim(update_student_profile.student_id), '') is null then raise exception 'Student ID is required'; end if;
  if update_student_profile.program not in ('BSc in Computer Science & Engineering (CSE)', 'BSc in Computer Science (CS)') then raise exception 'Invalid program'; end if;
  if update_student_profile.starting_term not in ('Spring', 'Summer', 'Fall') then raise exception 'Invalid starting term'; end if;
  if update_student_profile.starting_year not between 2001 and 2100 then raise exception 'Invalid starting year'; end if;
  if normalized_preference not in ('google', 'custom', 'none') then raise exception 'Invalid avatar preference'; end if;

  if normalized_preference = 'custom' then
    if normalized_path is null or split_part(normalized_path, '/', 1) <> caller::text then
      raise exception 'Invalid custom avatar path';
    end if;
    if not exists (
      select 1
      from storage.objects object
      where object.bucket_id = 'profile-photos'
        and object.name = normalized_path
        and object.owner_id = caller::text
    ) then
      raise exception 'Custom avatar was not uploaded by this account';
    end if;
  else
    normalized_path := null;
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = caller
      and profile.status = 'active'
      and profile.onboarding_completed
  ) then
    raise exception 'Profile editing is unavailable for this account';
  end if;

  update public.profiles profile
  set student_id = btrim(update_student_profile.student_id),
      program = update_student_profile.program,
      starting_term = update_student_profile.starting_term,
      starting_year = update_student_profile.starting_year,
      avatar_preference = normalized_preference,
      avatar_path = normalized_path,
      updated_at = now()
  where profile.id = caller
  returning profile.* into result;

  return result;
end;
$$;

revoke all on function public.update_student_profile(text, text, text, integer, text, text) from public;
grant execute on function public.update_student_profile(text, text, text, integer, text, text) to authenticated;

commit;
