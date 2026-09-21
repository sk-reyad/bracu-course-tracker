# Catalog Consolidation, Stream Filters, and Dashboard Sign-out Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Approved behavior

- The twelve legacy alternative codes remain discoverable in Add Courses but are absent from the default Course List and fixed Roadmap.
- When an alternative pair appears in semester history, its real codes, grades, faculty, and status remain unchanged. The fixed CSE110 or CSE260 Roadmap slot presents the pair as its accepted replacement; one member is incomplete and two completed members satisfy the slot.
- MNS and MPS consolidate to MPS / Department of Mathematics & Physical Sciences.
- GED and SGE consolidate to the normalized identity GENED, displayed as GenEd / School of General Education.
- Department consolidation remaps catalog courses, faculties, and user-owned course metadata without deleting semesters, attempts, grades, faculty selections, or profiles.
- Stable category slugs remain stored. Student-facing badges use Stream-1 through Stream-5 and disclose the full stream name plus a See more action.
- Course List gains a Curriculum field filter. See more opens Course List with the matching filter.
- Cloud Sync keeps Sync now. Sign out moves to the bottom-right of Student Dashboard after Support requests.

## Alternative equivalence groups

- CSE110: CSE161 + CSE162L; EEE103 + EEE103L; ECE103 + ECE103L.
- CSE260: EEE283 + EEE283L; ECE283 + ECE283L; EEE301 + EEE302.

## Data safety

- Existing deployed migrations remain immutable.
- New database changes are split into two forward migrations: `202608290024_catalog_alternative_visibility.sql`, shown in Supabase as `024 — Catalog Alternative Visibility`, followed by `202608290025_canonical_catalog_consolidation.sql`, shown as `025 — Canonical Catalog Consolidation`.
- The global catalog keeps alternative rows with `visibility = 'alternative'`; authenticated users retain read-only access and RLS remains active.
- User state migration is idempotent and versioned. It changes department references and presentation metadata only, preserving academic history.
- Duplicate departments, courses, and faculties are resolved by normalized identity without discarding a user-owned record.

## Curriculum field filters

- Stream 1: Writing Comprehension
- Stream 2: Math and Natural Sciences
- Stream 3: Arts and Humanities
- Stream 4: Social Sciences
- Stream 5: Communities, Seeking Transformation
- GenEd Electives (`gened`, `general-elective`)
- School Core
- Program Core
- Program Elective
- Project / Internship / Thesis (`capstone`, `thesis-project`)

## Verification

- Unit tests cover partitions, alternative discovery, equivalency, state migration, category aliases, filter navigation, and sign-out placement.
- Migration tests prove transaction ordering, canonical department references, alternative visibility, RLS/grant preservation, and no tracker-history mutation.
- The full Node test suite must pass before an upload package is created.
