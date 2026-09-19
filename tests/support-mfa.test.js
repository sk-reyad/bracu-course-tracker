const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');
// Execute the real handler with only external services replaced. Never connect
// to Supabase, send notifications, or use real identities in this test suite.
async function harness({ aal = 'aal1', valid = true, active = true, permitted = true, tokenOverride } = {}) {
  const calls = [];
  let handler;
  const assurance = await import(pathToFileURL(path.join(root, 'supabase/functions/_shared/jwt-assurance.mjs')).href);
  const errors = await import(pathToFileURL(path.join(root, 'supabase/functions/_shared/public-error.mjs')).href);
  const query = (kind, table) => {
    calls.push([kind, table]);
    const q = {};
    for (const method of ['select', 'eq', 'order', 'range', 'update', 'insert']) {
      q[method] = (...args) => { calls.push([kind, table, method, ...args]); return q; };
    }
    q.single = async () => ({ data: table === 'profiles'
      ? { status: active ? 'active' : 'suspended', full_name: 'Test Student', email: 'test@example.invalid' }
      : { id: 'fake-ticket', requester_user_id: 'fake-user', maintenance_enabled: false }, error: null });
    q.then = (resolve, reject) => Promise.resolve({ data: [], error: null }).then(resolve, reject);
    return q;
  };
  const client = kind => ({
    auth: { getUser: async () => {
      calls.push(['getUser']);
      return { data: { user: valid ? { id: 'fake-user' } : null }, error: valid ? null : new Error('Invalid token') };
    } },
    from: table => query(kind, table),
    rpc: async (name, args) => {
      calls.push([kind, name, args]);
      return { data: name === 'authorize' ? permitted : true, error: null };
    }
  });
  const env = { ALLOWED_ORIGINS: 'https://audit.invalid', SUPABASE_URL: 'https://unused.invalid',
    SUPABASE_ANON_KEY: 'mock-public', SUPABASE_SERVICE_ROLE_KEY: 'mock-private' };
  const raw = fs.readFileSync(path.join(root, 'supabase/functions/support-desk/index.ts'), 'utf8');
  const source = stripTypeScriptTypes(raw.replace(/^import .*;\r?\n/gm, ''));
  vm.runInNewContext(source, {
    Error, Response, Request, FormData, URL, TextEncoder, AbortSignal, crypto: globalThis.crypto,
    ...assurance, ...errors,
    createClient: (_url, key) => client(key === 'mock-private' ? 'admin' : 'caller'),
    fetch: () => { throw new Error('Network disabled in security tests'); },
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } }
  });
  const token = tokenOverride ?? `header.${Buffer.from(JSON.stringify({ sub: 'fake-user', aal })).toString('base64url')}.mock`;
  return { calls, async invoke(action, payload = {}, anonymous = false) {
    return handler(new Request('https://unused.invalid', {
      method: 'POST', headers: { origin: 'https://audit.invalid', 'content-type': 'application/json',
        ...(anonymous ? {} : { authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ action, payload })
    }));
  } };
}

const privileged = ['list-tickets', 'update-status', 'add-reply', 'update-reply', 'resend-notification', 'set-maintenance'];
for (const action of privileged) {
  test(`support ${action} rejects AAL1 before privileged data access`, async () => {
    const h = await harness();
    const response = await h.invoke(action);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, 'Multi-factor authentication required.');
    assert.equal(h.calls.some(call => call[0] === 'admin'), false);
  });
  test(`support ${action} still requires permission with AAL2`, async () => {
    const h = await harness({ aal: 'aal2', permitted: false });
    assert.equal((await h.invoke(action)).status, 403);
    assert.equal(h.calls.some(call => call[0] === 'admin'), false);
  });
}

test('support AAL2 read succeeds with permission and authenticated user', async () => {
  const h = await harness({ aal: 'aal2' });
  assert.equal((await h.invoke('list-tickets')).status, 200);
  assert.ok(h.calls.some(call => call[0] === 'caller' && call[1] === 'authorize'));
});
test('support AAL2 maintenance update succeeds only in the mock database', async () => {
  const h = await harness({ aal: 'aal2' });
  assert.equal((await h.invoke('set-maintenance', { enabled: true })).status, 200);
  assert.ok(h.calls.some(call => call[0] === 'admin' && call[2] === 'update'));
});
test('an invalid token claiming AAL2 is rejected before privileged access', async () => {
  const h = await harness({ aal: 'aal2', valid: false });
  assert.equal((await h.invoke('list-tickets')).status, 401);
  assert.equal(h.calls.some(call => call[0] === 'admin'), false);
});
test('a suspended AAL2 user is rejected before privileged access', async () => {
  const h = await harness({ aal: 'aal2', active: false });
  assert.equal((await h.invoke('list-tickets')).status, 403);
  assert.equal(h.calls.some(call => call[0] === 'admin'), false);
});
test('missing or malformed assurance fails closed after authentication', async () => {
  for (const tokenOverride of ['malformed', `header.${Buffer.from('{}').toString('base64url')}.mock`]) {
    const h = await harness({ tokenOverride });
    assert.equal((await h.invoke('list-tickets')).status, 403);
    assert.equal(h.calls.some(call => call[0] === 'admin'), false);
  }
});
test('student own tickets remain available at AAL1 and scoped to the caller', async () => {
  const h = await harness({ permitted: false });
  assert.equal((await h.invoke('list-my-tickets')).status, 200);
  assert.ok(h.calls.some(call => call[2] === 'eq' && call[3] === 'requester_user_id' && call[4] === 'fake-user'));
  assert.equal(h.calls.some(call => call[1] === 'authorize'), false);
});
test('public maintenance remains available without authentication', async () => {
  const h = await harness({ valid: false });
  assert.equal((await h.invoke('get-maintenance', {}, true)).status, 200);
  assert.equal(h.calls.some(call => call[0] === 'getUser'), false);
});
test('signed-in support submission still accepts AAL1 without Admin permission', async () => {
  const h = await harness({ permitted: false });
  const response = await h.invoke('submit-ticket', { name: 'Test Student', email: 'test@example.invalid', message: 'Test message', source: 'dashboard' });
  assert.equal(response.status, 201);
  assert.equal(h.calls.some(call => call[1] === 'authorize'), false);
});
test('guest submission reaches its security challenge, not the MFA guard', async () => {
  const h = await harness({ valid: false });
  const response = await h.invoke('submit-ticket', { name: 'Test Guest', email: 'guest@example.invalid', message: 'Test message', source: 'auth' }, true);
  assert.equal((await response.json()).error, 'Security verification is not configured.');
  assert.equal(h.calls.some(call => call[0] === 'admin'), false);
});
