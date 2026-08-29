const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const functionPath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'index.ts');
const actionsPath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'account-actions.mjs');
const policyPath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'account-policy.mjs');
const accountListPath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'account-list.mjs');
const rateLimitPath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'admin-rate-limit.mjs');
const catalogActionsPath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'catalog-actions.mjs');
const root = path.join(__dirname, '..');

async function loadAccountActions() {
  return import(`${pathToFileURL(actionsPath).href}?test=${Date.now()}-${Math.random()}`);
}

async function loadCatalogActions() {
  return import(`${pathToFileURL(catalogActionsPath).href}?test=${Date.now()}-${Math.random()}`);
}

test('administrator creation rejects weak passwords before creating an Auth user', async () => {
  const { createAdministrator } = await loadAccountActions();
  const admin = createAdminClient();

  await assert.rejects(() => createAdministrator({
    admin,
    payload: { fullName: 'New Admin', email: 'admin@example.com', password: 'password-123', role: 'admin', permissions: ['view_profiles'] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /12 characters.*uppercase.*lowercase.*number.*symbol/i);

  assert.equal(admin.calls.some(([name]) => name === 'createUser'), false);
});

test('unfiltered account listing requires administrator-list access', async () => {
  const policy = await import(`${pathToFileURL(policyPath).href}?test=${Date.now()}-${Math.random()}`);
  assert.equal(typeof policy.accountListPermission, 'function');
  assert.equal(policy.accountListPermission({ role: 'student' }), 'users.read');
  assert.equal(policy.accountListPermission({ role: 'admin' }), 'admins.read');
  assert.equal(policy.accountListPermission({ role: 'super_admin' }), 'admins.read');
  assert.equal(policy.accountListPermission({}), 'admins.read');
});

test('administrator profile summaries require administrator-list access', async () => {
  const policy = await import(`${pathToFileURL(policyPath).href}?test=${Date.now()}-${Math.random()}`);
  assert.equal(typeof policy.assertProfileSummaryAllowed, 'function');
  assert.doesNotThrow(() => policy.assertProfileSummaryAllowed('student', ['profiles.read']));
  assert.throws(
    () => policy.assertProfileSummaryAllowed('admin', ['profiles.read']),
    /administrator accounts/i
  );
  assert.doesNotThrow(() => policy.assertProfileSummaryAllowed('admin', ['profiles.read', 'admins.read']));
});

test('privileged administrator mutations use action-specific server-side rate limits', async () => {
  assert.equal(fs.existsSync(rateLimitPath), true, 'admin rate-limit policy must exist');
  const limiter = await import(`${pathToFileURL(rateLimitPath).href}?test=${Date.now()}-${Math.random()}`);
  assert.deepEqual(limiter.adminRateLimitForAction('create-admin'), { windowSeconds: 600, maxRequests: 5 });
  assert.deepEqual(limiter.adminRateLimitForAction('delete-account'), { windowSeconds: 600, maxRequests: 5 });
  assert.deepEqual(limiter.adminRateLimitForAction('update-admin-identity'), { windowSeconds: 600, maxRequests: 5 });
  assert.deepEqual(limiter.adminRateLimitForAction('set-account-status'), { windowSeconds: 300, maxRequests: 20 });
  assert.equal(limiter.adminRateLimitForAction('list-accounts'), null);
  assert.deepEqual(limiter.adminRateLimitForAction('upsert-catalog-item'), { windowSeconds: 300, maxRequests: 20 });
  assert.deepEqual(limiter.adminRateLimitForAction('delete-catalog-item'), { windowSeconds: 300, maxRequests: 20 });

  const calls = [];
  const admin = {
    async rpc(name, input) {
      calls.push([name, input]);
      return { data: false, error: null };
    }
  };
  let rejection;
  try {
    await limiter.enforceAdminRateLimit(admin, 'actor-1', 'create-admin');
  } catch (error) {
    rejection = error;
  }
  assert.equal(limiter.isAdminRateLimitExceeded(rejection), true);
  assert.equal(rejection.retryAfterSeconds, 600);
  assert.match(rejection.message, /Too many administrator changes/i);
  assert.deepEqual(calls, [[
    'consume_admin_rate_limit',
    { actor_id: 'actor-1', action_name: 'create-admin', window_seconds: 600, max_requests: 5 }
  ]]);
});

test('catalog mutations normalize allowed fields and write only the selected catalog record', async () => {
  const catalog = await loadCatalogActions();
  const calls = [];
  const admin = {
    async rpc(name, input) {
      calls.push([name, input]);
      return {
        data: {
          kind: input.catalog_kind,
          item: {
            ...input.catalog_item,
            created_by: 'super-1',
            created_at: '2026-08-27T00:00:00Z',
            updated_at: '2026-08-27T00:00:00Z'
          }
        },
        error: null
      };
    }
  };
  const audit = { targetId: 'unsafe-target', beforeValues: { unsafe: true }, afterValues: { unsafe: true } };
  const result = await catalog.upsertCatalogItem({
    admin,
    actor: { id: 'super-1', role: 'super_admin', permissions: ['catalog.manage'] },
    requestId: '11111111-1111-4111-8111-111111111111',
    payload: {
      kind: 'course', code: ' cse 420 ', title: ' Advanced Software Engineering ', credits: '3',
      department: 'cse', category: 'program-core', roadmapLevel: 7, roadmapOrder: 2,
      hardPrerequisites: ['cse 370', ' CSE370 '], softPrerequisites: [' CSE 320 '],
      ignored: '<script>alert(1)</script>'
    },
    audit,
  });

  assert.deepEqual(result, {
    kind: 'course',
    item: {
      code: 'CSE420', title: 'Advanced Software Engineering', credits: 3, department: 'CSE',
      category: 'program-core', visibility: 'curriculum', roadmap_level: 7, roadmap_order: 2,
      hard_prerequisites: ['CSE370'], soft_prerequisites: ['CSE320'],
      source_note: null, is_roadmap_slot: false
    }
  });
  assert.deepEqual(calls, [[
    'mutate_global_catalog',
    {
      catalog_action: 'upsert', catalog_kind: 'course', catalog_item: result.item,
      actor_id: 'super-1', audit_request_id: '11111111-1111-4111-8111-111111111111'
    }
  ]]);
  assert.deepEqual(audit, {
    targetId: null,
    beforeValues: { kind: 'course', key: 'CSE420' },
    afterValues: {}
  });
  assert.equal(Object.hasOwn(result.item, 'created_by'), false);
  assert.equal(Object.hasOwn(result.item, 'created_at'), false);
  assert.equal(JSON.stringify(calls).includes('ignored'), false);
});

test('catalog listing selects and returns public fields only', async () => {
  const catalog = await loadCatalogActions();
  const calls = [];
  const rows = {
    catalog_departments: [{ id: 'CSE', name: 'CSE', color: 'blue', created_by: 'secret' }],
    catalog_courses: [{ code: 'CSE110', title: 'Programming', credits: 3, department: 'CSE', category: 'core', visibility: 'curriculum', created_at: 'secret' }],
    catalog_faculties: [{ initial: 'ABC', name: 'Faculty', email: null, department: 'CSE', updated_at: 'secret' }]
  };
  const admin = {
    from(table) {
      return {
        select(columns) {
          calls.push([table, columns]);
          return { async order() { return { data: rows[table], error: null }; } };
        }
      };
    }
  };
  const result = await catalog.listCatalog({ admin });
  assert.equal(JSON.stringify(result).includes('secret'), false);
  assert.deepEqual(calls, [
    ['catalog_departments', 'id, name, color'],
    ['catalog_courses', 'code, title, credits, department, category, visibility, roadmap_level, roadmap_order, hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot'],
    ['catalog_faculties', 'initial, name, email, department']
  ]);
});

test('regular Admin with catalog.manage can mutate the catalog through the atomic RPC', async () => {
  const catalog = await loadCatalogActions();
  const calls = [];
  const admin = { async rpc(name, input) { calls.push([name, input]); return { data: { kind: 'department', item: input.catalog_item }, error: null }; } };
  await assert.doesNotReject(() => catalog.upsertCatalogItem({
    admin,
    actor: { id: 'admin-1', role: 'admin', permissions: ['catalog.manage'] },
    requestId: '22222222-2222-4222-8222-222222222222',
    payload: { kind: 'department', id: 'cse', name: 'Computer Science', color: 'blue' }
  }));
  assert.equal(calls[0][0], 'mutate_global_catalog');
});

test('course validation allows unknown credits but rejects unsafe credits, visibility, and self prerequisites', async () => {
  const catalog = await loadCatalogActions();
  const admin = { rpc() { throw new Error('database should not be reached'); } };
  const base = { kind: 'course', code: 'CSE420', title: 'Advanced', department: 'CSE', category: 'core' };
  for (const credits of [[], {}, -1, 20.5]) {
    await assert.rejects(() => catalog.upsertCatalogItem({
      admin, actor: { id: 'super-1', role: 'super_admin', permissions: [] }, requestId: crypto.randomUUID(),
      payload: { ...base, credits }
    }), /valid course credits/i);
  }
  assert.equal(catalog.normalizeCatalogPayload({ ...base, credits: null }).item.credits, null);
  assert.equal(catalog.normalizeCatalogPayload({ ...base, credits: '' }).item.credits, null);
  assert.doesNotThrow(() => catalog.normalizeCatalogPayload({ ...base, credits: 0 }));
  assert.equal(catalog.normalizeCatalogPayload({ ...base, code: 'ANT401(B)', credits: null }).item.code, 'ANT401(B)');
  assert.equal(catalog.normalizeCatalogPayload({ ...base, credits: 3 }).item.visibility, 'curriculum');
  assert.equal(catalog.normalizeCatalogPayload({ ...base, credits: 3, visibility: 'search_only' }).item.visibility, 'search_only');
  assert.equal(catalog.normalizeCatalogPayload({ ...base, credits: 3, visibility: 'alternative' }).item.visibility, 'alternative');
  assert.throws(
    () => catalog.normalizeCatalogPayload({ ...base, credits: 3, visibility: 'private' }),
    /valid student visibility/i,
  );
  await assert.rejects(() => catalog.upsertCatalogItem({
    admin, actor: { id: 'super-1', role: 'super_admin', permissions: [] }, requestId: crypto.randomUUID(),
    payload: { ...base, credits: 3, hardPrerequisites: ['CSE420'] }
  }), /cannot require itself/i);
});

test('catalog mutations reject an ungranted Admin and unsafe identifiers before database access', async () => {
  const catalog = await loadCatalogActions();
  const admin = { from() { throw new Error('database should not be reached'); } };
  await assert.rejects(() => catalog.upsertCatalogItem({
    admin,
    actor: { id: 'admin-1', role: 'admin', permissions: [] },
    payload: { kind: 'department', id: 'CSE', name: 'Computer Science' },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /catalog management access/i);
  await assert.rejects(() => catalog.upsertCatalogItem({
    admin,
    actor: { id: 'super-1', role: 'super_admin', permissions: ['catalog.manage'] },
    payload: { kind: 'faculty', initial: 'CSE;DROP', name: 'Unsafe', department: 'CSE' },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /valid faculty initial/i);
});

test('catalog delete delegates dependency enforcement to the atomic RPC', async () => {
  const catalog = await loadCatalogActions();
  const calls = [];
  const admin = {
    async rpc(name, input) {
      calls.push([name, input]);
      return { data: null, error: { message: 'Catalog item is referenced by another catalog record.' } };
    }
  };
  await assert.rejects(() => catalog.deleteCatalogItem({
    admin,
    actor: { id: 'super-1', role: 'super_admin', permissions: ['catalog.manage'] },
    payload: { kind: 'department', id: 'CSE' },
    audit: { targetId: null, beforeValues: {}, afterValues: {} },
    requestId: '33333333-3333-4333-8333-333333333333'
  }), /referenced by another catalog record/i);
  assert.equal(calls[0][0], 'mutate_global_catalog');
});

test('failed catalog mutation audit context contains only normalized kind and key', async () => {
  const catalog = await loadCatalogActions();
  const audit = { targetId: 'unsafe', beforeValues: { payload: 'unsafe' }, afterValues: { payload: 'unsafe' } };
  const admin = { async rpc() { return { data: null, error: { message: 'internal database detail' } }; } };
  await assert.rejects(() => catalog.deleteCatalogItem({
    admin,
    actor: { id: 'admin-1', role: 'admin', permissions: ['catalog.manage'] },
    payload: { kind: 'faculty', initial: ' abc ', ignored: 'must not be audited' },
    requestId: '44444444-4444-4444-8444-444444444444',
    audit
  }), /Could not delete/i);
  assert.deepEqual(audit, {
    targetId: null,
    beforeValues: { kind: 'faculty', key: 'ABC' },
    afterValues: {}
  });
});

test('admin rate-limit migration is atomic and service-role only', () => {
  const migrationPath = path.join(root, 'supabase', 'migrations', '202608250013_admin_action_rate_limits.sql');
  assert.equal(fs.existsSync(migrationPath), true, 'admin rate-limit migration must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create table public\.admin_rate_limits/i);
  assert.match(sql, /primary key\s*\(actor_id,\s*action_name\)/i);
  assert.match(sql, /create or replace function public\.consume_admin_rate_limit/i);
  assert.match(sql, /on conflict on constraint admin_rate_limits_pkey do update/i);
  assert.match(sql, /action_name is null/i);
  assert.match(sql, /window_seconds is null/i);
  assert.match(sql, /max_requests is null/i);
  assert.match(sql, /last_blocked_at timestamptz/i);
  assert.match(sql, /least\(limits\.request_count \+ 1, max_requests \+ 1\)/i);
  assert.match(sql, /alter table public\.admin_rate_limits enable row level security/i);
  assert.match(sql, /revoke all on function public\.consume_admin_rate_limit[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.consume_admin_rate_limit[\s\S]*to service_role/i);
});

test('admin Edge Function enforces the limiter before every privileged mutation and returns 429', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  assert.match(source, /import \{ enforceAdminRateLimit, isAdminRateLimitExceeded \} from "\.\/admin-rate-limit\.mjs"/);
  const limitIndex = source.indexOf('await enforceAdminRateLimit(admin, actor.id, action)');
  const switchIndex = source.indexOf('switch (action)');
  assert.ok(limitIndex > -1 && limitIndex < switchIndex, 'rate limit must run before the mutation switch');
  assert.match(source, /const rateLimited = isAdminRateLimitExceeded\(error\)/);
  assert.match(source, /MUTATION_ACTIONS\.has\(action\) && !rateLimited/);
  assert.match(source, /Too many administrator changes[\s\S]*429/);
  assert.match(source, /retry-after/);
});

function createAdminClient({ provisionError = null, verified = { role: 'admin', status: 'active', permissions: ['profiles.read', 'users.read'] } } = {}) {
  const calls = [];
  return {
    calls,
    auth: { admin: {
      async createUser(input) {
        calls.push(['createUser', input]);
        return { data: { user: { id: 'created-1', email: input.email } }, error: null };
      },
      async deleteUser(id) {
        calls.push(['deleteUser', id]);
        return { error: null };
      }
    } },
    async rpc(name, input) {
      calls.push(['rpc', name, input]);
      if (name === 'provision_admin_account') return { data: provisionError ? null : { role: 'admin' }, error: provisionError };
      if (name === 'admin_effective_access') return { data: verified, error: null };
      throw new Error(`Unexpected RPC: ${name}`);
    }
  };
}

function createIdentityClient({
  profile = {
    id: 'student-1', full_name: 'Before Name', email: 'before@g.bracu.ac.bd',
    avatar_path: 'student-1/avatar.png', status: 'active',
    user_roles: [{ app_roles: { name: 'student' } }]
  },
  authUser = { id: 'student-1', email: 'before@g.bracu.ac.bd', user_metadata: { full_name: 'Before Auth Name' } },
  profileUpdateError = null,
  authUpdateError = null,
  avatarCleanupError = null,
  avatarCleanupThrows = null,
  activeSuperAdmins = [{ id: 'super-1' }, { id: 'super-2' }]
} = {}) {
  const calls = [];
  return {
    calls,
    auth: { admin: {
      async getUserById(id) {
        calls.push(['getUserById', id]);
        return { data: { user: authUser }, error: null };
      },
      async updateUserById(id, attributes) {
        calls.push(['updateUserById', id, attributes]);
        return { data: authUpdateError ? null : { user: { ...authUser, ...attributes } }, error: authUpdateError };
      },
      async deleteUser(id) {
        calls.push(['deleteUser', id]);
        return { error: null };
      }
    } },
    storage: {
      from(bucket) {
        assert.equal(bucket, 'profile-photos');
        return {
          async remove(paths) {
            calls.push(['remove', paths]);
            if (avatarCleanupThrows) throw avatarCleanupThrows;
            return { error: avatarCleanupError };
          }
        };
      }
    },
    from(table) {
      assert.equal(table, 'profiles');
      return {
        select(columns) {
          if (columns.includes('user_roles!inner')) {
            const query = {
              eq(column, value) {
                calls.push(['filterActiveSuperAdmins', column, value]);
                return query;
              },
              then(resolve, reject) {
                return Promise.resolve({ data: activeSuperAdmins, error: null }).then(resolve, reject);
              }
            };
            return query;
          }
          return {
            eq(column, value) {
              assert.equal(column, 'id');
              assert.equal(value, profile.id);
              return {
                async single() {
                  calls.push(['loadProfile', value]);
                  return { data: profile, error: null };
                }
              };
            }
          };
        },
        update(changes) {
          return {
            async eq(column, value) {
              calls.push(['updateProfile', column, value, changes]);
              return { error: profileUpdateError };
            }
          };
        }
      };
    }
  };
}

test('student identity updates synchronize Auth and profile values', async () => {
  const { updateUserIdentity } = await loadAccountActions();
  const admin = createIdentityClient();
  const audit = { targetId: null, beforeValues: {}, afterValues: {} };

  const result = await updateUserIdentity({
    admin,
    payload: { id: 'student-1', fullName: '  Updated Student  ', email: '  UPDATED@G.BRACU.AC.BD ' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['users.identity.manage'] },
    audit
  });

  assert.deepEqual(result, { id: 'student-1', fullName: 'Updated Student', email: 'updated@g.bracu.ac.bd' });
  assert.deepEqual(admin.calls.filter(([name]) => name === 'updateUserById'), [[
    'updateUserById', 'student-1', {
      email: 'updated@g.bracu.ac.bd',
      user_metadata: { full_name: 'Updated Student' }
    }
  ]]);
  assert.deepEqual(audit.afterValues, {
    id: 'student-1', fullName: 'Updated Student', email: 'updated@g.bracu.ac.bd', role: 'student'
  });
});

test('normal Admin identity updates require the relevant permission and a Student target', async () => {
  const { updateUserIdentity } = await loadAccountActions();
  const withoutPermission = createIdentityClient();
  await assert.rejects(() => updateUserIdentity({
    admin: withoutPermission,
    payload: { id: 'student-1', fullName: 'Student', email: 'student@g.bracu.ac.bd' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['users.read'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /permission/i);
  assert.equal(withoutPermission.calls.some(([name]) => name === 'updateUserById'), false);

  const adminTarget = createIdentityClient({
    profile: {
      id: 'admin-2', full_name: 'Admin', email: 'admin@example.com', avatar_path: null, status: 'active',
      user_roles: [{ app_roles: { name: 'admin' } }]
    },
    authUser: { id: 'admin-2', email: 'admin@example.com', user_metadata: { full_name: 'Admin' } }
  });
  await assert.rejects(() => updateUserIdentity({
    admin: adminTarget,
    payload: { id: 'admin-2', fullName: 'Changed Admin', email: 'changed@example.com' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['users.identity.manage'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /Super Admin|Student account/i);
  assert.equal(adminTarget.calls.some(([name]) => name === 'updateUserById'), false);
});

test('permission-bearing Student actor cannot update another Student identity', async () => {
  const { updateUserIdentity } = await loadAccountActions();
  const admin = createIdentityClient();

  await assert.rejects(() => updateUserIdentity({
    admin,
    payload: { id: 'student-1', fullName: 'Changed Student', email: 'changed@g.bracu.ac.bd' },
    actor: { id: 'student-actor', role: 'student', permissions: ['users.identity.manage'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /administrator/i);
  assert.equal(admin.calls.some(([name]) => name === 'updateUserById'), false);
  assert.equal(admin.calls.some(([name]) => name === 'updateProfile'), false);
});

test('permission-bearing Student actor is rejected by the central privileged-action guard', async () => {
  const { assertAdministratorActor } = await loadAccountActions();
  assert.throws(
    () => assertAdministratorActor({ id: 'student-actor', role: 'student', permissions: ['admins.manage'] }),
    /administrator account is required/i
  );
  assert.doesNotThrow(() => assertAdministratorActor({ id: 'admin-1', role: 'admin', permissions: [] }));
});

test('Student target cannot receive privileged permissions through account access', async () => {
  const { setAccountPermissions } = await loadAccountActions();
  const calls = [];
  const admin = {
    async rpc(name, input) {
      calls.push([name, input]);
      if (name === 'admin_effective_access') {
        return { data: { role: 'student', status: 'active', permissions: [] }, error: null };
      }
      throw new Error('set_account_access must not be called');
    }
  };

  await assert.rejects(() => setAccountPermissions({
    admin,
    payload: { id: 'student-1', role: 'student', permissions: ['manage_permissions'] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /Student accounts cannot receive administrator permissions/i);
  assert.deepEqual(calls.map(([name]) => name), ['admin_effective_access']);
});

test('Student identity update rejects non-BRACU email before mutation', async () => {
  const { updateUserIdentity } = await loadAccountActions();
  const admin = createIdentityClient();

  await assert.rejects(() => updateUserIdentity({
    admin,
    payload: { id: 'student-1', fullName: 'Changed Student', email: 'changed@example.com' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['users.identity.manage'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /official BRAC University G-Suite email/i);
  assert.equal(admin.calls.some(([name]) => name === 'updateUserById'), false);
  assert.equal(admin.calls.some(([name]) => name === 'updateProfile'), false);
});

test('failed profile identity update restores previous Auth identity and records rollback', async () => {
  const { updateAdminIdentity } = await loadAccountActions();
  const admin = createIdentityClient({
    profile: {
      id: 'admin-2', full_name: 'Before Profile Name', email: 'profile-before@example.com',
      avatar_path: null, status: 'active', user_roles: [{ app_roles: { name: 'admin' } }]
    },
    authUser: { id: 'admin-2', email: 'auth-before@example.com', user_metadata: { full_name: 'Before Auth Name' } },
    profileUpdateError: new Error('profile write failed')
  });
  const audit = { targetId: null, beforeValues: {}, afterValues: {} };

  await assert.rejects(() => updateAdminIdentity({
    admin,
    payload: { id: 'admin-2', fullName: 'After Name', email: 'after@example.com' },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit
  }), /profile write failed/);

  assert.deepEqual(admin.calls.filter(([name]) => name === 'updateUserById'), [
    ['updateUserById', 'admin-2', { email: 'after@example.com', user_metadata: { full_name: 'After Name' } }],
    ['updateUserById', 'admin-2', { email: 'auth-before@example.com', user_metadata: { full_name: 'Before Auth Name' } }]
  ]);
  assert.deepEqual(audit.afterValues.rollback, { restored: true, error: null });
});

test('protected deletion clears the audit target and preserves deleted identity in JSON', async () => {
  const { deleteAccount } = await loadAccountActions();
  const admin = createIdentityClient();
  const audit = { targetId: null, beforeValues: {}, afterValues: {} };

  const result = await deleteAccount({
    admin,
    payload: { id: 'student-1', confirmationEmail: ' BEFORE@G.BRACU.AC.BD ' },
    actor: { id: 'super-1', role: 'super_admin', permissions: ['permissions.manage'] },
    audit
  });

  assert.deepEqual(result, { id: 'student-1', deleted: true, avatarCleanupError: null });
  assert.equal(audit.targetId, null);
  assert.deepEqual(audit.beforeValues, {
    deleted_target_id: 'student-1', email: 'before@g.bracu.ac.bd', role: 'student'
  });
  assert.deepEqual(admin.calls.filter(([name]) => name === 'deleteUser'), [['deleteUser', 'student-1']]);
  assert.deepEqual(admin.calls.filter(([name]) => name === 'remove'), [['remove', ['student-1/avatar.png']]]);
});

test('avatar cleanup exceptions do not reverse a successful account deletion', async () => {
  const { deleteAccount } = await loadAccountActions();
  const admin = createIdentityClient({ avatarCleanupThrows: new Error('storage unavailable') });
  const audit = { targetId: null, beforeValues: {}, afterValues: {} };

  const result = await deleteAccount({
    admin,
    payload: { id: 'student-1', confirmationEmail: 'before@g.bracu.ac.bd' },
    actor: { id: 'super-1', role: 'super_admin', permissions: ['permissions.manage'] },
    audit
  });

  assert.equal(result.deleted, true);
  assert.equal(result.avatarCleanupError, 'storage unavailable');
  assert.equal(audit.targetId, null);
  assert.equal(audit.afterValues.avatar_cleanup_error, 'storage unavailable');
  assert.equal(audit.afterValues.avatar_path, 'student-1/avatar.png');
});

test('Super Admin deletion is rejected before Auth mutation', async () => {
  const { deleteAccount } = await loadAccountActions();
  const admin = createIdentityClient({
    profile: {
      id: 'super-2', full_name: 'Second Super', email: 'super@example.com', avatar_path: null,
      status: 'active', user_roles: [{ app_roles: { name: 'super_admin' } }]
    },
    authUser: { id: 'super-2', email: 'super@example.com', user_metadata: { full_name: 'Second Super' } }
  });

  await assert.rejects(() => deleteAccount({
    admin,
    payload: { id: 'super-2', confirmationEmail: 'super@example.com' },
    actor: { id: 'super-1', role: 'super_admin', permissions: ['permissions.manage'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /cannot be deleted/i);
  assert.equal(admin.calls.some(([name]) => name === 'deleteUser'), false);
});

test('the last active Super Admin cannot be suspended or demoted', async () => {
  const { setAccountRole, setAccountStatus } = await loadAccountActions();
  const profile = {
    id: 'super-2', full_name: 'Last Super', email: 'last@example.com', avatar_path: null,
    status: 'active', user_roles: [{ app_roles: { name: 'super_admin' } }]
  };
  const statusAdmin = createIdentityClient({ profile, activeSuperAdmins: [{ id: 'super-2' }] });
  await assert.rejects(() => setAccountStatus({
    admin: statusAdmin,
    payload: { id: 'super-2', status: 'suspended' },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /last active Super Admin/i);
  assert.equal(statusAdmin.calls.some(([name]) => name === 'updateProfile'), false);

  const roleAdmin = createIdentityClient({ profile, activeSuperAdmins: [{ id: 'super-2' }] });
  roleAdmin.rpc = async name => {
    if (name === 'admin_effective_access') {
      return { data: { role: 'super_admin', status: 'active', permissions: ['permissions.manage'] }, error: null };
    }
    throw new Error('set_account_access must not be called');
  };
  await assert.rejects(() => setAccountRole({
    admin: roleAdmin,
    payload: { id: 'super-2', role: 'admin' },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /last active Super Admin/i);
});

test('access updates cannot demote the last active Super Admin', async () => {
  const { setAccountPermissions } = await loadAccountActions();
  const profile = {
    id: 'super-2', full_name: 'Last Super', email: 'last@example.com', avatar_path: null,
    status: 'active', user_roles: [{ app_roles: { name: 'super_admin' } }]
  };
  const admin = createIdentityClient({ profile, activeSuperAdmins: [{ id: 'super-2' }] });
  admin.rpc = async name => {
    if (name === 'admin_effective_access') {
      return { data: { role: 'super_admin', status: 'active', permissions: ['permissions.manage'] }, error: null };
    }
    throw new Error('set_account_access must not be called');
  };

  await assert.rejects(() => setAccountPermissions({
    admin,
    payload: { id: 'super-2', role: 'admin', permissions: [] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /last active Super Admin/i);
});

test('status mutation uses the guarded database RPC before mirroring Auth ban', async () => {
  const { setAccountStatus } = await loadAccountActions();
  const admin = createIdentityClient();
  admin.rpc = async (name, input) => {
    admin.calls.push(['rpc', name, input]);
    if (name === 'set_account_status_guarded') {
      return { data: { role: 'student', status: 'suspended', permissions: [] }, error: null };
    }
    throw new Error(`Unexpected RPC: ${name}`);
  };

  const result = await setAccountStatus({
    admin,
    payload: { id: 'student-1', status: 'suspended' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['users.status.manage'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  });

  assert.deepEqual(result, { id: 'student-1', status: 'suspended' });
  assert.equal(admin.calls.some(([name]) => name === 'updateProfile'), false);
  const guardedIndex = admin.calls.findIndex(([name]) => name === 'rpc');
  const authIndex = admin.calls.findIndex(([name]) => name === 'updateUserById');
  assert.deepEqual(admin.calls[guardedIndex], [
    'rpc', 'set_account_status_guarded', { target_user: 'student-1', target_status: 'suspended' }
  ]);
  assert.ok(authIndex > guardedIndex, 'Auth ban mirrors the committed guarded profile status');
});

test('authoritative status guard rejection after a stale precheck never mirrors Auth ban', async () => {
  const { setAccountStatus } = await loadAccountActions();
  const profile = {
    id: 'super-2', full_name: 'Second Super', email: 'second@example.com', avatar_path: null,
    status: 'active', user_roles: [{ app_roles: { name: 'super_admin' } }]
  };
  const admin = createIdentityClient({
    profile,
    activeSuperAdmins: [{ id: 'super-1' }, { id: 'super-2' }]
  });
  admin.rpc = async (name, input) => {
    admin.calls.push(['rpc', name, input]);
    if (name === 'set_account_status_guarded') {
      return { data: null, error: new Error('The last active Super Admin cannot be suspended or demoted.') };
    }
    throw new Error(`Unexpected RPC: ${name}`);
  };

  await assert.rejects(() => setAccountStatus({
    admin,
    payload: { id: 'super-2', status: 'suspended' },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /last active Super Admin/i);
  assert.equal(admin.calls.some(([name]) => name === 'updateUserById'), false);
});

test('normal Admin self-promotion is rejected before account access mutation', async () => {
  const { setAccountRole } = await loadAccountActions();
  const calls = [];
  const admin = {
    async rpc(name, input) {
      calls.push([name, input]);
      if (name === 'admin_effective_access') {
        return { data: { role: 'admin', status: 'active', permissions: ['permissions.manage'] }, error: null };
      }
      throw new Error('set_account_access must not be called');
    }
  };

  await assert.rejects(() => setAccountRole({
    admin,
    payload: { id: 'admin-1', role: 'super_admin' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['permissions.manage'] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /own role or permissions/i);
  assert.deepEqual(calls.map(([name]) => name), ['admin_effective_access']);
});

test('provisioning failure deletes the newly created Auth user', async () => {
  const { createAdministrator } = await loadAccountActions();
  const admin = createAdminClient({ provisionError: new Error('database setup failed') });

  await assert.rejects(() => createAdministrator({
    admin,
    payload: { fullName: 'New Admin', email: 'admin@example.com', password: 'SecurePass!2026', role: 'admin', permissions: ['view_profiles'] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /database setup failed/);
  assert.equal(admin.calls.filter(([name]) => name === 'deleteUser').length, 1);
});

test('provisioning verification mismatch deletes the newly created Auth user', async () => {
  const { createAdministrator } = await loadAccountActions();
  const admin = createAdminClient({ verified: { role: 'student', status: 'pending', permissions: [] } });

  await assert.rejects(() => createAdministrator({
    admin,
    payload: { fullName: 'New Admin', email: 'admin@example.com', password: 'SecurePass!2026', role: 'admin', permissions: ['view_profiles'] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /could not be verified/i);
  assert.equal(admin.calls.filter(([name]) => name === 'deleteUser').length, 1);
});

test('provisioning permission mismatch deletes the newly created Auth user', async () => {
  const { createAdministrator } = await loadAccountActions();
  const admin = createAdminClient({
    verified: { role: 'admin', status: 'active', permissions: ['profiles.read', 'users.read', 'admins.manage'] }
  });

  await assert.rejects(() => createAdministrator({
    admin,
    payload: { fullName: 'New Admin', email: 'admin@example.com', password: 'SecurePass!2026', role: 'admin', permissions: ['view_profiles'] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit: { targetId: null, beforeValues: {}, afterValues: {} }
  }), /permissions could not be verified/i);
  assert.equal(admin.calls.filter(([name]) => name === 'deleteUser').length, 1);
});

test('failed Auth status mirror restores the previous guarded profile status', async () => {
  const { setAccountStatus } = await loadAccountActions();
  const admin = createIdentityClient({ authUpdateError: new Error('Auth ban failed') });
  admin.rpc = async (name, input) => {
    admin.calls.push(['rpc', name, input]);
    if (name === 'set_account_status_guarded') {
      return { data: { role: 'student', status: input.target_status, permissions: [] }, error: null };
    }
    throw new Error(`Unexpected RPC: ${name}`);
  };
  const audit = { targetId: null, beforeValues: {}, afterValues: {} };

  await assert.rejects(() => setAccountStatus({
    admin,
    payload: { id: 'student-1', status: 'suspended' },
    actor: { id: 'admin-1', role: 'admin', permissions: ['users.status.manage'] },
    audit
  }), /Auth ban failed/);
  assert.deepEqual(admin.calls.filter(([name]) => name === 'rpc'), [
    ['rpc', 'set_account_status_guarded', { target_user: 'student-1', target_status: 'suspended' }],
    ['rpc', 'set_account_status_guarded', { target_user: 'student-1', target_status: 'active' }]
  ]);
  assert.deepEqual(audit.afterValues, {
    id: 'student-1', status: 'suspended', role: 'student',
    rollback: { restored: true, status: 'active', error: null }
  });
});

test('audit insert errors are surfaced to the request handler', async () => {
  const { writeMutationAudit } = await loadAccountActions();
  const admin = {
    from() {
      return { async insert() { return { error: new Error('audit storage unavailable') }; } };
    }
  };

  await assert.rejects(() => writeMutationAudit(
    admin,
    'actor-1',
    'target-1',
    'set-role',
    true,
    {},
    { role: 'admin' },
    'request-1'
  ), /audit storage unavailable/);
});

test('account access audits store the verified internal after-state', async () => {
  const { setAccountPermissions } = await loadAccountActions();
  const audit = { targetId: null, beforeValues: {}, afterValues: {} };
  const admin = {
    async rpc(name) {
      if (name === 'admin_effective_access') {
        return { data: { role: 'admin', permissions: ['profiles.read'] }, error: null };
      }
      if (name === 'set_account_access') {
        return { data: { role: 'super_admin', permissions: ['admins.manage', 'permissions.manage', 'profiles.read'] }, error: null };
      }
      throw new Error(`Unexpected RPC: ${name}`);
    }
  };

  await setAccountPermissions({
    admin,
    payload: { id: 'admin-2', role: 'super_admin', permissions: [] },
    actor: { id: 'super-1', role: 'super_admin', permissions: [] },
    audit
  });
  assert.deepEqual(audit.beforeValues, { id: 'admin-2', role: 'admin', permissions: ['profiles.read'] });
  assert.deepEqual(audit.afterValues, {
    id: 'admin-2',
    role: 'super_admin',
    permissions: ['admins.manage', 'permissions.manage', 'profiles.read'],
    permission_keys: []
  });
});

test('admin Edge Function authenticates and authorizes before constructing its privileged client', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  const verifyIndex = source.indexOf('auth.getUser(bearerToken)');
  const permissionIndex = source.indexOf('rpc("authorize"');
  const privilegedIndex = source.indexOf('SUPABASE_SECRET_KEYS');
  assert.ok(verifyIndex >= 0, 'caller JWT verification is required');
  assert.ok(permissionIndex > verifyIndex, 'permission check follows identity verification');
  assert.ok(privilegedIndex > permissionIndex, 'privileged client is unavailable before authorization');
});

test('admin Edge Function supports only the approved action and permission map', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  const policySource = fs.readFileSync(policyPath, 'utf8');
  for (const action of ['list-accounts', 'create-admin', 'update-user-identity', 'update-admin-identity', 'delete-account', 'set-account-status', 'set-role', 'set-user-permissions', 'get-profile-summary']) {
    assert.match(source, new RegExp(`"${action}"`));
  }
  for (const permission of ['profiles.read', 'users.read', 'users.status.manage', 'admins.read', 'admins.manage', 'permissions.manage']) {
    assert.match(`${source}\n${policySource}`, new RegExp(permission.replace('.', '\\.')));
  }
  assert.match(source, /ACTION_PERMISSIONS/);
  assert.match(source, /ALLOWED_ACTIONS/);
});

test('identity and deletion actions enforce server-side role boundaries and rollback', () => {
  const source = `${fs.readFileSync(functionPath, 'utf8')}\n${fs.readFileSync(actionsPath, 'utf8')}`;
  for (const action of ['update-user-identity', 'update-admin-identity', 'delete-account']) {
    assert.match(source, new RegExp(`"${action}"`));
  }
  assert.match(source, /@g\.bracu\.ac\.bd/);
  assert.match(source, /auth\.admin\.updateUserById/);
  assert.match(source, /restorePreviousIdentity/);
  assert.match(source, /confirmationEmail/);
  assert.match(source, /last active Super Admin/i);
  assert.match(source, /storage\.from\(["']profile-photos["']\)\.remove/);
  assert.match(source, /deleted_target_id/);
  assert.match(source, /audit\.targetId\s*=\s*null/);
});

test('admin Edge Function uses origin allowlisting, safe payloads, and mutation audit records', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  const actionsSource = fs.readFileSync(actionsPath, 'utf8');
  assert.doesNotMatch(source, /Access-Control-Allow-Origin["']?\s*[:,]\s*["']\*["']/i);
  assert.match(source, /ALLOWED_ORIGINS/);
  assert.match(actionsSource, /pickAllowed/);
  assert.match(actionsSource, /admin_audit_log/);
  assert.match(source, /requestId/);
  assert.match(actionsSource, /safeAuditValue/);
  assert.match(actionsSource, /delete\s+safe\.password/);
  assert.doesNotMatch(`${source}\n${actionsSource}`, /console\.(?:log|error)\([^\n]*password/i);
});

test('admin Edge Function returns a bodyless 204 response for allowed preflight requests', async () => {
  const responseModulePath = path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'http-response.mjs');

  await assert.doesNotReject(async () => {
    const { jsonResponse } = await import(pathToFileURL(responseModulePath).href);
    const response = jsonResponse(
      { data: null, error: null, requestId: 'request-1' },
      204,
      'request-1',
      'http://localhost:4173'
    );

    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:4173');
  });
});

test('admin Edge Function creates pre-authorized admins and mirrors suspension to Auth', () => {
  const source = `${fs.readFileSync(functionPath, 'utf8')}\n${fs.readFileSync(actionsPath, 'utf8')}`;
  assert.match(source, /auth\.admin\.createUser/);
  assert.match(source, /created_by_admin:\s*true/);
  assert.match(source, /app_role:\s*role/);
  assert.match(source, /auth\.admin\.updateUserById/);
  assert.match(source, /ban_duration/);
  assert.match(source, /876000h/);
  assert.match(source, /["']none["']/);
});

test('create-admin explicitly provisions and compensates failed database setup', () => {
  const source = fs.readFileSync(actionsPath, 'utf8');
  const createIndex = source.indexOf('auth.admin.createUser');
  const provisionIndex = source.indexOf("rpc('provision_admin_account'");
  const verifyIndex = source.indexOf('admin_effective_access');
  const compensateIndex = source.indexOf('auth.admin.deleteUser', createIndex);
  assert.ok(createIndex >= 0);
  assert.ok(provisionIndex > createIndex);
  assert.ok(verifyIndex > provisionIndex);
  assert.ok(compensateIndex > createIndex);
  assert.match(source, /permissions:\s*permissionKeys/i);
  assert.match(source, /const compensated\s*=\s*!compensationError/);
  assert.match(source, /if\s*\(compensated\)\s*audit\.targetId\s*=\s*null/);
  assert.match(source, /deleted_target_id:\s*createdUser\.id/);
  assert.match(source, /audit\.afterValues\s*=\s*\{[^}]*fullName/s);
  assert.match(source, /compensation_error:\s*errorMessage\(compensationError\)/);
});

test('admin Edge Function uses authoritative actor access and atomic account access updates', () => {
  const indexSource = fs.readFileSync(functionPath, 'utf8');
  const actionsSource = fs.readFileSync(actionsPath, 'utf8');
  const source = `${indexSource}\n${actionsSource}`;
  assert.match(source, /from ['"]\.\/account-policy\.mjs['"]/);
  assert.match(indexSource, /rpc\("admin_effective_access",\s*\{\s*target_user:\s*userData\.user\.id/s);
  const actorGuardIndex = indexSource.indexOf('assertAdministratorActor(actor)');
  const switchIndex = indexSource.indexOf('switch (action)');
  assert.ok(actorGuardIndex >= 0 && actorGuardIndex < switchIndex, 'database-derived actor role is rejected before action dispatch');
  assert.match(source, /expandPermissionKeys/);
  assert.match(source, /assertPermissionSubset/);
  assert.match(source, /assertTargetAllowed/);
  assert.match(actionsSource, /rpc\('set_account_access'/);
  assert.doesNotMatch(source, /from\("user_permissions"\)\.delete\(\)/);
});

test('profile summaries expose effective permissions and mutations carry safe audit state', () => {
  const source = fs.readFileSync(functionPath, 'utf8');
  assert.match(source, /effective_permissions:\s*access\.permissions\s*\|\|\s*\[\]/);
  assert.match(source, /type MutationAudit\s*=\s*\{/);
  assert.match(source, /targetId:\s*string\s*\|\s*null/);
  assert.match(source, /beforeValues:\s*Record<string, unknown>/);
  assert.match(source, /afterValues:\s*Record<string, unknown>/);
  assert.match(source, /writeMutationAudit\([\s\S]*mutationAudit\.targetId[\s\S]*mutationAudit\.beforeValues[\s\S]*mutationAudit\.afterValues/);
});

test('admin Edge Function import map pins the Supabase SDK', () => {
  const deno = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'deno.json'), 'utf8'));
  assert.equal(deno.imports['@supabase/supabase-js'], 'npm:@supabase/supabase-js@2.57.4');
});

test('admin profile relations make role and permission embeds valid for PostgREST', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608130005_admin_profile_relationships.sql'), 'utf8');
  assert.match(migration, /foreign key \(user_id\) references public\.profiles\(id\)/i);
  assert.match(migration, /alter table public\.user_roles[\s\S]*validate constraint/i);
  assert.match(migration, /alter table public\.user_permissions[\s\S]*validate constraint/i);
  assert.match(migration, /notify pgrst, 'reload schema'/i);
});

test('admin role filtering is delegated to the paginated account-list RPC and preserves database error details', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'admin-access', 'account-list.mjs'), 'utf8');
  assert.match(source, /target_role:\s*role/);
  assert.match(source, /throw new Error\(error\.message/);
});

test('admin Edge Function server role receives only the database privileges its actions require', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608130006_admin_service_role_grants.sql'), 'utf8');
  assert.match(migration, /grant select, update\s+on table public\.profiles\s+to service_role/i);
  assert.match(migration, /grant select\s+on table[\s\S]*public\.app_roles[\s\S]*public\.app_permissions[\s\S]*public\.role_permissions[\s\S]*to service_role/i);
  assert.match(migration, /grant select, insert, update, delete\s+on table public\.user_roles, public\.user_permissions\s+to service_role/i);
  assert.match(migration, /grant insert\s+on table public\.admin_audit_log\s+to service_role/i);
  assert.match(migration, /grant usage, select\s+on sequence public\.admin_audit_log_id_seq\s+to service_role/i);
  assert.doesNotMatch(migration, /\bto anon\b|\bto authenticated\b/i);
});

test('login metrics migration exposes only deduplicated service-side account aggregates', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202608130007_login_session_metrics.sql'), 'utf8');
  assert.match(migration, /unique\s*\(user_id,\s*session_id\)/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /auth\.jwt\(\)\s*->>\s*'session_id'/i);
  assert.match(migration, /at time zone 'Asia\/Dhaka'/i);
  assert.match(migration, /admin_account_login_metrics/i);
  assert.match(migration, /grant select on (?:table )?public\.admin_account_login_metrics to service_role/i);
  assert.doesNotMatch(migration, /grant select on (?:table )?public\.(?:login_events|admin_account_login_metrics) to (?:anon|authenticated|public)/i);
});

test('admin Edge Function loads and normalizes the current account page through exactly one RPC', async () => {
  const { listAccounts } = await import(`${pathToFileURL(accountListPath).href}?test=${Date.now()}-${Math.random()}`);
  const calls = [];
  const admin = {
    async rpc(name, input) {
      calls.push([name, input]);
      return {
        data: [{
          id: 'account-1',
          role_name: 'admin',
          total_count: 31,
          daily_login_count: '2',
          weekly_login_count: '4',
          monthly_login_count: '7',
          total_login_count: '11'
        }],
        error: null
      };
    }
  };

  const result = await listAccounts(admin, {
    page: 2,
    pageSize: 15,
    role: 'admin',
    status: 'active',
    search: ' A,(lice) '
  });

  assert.deepEqual(calls, [[
    'admin_list_accounts',
    {
      target_role: 'admin',
      target_status: 'active',
      target_search: 'Alice',
      page_offset: 15,
      page_limit: 15
    }
  ]]);
  assert.deepEqual(result, {
    accounts: [{
      id: 'account-1',
      daily_login_count: 2,
      weekly_login_count: 4,
      monthly_login_count: 7,
      total_login_count: 11,
      user_roles: { app_roles: { name: 'admin' } }
    }],
    page: 2,
    pageSize: 15,
    total: 31
  });
});

test('Admin Panel contains guarded account views, filters, states, drawer, dialog, and sign out', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
  assert.match(html, /BRACU Course Tracker/);
  assert.match(html, /<button(?=[^>]*data-account-view="users")[^>]*>\s*Users\s*<\/button>/);
  assert.match(html, /<button(?=[^>]*data-account-view="admins")[^>]*>\s*Admins\s*<\/button>/);
  assert.match(html, /id="adminSearch"/);
  assert.match(html, /id="adminStatusFilter"/);
  assert.match(html, /id="adminRoleFilter"/);
  assert.match(html, /id="adminLoading"/);
  assert.match(html, /id="adminEmpty"/);
  assert.match(html, /id="adminError"[^>]*role="alert"/);
  assert.match(html, /id="profileDrawer"[^>]*role="dialog"/);
  assert.match(html, /id="createAdminDialog"/);
  assert.match(html, /id="adminSignOut"/);
  assert.match(html, /<span>Search<\/span>/);
  assert.match(html, /<th>First registered<\/th>/);
  for (const heading of ['Daily', 'Weekly', 'Monthly', 'Total']) {
    assert.match(html, new RegExp(`<th>${heading}<\\/th>`));
  }
});

test('Admin Panel mounts the shared Dot Grid behind its interactive content', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'admin.css'), 'utf8');

  assert.match(html, /<canvas(?=[^>]*id="dotGridBackground")(?=[^>]*class="dot-grid-background")(?=[^>]*aria-hidden="true")[^>]*>\s*<\/canvas>/);
  assert.ok(html.indexOf('js/motion.js') < html.indexOf('js/admin.js'), 'motion starts before Admin Panel logic');
  assert.match(css, /--dot-grid-base:/);
  assert.match(css, /--dot-grid-active:/);
  assert.match(css, /\.dot-grid-background\s*{[^}]*position:\s*fixed;[^}]*pointer-events:\s*none;[^}]*z-index:\s*0;/s);
  assert.match(css, /\.admin-main\s*{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
});

test('Admin Panel CSS provides desktop table, mobile cards, full-screen detail, and safe overflow', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'admin.css'), 'utf8');
  assert.match(css, /\.admin-table-scroll[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /\.admin-account-cards[\s\S]*display:\s*grid/);
  assert.match(css, /\.profile-drawer[\s\S]*position:\s*fixed/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /\[hidden\]\s*{\s*display:\s*none\s*!important/);
  assert.match(css, /\.admin-filters\s+\.admin-icon-button\s*{[^}]*align-self:\s*end/s);
  assert.match(css, /select[^}]*appearance:\s*none/s);
  assert.match(css, /padding-right:\s*30px/);
  assert.match(css, /background-position:\s*right 9px center/);
  assert.match(css, /background-size:\s*12px 8px/);
});

test('desktop account table keeps its accessible action header inside the scroll container', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');

  assert.match(html, /<th\s+aria-label="Actions"><\/th>/);
  assert.doesNotMatch(html, /<th><span\s+class="sr-only">Actions<\/span><\/th>/);
});

test('Admin Panel capabilities follow canonical role and permission values', () => {
  const AdminModule = require('../js/admin.js');
  assert.deepEqual(AdminModule.getAdminCapabilities({ role: 'admin', permissions: ['users.read', 'users.status.manage', 'users.identity.manage'] }), {
    readUsers: true,
    readAdmins: false,
    manageStatus: true,
    manageUserIdentity: true,
    manageAdmins: false,
    managePermissions: false,
    manageAdminIdentity: false,
    deleteAccounts: false
  });
  assert.deepEqual(AdminModule.getAdminCapabilities({ role: 'super_admin', permissions: [] }), {
    readUsers: true,
    readAdmins: true,
    manageStatus: true,
    manageUserIdentity: true,
    manageAdmins: true,
    managePermissions: true,
    manageAdminIdentity: true,
    deleteAccounts: true
  });
});

test('profile actions are presented only for caller and target combinations they can manage', () => {
  const AdminModule = require('../js/admin.js');
  const normalAdmin = AdminModule.getAdminCapabilities({
    role: 'admin', permissions: ['users.identity.manage', 'permissions.manage']
  });
  const superAdmin = AdminModule.getAdminCapabilities({ role: 'super_admin', permissions: [] });

  assert.deepEqual(AdminModule.getProfileActionState(normalAdmin, 'student'), {
    editIdentity: true, deleteAccount: false
  });
  assert.deepEqual(AdminModule.getProfileActionState(normalAdmin, 'admin'), {
    editIdentity: false, deleteAccount: false
  });
  assert.deepEqual(AdminModule.getProfileActionState(superAdmin, 'admin'), {
    editIdentity: true, deleteAccount: true
  });
  assert.deepEqual(AdminModule.getProfileActionState(superAdmin, 'super_admin'), {
    editIdentity: true, deleteAccount: false
  });
});

test('access presentation respects both caller role and target role', () => {
  const AdminModule = require('../js/admin.js');
  const normalAdmin = AdminModule.getAdminCapabilities({ role: 'admin', permissions: ['permissions.manage'] });
  const superAdmin = AdminModule.getAdminCapabilities({ role: 'super_admin', permissions: [] });

  assert.deepEqual(AdminModule.getProfileAccessState(normalAdmin, 'admin', 'student'), {
    manageAccess: true,
    roleOptions: ['student']
  });
  assert.deepEqual(AdminModule.getProfileAccessState(normalAdmin, 'admin', 'admin'), {
    manageAccess: false,
    roleOptions: ['admin']
  });
  assert.deepEqual(AdminModule.getProfileAccessState(normalAdmin, 'admin', 'super_admin'), {
    manageAccess: false,
    roleOptions: ['super_admin']
  });
  assert.deepEqual(AdminModule.getProfileAccessState(superAdmin, 'super_admin', 'admin'), {
    manageAccess: true,
    roleOptions: ['student', 'admin', 'super_admin']
  });
});

test('profile request gate rejects deferred A after B opens and invalidates B on close', () => {
  const AdminModule = require('../js/admin.js');
  const gate = AdminModule.createProfileRequestGate();
  const requestA = gate.start('account-a');
  assert.equal(gate.isCurrent(requestA, 'account-a', true), true);

  const requestB = gate.start('account-b');
  assert.equal(gate.isCurrent(requestA, 'account-a', true), false);
  assert.equal(gate.isCurrent(requestB, 'account-b', true), true);

  gate.invalidate();
  assert.equal(gate.isCurrent(requestB, 'account-b', true), false);
  assert.equal(gate.isCurrent(requestB, 'account-b', false), false);
});

test('typed deletion compares normalized email but preserves raw confirmation payload', () => {
  const AdminModule = require('../js/admin.js');
  const result = AdminModule.buildDeleteAccountRequest({
    id: 'student-1',
    confirmationInput: ' Before@G.BRACU.AC.BD ',
    expectedEmail: 'before@g.bracu.ac.bd'
  });

  assert.equal(result.matches, true);
  assert.deepEqual(result.payload, {
    id: 'student-1', confirmationEmail: ' Before@G.BRACU.AC.BD '
  });
});

test('submission lock rejects duplicate starts until the active request finishes', () => {
  const AdminModule = require('../js/admin.js');
  const lock = AdminModule.createSubmissionLock();

  assert.equal(lock.tryStart(), true);
  assert.equal(lock.isActive(), true);
  assert.equal(lock.tryStart(), false);
  lock.finish();
  assert.equal(lock.isActive(), false);
  assert.equal(lock.tryStart(), true);
});

test('Admin Panel invokes only the named Edge Function and surfaces response errors', async () => {
  const AdminModule = require('../js/admin.js');
  let request;
  const controller = AdminModule.createAdminController({
    client: {
      auth: { async getSession() { return { data: { session: { access_token: 'admin-token' } }, error: null }; } },
      functions: { async invoke(name, options) { request = { name, options }; return { data: { data: { ok: true }, error: null }, error: null }; } }
    }
  });
  assert.deepEqual(await controller.invokeAction('list-accounts', { page: 1 }), { ok: true });
  assert.deepEqual(request, { name: 'admin-access', options: {
    body: { action: 'list-accounts', payload: { page: 1 } },
    headers: { Authorization: 'Bearer admin-token' }
  } });

  const failing = AdminModule.createAdminController({
    client: {
      auth: { async getSession() { return { data: { session: { access_token: 'admin-token' } }, error: null }; } },
      functions: { async invoke() { return { data: { data: null, error: 'Denied' }, error: null }; } }
    }
  });
  await assert.rejects(() => failing.invokeAction('list-accounts', {}), /Denied/);
});

test('Admin Panel rejects an expired local session before invoking the Edge Function', async () => {
  const AdminModule = require('../js/admin.js');
  let invoked = false;
  const controller = AdminModule.createAdminController({
    client: {
      auth: { async getSession() { return { data: { session: null }, error: null }; } },
      functions: { async invoke() { invoked = true; } }
    }
  });
  await assert.rejects(() => controller.invokeAction('list-accounts', {}), /session has expired/i);
  assert.equal(invoked, false);
});

test('Admin Panel renders account identity, role, and first registration date', () => {
  const AdminModule = require('../js/admin.js');
  const markup = AdminModule.accountMarkup({
    id: 'student-1',
    full_name: 'Student Name',
    email: 'student@g.bracu.ac.bd',
    status: 'active',
    created_at: '2026-08-12T03:20:49+06:00',
    daily_login_count: 2,
    weekly_login_count: 5,
    monthly_login_count: 11,
    total_login_count: 19,
    user_roles: [{ app_roles: { name: 'student' } }]
  });
  const mobileMarkup = AdminModule.accountMarkup({
    id: 'student-1', full_name: 'Student Name', email: 'student@g.bracu.ac.bd', status: 'active',
    created_at: '2026-08-12T03:20:49+06:00', daily_login_count: 2, weekly_login_count: 5,
    monthly_login_count: 11, total_login_count: 19, user_roles: [{ app_roles: { name: 'student' } }]
  }, true);

  assert.match(markup, /Student Name/);
  assert.match(markup, /student@g\.bracu\.ac\.bd/);
  assert.match(markup, />Student</);
  assert.match(markup, /data-status="active">Active</);
  assert.match(markup, /12 Aug 2026/);
  for (const value of ['2', '5', '11', '19']) assert.match(markup, new RegExp(`>${value}<`));
  for (const label of ['Daily', 'Weekly', 'Monthly', 'Total']) assert.match(mobileMarkup, new RegExp(label));
});

test('Admin onboarding is not required in desktop and mobile account markup', () => {
  const AdminModule = require('../js/admin.js');
  const admin = {
    id: 'admin-1', full_name: 'Admin Name', email: 'admin@example.com', status: 'active',
    created_at: '2026-08-12T03:20:49+06:00', onboarding_completed: false,
    user_roles: [{ app_roles: { name: 'admin' } }]
  };

  assert.match(AdminModule.accountMarkup(admin), /Not required/);
  assert.match(AdminModule.accountMarkup(admin, true), /Onboarding[\s\S]*Not required/);
  assert.match(AdminModule.accountMarkup(admin), />Admin</);
});

test('Admin Panel presents multi-word roles in readable title case', () => {
  const AdminModule = require('../js/admin.js');
  const markup = AdminModule.accountMarkup({
    id: 'super-1', full_name: 'Super Admin', email: 'super@example.com', status: 'suspended',
    created_at: '2026-08-12T03:20:49+06:00',
    user_roles: [{ app_roles: { name: 'super_admin' } }]
  });

  assert.match(markup, />Super Admin</);
  assert.match(markup, /data-status="suspended">Suspended</);
});

test('Admin Panel stops an unresponsive Edge Function from leaving accounts loading forever', async () => {
  const AdminModule = require('../js/admin.js');
  const controller = AdminModule.createAdminController({
    requestTimeoutMs: 5,
    client: {
      auth: { async getSession() { return { data: { session: { access_token: 'admin-token' } }, error: null }; } },
      functions: { invoke() { return new Promise(() => {}); } }
    }
  });

  const result = await Promise.race([
    controller.invokeAction('list-accounts', {}).then(
      () => ({ resolved: true }),
      error => ({ error })
    ),
    new Promise(resolve => setTimeout(() => resolve({ stillLoading: true }), 40))
  ]);

  assert.equal(result.stillLoading, undefined, 'the request must settle instead of remaining on the loading state');
  assert.match(result.error.message, /request timed out/i);
});

test('Admin Panel surfaces the Edge Function response message instead of a generic SDK error', async () => {
  const AdminModule = require('../js/admin.js');
  const response = new Response(JSON.stringify({ error: 'Database access was denied.' }), {
    status: 403,
    headers: { 'content-type': 'application/json' }
  });
  const controller = AdminModule.createAdminController({
    client: {
      auth: { async getSession() { return { data: { session: { access_token: 'admin-token' } }, error: null }; } },
      functions: { async invoke() { return { data: null, error: Object.assign(new Error('Edge Function returned a non-2xx status code'), { context: response }) }; } }
    }
  });

  await assert.rejects(() => controller.invokeAction('list-accounts', {}), /Database access was denied/);
});

test('Admin Panel wires permission-aware actions with confirmation and refresh', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'js', 'admin.js'), 'utf8');
  assert.match(js, /BracuAccess\.requireAdminAccess\(\)/);
  assert.match(js, /set-account-status/);
  assert.match(js, /set-user-permissions/);
  assert.doesNotMatch(js, /invokeAction\("set-role"/);
  assert.match(js, /invokeAction\("set-user-permissions",\s*\{\s*id,\s*role:\s*nextRole,\s*permissions,?\s*\}\)/);
  assert.match(js, /create-admin/);
  assert.match(js, /confirm\(/);
  assert.match(js, /createAccountListCache/);
  assert.match(js, /scheduleAlternatePrefetch/);
});

test('profile drawer exposes friendly access, guarded identity editing, and typed deletion', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
  assert.match(html, /id="deleteAccountDialog"[^>]*aria-labelledby="deleteAccountTitle"/);
  assert.match(html, /id="adminToast"[^>]*role="status"/);
  assert.match(js, /Edit details/);
  assert.match(js, /Save permissions/);
  assert.match(js, /update-user-identity/);
  assert.match(js, /update-admin-identity/);
  assert.match(js, /delete-account/);
  assert.match(js, /confirmationEmail/);
  assert.match(js, /Not required/);
});

test('account policy expands friendly permission keys without privilege escalation', async () => {
  const policy = await import(pathToFileURL(path.join(root, 'supabase', 'functions', 'admin-access', 'account-policy.mjs')).href);
  assert.deepEqual(policy.expandPermissionKeys(['view_profiles', 'edit_user_details']), [
    'profiles.read', 'users.identity.manage', 'users.read'
  ]);
  assert.throws(
    () => policy.assertPermissionSubset(['admins.manage'], ['users.read']),
    /cannot grant access/i
  );
});

test('account policy enforces the admin hierarchy', async () => {
  const policy = await import(pathToFileURL(path.join(root, 'supabase', 'functions', 'admin-access', 'account-policy.mjs')).href);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', targetId: 'super-1', targetRole: 'super_admin', operation: 'update'
  }), /Super Admin/i);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', targetId: 'admin-1', targetRole: 'admin', operation: 'access'
  }), /own role or permissions/i);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'super-1', actorRole: 'super_admin', targetId: 'super-2', targetRole: 'super_admin', operation: 'delete'
  }), /cannot be deleted/i);
  assert.doesNotThrow(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', actorPermissions: ['users.identity.manage'],
    requiredPermission: 'users.identity.manage', targetId: 'student-1', targetRole: 'student', operation: 'identity'
  }));
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', actorPermissions: ['users.read'],
    requiredPermission: 'users.identity.manage', targetId: 'student-1', targetRole: 'student', operation: 'identity'
  }), /permission/i);
  assert.throws(() => policy.assertTargetAllowed({
    actorId: 'admin-1', actorRole: 'admin', actorPermissions: ['users.identity.manage'],
    requiredPermission: 'users.identity.manage', targetId: 'admin-2', targetRole: 'admin', operation: 'identity'
  }), /Super Admin/i);
});

test('Admin permission UI uses short English copy and hides technical codes', () => {
  const Permissions = require('../js/admin-permissions.js');
  assert.deepEqual(Permissions.CATALOG.map(item => [item.label, item.description]), [
    ['View profiles', 'View names, emails, and academic details.'],
    ['Edit user details', 'Change student names and G-Suite emails.'],
    ['Manage user status', 'Suspend or reactivate students.'],
    ['View admins', 'View admin accounts and access.'],
    ['Create admins', 'Create new admin accounts.'],
    ['Manage permissions', 'Change roles and access.'],
    ['View support', 'View support tickets and replies.'],
    ['Manage support', 'Update ticket status and send replies.'],
    ['Maintenance mode', 'Turn website maintenance mode on or off.'],
    ['Manage global catalog', 'Add and manage shared departments, courses, and faculty.']
  ]);
  assert.deepEqual(Permissions.keysForCodes(['admins.read', 'profiles.read', 'users.read']), [
    'view_profiles', 'view_admins'
  ]);
  const js = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
  assert.doesNotMatch(js, /<span>\$\{permission\}<\/span>/);
  assert.match(js, /Save permissions/);
});

test('Admin Panel loads the permission catalog before its page logic and provides Create Admin controls', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  assert.ok(html.indexOf('js/admin-permissions.js') < html.indexOf('js/admin.js'));
  assert.match(html, /id="createAdminPermissions"/);
});

test('Admin Catalog UI is permission-aware and exposes managed CRUD states', async () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'js', 'admin-catalog.js'), 'utf8');
  const permissions = require('../js/admin-permissions.js');
  const policy = await import(`${pathToFileURL(policyPath).href}?test=${Date.now()}-${Math.random()}`);
  const catalogPermission = permissions.CATALOG.find((item) => item.key === 'manage_catalog');

  assert.deepEqual(catalogPermission, {
    key: 'manage_catalog',
    label: 'Manage global catalog',
    description: 'Add and manage shared departments, courses, and faculty.',
    codes: ['catalog.manage'],
  });
  assert.deepEqual(policy.expandPermissionKeys(['manage_catalog']), ['catalog.manage']);
  assert.match(html, /data-admin-view="catalog"/);
  assert.match(html, /id="catalogAdminView"/);
  assert.match(html, /data-catalog-kind="department"/);
  assert.match(html, /data-catalog-kind="course"/);
  assert.match(html, /data-catalog-kind="faculty"/);
  assert.match(html, /js\/admin-catalog\.js/);
  assert.match(js, /permissions[^\n]*includes\("catalog\.manage"\)/);
  assert.match(js, /"list-catalog"/);
  assert.match(js, /"upsert-catalog-item"/);
  assert.match(js, /"delete-catalog-item"/);
  const uiSource = `${html}\n${js}`;
  assert.match(uiSource, /Edit/);
  assert.match(uiSource, /Save/);
  assert.match(uiSource, /Cancel/);
  assert.match(uiSource, /Delete/);
});

test('Admin Catalog exposes and applies kind-specific search and select filters', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'js', 'admin-catalog.js'), 'utf8');
  assert.match(html, /id="catalogSearch"/);
  assert.match(html, /id="catalogDepartmentFilter"/);
  assert.match(html, /id="catalogCategoryFilter"/);
  assert.match(html, /id="catalogVisibilityFilter"/);
  assert.match(html, /id="catalogFilterCount"[^>]*role="status"/);
  assert.match(html, /id="catalogNoResults"/);
  assert.match(js, /BracuCatalog\.filterCatalogItems/);
  assert.match(js, /catalogSearch[\s\S]*addEventListener\("input"/);
  assert.match(js, /catalogDepartmentFilter[\s\S]*addEventListener\("change"/);
  assert.match(js, /catalogCategoryFilter[\s\S]*addEventListener\("change"/);
  assert.match(js, /catalogVisibilityFilter[\s\S]*addEventListener\("change"/);
  assert.match(js, /Add Course only/);
  assert.match(js, /Visible in Course List/);
  assert.match(js, /name="categoryPreset"/);
  assert.match(js, /Custom category/);
  assert.match(js, /slugifyCategoryLabel/);
});

test('Create Admin uses the shared strong-password policy in the browser and server', () => {
  const html = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'js', 'admin.js'), 'utf8');
  const actions = fs.readFileSync(actionsPath, 'utf8');
  assert.match(html, /shared\/password-policy\.js/);
  assert.match(html, /minlength="12"/);
  assert.match(js, /BracuPasswordPolicy\.assertAdminPassword/);
  assert.match(actions, /assertAdminPassword\(input\.password\)/);
  assert.match(actions, /import '\.\/password-policy\.js'/);
  assert.equal(
    fs.readFileSync(
      path.join(root, 'supabase', 'functions', 'admin-access', 'password-policy.js'),
      'utf8',
    ),
    fs.readFileSync(path.join(root, 'shared', 'password-policy.js'), 'utf8'),
  );
});

test('Admin permission and danger controls are responsive and accessible', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'admin.css'), 'utf8');
  assert.match(css, /\.permission-option-copy\s*{[^}]*min-width:\s*0/s);
  assert.match(css, /\.permission-option-copy\s+small\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.danger-zone/);
  assert.match(css, /\.admin-danger/);
  assert.match(css, /\.admin-toast/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.permission-option/);
  assert.match(css, /:focus-visible/);
});

test('drawer focus return prefers a rerendered matching opener before stable fallbacks', () => {
  const AdminModule = require('../js/admin.js');
  const original = { isConnected: false, dataset: { openProfile: 'account-1' } };
  const rerendered = { isConnected: true, dataset: { openProfile: 'account-1' } };
  const fallback = { isConnected: true };

  assert.equal(AdminModule.getFocusReturnTarget({
    openerId: 'account-1', originalOpener: original, openers: [{ isConnected: true, dataset: { openProfile: 'other' } }, rerendered], fallback
  }), rerendered);
  const stillConnectedOriginal = { isConnected: true };
  assert.equal(AdminModule.getFocusReturnTarget({
    openerId: 'account-1', originalOpener: stillConnectedOriginal, openers: [], fallback
  }), stillConnectedOriginal);
  assert.equal(AdminModule.getFocusReturnTarget({
    openerId: 'account-1', originalOpener: original, openers: [], fallback
  }), fallback);
  assert.equal(AdminModule.getFocusReturnTarget({
    openerId: 'account-1', originalOpener: { isConnected: true, hidden: true }, openers: [], fallback
  }), fallback);
});

test('post-deletion focus uses the stable Accounts control after the deleted row is gone', () => {
  const AdminModule = require('../js/admin.js');
  const accountsTab = { isConnected: true, dataset: { accountView: 'users' } };

  assert.equal(AdminModule.getFocusReturnTarget({
    openerId: 'deleted-account',
    originalOpener: { isConnected: false, dataset: { openProfile: 'deleted-account' } },
    openers: [{ isConnected: true, dataset: { openProfile: 'remaining-account' } }],
    fallback: accountsTab
  }), accountsTab);
});

test('drawer Tab helper wraps focus and keeps in-drawer focus unchanged', () => {
  const AdminModule = require('../js/admin.js');
  const first = { id: 'first' };
  const middle = { id: 'middle' };
  const last = { id: 'last' };
  const controls = [first, middle, last];

  assert.equal(AdminModule.getDrawerTabTarget({ activeElement: last, controls, shiftKey: false, isInsideDrawer: true }), first);
  assert.equal(AdminModule.getDrawerTabTarget({ activeElement: first, controls, shiftKey: true, isInsideDrawer: true }), last);
  assert.equal(AdminModule.getDrawerTabTarget({ activeElement: middle, controls, shiftKey: false, isInsideDrawer: true }), null);
  assert.equal(AdminModule.getDrawerTabTarget({ activeElement: {}, controls, shiftKey: false, isInsideDrawer: false }), first);
});

test('aria-busy helper restores its state after successful and failed work', async () => {
  const AdminModule = require('../js/admin.js');
  const attributes = new Map();
  const element = { setAttribute(name, value) { attributes.set(name, value); } };

  assert.equal(await AdminModule.withAriaBusy(element, async () => {
    assert.equal(attributes.get('aria-busy'), 'true');
    return 'saved';
  }), 'saved');
  assert.equal(attributes.get('aria-busy'), 'false');
  await assert.rejects(() => AdminModule.withAriaBusy(element, async () => { throw new Error('request failed'); }), /request failed/);
  assert.equal(attributes.get('aria-busy'), 'false');
});
