# TASK_003 — R-023 stream badge alternative

Technical verification: PASS WITH LIMITATIONS. R-023 is demonstrated here and remains UNREVIEWED pending independent review and owner decision. Selected Demo B remains SELECTED CANDIDATE. No other recommendation was started.

[Three-way gallery](GALLERY.md) · [Portable HTML gallery](GALLERY.html) · [Minimal candidate diff](CHANGES.diff) · [Preview instructions](PREVIEW.md) · [Manifest](MANIFEST.json)

## Recommendation and provenance

R-023 / F-005 / P2: make the containing stream badge the interactive target. The exact action source is [S01 audit line 327](../TASK_001/evidence/sources/S01_AUDIT.txt#L327), attributed in the accepted register to ecc:accessibility and ecc:browser-qa: “Target size is at least 24 × 24 CSS px or qualifies through sufficient target spacing; the containing badge may be made the target.” [R-022/R-023 register context](../MASTER_RECOMMENDATIONS.md#r-023) and [ledger](../REVIEW_LEDGER.md) are unchanged. R-024 spacing/exception assessment remains separate and unreviewed. These measurements do not establish WCAG conformance or nonconformance.

Original baseline: `9d86db46b1134a3755a2e269252b1ee1234f2570`. Starting review commit: `f989932461813fe5674fea5c13b1f32518a477d8`. Original main and all prior artifacts remain intact.

## Three independently reproducible versions

- BEFORE: original tracked baseline, including its original tooltip semantics and dimensions. No fixes are backported into the baseline.
- OPTION A: the preserved selected Demo B stream implementation extracted into a fresh baseline export, including its final labeled role=group correction. Its 24px inner trigger, body portal, bounded positioning, scroll/resize dismissal and keyboard bridge are retained. No Demo A/C/D changes are imported. The normalized roadmap file matches the completed corrected demo exactly.
- OPTION B: same selected Demo B behavior, with badge/category-badge classes moved from the noninteractive wrapper to the existing native button. The tooltip/See more button stays a sibling. Badge tokens and 26px visible height are retained. No click-handler workaround or new focus stop is added.

## Exact source changes

Relative to Option A, only two runtime files change:

| File | Function / selector | Change |
|---|---|---|
| js/roadmap.js | renderCategoryBadge | Move visible badge classes onto the native disclosure button; leave wrapper and sibling disclosure intact. Non-stream branches remain identical. |
| css/style.css | .stream-category > .stream-category-trigger.badge | Restore the existing badge padding, border, colors and typography on the button; minimum height 26px equals A's outer badge. |

The owning tests/main-integration.test.js changes two exact markup expectations to the new class locations. Assertions are preserved; the browser tests verify actual semantics and behavior. js/app.js is byte-identical between A and B. The three full source snapshots include js/app.js because it supplies Demo B's inherited behavior relative to original; it is not a new R-023 handler change.

[CHANGES.diff](CHANGES.diff) is the minimal A-to-B runtime patch; [TEST_CHANGES.diff](TEST_CHANGES.diff) contains the two static-test matcher edits. [BASELINE_TO_SELECTED_B.diff](BASELINE_TO_SELECTED_B.diff) and [BASELINE_TO_R023.diff](BASELINE_TO_R023.diff) reconstruct each stream-only candidate from the baseline. Patch replay and rebuilt snapshots were compared successfully.

## Actual target and hit-area comparison

ANT101 / Stream-4: both visible badges measure 64.578125 × 26 CSS px. A's native target measures 48.578125 × 24; B's measures 64.578125 × 26. Thus the rectangular target grows about 44%, while the visible badge dimensions stay equal. Rounded corners remain outside the painted pill; no rectangular corner hit claim is made.

At 1px-spaced sample centers over the visible badge bounding box (1690 points), A receives 1250 hits. B receives 1555 at mobile and 1559 at desktop: approximately 24.4–24.7% more actual hit samples. These are browser hit tests, not a continuous area or touch-success study. [Raw scan and accessibility tree](evidence/extra-results.json), [summary](evidence/HIT_AREA_COMPARISON.json).

Seven actual pointer locations were checked per viewport/theme: center, left, right, top, bottom and both padding regions. B opens exactly once from every sampled region. A opens in its native target and misses its external padding/border, as the measurements show. The test counts disclosure activations to catch double handling. [All coordinates/results](evidence/browser-results.json).

B therefore provides a modest, demonstrable pointer benefit beyond selected Demo B. Keyboard actions remain equivalent. The intended focus ring now follows the whole pill rather than the inner text button. The inherited positioning function uses the new button edge, shifting the popover anchor horizontally by approximately 8px; there is no new positioning algorithm or visual redesign. Owner evaluation should weigh this larger target and clearer focus outline against a small markup/CSS change. This report makes no selection for the owner.

## Browser verification

Chrome 156.0.8078.80, Windows headless, CSS viewport emulation at height 1000; widths 360/390/768/1024/1280/1440, light/dark, both A/B: **24 complete interaction cases passed**.

Verified using real CDP keyboard/pointer input: all sampled pointer regions; single activation; Enter and Space; Tab to See more; Shift+Tab back; focus-visible; accurate aria-expanded and aria-controls; labeled group popup portaled to body; Escape returning focus; outside dismissal; switching consecutive stream badges; keyboard and pointer See more setting the correct filter and focusing it; scroll/resize dismissal; first/last stream positioning; long-content wrapping and viewport bounds; closed/open root overflow. All recorded document scroll widths are no greater than their client widths. Consecutive badges are in adjacent course cards; the fixture has no multiple stream badges in one card.

Eight further variant/theme/mobile/desktop cases passed raster hit scanning, native button name/role in Chrome's accessibility tree, upper/lower viewport positioning (the upper anchor is below the sticky header), forward Tab out closing disclosure, and no hover-only/focus-only auto-opening, consistently with selected B. Visible size, font, text/background/border colors match exactly in these comparisons. No academic status CSS rules change.

48 matched screenshots cover ANT101 / Stream-4: three versions × desktop/mobile × both themes × closed/focused/open/See more. Original focus-within may already reveal its tooltip; that historical behavior is intentionally shown. Actual screenshots are checked visually for the example badge and relevant UI, not fabricated mockups or a pixel-perfect rendering claim.

## Tests and diagnostics

`node --test tests/*.test.js` (the runner expands the file list portably): original **365/365**, selected B **365/365**, R-023 **365/365**; zero failing, skipped or cancelled tests. [Runner summaries](evidence/test-results.json) and full per-variant logs are included. The malformed-storage diagnostic is an intentional existing fixture, not a test failure.

Browser commands run: `node verify.mjs` (A matrix); `node verify.mjs --continue-r023` (completed candidate matrix); `node verify-extra.mjs`; `node verify.mjs --screenshots-only` (matched framing correction); `node recheck-pointer.mjs` (A's settled-coordinate recheck). A clean `node verify.mjs` runs the full matrix and captures all screenshots.

Final interaction runs contain zero JavaScript runtime exceptions. Log-domain inspection records an intentional **403** from the isolated local /rest/v1/site_settings maintenance read in each supplemental case: the safety server blocks that endpoint and never sends it to Supabase. This is a known preview network error, not a claim of a clean production network trace. [Raw diagnostics](evidence/extra-results.json).

Earlier harness attempts are preserved and explicitly superseded: initial click observed queued layout/scroll dismissal before settling; a missing focus step tested Enter on the filter; array [-1] was corrected to .at(-1); a stale pre-hover rectangle missed the moving card's bottom edge; an upper test click at y=60 was intercepted by the sticky header. Corrected tests wait for existing motion/scroll and measure actual settled geometry. No application changes were made to make these harness checks pass. The initial Chrome launch also failed until its profile path was correctly quoted. No final failed application assertion remains.

## Protection, status and limitations

[Protection evidence](evidence/PROTECTION.json) records unchanged original main HEAD, empty tracked/staged diffs, preserved preexisting untracked audit checksum, fingerprints of all previously completed demo/correction/native workspaces, unchanged prior review artifacts and successful diff reconstruction. Only TASK_003 review artifacts are published. Counts remain **106: 23 SELECTED, 10 REJECTED, 7 HOLD, 66 UNREVIEWED**; [unchanged snapshot](evidence/UNCHANGED_COUNTS.json). Demo A and Demo B remain selected candidates, C HOLD, D rejected, R-010 rejected with its existing decision untouched.

No API, authentication, Supabase, academic calculations, course data, GPA/CGPA, PDF, persistence, general navigation, deployment or other badge logic is changed. All tests use preview fixtures. The isolated server blocks cloud writes and authentication; actual cloud/auth/PDF/real-student workflows are not exercised by this task.

Limitations: Chromium only; no Firefox/WebKit, physical touch device, assistive-technology speech session, high zoom/forced colors, or every possible catalog/viewport combination. Chrome's accessibility tree and keyboard input support the semantic checks but do not replace screen-reader testing. Reduced-motion and motion transitions are inherited unchanged and are not a new R-023 matrix. No WCAG spacing-exception assessment, production deployment or owner acceptance is claimed. CDNs may be needed when reproducing fonts/icons.

## Independent handoff

Review the minimal diff, actual hit coordinates, matched gallery and protection record. Confirm that moving badge styling onto the existing native button is an acceptable R-023 alternative and that the larger pointer surface warrants owner evaluation. R-023 remains UNREVIEWED; no decision/count changes, merge, deployment or R-024 work are authorized by this report. STOP after publication and await independent technical review and the owner's explicit decision.
