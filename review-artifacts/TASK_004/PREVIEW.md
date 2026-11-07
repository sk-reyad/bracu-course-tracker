# Read-only reproduction

Requires Git, tar, Node 24 and a separate Chrome profile. No npm dependencies or application edits. Source pins: original 9d86db46b1134a3755a2e269252b1ee1234f2570; accepted A/B source 426a1cebac9a617d7ef5ce27eeb2782aed2c70ee; owner-decision baseline 3d3eea502b9bee612151fa3fbf75be878cd04d46.

From a public checkout of this published review commit:

1. Run `node review-artifacts/TASK_004/tooling/rebuild-assessment.cjs <checkout> <new-directory-outside-checkout>`. This exports tracked baseline content, copies its O/A/B environments and reads A/B overlays from pinned Git blobs. Existing output directories are rejected. Text archive exports can use platform line endings; this changes no source content.
2. In the new output directory, run `node serve.cjs`. Read-only Original/O: http://127.0.0.1:4300/index.html?preview=1; selected Demo B/A: http://127.0.0.1:4301/index.html?preview=1; selected R-023/B: http://127.0.0.1:4302/index.html?preview=1. If the author's previews are already running, use those rather than starting a duplicate server.
3. Start a dedicated headless Chrome instance at debugging port 9244 with a fresh external profile, no normal browser profile. Quote profile paths containing spaces. Example PowerShell from the new output directory:

```powershell
$r024Arguments = '--headless=new --remote-debugging-port=9244 --user-data-dir="' + (Join-Path (Get-Location) 'browser-profile') + '" --no-first-run --no-default-browser-check about:blank'
Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $r024Arguments -WindowStyle Hidden
```

4. Run `node measure.mjs`, `node edges.mjs`, `node overlap-recheck.mjs` sequentially, since they use the same dedicated page. The first command measures six widths × two themes × three source versions, records representative course targets and documents absent roadmap targets. The edge command checks actual Stream-5 content near upper/lower viewport edges. The final command investigates the original overlapped See more target without altering it. Results and screenshots appear under evidence/.
5. Run `node --test geometry.test.mjs` and `node run-tests.cjs`. The latter expands the application tests file list and executes all three isolated copies.
6. In the public checkout, run `node --test review-artifacts/TASK_004/tooling/verify-evidence.test.mjs` to validate published measurement/classification consistency, links, hashes of protected authority and commit scope.

The safety server binds loopback, permits GET/HEAD static assets, replaces runtime config with a dummy local value, blocks authentication/admin pages and external API connections, and always uses unchanged preview fixtures. A local maintenance read returns 403 and is recorded. CDNs may supply Inter/icons; the recorded browser/fonts must be considered when comparing exact fractional pixel values. No real student, auth, storage, database or cloud write is used.

The browser scripts only change transient theme, focus, disclosure and scroll state; they do not inject markup, CSS, synthetic records, competing controls or app handlers. The inventory ranks all stream layout boxes to select meaningful representatives; only actual measured states receive classifications. Roadmap has 43 cards but no stream controls in this accepted fixture.

Review case files through the index; geometry is in CSS pixels, independent of screenshot display scaling. Miss lists are limited to eight examples while full miss counts are retained; no successful direct-size result has a square miss. The SVG diagram is clearly labeled and generated from actual measured coordinates, not a modified application screenshot.
