# Run the R-029 comparison

Use a checkout of this review commit, with the protected main commit available in its Git history. The commands below use PowerShell, Git and Node.js 24. Use a new output directory outside every checkout. Rebuilding reads the 182 tracked files from Git objects. The After copy substitutes the published candidate snapshot for `js/app.js`.

```powershell
$checkout = (Get-Location).Path
$demo = Join-Path ([System.IO.Path]::GetTempPath()) 'bracu-r029-review'
node review-artifacts/TASK_005/tooling/rebuild.cjs "$checkout" "$demo"
Set-Location -LiteralPath "$demo"
node serve.cjs
```

| Version | Local preview |
| --- | --- |
| Before · protected main | [Open Before](http://127.0.0.1:4310/index.html?preview=1) |
| After · R-029 only | [Open After](http://127.0.0.1:4311/index.html?preview=1) |

Use the preview fixture. Scroll past the first viewport until the arrow appears at the lower right. Click it, then scroll down again. Use Tab to reach the arrow and press Enter. Repeat with Space. Compare both tabs with reduced motion enabled and disabled. At the top, observe what happens to focus when the arrow disappears. The server binds to loopback, overrides the public config with a local placeholder and restricts connections to the preview origin. The original pages load fonts and script assets from their usual CDNs. Stop the server with Ctrl+C.

## Replay the evidence collection

The published evidence is viewable without a server. To take fresh measurements, use a **dedicated headless Chromium session** on debugging port 9245 with an empty browser profile. Close that dedicated browser after testing. In a second PowerShell window set `$checkout` and `$demo` to the same paths as above, then run the following commands with the preview server running.

```powershell
$tools = Join-Path $checkout 'review-artifacts/TASK_005/tooling'
$browserProfile = Join-Path $demo 'browser-profile'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
Start-Process -WindowStyle Hidden -FilePath $chrome -ArgumentList ('--headless=new --remote-debugging-address=127.0.0.1 --remote-debugging-port=9245 --user-data-dir="' + $browserProfile + '" --no-first-run --disable-sync about:blank')
Set-Location -LiteralPath "$demo"
node measure.mjs
node "$tools/control.mjs" "$demo/evidence"
node "$tools/run-tests.cjs" "$demo"
```

The recorder writes per-frame positions and native input events, screenshots, diagnostics and timestamped JPEG screencast frames under the new workspace's `evidence` folder. To render the captured frames as GIFs, run `python "$tools/render-cast.py" "$demo/evidence" "$demo/evidence/screencasts"` with Pillow installed. Durations, frame counts and optional favicon caching can differ between runs.

To verify the *published* observations against the candidate contract, run `node --test review-artifacts/TASK_005/tooling/verify.test.cjs` from the review checkout. The application regression suites run against both external source copies. The browser commands exercise the tracker preview with local test state.
