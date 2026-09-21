# Repository instructions

BRACU Course Tracker is a vanilla HTML/CSS/JavaScript academic tracker with Supabase Auth/data/Storage/Edge Functions and Vercel middleware. Preserve working academic, identity and persistence behavior.

## Before changing anything

1. Inspect git status, current implementation/tests/configuration and relevant nested AGENTS.md. Preserve existing modified/untracked work.
2. Identify affected modules, persisted state and trust boundaries. Read only relevant documents below.
3. Search existing helpers/patterns; choose the smallest correct change.
4. Preserve compatibility unless explicitly changing the contract. Update behavior tests and triggered docs in the same change.
5. Treat historical plans/comments as context; investigate conflicts against executed code and later migrations. Record unresolved evidence in KNOWN_ISSUES.

## Documentation routing and maintenance

All links below also define update triggers; review does not require an edit if the contract is unchanged.

| Change / question | Owner |
| --- | --- |
| Product semantics and invariants | [PROJECT](docs/PROJECT.md) |
| Module responsibilities and flows | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| Tokens, components, states and responsive behavior | [DESIGN](docs/DESIGN.md) |
| Schema, JSON persistence, storage and catalog sources | [DATA_MODEL](docs/DATA_MODEL.md) |
| Auth, RBAC, RLS, grants and trust boundaries | [SECURITY](docs/SECURITY.md) |
| Test commands, fixtures and coverage ownership | [TESTING](docs/TESTING.md) |
| Local prerequisites, bootstrap and config | [SETUP](docs/SETUP.md) |
| Production compatibility/order and recovery | [DEPLOYMENT](docs/DEPLOYMENT.md) |
| Durable architectural decision | [DECISIONS](docs/DECISIONS.md) |
| Compact cross-task constraints | [MEMORY](docs/MEMORY.md) |
| Verified unresolved limitation | [KNOWN_ISSUES](docs/KNOWN_ISSUES.md) |

## Change discipline

Do not rewrite working systems, rename/reformat unrelated files, add dependencies without justification, duplicate academic rules, or silently change persisted formats/user semantics. Runtime source is not the duplicate delivery files in github-upload. Documentation-only tasks must not alter runtime to match prose.

Do not reset, discard or delete other work. Do not commit, push, deploy, apply remote SQL or modify production settings without task authorization. Never test writes against real student data by default.

## Security and data guardrails

Never expose privileged secrets in browser code/logs/docs; never weaken RLS to fix a frontend problem. Hidden controls and browser-supplied role/permission/owner values are not authorization. Preserve server identity, permission, active-account and applicable MFA gates before privileged operations.

Inspect the complete migration order and later overrides. Prefer a new forward migration over editing potentially applied history. Review existing rows, constraints, RLS, PUBLIC/anon/authenticated grants, indexes, functions/triggers/search_path, client compatibility and recovery. No destructive reset as a shortcut.

## UI and tests

Read DESIGN for UI changes. Reuse owning-page tokens/components; preserve responsive, light/dark, keyboard, status and reduced-motion behavior.

Run focused tests for focused changes; add/update regressions for changed behavior. Use node --test tests/*.test.js for broad/high-risk work when feasible. Optional browser/hosted checks are separate. Never claim a test passed unless run; report unavailable/skipped tests and causes. Do not weaken assertions to conceal defects.

## Repository skills

- [course-catalog](.agents/skills/course-catalog/SKILL.md): reference sources, identity, prerequisites/alternatives, visibility, faculty and catalog admin/import work.
- [database-migration](.agents/skills/database-migration/SKILL.md): SQL/schema/RLS/grant/RPC/storage changes.
- [security-review](.agents/skills/security-review/SKILL.md): auth/privacy/privileged/security boundary changes and reviews.
- [release-check](.agents/skills/release-check/SKILL.md): release readiness or broad/high-risk completion; never auto-deploy.

Skills guide work, not authority to mutate external systems.

## Completion

Check intended behavior, targeted/full tests as appropriate, security/data implications, documentation triggers, unexpected diff/untracked additions and visible regression risk. Report evidence and remaining gaps. Documentation claims must distinguish local source verification from deployed behavior.
