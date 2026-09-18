-- Query name: Security Fix 02 — Restrict postgres Default TRUNCATE Grants
-- Only future public tables created by postgres are affected.
-- No existing table privileges, data, RLS, auth, storage or service_role changes.
-- supabase_admin defaults remain pending a separate authority check.
-- Forward-only security migration; do not automatically restore unsafe grants.
BEGIN;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE TRUNCATE ON TABLES FROM PUBLIC, anon, authenticated;

COMMIT;

