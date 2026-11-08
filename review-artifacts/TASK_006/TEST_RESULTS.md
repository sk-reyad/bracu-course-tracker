# TASK_006 verification results

| Executed verification | Result |
| --- | --- |
| Original application suite | 365 passed, 0 failed, 0 skipped |
| Selected Before application suite | 365 passed, 0 failed, 0 skipped |
| Candidate After application suite, final run | 365 passed, 0 failed, 0 skipped |
| Published browser evidence and dynamic helper checks | 140 passed, 0 failed, 0 skipped |
| Main activation matrix | 120 trusted pointer / Enter / Space cases |
| Additional activation cases | 12, including programmatic, rapid and later-badge edge cases |
| Disclosure controls | 20 version / width / theme configurations; 3 positions each |
| Roadmap See more | NOT TESTED · 43 accepted cards, zero stream disclosures |

The suites used Node 24.16.0. Browser measurements used Chrome 156.0.8078.80 on Windows, headless, CSS height 1000, scale 1. The deliberate malformed-storage fixture logs a parse warning. Actual final TAP outputs are under [evidence](evidence).

Commands from the isolated workspace and review checkout are documented in [PREVIEW.md](PREVIEW.md). The author ran the following checks.

```powershell
node tooling/run-tests.cjs <external-workspace>
node measure.mjs
node <public-tooling>/controls.mjs evidence
node --test --test-reporter=tap tooling/verify.test.cjs
git -C before apply --check <TASK_006>/CHANGES.diff
git -C after apply --reverse --check <TASK_006>/CHANGES.diff
git -C before apply --check <TASK_006>/TEST_CHANGES.diff
git -C after apply --reverse --check <TASK_006>/TEST_CHANGES.diff
```

The first After application run passed 364/365. Its one failure was an exact signature assertion expecting `openCurriculumField(fieldId)`. The optional scroll parameter required updating that assertion in the isolated candidate. All behavior assertions stayed in place, and the final suite passed.

The first evidence verifier passed 139/140. It expected three rapid Enter keydowns in the document, while the browser recorded See more followed by the focused native selector. The selector popup consumed the third Enter. The final assertion verifies those two exact targets and a single action/render/scroll. No application change followed this verifier correction.

The shared sticky-header overlap at 1440 px is recorded as an existing limitation in both versions. The filter receives focus but its upper portion is obscured. The section heading is behind the header at the final start alignment. Reduced-motion pointer scrolling still requests smooth and belongs to held R-026.

Diagnostics contain two local maintenance 403 responses and two favicon 404 responses. No uncaught runtime exception was recorded. Physical devices, screen readers, Firefox, Safari and live service workflows were not exercised.

The six earlier completed workspaces, source reconstruction and independently rebuilt preview copies passed hash comparisons. The protected original main and current authoritative register/ledger are preserved. [Git protection](evidence/GIT_PROTECTION.json)
