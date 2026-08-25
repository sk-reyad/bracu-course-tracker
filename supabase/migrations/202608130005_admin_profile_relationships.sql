begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_roles_user_id_profiles_fkey'
      and conrelid = 'public.user_roles'::regclass
  ) then
    alter table public.user_roles
      add constraint user_roles_user_id_profiles_fkey
      foreign key (user_id) references public.profiles(id)
      on delete cascade not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_permissions_user_id_profiles_fkey'
      and conrelid = 'public.user_permissions'::regclass
  ) then
    alter table public.user_permissions
      add constraint user_permissions_user_id_profiles_fkey
      foreign key (user_id) references public.profiles(id)
      on delete cascade not valid;
  end if;
end
$$;

alter table public.user_roles
  validate constraint user_roles_user_id_profiles_fkey;

alter table public.user_permissions
  validate constraint user_permissions_user_id_profiles_fkey;

notify pgrst, 'reload schema';

commit;
