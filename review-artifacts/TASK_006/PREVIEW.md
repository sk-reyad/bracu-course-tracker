# R-030 interactive comparison

From a checkout containing this review commit and its Git history, run the following in PowerShell. Use a new directory outside every checkout.

```powershell
$checkout = (Get-Location).Path
$demo = Join-Path ([IO.Path]::GetTempPath()) 'bracu-r030-review'
node review-artifacts/TASK_006/tooling/rebuild.cjs "$checkout" "$demo"
Set-Location -LiteralPath "$demo"
node serve.cjs
```

| Version | Local page |
| --- | --- |
| Reference O · protected main | [Original](http://127.0.0.1:4320/index.html?preview=1) |
| Before · selected Demo B + R-023 stream treatment | [Before](http://127.0.0.1:4321/index.html?preview=1) |
| After · selected treatment + R-030 only | [After](http://127.0.0.1:4322/index.html?preview=1) |

Use Course List with all filters cleared. Scroll to ANT101, open its Stream-4 badge and Tab to See more. Press Enter or Space and compare the filtered result and focused curriculum selector. Reset the curriculum selector to All curriculum fields before repeating. Use a later stream badge for a longer scroll. Repeat with pointer input and both motion preferences. The 1440 px header can obscure the top of the focused selector in both versions.

The server uses loopback, preview mode, local placeholder config and a connection restriction to the local origin. Ordinary CDN script and font downloads are needed. It allows read requests and denies authenticated pages and writes. Ctrl+C stops the server.

## Collect new evidence

Keep the server running. In a second PowerShell window set `$checkout` and `$demo` to the same paths, then launch a dedicated empty Chrome profile.

```powershell
$tools = Join-Path $checkout 'review-artifacts/TASK_006/tooling'
$profile = Join-Path $demo 'browser-profile'
Start-Process -WindowStyle Hidden -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList ('--headless=new --remote-debugging-address=127.0.0.1 --remote-debugging-port=9246 --user-data-dir="' + $profile + '" --no-first-run --disable-sync about:blank')
Set-Location -LiteralPath "$demo"
node measure.mjs
node "$tools/controls.mjs" "$demo/evidence"
node "$tools/run-tests.cjs" "$demo"
python "$tools/render-cast.py" "$demo/evidence" "$demo/evidence/screencasts"
```

Node 24, Git, Chrome and Python with Pillow are the authoring tools used here. The GIF conversion uses actual captured Chrome JPEGs and their timestamps. The final frame holds for 900 ms. The measurement script records scroll and focus calls while forwarding them to the original browser implementation. Setup repositions and temporary theme/filter changes stay inside the isolated preview.

Run `node --test review-artifacts/TASK_006/tooling/verify.test.cjs` from the review checkout to validate the published evidence. Timing varies between runs. Published artifacts can be reviewed directly on GitHub without any local server.
