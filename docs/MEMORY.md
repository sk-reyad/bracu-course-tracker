# MEMORY

## Document contract

- Purpose: Compact cross-task context, not chat history.
- Read this when: starting broad or ambiguous maintenance.
- Update this when: durable constraints/state or recurring confusion change.
- Primary sources of truth: [current architecture](ARCHITECTURE.md), [issues](KNOWN_ISSUES.md), repository configuration.


## Current verified state

- Runtime is vanilla browser modules plus Supabase and Vercel middleware.
- Degree Plan already exists; do not list category-based requirements as an entirely future feature.
- Shared catalog and personal tracker are separate; state and SQL have distinct version mechanisms.
- Current migration chain includes later hardening through 027; early CRUD policies do not describe current tracker writes.
- Node suite and optional browser script are separate verification layers; [Testing](TESTING.md) owns commands.
- docs/SETUP.md existed before this documentation system; its problem was stale instructions, not absence.

## Active constraints

Maintainer constraint: preserve existing production users and academic data. Documentation work does not authorize deployment, migrations, configuration changes or production test writes.

The bootstrap checkout had untracked source files. Do not infer authorship from untracked status or erase them as generated leftovers. Future tasks must inspect fresh status rather than assuming the baseline persists.

## Durable context

Root README is the overview; the eleven top-level docs own current contracts. Older docs/superpowers notes are historical design/plan/report evidence, not current runbooks. Root BRAIN.md, SELF_CHECK.md and security reports are historical context to reconcile against implementation, not a substitute for the maintained docs.

Upload packages are delivery snapshots, not canonical source. Never edit runtime by patching only a duplicate inside github-upload.

## Deferred / watch points

- [Known issues](KNOWN_ISSUES.md) owns dependency reproducibility and hosted-verification gaps.
- Do not infer current hosted schema/settings from local migration presence.
- Keep personal records, session traces and secrets out of documentation and skills.
- Review documentation triggers in [AGENTS.md](../AGENTS.md); do not append a session log here.
