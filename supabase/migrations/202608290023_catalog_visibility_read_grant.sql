-- Query name: 023 — Catalog Visibility Read Grant
-- Forward-only repair for migration 020, which added visibility after the
-- authenticated role's catalog_courses column-level SELECT grant was defined.
-- RLS still limits reads to active authenticated accounts; browser writes stay revoked.
-- Rollback (only after the frontend stops selecting visibility):
-- revoke select (visibility) on table public.catalog_courses from authenticated;

begin;

grant select (visibility)
on table public.catalog_courses
to authenticated;

commit;
