# Reproducible isolated preview

Base: `9d86db46b1134a3755a2e269252b1ee1234f2570`. Review starting commit: `f989932461813fe5674fea5c13b1f32518a477d8`. Requires Git, tar, Node 24 and Chrome for the included browser verifier; no npm installation.

1. Clone the public repository and check out the published review commit.
2. Run `node review-artifacts/TASK_003/tooling/rebuild-demo.cjs <checkout> <new-directory-outside-checkout>`. The tool exports tracked baseline files and overlays the supplied source snapshots. It refuses an existing output directory.
3. In that new directory, run `node serve.cjs`.
4. Open Original http://127.0.0.1:4290/index.html?preview=1, selected Demo B http://127.0.0.1:4291/index.html?preview=1, R-023 http://127.0.0.1:4292/index.html?preview=1. Use ANT101 / Stream-4 in Course List.
5. Run `node run-tests.cjs` for all three application suites.
6. For browser verification, launch a separate Chrome profile with `--headless=new --remote-debugging-port=9242 --user-data-dir=<new-isolated-profile>`, keeping a page open. Run `node verify.mjs`. Results and screenshots appear under evidence/. Quote any profile path containing spaces.

The server binds loopback, serves only GET/HEAD static assets, replaces config with a dummy local value, blocks authentication/admin pages, disallows outbound connections using CSP, and always uses preview fixture data. No privileged credentials or user data are included. CDN script/font assets may require internet; browser logs disclose loading failures. No server-side cloud workflow is exercised. Close only this dedicated browser/profile and stop this server when finished.

The original snapshot is reconstructible from the public base commit. source/demo-b contains only selected Demo B's stream changes extracted from the preserved completed demo (including the final role=group correction); it excludes Demo A, C, D. source/r023 adds only the badge alternative and two owning static-test matcher updates. CHANGES.diff is relative to selected Demo B, not original. BASELINE_TO_* patches reconstruct each stream-only variant.
