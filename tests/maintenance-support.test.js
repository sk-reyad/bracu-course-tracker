const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

test("production maintenance page uses Split design and exposes support plus admin access", () => {
  const html = fs.readFileSync(path.join(root, "maintenance.html"), "utf8");
  assert.match(html, /<canvas[^>]+id="dotGridBackground"[^>]+aria-hidden="true"/);
  assert.match(html, /headline-split/);
  assert.match(html, /We(?:&rsquo;|’)re making things/);
  assert.match(html, /<h1[^>]*>better\.<\/h1>/);
  assert.match(html, /data-open-support/);
  assert.match(html, /auth\.html\?mode=admin/);
  assert.match(html, /id="maintenanceThemeToggle"[^>]+aria-label="Switch to dark theme"/);
  assert.match(html, /assets\/maintenance-illustration\.svg/);
  assert.match(html, /css\/maintenance-preview\.css/);
  assert.match(html, /js\/motion\.js/);
  assert.match(html, /js\/maintenance-preview\.js/);
  assert.match(html, /js\/maintenance-guard\.js/);
  assert.match(html, /js\/support-widget\.js/);
});

test("maintenance Check again makes one fresh request to the public entry point", () => {
  const source = fs.readFileSync(
    path.join(root, "js", "maintenance-preview.js"),
    "utf8",
  );
  let retry = null;
  let assigned = "";
  let reloads = 0;
  const retryButton = {
    addEventListener(event, callback) {
      if (event === "click") retry = callback;
    },
  };
  const sandbox = {
    document: {
      documentElement: { dataset: {} },
      getElementById(id) {
        return id === "maintenanceRetry" ? retryButton : null;
      },
    },
    localStorage: { getItem() { return "light"; }, setItem() {} },
    location: {
      assign(value) { assigned = value; },
      reload() { reloads += 1; },
    },
    matchMedia() { return { matches: false }; },
  };
  sandbox.globalThis = sandbox;

  vm.runInNewContext(source, sandbox);
  assert.equal(typeof retry, "function");
  retry();

  assert.equal(assigned, "index.html");
  assert.equal(reloads, 0);
});

test("production maintenance assets remain theme-safe, responsive, and motion-safe", () => {
  const svg = fs.readFileSync(path.join(root, "assets", "maintenance-illustration.svg"), "utf8");
  const css = fs.readFileSync(path.join(root, "css", "maintenance-preview.css"), "utf8");

  assert.match(svg, /<g id="Illustration">/);
  assert.doesNotMatch(svg, /<g id="Background">/);
  assert.doesNotMatch(svg, /<rect[^>]+fill:#FFFFFF/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\.maintenance-action:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /min-height:\s*100dvh/);
  assert.match(css, /\.dot-grid-background[\s\S]*pointer-events:\s*none/);
});

test("production maintenance layout has a compact landscape treatment instead of clipping", () => {
  const css = fs.readFileSync(path.join(root, "css", "maintenance.css"), "utf8");
  assert.match(css, /@media\s*\(max-height:\s*520px\)\s*and\s*\(orientation:\s*landscape\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(120px,/);
  assert.match(css, /\.maintenance-production\s+\.maintenance-visual\s*{[^}]*order:\s*0/s);
});

test("support widget is available from auth and student dashboard", () => {
  const auth = fs.readFileSync(path.join(root, "auth.html"), "utf8");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  for (const html of [auth, index]) {
    assert.match(html, /css\/support\.css/);
    assert.match(html, /js\/support-widget\.js/);
    assert.match(html, /data-open-support/);
  }
  assert.match(index, /id="supportTicketsPanel"/);
});

test("every production public entry loads the maintenance guard while Admin stays exempt", () => {
  for (const file of ["index.html", "auth.html", "error.html", "maintenance.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /js\/maintenance-guard\.js/, `${file} must load maintenance state`);
  }
  const admin = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  assert.doesNotMatch(admin, /js\/maintenance-guard\.js/);
});

test("admin login mode cannot navigate back into the student flow", () => {
  const auth = fs.readFileSync(path.join(root, "js", "auth.js"), "utf8");
  assert.match(auth, /adminOnlyMode/);
  assert.match(auth, /backToStudent[^\n]+hidden/);
});

test("Vercel middleware enforces maintenance before public HTML is served", () => {
  const middleware = fs.readFileSync(path.join(root, "middleware.ts"), "utf8");
  assert.match(middleware, /site_settings\?id=eq\.global/);
  assert.match(middleware, /maintenance\.html/);
  assert.match(middleware, /auth\.html[^\n]+mode[^\n]+admin/);
  assert.match(middleware, /admin\.html/);
  assert.match(middleware, /catch[^]*maintenanceUrl/s);
});

test("admin panel contains support desk and maintenance controls", () => {
  const html = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  const permissions = require(path.join(root, "js", "admin-permissions.js"));
  assert.match(html, /data-admin-view="support"/);
  assert.match(html, /id="maintenanceStateToggle"/);
  assert.match(html, /id="supportTicketList"/);
  assert.ok(permissions.CATALOG.some(item => item.key === "view_support"));
  assert.ok(permissions.CATALOG.some(item => item.key === "manage_support"));
  assert.ok(permissions.CATALOG.some(item => item.key === "manage_maintenance"));
});

test("support schema has RLS, guest ownership separation, replies, statuses, and maintenance permissions", () => {
  const sql = fs.readFileSync(path.join(root, "supabase", "migrations", "202608210011_maintenance_support_desk.sql"), "utf8");
  assert.match(sql, /create table[^;]+support_tickets/is);
  assert.match(sql, /requester_user_id\s+uuid/i);
  assert.match(sql, /active.*working_on_it.*solved.*cancelled/is);
  assert.match(sql, /create table[^;]+support_replies/is);
  assert.match(sql, /enable row level security/gi);
  assert.match(sql, /support\.read/);
  assert.match(sql, /support\.manage/);
  assert.match(sql, /maintenance\.manage/);
  assert.match(sql, /auth\.uid\(\)\s*=\s*requester_user_id/i);
  assert.match(sql, /create or replace function public\.set_account_access/i);
  assert.match(sql, /support\.read.*support\.manage.*maintenance\.manage/is);
  assert.match(sql, /create table public\.support_rate_limits/i);
  assert.match(sql, /create or replace function public\.consume_support_rate_limit/i);
  assert.match(sql, /revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+public\.support_tickets/is);
});

test("support Edge Function keeps Web3Forms key server-side and enforces privileged actions", () => {
  const source = fs.readFileSync(path.join(root, "supabase", "functions", "support-desk", "index.ts"), "utf8");
  assert.match(source, /Deno\.env\.get\("WEB3FORMS_ACCESS_KEY"\)/);
  assert.doesNotMatch(source, /WEB3FORMS_ACCESS_KEY\s*=\s*["'][^"']+["']/);
  assert.match(source, /support\.read/);
  assert.match(source, /support\.manage/);
  assert.match(source, /maintenance\.manage/);
  assert.match(source, /requester_user_id/);
  assert.match(source, /from\("profiles"\)\.select\("full_name, email"\)/);
  assert.match(source, /requester_name:\s*identity\.name/);
  assert.match(source, /TURNSTILE_SECRET_KEY/);
  assert.match(source, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
  assert.match(source, /verification\?\.action\s*===\s*"support_ticket"/);
  assert.match(source, /consume_support_rate_limit/);
  assert.match(source, /\.range\(from,\s*to\)/);
});

test("support dialog scrolls on short screens and renders a guest security challenge", () => {
  const css = fs.readFileSync(path.join(root, "css", "support.css"), "utf8");
  const widget = fs.readFileSync(path.join(root, "js", "support-widget.js"), "utf8");
  assert.match(css, /\.support-dialog\s*{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.support-dialog textarea\s*{[^}]*max-height:/s);
  assert.match(widget, /supportTurnstile/);
  assert.match(widget, /turnstileToken/);
  assert.match(widget, /size:\s*"flexible"/);
  assert.match(widget, /action:\s*"support_ticket"/);
});

test("student support panel uses the tracker theme surface, border, and text tokens", () => {
  const css = fs.readFileSync(path.join(root, "css", "support.css"), "utf8");
  const panel = css.match(/\.support-tickets-panel\s*{([^}]*)}/)?.[1] || "";
  const ticket = css.match(/\.support-ticket\s*{([^}]*)}/)?.[1] || "";
  assert.match(panel, /border:\s*1px solid var\(--border/);
  assert.match(panel, /color:\s*var\(--text/);
  assert.match(panel, /background:\s*var\(--surface-soft/);
  assert.doesNotMatch(panel, /--surface2/);
  assert.match(ticket, /border:\s*1px solid var\(--border/);
  assert.match(ticket, /background:\s*var\(--surface/);
});

test("admin support desk paginates instead of permanently hiding older tickets", () => {
  const html = fs.readFileSync(path.join(root, "admin.html"), "utf8");
  const js = fs.readFileSync(path.join(root, "js", "admin-support.js"), "utf8");
  assert.match(html, /id="loadMoreSupportTickets"/);
  assert.match(js, /nextPage/);
  assert.match(js, /loadMoreSupportTickets/);
});
