# TASK_002 — Targeted initial-focus recheck

## A. Identification
R-010; review parent 7025af30d7152f7e90a5e507fa90b840427c49b7; original base 9d86db46b1134a3755a2e269252b1ee1234f2570; 2026-11-07T11:58:30.244Z. READY FOR INDEPENDENT REVIEW, not independent approval or owner selection.

## B. Request
Clarify the apparent discrepancy between close-button focus code and old host-looking evidence; trace all four modals under pointer/keyboard activation, asynchronous updates and first Tab/Shift+Tab; compare A; fix only genuine B regression; correct misleading comment. Preserve appearance, decisions, original repository and A. No R-023.

## C. Finding: evidence-label ambiguity, not host focus
The old test recorded activeElement.id || activeElement.getAttribute('data-close-modal') || activeElement.tagName. The header close button has no id; its data-close-modal value is the modal ID (e.g. settingsModal). The old initial.tag field separately recorded modal.tagName (DIALOG in B), **not activeElement.tagName**. Together those fields misleadingly looked like a focused host. Historical browser-results.json is preserved unchanged; this report supersedes that interpretation.

## D. Reproduction and result
64 cases: four modal editors × Enter/pointer × 390/1440 CSS px × light/dark × A/B. A fresh preview is loaded for every case. Actual input events activate the real Settings/Dashboard buttons. Course/Department editing launch controls are disabled in read-only preview, so disposable DOM launcher buttons call the unchanged CSE110/CSE editor functions; they are activated with the same real Enter/pointer events. This is not authenticated edit-control verification and changes no A source or user data.

The trace captures focusin targets, the synchronous return from openModal, a queued microtask, two requestAnimationFrame callbacks, an immediate protocol sample and a 200ms settled sample. All 64 cases focus the header **BUTTON**, with isClose=true, isHost=false, no unexpected host focusin. All three update samples exist in every case. Exact tag/id/label/data attribute/element identity/HTML are retained. The close attempt is not overridden in these cases. A and B match in all 32 paired comparisons. For the distinct Add Course catalog-picker workflow, the established later search focus remains intentional; this recheck targets the course editor matching the reviewed evidence.

First Tab: Settings → active Faculty List tab; Dashboard → profile Edit; Course → code input; Department → department-code input. Shift+Tab returns to close. Shift+Tab from initial close wraps to the last eligible control (Settings last faculty Edit; Dashboard New request; Course/Department Cancel), identically in A/B. Escape restores the opener in all cases. Native first/last wrapping is explicit JavaScript, not a claimed browser-only guarantee.

## E. Requirements
| Requirement | Result |
| --- | --- |
| Four modals, keyboard and pointer | PASS, 64 cases |
| Immediate, microtask and rendering samples | PASS, synchronous + all three update phases + settled |
| focusin trace and host/close identity | PASS, no host focus observed |
| First Tab/Shift+Tab and A comparison | PASS, 32 exact paired comparisons |
| Explain acceptable behavior or fix actual regression | PASS, ambiguity resolved; no behavior fix warranted |
| Correct misleading no-custom-Tab comment | PASS, one comment only |
| Preserve appearance/A/main/decisions and stop | PASS, source equality and Git guards |

## F. Changes
Only one comment in isolated Native B js/app.js changes: it now says native modality owns background blocking and explicit first/last Tab wrapping is installed below. [Comment-only diff](COMMENT_ONLY.diff) and [new source snapshot](source/native/js/app.js). Exact comparison against the accepted B source proves no executable code difference. A source and B index/CSS match the accepted review commit. Old TASK_002 report/source/evidence and all previous history remain untouched; new evidence is added in TASK_002_FOCUS_RECHECK only.

## G. Validation
node recheck-focus.mjs: **64 cases, 512 assertions, 0 failures**. Additional dataset checks confirm 3 update samples per case, 0 host focusin and exact A/B identity/transition parity. node --check native/js/app.js: PASS. node --test tests/interaction-layer.test.js tests/main-integration.test.js from native: **33 passed, 0 failed/skipped**. [Trace](evidence/initial-focus.json), [summary](evidence/summary.json), [transition examples](evidence/transition-examples.json), [test log](evidence/targeted-node-tests.txt), [tooling](tooling/recheck-focus.mjs).

The first harness attempt used an incomplete Enter sequence and did not activate the A button. It failed the strict initial-focus assertion; the harness now sends rawKeyDown, char and keyUp. No app code or assertion was changed to conceal a defect. Public traces contain only synthetic preview state/controls. No new screenshots: appearance code is unchanged and this issue requires temporal focus data, not still images. Package/staged/remote hashes verified before final handoff.

## H. Evidence semantics
Actual active-element descriptors replace the old conflated string/host-tag scheme. The synchronous open-return snapshot establishes immediate focus even though microtasks may run before a later CDP evaluation. The focusin log contains only opener → close movement during opening, no unexpected host event or subsequent override. See per-case timestamps and full original context descriptors.

## I. Regression protection
No executable behavior, styles, markup, academic/PDF/Auth/API/storage logic changed. Candidate A not edited. Original main 9d86db46b1134a3755a2e269252b1ee1234f2570, tracked/staged diffs empty, only pre-existing untracked FRONTEND_UI_MULTISKILL_AUDIT.md; audit hash unchanged. [Protection record](evidence/protection.json). Review branch receives only new recheck artifacts; master/ledger unchanged, R-010 remains unselected/unrejected. Original completed A/B/C/D workspaces untouched.

## J. Limits
Chrome headless/CDP only; not a physical phone, screen reader or cross-browser certification. Authenticated editor launch controls and real persistence/support/PDF/cloud flows NOT TESTED. Course/department launchers are explicitly synthetic; real rendering/focus functions and keyboard/pointer input are exercised. Close-button initial focus is a consistent named dismissal control and matches selected A; this evidence establishes that chosen policy, not that it is universally optimal for every future dialog's content.

## K. Publication protection
Normal artifact-only commit/push to temp/ui-ux-audit-review; no main/production change, deployment or merge. Old evidence preserved. Only one local candidate comment changed; no UI/data mutations beyond disposable test-page instrumentation.

## L. Assessment
READY FOR INDEPENDENT REVIEW. No genuine initial-focus regression reproduced; the original field naming was misleading. All owner decisions preserved, including A selected candidate, C HOLD, D rejected; no R-010 disposition inferred.

## M. Handoff
Review the identity snapshots and focusin phase trace, then the comment-only diff. The old apparently host-valued string was the close button's data attribute; old tag was the modal host tag. No next recommendation started. STOP for independent review.
