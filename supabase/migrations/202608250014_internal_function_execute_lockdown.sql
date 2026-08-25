-- Prevent browser-facing database roles from invoking internal trigger helpers
-- through PostgREST RPC. PostgreSQL triggers/event triggers continue to call
-- these functions as configured; this migration changes privileges only.

begin;

revoke all on function public.handle_new_auth_user()
from public, anon, authenticated;

-- Supabase may create this event-trigger helper outside the local migration
-- history. Keep the migration portable when the helper is absent locally.
do $migration$
begin
  if pg_catalog.to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$migration$;

commit;
