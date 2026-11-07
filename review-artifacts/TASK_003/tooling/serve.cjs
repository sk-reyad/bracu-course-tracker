const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png'};
for (const [name, port] of [['original',4290],['demo-b',4291],['r023',4292]]) {
  const root = path.join(__dirname,name);
  http.createServer((req,res)=>{
    const url = new URL(req.url,'http://127.0.0.1');
    res.setHeader('Cache-Control','no-store');
    // Neither copy can connect to a production service. CDN assets remain readable.
    res.setHeader('Content-Security-Policy', "connect-src 'self'; form-action 'none'; frame-src 'none'; object-src 'none'");
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
    if (url.pathname === '/') return res.writeHead(302,{Location:'/index.html?preview=1'}).end();
    if (url.pathname === '/js/config.js') {
      res.setHeader('Content-Type','text/javascript');
      return res.end("window.BRACU_CONFIG=Object.freeze({supabaseUrl:location.origin,supabasePublishableKey:'isolated-demo-placeholder',authPageUrl:'auth.html',appPageUrl:'index.html?preview=1',adminPageUrl:'admin.html',errorPageUrl:'error.html'});");
    }
    if (url.pathname === '/auth.html' || url.pathname === '/admin.html') return res.writeHead(403).end('Authentication is disabled in this isolated demo.');
    const file = path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
    if (!/\.(html|css|js|svg|png|webp|jpg|jpeg|ico)$/.test(file)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }).listen(port,'127.0.0.1',()=>console.log(name+': http://127.0.0.1:'+port+'/index.html?preview=1'));
}
