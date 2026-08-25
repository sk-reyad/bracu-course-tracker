begin;

-- Keep each user's own data available at AAL1, but require a verified MFA
-- session before any administrator permission can expose or change other data.
drop policy if exists profiles_select_authorized on public.profiles;
create policy profiles_select_authorized on public.profiles
for select to authenticated
using (
  (id = auth.uid() and status in ('pending', 'active'))
  or (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and public.authorize('profiles.read')
    and exists (
      select 1
      from public.user_roles target_user_role
      join public.app_roles target_role on target_role.id = target_user_role.role_id
      where target_user_role.user_id = profiles.id
        and target_role.name = 'student'
    )
  )
  or (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and public.authorize('admins.read')
    and exists (
      select 1
      from public.user_roles target_user_role
      join public.app_roles target_role on target_role.id = target_user_role.role_id
      where target_user_role.user_id = profiles.id
        and target_role.name in ('admin', 'super_admin')
    )
  )
);

drop policy if exists roles_read_authorized on public.app_roles;
create policy roles_read_authorized on public.app_roles
for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and (public.authorize('admins.read') or public.authorize('users.read'))
);

drop policy if exists permissions_read_authorized on public.app_permissions;
create policy permissions_read_authorized on public.app_permissions
for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and (public.authorize('admins.read') or public.authorize('users.read'))
);

drop policy if exists role_permissions_read_authorized on public.role_permissions;
create policy role_permissions_read_authorized on public.role_permissions
for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and (public.authorize('admins.read') or public.authorize('users.read'))
);

drop policy if exists user_roles_read_self_or_authorized on public.user_roles;
create policy user_roles_read_self_or_authorized on public.user_roles
for select to authenticated
using (
  user_id = auth.uid()
  or (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and public.authorize('users.read')
    and exists (
      select 1
      from public.app_roles target_role
      where target_role.id = user_roles.role_id
        and target_role.name = 'student'
    )
  )
  or (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and public.authorize('admins.read')
    and exists (
      select 1
      from public.app_roles target_role
      where target_role.id = user_roles.role_id
        and target_role.name in ('admin', 'super_admin')
    )
  )
);

drop policy if exists user_permissions_read_self_or_authorized on public.user_permissions;
create policy user_permissions_read_self_or_authorized on public.user_permissions
for select to authenticated
using (
  user_id = auth.uid()
  or (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and public.authorize('permissions.manage')
  )
);

drop policy if exists audit_read_super_admin on public.admin_audit_log;
create policy audit_read_super_admin on public.admin_audit_log
for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('permissions.manage')
);

drop policy if exists site_settings_manage_authorized on public.site_settings;
create policy site_settings_manage_authorized on public.site_settings
for update to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('maintenance.manage')
)
with check (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('maintenance.manage')
);

drop policy if exists support_tickets_read_authorized on public.support_tickets;
create policy support_tickets_read_authorized on public.support_tickets
for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('support.read')
);

drop policy if exists support_tickets_manage_authorized on public.support_tickets;
create policy support_tickets_manage_authorized on public.support_tickets
for update to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('support.manage')
)
with check (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('support.manage')
);

drop policy if exists support_replies_read_authorized on public.support_replies;
create policy support_replies_read_authorized on public.support_replies
for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('support.read')
);

drop policy if exists support_replies_manage_authorized on public.support_replies;
create policy support_replies_manage_authorized on public.support_replies
for all to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('support.manage')
)
with check (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and public.authorize('support.manage')
);

commit;
