---
name: course-catalog
description: "Use for course or faculty reference sources, catalog identity/credits/prerequisites/alternatives, visibility, imports or admin catalog operations. Not for unrelated layout or personal tracker edits that do not change catalog contracts."
---

# course-catalog

## Workflow

1. Read root AGENTS.md and relevant [Project](../../../docs/PROJECT.md), [Architecture](../../../docs/ARCHITECTURE.md) and [Data model](../../../docs/DATA_MODEL.md) sections.
2. Identify source authority: degree-plan-data.js, data.js, catalog-source-config.mjs, external workbook, existing migration or runtime global catalog. Inspect before changing derived copies.
3. Inspect js/catalog.js, consuming app/roadmap/degree-plan modules, admin-catalog.js and function catalog-actions.mjs when relevant.
4. Inspect scripts/catalog-import.mjs and catalog-workbook-reader.mjs and the full later catalog migration chain.
5. Classify identity, credits, prerequisite/alternative, faculty, visibility or personal-state impact. Preserve stable codes, user-owned metadata, attempts and migration compatibility.
6. Use a canonical generator when available; do not regenerate applied migrations in place or run the importer without required source/dependency availability.
7. Run node --test tests/catalog.test.js tests/catalog-import.test.js tests/faculty-data.test.js tests/prerequisites.test.js; add degree-plan/admin/main-integration tests as affected.
8. Review documentation triggers; update only changed contracts.

## Final checks

- Source and generated output distinguished?
- Unknown credits remain unknown rather than invented?
- Canonical department/code aliases and alternative pairs preserved?
- Shared deletion does not erase private history?
- Correct visibility/read columns and server mutation path?
- Tests and remaining source/dependency gaps reported?

Use database-migration/security-review if the request crosses those boundaries. This skill does not authorize remote SQL or deployment.
