# TASK_004 — R-024 target size and spacing assessment

**Completed read-only assessment with limitations.** Original stream triggers pass the spacing exception in tested arrangements. Selected Demo B and selected R-023 targets pass direct minimum size. Two original upper-mobile See more observations remain INCONCLUSIVE. R-024 remains UNREVIEWED; no owner decision or production change is implied.

[WCAG assessment](WCAG_2_5_8_ASSESSMENT.md) · [Evidence index](evidence/target-measurements.json) · [Gallery](GALLERY.md) · [Closest pairs](evidence/closest-target-pairs.json) · [Reproduction](PREVIEW.md) · [Protection](evidence/GIT_PROTECTION.json) · [Tests](TEST_RESULTS.txt)

## Scope and authority

Review parent 3d3eea502b9bee612151fa3fbf75be878cd04d46; protected original baseline 9d86db46b1134a3755a2e269252b1ee1234f2570; accepted stream snapshot commit 426a1cebac9a617d7ef5ce27eeb2782aed2c70ee. Current authority remains [TASK_003_DECISION_001](../TASK_003_DECISION_001/REGISTER.json). R-022 and R-023 remain SELECTED, R-024 UNREVIEWED. Counts unchanged: 106 total, 24 SELECTED, 10 REJECTED, 7 HOLD, 65 UNREVIEWED, 0 IN REVIEW. Only new TASK_004 review artifacts are published.

The accepted [S01 F-005 finding](../TASK_001/evidence/sources/S01_AUDIT.txt#L318) proved ~13px trigger height and a usability concern; it explicitly left spacing/exceptions unverified. New browser results fill that gap for the measured Course List arrangements. The assessment cites the [normative WCAG criterion](https://www.w3.org/TR/WCAG22/#target-size-minimum) and separates it from informative guidance, browser measurements, technical conclusions and unverified cases.

## Measurements and conclusions

36 viewport/theme/version cases; 62 Course List triggers inventoried in each; representative smallest/closest/long-label/last cases measured at relevant widths. 234 main observations plus 72 edge observations: **306 target/state assessments — 236 direct-size PASS, 68 spacing PASS, 2 INCONCLUSIVE, zero demonstrated FAIL**. These are scoped observations, not 306 independent website conformance tests. 45 actual screenshots include matched O/A/B desktop/mobile light/dark states and the original overlap.

The closest original stream spacing clearance is 17.5234375px to See more. The 13px targets are undersized, but their tested circles do not intersect actual neighbors or other undersized circles. Wide rounded selected targets contain the required square and pass actual hit tests; no result rests on CSS height alone. No other exception is claimed.

Two original 360px upper-edge long-label See more cases are partly obscured by the header. Additional candidate-square searches did not resolve the usable target geometry. They remain INCONCLUSIVE; this report neither manufactures a failure nor assumes an obscuration exemption. Selected A/B pass the same cases. Detailed measurements, limits and separately authorized follow-up options are in the assessment.

The unchanged fixture has 43 roadmap cards and no roadmap stream triggers. Roadmap stream testing is explicitly NOT TESTED; labels are not counted as actionable targets. Shared source is verified, but no synthetic data was introduced to simulate a roadmap case.

## Validation and limitations

Application regression suites were actually rerun in each fresh isolated copy: original **365/365**, selected Demo B **365/365**, selected R-023 **365/365**. Geometry calculations and evidence/protection consistency: **30/30 focused tests passed, zero failed/skipped**; all tooling syntax and git diff checks passed. Mathematical unit vectors are separate from application data. Exact commands/output and documentation/protection/data consistency results are in TEST_RESULTS.txt and evidence logs. Browser: Chrome/156.0.8078.80, headless Windows CSS viewport emulation. Final matrix had no runtime exception; intentional preview maintenance 403 and missing favicon.ico 404 logs remain visible. No real devices, other browser engines, cloud/auth/PDF writes, all possible course datasets or whole-site conformance claim.

Original Git state, existing untracked audit, all completed demos/corrections/native candidates, fresh accepted source copies, current register/counts and historical artifacts were compared before/after. No application, markup, CSS, behavior, data, API, authentication, persistence, PDF or deployment logic changed. A source inventory and hashes identify the exact accepted reconstruction.

## Handoff and stop

Review the complete [assessment](WCAG_2_5_8_ASSESSMENT.md), per-observation evidence, math tests, original overlap recheck and protection record. Only R-024 verification was performed. All selections and counts remain unchanged. **STOP after publishing; await independent technical review and the owner's explicit decision. Do not begin R-025, merge, deploy or implement production changes.**
