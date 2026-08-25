begin;

create table if not exists public.course_tracker_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_tracker_data enable row level security;

drop policy if exists tracker_select_own_active on public.course_tracker_data;
drop policy if exists tracker_insert_own_active on public.course_tracker_data;
drop policy if exists tracker_update_own_active on public.course_tracker_data;
drop policy if exists tracker_delete_own_active on public.course_tracker_data;

create policy tracker_select_own_active on public.course_tracker_data
for select to authenticated
using (auth.uid() = user_id and public.current_account_active());

create policy tracker_insert_own_active on public.course_tracker_data
for insert to authenticated
with check (auth.uid() = user_id and public.current_account_active());

create policy tracker_update_own_active on public.course_tracker_data
for update to authenticated
using (auth.uid() = user_id and public.current_account_active())
with check (auth.uid() = user_id and public.current_account_active());

create policy tracker_delete_own_active on public.course_tracker_data
for delete to authenticated
using (auth.uid() = user_id and public.current_account_active());

-- The profile-photos bucket is private; access is granted only by object policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatar_select_own_active on storage.objects;
drop policy if exists avatar_insert_own_active on storage.objects;
drop policy if exists avatar_update_own_active on storage.objects;
drop policy if exists avatar_delete_own_active on storage.objects;

create policy avatar_select_own_active on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.profile_asset_access_allowed()
);

create policy avatar_insert_own_active on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.profile_asset_access_allowed()
);

create policy avatar_update_own_active on storage.objects
for update to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.profile_asset_access_allowed()
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.profile_asset_access_allowed()
);

create policy avatar_delete_own_active on storage.objects
for delete to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.profile_asset_access_allowed()
);

commit;
