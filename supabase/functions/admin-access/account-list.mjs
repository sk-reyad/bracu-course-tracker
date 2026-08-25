function cleanSearch(value) {
  return String(value || '').trim().replace(/[,%()]/g, '').slice(0, 100);
}

function relationForRole(role) {
  return { app_roles: { name: role || 'student' } };
}

export async function listAccounts(admin, payload = {}) {
  const page = Math.max(1, Number(payload.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(payload.pageSize) || 25));
  const role = ['student', 'admin', 'super_admin'].includes(String(payload.role || ''))
    ? String(payload.role)
    : null;
  const status = ['pending', 'active', 'suspended'].includes(String(payload.status || ''))
    ? String(payload.status)
    : null;
  const search = cleanSearch(payload.search) || null;
  const { data, error } = await admin.rpc('admin_list_accounts', {
    target_role: role,
    target_status: status,
    target_search: search,
    page_offset: (page - 1) * pageSize,
    page_limit: pageSize
  });
  if (error) throw new Error(error.message || 'Could not load accounts.');

  const rows = Array.isArray(data) ? data : [];
  const total = Number(rows[0]?.total_count || 0);
  const accounts = rows.map(row => {
    const { role_name, total_count, ...account } = row;
    return {
      ...account,
      daily_login_count: Number(account.daily_login_count || 0),
      weekly_login_count: Number(account.weekly_login_count || 0),
      monthly_login_count: Number(account.monthly_login_count || 0),
      total_login_count: Number(account.total_login_count || 0),
      user_roles: relationForRole(String(role_name || 'student'))
    };
  });
  return { accounts, page, pageSize, total };
}

