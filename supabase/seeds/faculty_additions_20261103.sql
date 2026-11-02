-- Additive shared catalog data, applied live on 2026-11-03.
-- Reapply explicitly after schema migrations for a fresh installation.
-- Preserve existing records, personal tracker data, grants and policies.
begin;

insert into public.catalog_faculties (initial, name, email, department)
values
  ('ALM', 'Md. Aftab Alam', 'aftab.alam@bracu.ac.bd', 'ESS'),
  ('PSD', 'Partho Sutra Dhor', 'partho.dhor@bracu.ac.bd', 'MPS')
on conflict (initial) do nothing;

commit;
