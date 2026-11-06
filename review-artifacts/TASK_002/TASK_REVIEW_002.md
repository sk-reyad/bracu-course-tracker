# TASK_REVIEW_002 — R-010 native dialog alternative

## A. Task Identification

TASK_002 · 2026-11-06T22:53:08.261Z · R-010 / F-002 / P1. Sources: ecc:accessibility and ecc:frontend-a11y, [S01 correction alternatives](https://github.com/sk-reyad/bracu-course-tracker/blob/d2a22340c4fcf6afb5d865eb99ff4c48247b64d7/review-artifacts/TASK_001/evidence/sources/S01_AUDIT.txt#L278), [accepted R-010 register](https://github.com/sk-reyad/bracu-course-tracker/blob/d2a22340c4fcf6afb5d865eb99ff4c48247b64d7/review-artifacts/MASTER_RECOMMENDATIONS.md#r-010). Original base 9d86db46b1134a3755a2e269252b1ee1234f2570; review parent d2a22340c4fcf6afb5d865eb99ff4c48247b64d7; branch temp/ui-ux-audit-review in the separate review clone. New candidate lives in a new external bracu-task002-r010 workspace. Personal absolute paths withheld from public evidence. Status: READY FOR INDEPENDENT REVIEW / technically ready for owner evaluation within tested Chrome scope, not independent approval or production authorization. R-010 remains UNREVIEWED in the unchanged master/ledger.

## B. Original User Instructions

[Complete TASK_002 request](TASK_002_REQUEST.txt): implement R-010 only as independent native alternative, preserve complete selected A, compare untouched original/A/native B, preserve accessibility/workflows/appearance and data boundaries, test and capture actual matched evidence, publish only review-artifacts/TASK_002, then stop. Do not begin R-023 or any other proposal, change main/production/academic/API/Auth/persistence/PDF/deployment logic, merge or deploy. A/B previous selections remain candidates, C HOLD, D rejected. No silence or test pass selects native B.

## C. Initial State

Original: main 9d86db46b1134a3755a2e269252b1ee1234f2570; tracked/staged diff empty; only pre-existing untracked FRONTEND_UI_MULTISKILL_AUDIT.md, unchanged SHA-256 9ad3924539bea8181d9337b6e8e970a116bf28b9109c7cdb589f9a1536ca54d9. Review clone clean at d2a22340c4fcf6afb5d865eb99ff4c48247b64d7. Original modal host is a hidden div, inner section role=dialog, openModal reveals/mounts icons/grid without focus entry or containment. Escape/document clicks call closeModal; one global opener pointer restores focus. Settings click-only active classes lack full tab semantics. Focus defect reproduced before screenshot staging.

Selected A is preserved in the completed improved workspace. For a fair R-010-only comparison, a new A-only copy extracts its exact modal helpers and Settings behavior onto the original baseline. It excludes the completed workspace's B/C and opt-in D changes. A uses a focus stack, explicit sibling inert tracking, focus redirection and Tab edge cycle, named close controls and complete Settings keyboard model. Its extracted helpers byte-match the selected implementation after line-ending normalization; no old file was edited.

## D. Work Performed

B starts from that new A-only comparison copy. All four outer hosts become named native dialog elements; duplicate inner section dialog roles are removed. Existing panels, content and workflows remain. CSS only resets native host margins/borders/max-size/color, retaining existing full-page modal design, responsive padding and panel tokens.

app.js replaces A's custom inert manager/focus stack/redirect with nativeModalSessions lifecycle bookkeeping, showModal/close, finishNativeModalClose and native close/cancel listeners. Session removal makes cleanup idempotent; synchronous cleanup preserves existing save-call ordering, while queued close events cannot hide a reopened modal. Body overflow, opener focus, dashboard draft reset and the shared dot-grid host are restored. Existing save/academic/PDF functions are unchanged.

**Native is not automatically better:** Chrome initially allowed Tab to browser chrome (BODY active, document.hasFocus false). B therefore retains an explicit first/last Tab boundary cycle, clearly candidate JavaScript; it is not claimed to be pure browser focus cycling. Native still owns background blocking/top layer; there is no A sibling-inert manager or outside-focus redirection. Chrome also grouped nested native cancellations on one Escape. B requests only the focused nested dialog's close (requestClose, with cancel/close fallback) and prevents the default grouped cascade. The support widget file/submission logic is unchanged. Finally, the existing toast is temporarily hosted in the native top layer so validation feedback is not obscured; it returns to its original body position on final close.

| Behavior | Original | Selected A | Native B |
| --- | --- | --- | --- |
| Initial focus / full Settings model | Missing focus entry / incomplete tabs | Explicit entry and full tabs | Same outcomes retained |
| Background blocking | Overlay paint only | JS inert manager + focus redirection | Browser native modality |
| In-page Tab cycle | Escapes | Custom edge cycle | Explicit edge cycle still needed in tested Chrome |
| Escape / nested support | Original custom dismissal | Child native protected | Native host + scoped nested close policy |
| Opener / close cleanup | Single opener | Custom lifecycle | Idempotent native close/cancel lifecycle |
| Validation toast | Body layer | Body layer | Must move into native top layer |
| Panel appearance | Original | Original plus keyboard focus | 16 measured panel states equal to A |

Demonstrable benefit: native :modal/AX modality and background focus rejection without manually toggling siblings. Demonstrable cost: native host resets, native event/race coordination, nested Escape guard and feedback hosting. Both candidates pass the local outcomes; no universal superiority, browser-wide accessibility compliance or owner preference is asserted.

## E. Requirement-by-Requirement Verification

| ID | Requested | Evidence / implemented | Result |
| --- | --- | --- | --- |
| R10-01 | R-010 only; preserve baseline and selected A | Separate fresh workspace; A-only modal/tab extraction; all old workspace hashes unchanged; no B/C/D source leaked | PASS |
| R10-02 | Three-way real functional comparison | Original plus A plus independent native B; full runtime diffs/source; rebuild tooling | PASS |
| R10-03 | All four modal workflows and accessibility outcomes | 48 case matrix, real Tab/Shift+Tab/Escape, native AX names, focus return, hidden/open lifecycle | PASS |
| R10-04 | Settings content/tabs and nested support | Home/End/Left/Right and roles/state; actual support trigger and guarded nested dismissal; fallback tested | PASS |
| R10-05 | Save/cancel/programmatic close, no duplicate effects | Real Cancel/close and pointer routes; duplicate/direct/rapid reopen tests; unchanged save functions with disposable-memory persistence mock | PASS |
| R10-06 | Scroll/backdrop/feedback and visual identity | Wheel scroll, body restore, backdrop clicks; 16 A/B computed panel matches; toast top-layer comparison | PASS |
| R10-07 | Matched mobile/desktop light/dark screenshots and gallery | 51 actual PNGs; GitHub Markdown gallery and portable HTML | PASS |
| R10-08 | Tests, console evidence, honest limits | 3×365 Node tests, 8 source guards; 2284+18 browser assertions; no Runtime exceptions in 12 sampled loads | PASS |
| R10-09 | Original source, completed demos and production boundaries unchanged | Only review artifacts published; isolated diff limited to UI controller/markup/native-host reset and one owning test | PASS |
| R10-10 | Report/diffs/manifest/publication and stop | A–M report, artifacts/hashes/ZIP, anonymous GitHub verification; no next recommendation or owner disposition inferred | PASS |

10 PASS, no failed/blocked scoped requirement. Authenticated/cloud writes and real support/PDF workflows were not exercised; they are explicit limits, not passed workflows.

## F. Changed Files and Diff

- Native runtime: index.html (four host/name/role conversions); js/app.js (modal helpers, bindEvents native listeners/edge wrap/nested Escape, toast/grid restoration); css/style.css (native host reset only, shared A Settings focus rule retained).
- Native owning test: tests/interaction-layer.test.js, one assertion updated to require the new close cleanup helper and its caller; original test file unchanged.
- A-only extraction changes only index.html, js/app.js, css/style.css relative to baseline; helpers are the selected implementation, not a new architecture.
- [CHANGES.diff](CHANGES.diff): minimal runtime **Option A → native B**, apply from the A root with git apply. [TEST_CHANGES.diff](TEST_CHANGES.diff) separately covers native owning assertion. [BASELINE_TO_A.diff](BASELINE_TO_A.diff) / [BASELINE_TO_B.diff](BASELINE_TO_B.diff) show each independent comparison against 9d86db46b1134a3755a2e269252b1ee1234f2570. Changed files preserve paths under [source](source). No deletions, dependencies, runtime changes outside the isolated copy, or unrelated B/C/D implementation.
- TASK_002/.gitattributes marks PNGs binary to preserve exact image bytes and excludes archived patch context-marker spaces from whitespace checking; it affects review artifacts only.
- Artifact paths only under TASK_002: report, galleries, request, source copies, tooling, screenshots, test/evidence JSON/logs, manifest. Master/ledger and all prior task files remain unchanged.

## G. Tests and Verification

Windows, Node v24.16.0, real headless Chrome/CDP. Used the local e2e-testing skill's deterministic assertions/evidence guidance; execution is Chrome CDP, **not Playwright**. No dependency installed. Commands: node --check native/js/app.js; node --test tests/*.test.js from each original/A/native; node --test source-checks.cjs; node verify-browser.mjs; node verify-extra.mjs; node verify-picker.mjs. Actual logs and scripts are included.

- Original / A / B: each 365 passed, 0 failed/skipped (1095 application test executions). Native final suite rerun after native fixes.
- Source guards: 8 passed, 0 failed (these local preservation checks require the retained completed-demo workspace; public reconstruction can rerun application/browser tests without that private workspace); all tracked baseline files match 9d86db46b1134a3755a2e269252b1ee1234f2570 after export line-ending normalization; only allowed UI/test files differ; old workspaces unchanged; save/PDF/support logic identical.
- Browser: 2284 assertions across 48 modal/viewport/theme groups; 18 advanced assertions plus 8 catalog-picker assertions (search focus/results/Escape/opener return for A/B). Real Tab/Shift+Tab/arrow/Home/End/Escape, pointer backdrop/close, native AX names/:modal, opener return, nested support, duplicate/external close and rapid reopen, memory-only save routine calls, toast/wheel scroll. No Runtime exceptions in sampled loads; an additional 12-load console pass recorded no console.error calls, with security/network messages separately recorded in evidence/console-results.json. [browser data](evidence/browser-results.json), [advanced data](evidence/advanced-browser.json), [visual measurements](evidence/visual-parity.json), [full summary and initial failures](TEST_RESULTS.txt).
- Preview CSP intentionally prevents cloud connections/submissions; auth/admin routes disabled identically by local harness, no application config mutation. Synthetic save calls substitute persist only in disposable page memory, then reload; **not real authenticated save/persistence verification**.
- Diff application/hash validation, package readability/hash verification, privacy scan and anonymous published artifact hashes were checked before handoff.

## H. Visual and Interactive Evidence

[GitHub three-way gallery](GALLERY.md), [portable HTML gallery](GALLERY.html): 48 matched original/A/B screenshots for four modals × 390/1440 CSS px × light/dark, plus three matched validation-toast screenshots. Height 1000, device scale 1, zoom 100%, identical synthetic preview content; Settings Grade Scale selected. Baseline initial focus is recorded before the capture deliberately focuses its close button for fair visual framing. Browser CDP viewport is a CSS-width desktop emulation, not a physical phone. A/B panel geometry/background/border/radius/shadow/font measurements match in all 16 pairs. This is measured visual parity, not an established pixel-regression baseline; dynamic dot-grid pixels may differ. Screenshots were visually inspected.

## I. Regression Analysis

UI/theme/responsive/modal behavior TESTED AND PASSED within Chrome matrix. Academic engines, course/prerequisite logic, faculty, PDF/vendor, storage/boot, Auth/API/support source VERIFIED UNCHANGED by full file/source guards; not a claim of full authenticated/cloud behavior. Background scroller frozen while open, actual modal wheel scrolling works, closing restores overflow. Toast/nested close risks were found and corrected, not hidden. Existing course/department form payload/save function bodies unchanged. No real student records, imports, database/production operations.

## J. Problems and Limitations

Initial native static test 364/365 failed because cleanup moved into a helper; owning isolated assertion now checks that helper and caller without dropping lifecycle intent. Pure native Tab and nested Escape did not meet A's required outcomes initially; explicit policy code fixes remain visible in the diff. Native top layer requires toast hosting. One advanced toast check sampled an unsettled transition; readiness now polls actual opacity without weakening visibility assertions. Initial unsafe port/sandbox networking failures were environment setup issues. A shared isolated-server 403 for [isolated preview]/rest/v1/site_settings?select=maintenance_enabled%2Cmaintenance_message&id=eq.global occurred in all variants; no application console.error/Runtime exceptions.  See TEST_RESULTS.txt.

NOT TESTED: Firefox/WebKit, physical devices, real screen reader announcements, hosted/production Auth/MFA, true support challenge/submission, real personal/cloud saves, actual PDF generation. Support local form opens/closes; submission is intentionally blocked. Modern dialog/showModal is required; requestClose fallback exercised, but broad legacy compatibility not certified. Existing baseline stream overflow/reduced-motion gaps are deliberately untouched (no B/C mixed in). Scope is R-010; this does not fix other pending recommendations. No SHIP/production readiness claim.

## K. Original Repository Protection

Original main HEAD 9d86db46b1134a3755a2e269252b1ee1234f2570, before/after status only ?? FRONTEND_UI_MULTISKILL_AUDIT.md; tracked/staged diff empty and audit hash unchanged. [Protection record](evidence/original-protection.json), [completed workspace fingerprints](evidence/preserved-workspace-hashes.json), source guard logs. Review commit adds TASK_002 only; original working tree and previous completed demo source untouched. No main commit/push, merge, deployment, production config/API/Supabase/data operation. Normal review-artifact commit/push is explicitly authorized. External branch automation was not inspected/certified disabled; no deployment command invoked.

## L. Codex Self-Assessment

READY FOR INDEPENDENT REVIEW and owner evaluation in tested scope; 10/10 scoped requirements fulfilled. High confidence in measured Chrome behavior/source isolation, limited cross-browser/assistive-tech confidence until separate checks. This is not independent approval. R-010 is **not SELECTED/REJECTED**, master/ledger unchanged. Keep selected A available. No next recommendation started.

## M. Independent Reviewer Handoff

Review R-010 only: unchanged original, selected A extracted separately, native B with shared accessibility outcomes and clearly identified remaining JavaScript policies. Begin at GALLERY.md, then CHANGES.diff, source/native/js/app.js, browser-results/advanced-browser and source guards. Check nested Escape, Tab boundary policy, toast top layer, idempotent close/reopen, focus restoration and exact source protection. Source changes limited to listed UI/test files; gallery/logs are independent of Windows localhost. No blocked scoped correction remains; limitations above are not silently passed. Owner should keep A, prefer B, request revision or hold **after** independent review; technical results do not decide the design. STOP.
