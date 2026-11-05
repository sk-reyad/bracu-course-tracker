---
name: database-migration
description: "Use for Supabase SQL migrations, schema, policies, grants, indexes, RPCs, triggers or Storage access changes and reviews. Not for frontend-only layout or calculations with no persistence or security impact."
---

# database-migration

## Workflow

1. Read [Data model](../../../docs/DATA_MODEL.md), [Security](../../../docs/SECURITY.md) and [Supabase instructions](../../../supabase/AGENTS.md).
2. List the full migration chain and inspect later replacements/revocations. Separate repository state from verified applied hosted state.
3. Derive the next ordered filename from the live directory; prefer a new forward migration. Do not casually rewrite potentially applied history.
4. Assess existing rows, constraints, ownership, foreign keys, indexes and transaction/idempotency behavior.
5. Evaluate PUBLIC/anon/authenticated/service/Auth-admin table, column and EXECUTE grants plus RLS. Review SECURITY DEFINER/INVOKER, search_path and caller-derived ownership.
6. Check RPC signatures and old/new Edge/client compatibility. Plan deployment order and recovery before writing SQL.
7. Run relevant security, access, admin, catalog and support tests from [Testing](../../../docs/TESTING.md). Distinguish static SQL assertions from execution against a database.
8. Review DATA_MODEL/SECURITY and operational SETUP/DEPLOYMENT update triggers.

## Stop and investigate

Dropping data/columns/tables, changing ownership, broadening policies, exposing functions, editing managed Storage schemas or rewriting persisted JSON requires exact target/data-impact review and scoped authorization. Never reset production to resolve drift; never infer production mutation approval from a request to write a migration.

## Final checks

- Forward compatibility and existing-data preservation evaluated?
- Effective grants/policies checked, not only CREATE TABLE?
- Privileged functions and alternate direct access paths covered?
- Recovery limits, tests and hosted checks stated truthfully?
