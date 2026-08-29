-- Query name: 025 — Canonical Catalog Consolidation
-- Forward-only catalog data migration. It intentionally never touches tracker
-- JSON, tracker history, profiles, semesters, attempts, grades, or Auth users.

begin;

insert into public.catalog_departments (id, name, color)
values
  ('MPS', 'Department of Mathematics & Physical Sciences', 'violet'),
  ('GENED', 'School of General Education', 'blue')
on conflict (id) do update
set name = excluded.name,
    color = excluded.color,
    updated_at = now();

update public.catalog_courses
set department = case
  when department = 'MNS' then 'MPS'
  when department in ('GED', 'SGE') then 'GENED'
  else department
end,
updated_at = now()
where department in ('MNS', 'GED', 'SGE');

update public.catalog_faculties
set department = case
  when department = 'MNS' then 'MPS'
  when department in ('GED', 'SGE') then 'GENED'
  else department
end,
updated_at = now()
where department in ('MNS', 'GED', 'SGE');

delete from public.catalog_departments
where id in ('MNS', 'GED', 'SGE');

update public.catalog_courses
set visibility = 'alternative',
    updated_at = now()
where code in (
  'CSE161', 'CSE162L',
  'EEE103', 'EEE103L', 'ECE103', 'ECE103L',
  'EEE283', 'EEE283L', 'ECE283', 'ECE283L', 'EEE301', 'EEE302'
);

commit;
