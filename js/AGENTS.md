# JavaScript subtree

Read [Architecture](../docs/ARCHITECTURE.md) before cross-module changes and [Design](../docs/DESIGN.md) for UI work.

- Route GPA to gpa.js, prerequisites to prerequisites.js, requirement allocation to degree-plan.js and definitions to degree-plan-data.js.
- Route reference normalization/merging to catalog.js; browser state/backups to storage.js; boot/serialized sync to app-boot.js.
- Keep DOM rendering in app.js/owning view modules, not pure engines. Do not add another calculation to app.js because it is convenient.
- Preserve ordered script globals and CommonJS test exports when changing interfaces.
- Keep preview's early personal-data bypass and mutation guards. Public maintenance traffic is a separate flow.
- Preserve per-user keys, legacy matching, pending/conflict resolution and revision semantics. Read DATA_MODEL before persistence changes.
- Client permissions/decoded claims only guide UI; server/RLS must enforce access. Public config must not contain privileged secrets.
- Escape user-owned strings and retain theme/responsive/focus/reduced-motion states.
- Add/update relevant [tests](../docs/TESTING.md) and review PROJECT/ARCHITECTURE/DESIGN update triggers.
