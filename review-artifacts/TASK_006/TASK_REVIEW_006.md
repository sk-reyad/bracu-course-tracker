# TASK_006 · R-030 keyboard Stream See more scrolling

**Technically ready for owner evaluation with the shared header-overlap limitation. R-030 remains UNREVIEWED.** In the matched 390 px ANT101 / Stream-4 example, the page moves from 16324 to 16371 CSS px. Before animates over roughly 89.8 ms to the first near-final frame. After reaches the destination before the scroll request returns. The movement is small. The later-badge case shows a larger difference. Instant scrolling is a testable alternative; practical preference remains an owner decision.

[Comparison recordings](GALLERY.md) · [Preview instructions](PREVIEW.md) · [Minimal runtime diff](CHANGES.diff) · [Matrix CSV](evidence/matrix.csv)

## Source and comparison architecture

R-030 comes from emil-design-eng Audit 10, S01 line 193, related to F-006 and repeated keyboard feedback. [Original audit clause](../TASK_001/evidence/sources/S01_AUDIT.txt#L193) · [F-006](../TASK_001/evidence/sources/S01_AUDIT.txt#L338) · [Current R-030](../MASTER_RECOMMENDATIONS.md#r-030)

Reference O is an untouched byte-for-byte reconstruction of protected main 9d86db46b1134a3755a2e269252b1ee1234f2570. Both primary copies overlay the selected TASK_003 R-023 stream snapshot from 426a1cebac9a617d7ef5ce27eeb2782aed2c70ee. It combines Demo B portal containment, corrected group semantics, closing and keyboard behavior with the selected full-badge target. Its Back to Top handler retains original smooth scrolling, and its stream path requests smooth under both preferences. The selected snapshot includes four files, including its owning integration test. [Selected source](https://github.com/sk-reyad/bracu-course-tracker/tree/426a1cebac9a617d7ef5ce27eeb2782aed2c70ee/review-artifacts/TASK_003/source/r023)

The primary comparison changes only R-030. Prior Demo C reduced-motion work stays held. TASK_005/R-029 is a rejected implementation with historical evidence, and its Back to Top code is absent here. The current owner reason and counts remain authoritative. [R-029 decision](../TASK_005_DECISION_001/DECISION_REPORT.md) · [Current counts](../TASK_005_DECISION_001/COUNTS.json) · [Demo B correction history](../TASK_001/evidence/sources/S03_CORRECTION_REVIEW.txt)

## Implementation and input classification

In js/app.js, openCurriculumField gains an optional scrollBehavior parameter defaulting to smooth. The existing delegated See more branch supplies instant only for a trusted click with zero detail and no pointerType. It continues to prevent default and stop propagation at the same location. The helper still closes the tooltip, selects the field, renders once, scrolls the courses section with block start and focuses the curriculum selector with preventScroll true. Existing callers with one argument retain smooth scrolling. [Candidate source](source/after/js/app.js#L1054) · [Runtime diff](CHANGES.diff)

Actual mouse clicks in this Chromium had detail 1 and pointerType mouse. Native Enter and Space clicks were trusted, had zero detail and an empty pointerType. Enter activated on keydown; Space activated on release. Programmatic click controls were untrusted and retained smooth scrolling in both preferences. There are no added key listeners or modality flags. This event signature can include trusted assistive-technology activation, while other AT signatures may take the smooth path. Screen readers and physical switches were not tested. The classification has a similar tradeoff to the rejected R-029 alternative. R-030 additionally needs one optional argument through the existing delegated call. The small source change is maintainable, but adds a permanent modality distinction whose practical value remains unproven.

## Results across inputs and motion preferences

| Version | Input | Motion | Cases | Request | Result |
| --- | --- | --- | ---: | --- | --- |
| before | pointer | no-preference | 10 | smooth | First near-final frame 63–280.6 ms after request |
| before | Enter | no-preference | 10 | smooth | First near-final frame 63.9–278.7 ms after request |
| before | Space | no-preference | 10 | smooth | First near-final frame 63.9–273.1 ms after request |
| before | pointer | reduce | 10 | smooth | First near-final frame 63.9–279.4 ms after request |
| before | Enter | reduce | 10 | smooth | First near-final frame 63.3–274.2 ms after request |
| before | Space | reduce | 10 | smooth | First near-final frame 62.9–273.1 ms after request |
| after | pointer | no-preference | 10 | smooth | First near-final frame 61.9–280 ms after request |
| after | Enter | no-preference | 10 | instant | Destination reached before scroll call returned |
| after | Space | no-preference | 10 | instant | Destination reached before scroll call returned |
| after | pointer | reduce | 10 | smooth | First near-final frame 63.6–280.3 ms after request |
| after | Enter | reduce | 10 | instant | Destination reached before scroll call returned |
| after | Space | reduce | 10 | instant | Destination reached before scroll call returned |

The 120 primary runs cover five widths, two themes, both preferences and pointer/Enter/Space input in both copies. Every run made one openCurriculumField call, one Course List render and one section scroll. All selected the expected field and complete expected course set, closed the popup and focused curriculumFieldFilter. The first Stream-4 case consistently produced 25 courses. No window.scrollTo call occurred during activation. The filter focus call preserved y immediately before/after in every run. Candidate keyboard requests reached the final destination synchronously and produced no subsequent movement beyond the destination. Smooth requests produced intermediate frame positions. [Full traces](evidence/traces) · [Matrix](evidence/matrix.csv)

There are twelve additional runs: four programmatic controls, four three-Enter bursts and four last-badge upper-edge activations, spanning both versions and preferences at 1440 px dark. After the first burst activation, focus moves to the native selector. The next Enter opens its native popup, which consumes the third Enter outside document events. Each trace records two document keydowns and one See more action, render and scroll. Repeated See more activation on the same closed popup is unavailable after navigation.

The later-badge test starts much farther down the unfiltered list. Rendering the smaller filtered list shortens the document and can clamp the current scroll position before the smooth animation completes. The traces retain the initial, call-return, focus and final positions. That layout clamp is shared behavior and must be distinguished from the explicit instant branch. The candidate still reaches the final destination before focus, with the same final results and y.

Pointer activation under reduce continues requesting smooth. This is the unresolved held R-026 condition. The keyboard-specific candidate does not resolve it. Demo C and R-025 through R-028 stay HOLD.

## Focus, header and responsive findings

Native Enter on the trigger and real Tab traverse into the body-portaled See more action. After activation the filter is active, and the next Tab reaches the first result stream badge. The action preserves its existing focus semantics and introduces no hidden-focused-element state in these tests. The initial keyboard action matches focus-visible.

| Width | Before / After final filter top | Header bottom | Horizontal document overflow |
| ---: | ---: | ---: | --- |
| 360 | 255.1 | 176 | NONE |
| 390 | 254.9 | 176 | NONE |
| 768 | 254.8 | 139 | NONE |
| 1024 | 74.5 | 66 | NONE |
| 1440 | 40.9 | 66 | NONE |

Both copies align the section start near viewport y=0. The sticky header consequently obscures the section heading at tested sizes. At 1440 px it also covers approximately 25 px of the focused filter: filter top 40.86, header bottom 66, filter height 42. The same geometry occurs Before and After. At the other tested widths the curriculum selector is below the header. This existing selected-stream limitation is retained, documented and visible in final screenshots. No scroll offset or CSS change was made.

Twenty additional control configurations cover both versions, every width and both themes. Three distinct stream badge positions per configuration stayed inside viewport bounds. Escape closed the group and restored trigger focus; outside click closed it; opening a second badge closed the first. The accepted Roadmap has 43 cards and zero stream disclosures. Roadmap See more activation is **NOT TESTED** because the required control is absent. No records were fabricated. [Controls](evidence/controls.json)

## Tests, protection and limits

- Application suites passed 365/365 in Original, selected Before and candidate After, with zero failures or skips. Candidate initially passed 364 and failed one stale exact-signature assertion. Only the isolated candidate assertion was updated to the new optional-parameter signature. The unchanged assertions still protect filter assignment, target section and native badge markup. A separate dynamic helper check verifies default smooth, explicit instant and invalid-field guard behavior. [Test changes](TEST_CHANGES.diff) · [Final logs](evidence/original-tests.tap) · [Before](evidence/before-tests.tap) · [After](evidence/after-tests.tap)
- Evidence verification passed 140/140 with zero failures or skips. The first verifier expected all three burst keydowns at document level. Actual Chromium popup behavior delivered two, so the final assertion explicitly checks See more followed by the native selector and exactly one action. The full raw events are retained. [Verification](evidence/verification.tap) · [Executable checks](tooling/verify.test.cjs)
- Chromium 156.0.8078.80, Windows headless, 1000 CSS px height, scale 1, mobile false at narrow widths. Four resource diagnostics consist of two blocked local maintenance 403 reads and two favicon 404s. No uncaught runtime exception was recorded. No physical-device, screen-reader, Firefox, Safari or hosted-auth coverage is claimed. Test instrumentation and screenshots can affect frame scheduling; timings describe these runs. [Browser](evidence/browser.json) · [Diagnostics](evidence/diagnostics.json)
- The 182 original files match protected Git blobs. Before matches the pinned accepted overlays. After differs in one runtime file and its owning signature test. Rebuilt copies match all three sources. Six earlier completed workspace inventories and the original working tree remain unchanged. Runtime and test patches passed forward/reverse checks. No API, Auth, Supabase, persistence, course data, calculations, prerequisites, PDF, Admin Catalog or deployment source changed. These systems are source-protected and covered by the existing unit suite; live service/PDF workflows were not rerun. [Protection](evidence/GIT_PROTECTION.json)

Review starts at 567978b36a03f5e25360f8bda700e84b04372953. Only TASK_006 artifacts are published. The authoritative register, ledger, prior decisions, historical evidence and counts remain unchanged: 106 total, 25 SELECTED, 11 REJECTED, 7 HOLD, 63 UNREVIEWED, 0 IN REVIEW. The shared header overlap limits the current selected experience. No new regression was found within measured activation, focus, filtering, dismissal and containment scenarios. This statement covers the recorded Chromium fixture only.

## Owner evaluation and STOP

The candidate is technically ready for comparison with the documented shared limitation. The first badge produces little visual movement; later badges produce a longer scroll. Measurable timing change alone does not establish a UX improvement or justify keeping the extra classification branch. Owner decision pending. STOP after publication for independent review. R-030 remains UNREVIEWED. R-031 and held work await a new explicit instruction.
