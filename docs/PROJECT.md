# PROJECT

## Document contract

- Purpose: Product semantics and invariants.
- Read this when: changing features, modes, account rules or academic state.
- Update this when: user-visible semantics or durable invariants change.
- Primary sources of truth: [entry page](../index.html), [access](../js/access.js), [state](../js/storage.js), [GPA](../js/gpa.js), [prerequisites](../js/prerequisites.js), [Degree Plan](../js/degree-plan.js).

## Purpose and users

An independent BRAC University academic planning application: courses, semester attempts, prerequisites, GPA/CGPA, degree requirements, reports and backups. It is not an official transcript or advising system. The bundled CS plan uses 124 credits; a CSE profile selection is not a separate CSE degree audit.

| Persona / state | Surface and behavior |
| --- | --- |
| Visitor | Read-only sample tracker via index.html?preview=1; auth and maintenance support |
| Student, pending | Onboarding after Google authentication |
| Student, active and onboarded | Personal tracker and profile; own support history |
| Suspended account | Main access signs out/rejects; server/data rules apply independently |
| Admin / super_admin | Separate Admin Panel; active identity, AAL2 and operation-specific permissions |

These are application roles; PostgreSQL authenticated and service_role are different concepts. See [Security](SECURITY.md).

## Pages and capabilities

- [index.html](../index.html): dashboard, roadmap, My Path, course collection, settings/Degree Plan, JSON backups and PDF export.
- [auth.html](../auth.html): official Google student login and onboarding; mode=admin enables password/MFA flow.
- [admin.html](../admin.html): account lists and actions, shared catalog, support and maintenance.
- [maintenance.html](../maintenance.html): retry, theme and support.
- [privacy.html](../privacy.html), [terms.html](../terms.html), [error.html](../error.html): legal and safe error surfaces.

## Academic vocabulary

| Concept | Meaning |
| --- | --- |
| Course | Definition keyed by code, with title, credits, department, prerequisites and classification |
| Catalog | Shared reference records; not a student's academic history |
| Semester | Personal ordered grouping containing course attempts |
| Attempt | Individual course enrollment record: code, status, grade, faculty and optional overrides/retake metadata |
| Attempt status | completed, current, planned, omitted |
| Derived course status | Above statuses or not-started; missing hard prerequisites are evaluated separately |
| Degree Plan status | View additionally derives failed, selected and not-selected; do not persist these as attempt statuses |
| RT / RP | Retake / repeat markers; attempt selection still follows the GPA engine |
| Hard / soft prerequisite | Hard absence makes eligible=false; soft absence is reported separately |
| Revision | Database concurrency counter, distinct from browser key/catalog version |
| AAL2 | MFA assurance level, not an application role |

## Invariants to preserve

1. Personal tracker/history remains owner-scoped; admin permission is not a blanket grant to read every tracker.
2. Anonymous preview boots without personal Auth/tracker/catalog loading or writes. The page can still load external libraries and the public maintenance guard; it is not a network-free mode.
3. Google-provided student name/email are immutable through student profile actions. Authorized administrative identity flows are separate.
4. A new authenticated account must not inherit the sample or another browser user's academic history. Legacy recovery requires matching identity.
5. Save conflicts must not silently discard pending local changes. Keep revision checks, history and explicit destructive-reset guards.
6. Personal catalog additions do not authorize shared catalog mutation. Deleting a shared catalog row does not retroactively delete attempts.
7. Hard/soft prerequisite and recognized alternative semantics must agree across catalog, roadmap and Degree Plan consumers.
8. Browser visibility and decoded claims are presentation aids, not authorization boundaries.
9. Preserve persisted state compatibility; do not casually change course identity or storage keys.

## Academic interpretation

GPA uses credit-weighted eligible completed attempts and highest grade points per course, with newer timestamps resolving equal points in the GPA engine. Degree Plan has its own requirement allocation engine: zero-credit foundation courses do not add requirement credits; a course is allocated once, with alternatives and electives handled explicitly. Do not collapse these separate calculations without tests proving intended parity.

Degree Plan totals are 39 University Core + 12 School Core + 48 Program Core + 21 Program Elective + 4 project. Progress is a calculation over stored data, not proof of university approval.

## Persistence expectations and constraints

The database is canonical except documented pending-local/recovery resolution. Failed networking can leave local work pending; this is not a complete offline/PWA guarantee. Backup import validates shape, size and identifiers. Protect exported academic records and shared-device browser storage.

See [Data model](DATA_MODEL.md) for exact keys and limits, [Architecture](ARCHITECTURE.md) for flow ownership and [Known issues](KNOWN_ISSUES.md) for verified limitations.

