# Local interactive comparison

Existing owner workspace: bracu-task002-r010 under the same external visualization directory used for these isolated tasks. Run node serve.cjs there.

- Original: http://127.0.0.1:4280/index.html?preview=1
- Selected A: http://127.0.0.1:4281/index.html?preview=1
- R-010 native: http://127.0.0.1:4282/index.html?preview=1

Stop with Ctrl+C. Read-only synthetic preview; Auth/Admin and cloud writes blocked. Do not substitute real credentials. No D styling. For independent reconstruction on another computer: clone the public repository, then run node tooling/rebuild-demo.cjs <repository-checkout> <new-output-directory>. It exports only tracked 9d86db46b1134a3755a2e269252b1ee1234f2570, overlays the included source files, and installs the identical read-only server, without modifying that checkout. Git, tar, Node and CDN availability are prerequisites. Then run node serve.cjs from the new output directory. No deployment required. GALLERY.html can be opened directly from this evidence package without any server.
