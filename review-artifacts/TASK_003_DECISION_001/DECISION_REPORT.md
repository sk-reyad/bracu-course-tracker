# TASK_003_DECISION_001 — R-023 selection

R-023 is now **SELECTED CANDIDATE** (machine status SELECTED), following the explicit owner instruction. This records a design preference only; production implementation is not authorized.

[Current authoritative register](REGISTER.json) · [Counts](COUNTS.json) · [Owner instruction, verbatim](OWNER_DECISION.txt) · [Change record](DECISION_CHANGE.json) · [Verification](VERIFICATION_RESULTS.txt) · [Protection](GIT_PROTECTION.json)

## Exact owner decision

Owner selected R-023's full-badge interactive target after reviewing TASK_003. The entire visible stream badge is the preferred clickable surface. The previously selected Demo B tooltip, accessibility, positioning and overflow improvements remain preserved.

Demonstrated field: **TASK_003 — Full-badge interactive alternative demonstrated and selected by owner**. Transition: **R-023 UNREVIEWED → SELECTED**. Technical TASK_003 verification was complete before this selection; passing technical tests did not itself select this design.

## Requirement and preferred implementation

R-022 remains the selected minimum interactive target-size requirement, satisfied by R-023. R-023 is the owner-selected preferred implementation using the entire visible stream badge. It supersedes only the earlier inner-trigger-only treatment, preserving Demo B tooltip, accessibility, positioning, scrolling, dismissal and overflow improvements. Any eventual separately authorized production implementation must combine these requirements in one implementation, not create competing controls.

R-022's full machine-readable recommendation record remains unchanged and SELECTED. The other 105 records, including all prior owner reasons, remain deeply unchanged. Demo A remains SELECTED CANDIDATE, Demo B's other selected improvements remain selected, Demo C stays HOLD, Demo D stays rejected, and Native B / R-010 remains REJECTED. No second control or competing implementation is created.

## Historical technical evidence

- [TASK_REVIEW_003.md](https://github.com/sk-reyad/bracu-course-tracker/blob/426a1cebac9a617d7ef5ce27eeb2782aed2c70ee/review-artifacts/TASK_003/TASK_REVIEW_003.md)
- [GALLERY.md](https://github.com/sk-reyad/bracu-course-tracker/blob/426a1cebac9a617d7ef5ce27eeb2782aed2c70ee/review-artifacts/TASK_003/GALLERY.md)
- [HIT_AREA_COMPARISON.json](https://github.com/sk-reyad/bracu-course-tracker/blob/426a1cebac9a617d7ef5ce27eeb2782aed2c70ee/review-artifacts/TASK_003/evidence/HIT_AREA_COMPARISON.json)
- [CHANGES.diff](https://github.com/sk-reyad/bracu-course-tracker/blob/426a1cebac9a617d7ef5ce27eeb2782aed2c70ee/review-artifacts/TASK_003/CHANGES.diff)

These four immutable links are pinned to TASK_003 commit 426a1cebac9a617d7ef5ce27eeb2782aed2c70ee. Its 48 screenshots, 24 interaction cases, 8 supplemental cases and 365/365 application tests per version are existing historical results, not new tests run for this decision. Its Chromium-only, preview 403 and other documented limitations remain. Historical TASK_003 reports/manifest still say decision pending because they preserve their original publication state; the current master/ledger and this snapshot provide the updated authority. No historical evidence is rewritten.

## Counts and source integrity

**106 total: 24 SELECTED, 10 REJECTED, 7 HOLD, 65 UNREVIEWED, 0 IN REVIEW.** Only one status transition occurred. IDs, actions, priorities, identities, source quotations, 119 raw occurrences, 13 exact deduplications and all reconciliation history remain unchanged. R-024 is still UNREVIEWED and has not been started.

## Changed review files

Updated review-artifacts/MASTER_RECOMMENDATIONS.md and REVIEW_LEDGER.md for R-023's status, demonstration, direct evidence links, requirement/implementation relationship, counts and current authority pointers. Added only this decision directory: report, authoritative REGISTER.json/COUNTS.json, verbatim owner instruction, change record, protection evidence, focused verification test/results, manifest and checksums. Old machine snapshots remain immutable history.

## Validation commands and results

Decision consistency/protection checks: **16/16 passed, 0 failed, 0 skipped**. Syntax check and git diff --check also passed.

Run from the review checkout:

`node --check review-artifacts/TASK_003_DECISION_001/verify-decision.test.cjs`

`node --test review-artifacts/TASK_003_DECISION_001/verify-decision.test.cjs`

See VERIFICATION_RESULTS.txt for actual executed output and any failures. The tests check the single allowed transition, unchanged other 105 records, all status counts, master/ledger consistency, exact decision reason, source/deduplication integrity, direct evidence links, immutable prior artifacts, original repository state and completed workspace fingerprints. Optional BRACU_ORIGINAL_REPO and BRACU_REVIEW_EXTERNAL_ROOT variables enable live local protection rechecks; these were supplied during the author run. Reviewers without those local workspaces can still check the recorded before/after protection evidence.

Publication checks additionally cover git diff --check, staged file scope and blob/checksum equality. The containing commit SHA is supplied in the final handoff instead of a self-referential hash in this report. Anonymous post-push access/checksum validation confirms publication.

## Repository protection and limitations

Review parent: 426a1cebac9a617d7ef5ce27eeb2782aed2c70ee. Protected original main: 9d86db46b1134a3755a2e269252b1ee1234f2570, with empty tracked/staged diffs and its preexisting untracked audit preserved. GIT_PROTECTION.json records equal original before/after state and all four completed demo/correction workspace inventories. No original application source, completed candidate, rejected Native B, historical TASK_003 evidence, original audit, API, Supabase, Auth, academic calculation, PDF or persistence logic changed. Only authorized review documents are committed to temp/ui-ux-audit-review. No merge, deployment or production implementation occurred.

This is documentation-only verification. Application/browser/cloud/assistive-technology tests are not rerun; no new runtime or deployed behavior is claimed. Existing source-transcript and browser-testing limitations remain as recorded in earlier evidence.

## Independent handoff and stop

Compare DECISION_CHANGE.json with the previous authoritative TASK_002_DECISION_002 register and inspect the focused verification output. Confirm the owner's preference is limited to the stream badge's interactive target, with R-022 and all other selected Demo B requirements retained. **STOP after publication. Wait for independent review and explicit owner NEXT before another recommendation.**
