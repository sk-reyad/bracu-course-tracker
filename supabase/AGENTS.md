# Supabase subtree

Read [Data model](../docs/DATA_MODEL.md) and [Security](../docs/SECURITY.md) before material changes.

- Use database-migration for SQL/schema/policy/grant/RPC/storage work; security-review for identity/permission/privileged changes.
- List all migrations before selecting a new 12-digit ordered prefix. Later SQL overrides early policies/grants; use new forward files by default.
- Evaluate PUBLIC, anon, authenticated, service_role and supabase_auth_admin separately; policies do not substitute for grants.
- Check SECURITY DEFINER/INVOKER, fixed search_path, argument ownership, EXECUTE exposure, indexes, existing data and recovery. Never weaken RLS/grants to satisfy a client call.
- admin-access verifies identity/AAL2/current authorization before service operations. support-desk has deliberate public branches and protected handler gates despite verify_jwt=false.
- Preserve deno.json imports and _shared dependencies when deploying functions; do not trust client permission claims.
- Preserve migration compatibility/idempotency where required; do not assume every historical file is safely rerunnable.
- Never put secrets or real user records into examples, fixtures or logs.
- Run affected security/admin/support/catalog tests; document that SQL text checks are not hosted policy tests.
- Review DATA_MODEL/SECURITY and SETUP/DEPLOYMENT when corresponding contracts change. Production SQL/deployments require explicit task scope.
