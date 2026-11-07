# TASK_005 · R-029 keyboard Back to Top

**Ready for owner evaluation. R-029 remains UNREVIEWED.** On the 390 px light preview, pressing Enter from 1646 CSS px reached zero within the candidate’s scroll call. The original took 672.8 ms from the call to the first sampled frame at zero. The pointer still animated in both previews, including under reduced motion.

[Recorded comparison](GALLERY.md) · [128 activation traces in CSV](evidence/matrix.csv) · [Local interactive preview](PREVIEW.md) · [Minimal source diff](CHANGES.diff)

## Scope and implementation

The emil-design-eng audit links immediate keyboard feedback to repeated actions in F-006 (P2). The register assigns Back to Top keyboard activation to R-029. R-030 covers Stream See more. [Audit line 193](../TASK_001/evidence/sources/S01_AUDIT.txt#L193) · [F-006](../TASK_001/evidence/sources/S01_AUDIT.txt#L338) · [R-029 register entry](../MASTER_RECOMMENDATIONS.md#r-029)

Before uses protected main `9d86db46b1134a3755a2e269252b1ee1234f2570`. After changes one listener in `bindEvents()` in `js/app.js`. Both copies use the original native button, accessible name “Back to top”, DOM order, position, focus CSS and visibility threshold. In the baseline, the listener always requests smooth scrolling. The root CSS uses smooth scrolling by default and auto under reduced motion. [Candidate source](source/after/js/app.js#L1873) · [Original handler](https://github.com/sk-reyad/bracu-course-tracker/blob/9d86db46b1134a3755a2e269252b1ee1234f2570/js/app.js#L1873)

The candidate handles the single native click. In this browser, a mouse click had `isTrusted=true`, `detail=1` and `pointerType="mouse"`. Enter and Space produced trusted clicks with `detail=0` and an empty pointer type. That combination takes the explicit `instant` branch, even when root CSS specifies smooth. All other clicks take the original smooth branch. Enter clicked on keydown and Space clicked on key release. The candidate adds no key listener or global modality state.

A scripted `.click()` also has zero detail but is untrusted. All four scripted checks retained smooth scrolling. A trusted assistive-technology activation with the same event signature as these keyboard clicks would take the instant branch. Other signatures may take the smooth branch. No screen reader or physical switch was exercised.

## Activation results

| Input | Motion preference | Before · request / observed | After · request / observed | Runs per version |
| --- | --- | --- | --- | ---: |
| pointer | no-preference | smooth · 490.1–503.5 ms to first zero frame | smooth · 485.4–524.6 ms to first zero frame | 10 |
| Enter | no-preference | smooth · 661.2–681.3 ms to first zero frame | instant · zero at return | 10 |
| Space | no-preference | smooth · 812.8–831.9 ms to first zero frame | instant · zero at return | 10 |
| pointer | reduce | smooth · 491.3–502.1 ms to first zero frame | smooth · 486.2–504.1 ms to first zero frame | 10 |
| Enter | reduce | smooth · 662.5–689 ms to first zero frame | instant · zero at return | 10 |
| Space | reduce | smooth · 808.8–836.4 ms to first zero frame | instant · zero at return | 10 |

Each primary cell covers five widths and two themes. Every one of the 120 primary activations issued exactly one request with `top: 0` and settled at zero. Smooth cases had intermediate browser positions. Every instant case returned at zero and stayed there on all subsequent sampled frames. Times measure observed animation frames and include frame scheduling. The click handler timing uses the page’s monotonic clock. [Per-run matrix](evidence/matrix.csv) · [Full timestamped events and positions](evidence/traces)

The setup requested 900, 1,650 and 2,450 px for mouse, Enter and Space. Each trace records the actual position after layout. Four additional rapid three-Enter bursts started around 1,800 px. All twelve native button clicks triggered one request each. The six candidate requests were instant, including repeats at the destination. Single-key and burst observations support a meaningful keyboard difference on this long page. They do not measure user preference.

**HOLD — Reduced-Motion Reference.** The completed Demo C Back to Top listener branches on the motion preference. Its historical light/dark check used a programmatic click and intercepted the requested behavior. It recorded smooth for no preference and instant for reduce. Its later faculty-checkmark correction did not alter this listener. R-029 uses the protected main baseline independently. The reduced-motion mouse result remains an unresolved R-025 condition. R-025 through R-028 and Demo C retain HOLD. [Historical Demo C review](../TASK_001/evidence/sources/S02_DEMO_REVIEW.txt#L89) · [Correction evidence](../TASK_001/evidence/sources/S03_CORRECTION_REVIEW.txt) · [Historical scroll samples](evidence/held-reference.json)

## Focus, visibility and responsive behavior

For each keyboard case the fixture focused the immediately preceding footer link without scrolling, confirmed focus there and traversed to Back to Top with real Tab. Before activation the button matched `:focus-visible`, reached full opacity and had the same settled geometry, background and shadow in each paired case. At viewport height 800 px, both buttons were hidden at y=359 and 360, visible at 361 and 700, then hidden again at 360 and zero. A real Dashboard click opened the modal in both controls and made zero Back to Top scroll requests. [Threshold and Dashboard controls](evidence/controls.json)

**Shared focus limitation.** Once the button hides, the browser drops focus to BODY. Neither version assigns a destination heading or link. Every settled primary case had a hidden, non-pointer-interactive button and BODY as the active element. An instant scroll reaches the hiding threshold earlier. During the existing CSS transition, the button can briefly retain focus before focusout. The same terminal focus behavior occurs in the original. This test does not establish the experience of the next screen-reader command or every subsequent Tab path.

| Viewport (CSS px) | Root client / scroll width (CSS px), both variants |
| ---: | ---: |
| 360 | 345 / 448 |
| 390 | 375 / 448 |
| 768 | 753 / 753 |
| 1024 | 1009 / 1009 |
| 1440 | 1425 / 1425 |

The original and candidate have the same whole-document horizontal overflow at 360 and 390 px in this fixture. No overflow appeared at the other tested widths. Narrow windows used a desktop Chromium viewport with its scrollbar. Touch hardware and pinch zoom were outside this run.

## Regression evidence and limits

- Original application suite 365/365. Candidate application suite 365/365. No failures or skips. Both ran the unmodified tests, including the footer layout test. The malformed-storage warning comes from the deliberate fixture. [Before TAP](evidence/before-tests.tap) · [After TAP](evidence/after-tests.tap)
- Browser evidence checks 127/127, zero failures and skips. The matrix includes 120 primary cases, four rapid bursts and four scripted controls. The separate boundary and Dashboard controls ran in both versions. [Verification TAP](evidence/verification.tap) · [Executable checks](tooling/verify.test.cjs)
- Chrome 156.0.8078.80, headless Windows, 800 CSS px high at scale 1. No uncaught JavaScript exceptions in the final measurement run. 3 resource errors (3 local maintenance 403, 0 favicon 404). The isolated server denies the maintenance read. Diagnostic events received on enabling the log can belong to the preceding page. No Firefox, Safari, physical-device, screen-reader, hosted auth, live Supabase, live PDF or deployment test was run. [Browser](evidence/browser.json) · [Diagnostics](evidence/diagnostics.json)
- Harness development exposed four measurement issues. Enter initially lacked character data and produced no native click. An extra post-hide Tab could move focus out of the page before the next case. Header layout shifted the first requested visibility-boundary position. One computed shadow was sampled mid-transition. The final recorder sends native key text, verifies the footer starting point and waits for actual button transitions. The boundary control repositions after layout and asserts the exact observed y. The implementation did not change in response to these harness findings.
- All 182 Before files matched the pinned Git blobs byte for byte. The After source differs only in the one handler. Forward and reverse patch checks passed. Stream navigation, Course List, Dashboard, Settings, Roadmap, academic calculations, Auth, API, Supabase, storage, PDF, Admin Catalog and deployment sources share the baseline bytes outside that hunk. Five completed workspaces matched their preceding file inventories. Original main and its existing untracked audit were preserved. [Protection evidence](evidence/GIT_PROTECTION.json)

The review starts at `ebe91e1ef559bf50e0c127c0126fe723370163c6`. The authoritative register still has 106 recommendations, with 25 SELECTED, 10 REJECTED, 7 HOLD, 64 UNREVIEWED and 0 IN REVIEW. Only TASK_005 review artifacts are published. Owner decision pending. [Current counts](../TASK_004_DECISION_001/COUNTS.json) · [Artifact manifest](MANIFEST.json)
