# TASK_005_DECISION_001 — R-029 rejected

R-029 changes from UNREVIEWED to REJECTED following technical review and owner-delegated evaluation. Original smooth Back to Top scrolling is preferred. Recorded 2026-11-08, Asia/Dhaka.

R-029 was rejected after technical review and owner-delegated evaluation. The keyboard-only instant-scroll alternative showed measurable timing improvement but insufficient practical UX benefit to justify changing the existing consistent smooth-scroll behavior and adding input-classification logic. Existing focus-loss behavior remains a separate limitation. Original Back to Top scrolling is preferred.

[Decision record](OWNER_DECISION.txt) · [Current register](REGISTER.json) · [Counts](COUNTS.json) · [Record delta](DECISION_CHANGE.json)

## Demonstration and decision

TASK_005 — Keyboard instant-scroll alternative demonstrated and tested, then rejected after owner-delegated evaluation. The owner reviewed the demo and reported no meaningful perceived improvement, then delegated the recommendation decision. TASK_005 technically verified immediate Enter/Space scrolling across 120 primary cases and eight extra activation cases. Both application copies passed 365 tests and 127 evidence checks passed. Those are historical results. Technical success and final owner selection are recorded separately. The implementation alternative is rejected. Keyboard accessibility and reduced-motion accessibility retain their existing recommendation records.

- [report](https://github.com/sk-reyad/bracu-course-tracker/blob/70636d7bce53d8c2783d00142c54e1ee7c2ff222/review-artifacts/TASK_005/TASK_REVIEW_005.md)
- [gallery](https://github.com/sk-reyad/bracu-course-tracker/blob/70636d7bce53d8c2783d00142c54e1ee7c2ff222/review-artifacts/TASK_005/GALLERY.md)
- [diff](https://github.com/sk-reyad/bracu-course-tracker/blob/70636d7bce53d8c2783d00142c54e1ee7c2ff222/review-artifacts/TASK_005/CHANGES.diff)
- [matrix](https://github.com/sk-reyad/bracu-course-tracker/blob/70636d7bce53d8c2783d00142c54e1ee7c2ff222/review-artifacts/TASK_005/evidence/matrix.csv)

All four links are pinned to starting commit 70636d7bce53d8c2783d00142c54e1ee7c2ff222. Historical TASK_005 files, including their UNREVIEWED statements and complete candidate source, remain immutable.

## Preserved records and limitations

All other 105 complete recommendation records are unchanged. R-025 through R-028 and Demo C remain HOLD. R-030 remains UNREVIEWED. Demo A/B selections, rejected Native B and Demo D, R-023 selection and scoped R-024 acceptance retain their previous reasons and evidence. Source identities, original audit wording, exact-only deduplication and occurrence history are preserved.

Counts reconcile to 106 total, 25 SELECTED, 11 REJECTED, 7 HOLD, 63 UNREVIEWED and 0 IN REVIEW. Existing focus loss when Back to Top hides, narrow-width overflow and Chromium-only technical coverage remain documented in TASK_005. Reduced-motion pointer scrolling remains held separately. This decision introduces no focus or scrolling implementation.

## Validation and protected scope

[Verification results](VERIFICATION_RESULTS.txt) · [Executable checks](verify-decision.test.cjs) · [Git protection](GIT_PROTECTION.json) · [Manifest](MANIFEST.json)

All 14 documentation and protection tests passed, with zero failures or skips. The syntax check also passed.

Only current MASTER_RECOMMENDATIONS.md, REVIEW_LEDGER.md and this new decision directory change. Checks compare all other 105 records, all unaffected master blocks and ledger rows, source/decision history, reconciled counts, historical Git blobs, original repository state and six completed workspace inventories. Original main remains 9d86db46b1134a3755a2e269252b1ee1234f2570. The preexisting untracked audit is preserved. No application source, completed demo, production data, merge or deployment changed.

Application and browser tests were not rerun for this documentation decision. Live filesystem checks use optional BRACU_ORIGINAL_REPO and BRACU_REVIEW_EXTERNAL_ROOT variables; they were supplied for publication validation. Reviewers can inspect recorded protection evidence without those private workspaces. The manifest hashes both current documents and every new payload file. SHA256SUMS additionally covers the manifest.

## Publication and handoff

Review parent 70636d7bce53d8c2783d00142c54e1ee7c2ff222. Publish normally to temp/ui-ux-audit-review. The final handoff supplies the containing commit SHA and report URL. STOP after publication for independent review. R-030 and HOLD recommendations await a new explicit NEXT instruction.
