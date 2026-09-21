# DECISIONS

## Document contract

- Purpose: Durable architecture decisions, not a changelog.
- Read this when: considering replacement of core patterns.
- Update this when: a durable choice changes; retain superseded entries.
- Primary sources of truth: [architecture](ARCHITECTURE.md), linked implementation and historical design notes.

## D-001 — Ordered vanilla browser modules

Status: Active  
Evidence type: Observed from implementation — [source](../index.html)

### Context

HTML entry points load classic scripts; no application build manifest exists.

### Decision

Keep the current runtime model as the baseline, not a framework inferred from tooling.

### Why this matters

Script order/global interfaces and CommonJS test factories are compatibility boundaries.

### Consequences

Module isolation must be deliberate; app.js has broad coupling.

### Revisit when

A scoped requirement justifies a runtime/toolchain migration.

## D-002 — Supabase identity and data boundaries

Status: Active  
Evidence type: Observed from implementation — [source](../supabase/migrations/202608120002_tracker_storage_rls.sql)

### Context

The browser uses Auth, PostgREST, RPCs and Storage.

### Decision

Keep identity and private data enforcement server/database-side.

### Why this matters

Frontend UI checks cannot protect direct API access.

### Consequences

Grants, RLS and privileged Edge paths all need review.

### Revisit when

Changing backend/identity provider or exposure model.

## D-003 — Privileged Edge operations and AAL2

Status: Active  
Evidence type: Observed from implementation — [source](../supabase/functions/support-desk/index.ts)

### Context

Admin actions and support-admin branches verify caller/MFA/permissions.

### Decision

Route privileged requests through the existing guarded server paths.

### Why this matters

Decoding claims is not verification; service credentials bypass ordinary user boundaries.

### Consequences

Public support branches remain separate; retain negative MFA tests.

### Revisit when

Introducing a new privileged action or different factor policy.

## D-004 — Preview is separate from personal state

Status: Active  
Evidence type: Observed from implementation — [source](../js/app-boot.js)

### Context

Access/boot have an early preview branch.

### Decision

Generate sanitized sample state; suppress personal persistence and editing.

### Why this matters

Visitors can inspect the app without a private tracker session.

### Consequences

Public maintenance reads and CDN assets are still possible.

### Revisit when

Adding preview interactions or changing startup networking.

## D-005 — Revisioned database-first tracker

Status: Active  
Evidence type: Explicit — [source](superpowers/specs/2026-08-28-versioned-database-first-tracker-sync-design.md)

### Context

The versioned-sync design and migration define conflict/data-loss handling.

### Decision

Use expected revisions, pending-local preservation, bounded history and guarded empty overwrite.

### Why this matters

Blind timestamp-based last-writer-wins can lose work.

### Consequences

More state metadata and explicit recovery paths; no automatic general merge.

### Revisit when

Changing multi-device conflict semantics or payload layout.

## D-006 — Shared catalog, personal progress

Status: Active  
Evidence type: Explicit — [source](../supabase/migrations/202608260018_global_catalog.sql)

### Context

Catalog migration comments distinguish reference distribution from user state.

### Decision

Catalog deletion stops future distribution; preserve existing personal history.

### Why this matters

Reference edits must not become destructive student-data rewrites.

### Consequences

Canonicalization and visibility need compatible merge/import rules.

### Revisit when

Changing course identity or reference ownership.

## D-007 — Vercel maintenance boundary

Status: Active  
Evidence type: Observed from implementation — [source](../middleware.ts)

### Context

Middleware reads site_settings before matched public requests.

### Decision

Use server-side fail-closed maintenance redirect with explicit recovery exemptions.

### Why this matters

Client guard is fail-open and cannot provide the same hosting behavior.

### Consequences

Local static preview is not an equivalent deployment test.

### Revisit when

Changing hosting platform or maintenance availability policy.
