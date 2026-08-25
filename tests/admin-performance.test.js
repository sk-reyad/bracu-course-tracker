const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const AdminModule = require('../js/admin.js');

test('account list cache deduplicates requests and serves a fresh page without another load', async () => {
  let now = 1000;
  let calls = 0;
  const cache = AdminModule.createAccountListCache({ ttlMs: 30000, maxEntries: 4, now: () => now });
  const query = { role: 'student', page: 1, pageSize: 25, search: '', status: '' };
  const key = cache.keyFor(query);
  const loader = async () => {
    calls += 1;
    await Promise.resolve();
    return { accounts: [{ id: 'student-1' }], total: 1 };
  };

  const [first, duplicate] = await Promise.all([
    cache.load(key, loader),
    cache.load(key, loader)
  ]);

  assert.equal(calls, 1);
  assert.deepEqual(first, duplicate);
  assert.deepEqual(cache.read(key), { data: first, fresh: true, fetchedAt: 1000 });
  assert.deepEqual(await cache.load(key, loader), first);
  assert.equal(calls, 1);
});

test('account list cache exposes stale data, refreshes once, bounds entries, and invalidates', async () => {
  let now = 0;
  let calls = 0;
  const cache = AdminModule.createAccountListCache({ ttlMs: 30, maxEntries: 2, now: () => now });
  const load = value => cache.load(value, async () => ({ accounts: [{ id: `${value}-${++calls}` }], total: 1 }));

  await load('users');
  now = 31;
  assert.equal(cache.read('users').fresh, false);
  const refreshed = await load('users');
  assert.equal(refreshed.accounts[0].id, 'users-2');

  await load('admins');
  await load('pending');
  assert.equal(cache.read('users'), null, 'oldest page is evicted when the cache is full');
  cache.invalidate();
  assert.equal(cache.read('admins'), null);
  assert.equal(cache.read('pending'), null);
});

test('account list RPC performs one paginated database call and preserves the browser response shape', async () => {
  const moduleUrl = pathToFileURL(path.join(ROOT, 'supabase', 'functions', 'admin-access', 'account-list.mjs')).href;
  const { listAccounts } = await import(moduleUrl);
  const calls = [];
  const admin = {
    async rpc(name, payload) {
      calls.push([name, payload]);
      return {
        data: [{
          id: 'admin-1', full_name: 'Admin One', email: 'admin@example.com', role_name: 'admin',
          status: 'active', onboarding_completed: true, created_at: '2026-08-14T00:00:00Z',
          daily_login_count: 1, weekly_login_count: 2, monthly_login_count: 3,
          total_login_count: 4, total_count: 41
        }],
        error: null
      };
    }
  };

  const result = await listAccounts(admin, { page: 2, pageSize: 25, role: 'admin', status: 'active', search: 'Reyad' });

  assert.deepEqual(calls, [['admin_list_accounts', {
    target_role: 'admin', target_status: 'active', target_search: 'Reyad',
    page_offset: 25, page_limit: 25
  }]]);
  assert.equal(result.total, 41);
  assert.equal(result.accounts[0].user_roles.app_roles.name, 'admin');
  assert.equal(result.accounts[0].total_login_count, 4);
  assert.equal('role_name' in result.accounts[0], false);
  assert.equal('total_count' in result.accounts[0], false);
});

test('migration 010 adds the service-only paginated RPC and scale indexes', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '202608140010_admin_account_list_performance.sql'), 'utf8');

  assert.match(sql, /create or replace function public\.admin_list_accounts/i);
  assert.match(sql, /with filtered as materialized/i);
  assert.match(sql, /count\(\*\) over\s*\(\)/i);
  assert.match(sql, /left join lateral/i);
  assert.match(sql, /revoke all on function public\.admin_list_accounts[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.admin_list_accounts[\s\S]*to service_role/i);
  assert.match(sql, /user_roles_role_user_idx/i);
  assert.match(sql, /profiles_status_created_idx/i);
  assert.match(sql, /login_events_user_signed_in_idx/i);
  assert.match(sql, /profiles_full_name_trgm_idx/i);
  assert.match(sql, /profiles_email_trgm_idx/i);
  assert.match(sql, /profiles_student_id_trgm_idx/i);
});

test('profile access and account status cards use the approved breathing room', () => {
  const html = fs.readFileSync(path.join(ROOT, 'js', 'admin.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'admin.css'), 'utf8');

  assert.match(html, /class="detail-card access-card"/);
  assert.match(html, /class="detail-card[^"$]*account-status-card/);
  assert.match(css, /\.drawer-body\s*{[^}]*gap:\s*18px/s);
  assert.match(css, /\.detail-card\s*{[^}]*padding:\s*18px/s);
  assert.match(css, /\.access-card\s+\.permission-list\s*{[^}]*margin-top:\s*14px/s);
  assert.match(css, /\.permission-list\s*{[^}]*gap:\s*12px/s);
  assert.match(css, /\.permission-option\s*{[^}]*min-height:\s*64px;[^}]*padding:\s*12px 14px;[^}]*gap:\s*16px/s);
  assert.match(css, /\.account-status-card\s+\.drawer-actions\s*{[^}]*gap:\s*10px/s);
});

test('permission controls keep action spacing, fieldset padding, and one accessible focus ring', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'admin.css'), 'utf8');

  assert.match(css, /\.access-card\s+\.drawer-actions\s*{[^}]*margin-top:\s*14px/s);
  assert.match(css, /\.permission-fieldset\s*{[^}]*padding:\s*18px 14px 20px/s);
  assert.match(css, /\.permission-fieldset\s+\.permission-list\s*{[^}]*padding:\s*6px 0/s);
  assert.match(css, /\.permission-option:has\(input:focus-visible\)\s*{[^}]*box-shadow:/s);
  assert.match(css, /\.permission-option\s+input:focus-visible\s*{[^}]*outline:\s*none/s);
  assert.match(css, /\.admin-dialog\s+input:not\(\[type="checkbox"\]\):focus/);
  assert.doesNotMatch(css, /\.admin-dialog\s+input:focus[,\{]/);
});
