-- Query name: 024 — Catalog Alternative Visibility
-- Forward-only schema expansion. Roll back with a later migration only after
-- every alternative row has been moved to curriculum or search_only.

begin;

alter table public.catalog_courses
  drop constraint if exists catalog_courses_visibility_check;

alter table public.catalog_courses
  add constraint catalog_courses_visibility_check
  check (visibility in ('curriculum', 'search_only', 'alternative'));

commit;
