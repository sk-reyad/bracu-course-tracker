(function exposeAdminModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.AdminModule = api;
    if (root.document) api.mountAdminPage(root);
  }
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildAdminModule() {
    "use strict";

    function getAdminCapabilities(context = {}) {
      const superAdmin = context.role === "super_admin";
      const permissions = new Set(context.permissions || []);
      return {
        readUsers: superAdmin || permissions.has("users.read"),
        readAdmins: superAdmin || permissions.has("admins.read"),
        manageStatus: superAdmin || permissions.has("users.status.manage"),
        manageUserIdentity:
          superAdmin || permissions.has("users.identity.manage"),
        manageAdmins: superAdmin || permissions.has("admins.manage"),
        managePermissions: superAdmin || permissions.has("permissions.manage"),
        manageAdminIdentity: superAdmin,
        deleteAccounts: superAdmin,
      };
    }

    function getProfileActionState(capabilities = {}, targetRole = "student") {
      return {
        editIdentity:
          targetRole === "student"
            ? Boolean(capabilities.manageUserIdentity)
            : Boolean(capabilities.manageAdminIdentity),
        deleteAccount:
          Boolean(capabilities.deleteAccounts) &&
          (targetRole === "student" || targetRole === "admin"),
      };
    }

    function getProfileAccessState(
      capabilities = {},
      callerRole = "admin",
      targetRole = "student",
    ) {
      const superAdmin = callerRole === "super_admin";
      return {
        manageAccess:
          Boolean(capabilities.managePermissions) &&
          (superAdmin || targetRole === "student"),
        roleOptions: superAdmin
          ? ["student", "admin", "super_admin"]
          : [targetRole],
      };
    }

    function createProfileRequestGate() {
      let version = 0;
      return Object.freeze({
        start(id) {
          return Object.freeze({ id, version: ++version });
        },
        invalidate() {
          version += 1;
        },
        isCurrent(request, selectedId, drawerOpen) {
          return Boolean(
            drawerOpen &&
            request &&
            request.version === version &&
            request.id === selectedId,
          );
        },
      });
    }

    function buildDeleteAccountRequest({
      id,
      confirmationInput,
      expectedEmail,
    }) {
      const confirmationEmail = String(
        confirmationInput == null ? "" : confirmationInput,
      );
      return {
        matches:
          confirmationEmail.trim().toLowerCase() ===
          String(expectedEmail || "")
            .trim()
            .toLowerCase(),
        payload: { id, confirmationEmail },
      };
    }

    function createSubmissionLock() {
      let active = false;
      return Object.freeze({
        tryStart() {
          if (active) return false;
          active = true;
          return true;
        },
        finish() {
          active = false;
        },
        isActive() {
          return active;
        },
      });
    }

    function isVisibleFocusable(element) {
      if (
        !element ||
        !element.isConnected ||
        element.hidden ||
        element.disabled
      )
        return false;
      return (
        typeof element.getClientRects !== "function" ||
        element.getClientRects().length > 0
      );
    }

    function getFocusReturnTarget({
      openerId,
      originalOpener,
      openers = [],
      fallback,
    } = {}) {
      const currentOpener = Array.from(openers).find(
        (opener) =>
          isVisibleFocusable(opener) &&
          opener.dataset &&
          opener.dataset.openProfile === openerId,
      );
      if (currentOpener) return currentOpener;
      if (isVisibleFocusable(originalOpener)) return originalOpener;
      return isVisibleFocusable(fallback) ? fallback : null;
    }

    function getDrawerTabTarget({
      activeElement,
      controls = [],
      shiftKey = false,
      isInsideDrawer = false,
    } = {}) {
      if (!controls.length) return null;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!isInsideDrawer || (!shiftKey && activeElement === last))
        return first;
      if (shiftKey && activeElement === first) return last;
      return null;
    }

    async function withAriaBusy(element, work) {
      element.setAttribute("aria-busy", "true");
      try {
        return await work();
      } finally {
        element.setAttribute("aria-busy", "false");
      }
    }

    async function normalizeAdminError(error) {
      const response = error && error.context;
      if (response && typeof response.json === "function") {
        try {
          const readable =
            typeof response.clone === "function" ? response.clone() : response;
          const payload = await readable.json();
          if (payload && payload.error) return new Error(String(payload.error));
        } catch (_error) {
          // Fall back to the SDK error when the response is not JSON.
        }
      }
      return error instanceof Error
        ? error
        : new Error(String(error || "Admin request failed."));
    }

    function createAdminController({ client, requestTimeoutMs = 15000 } = {}) {
      async function invokeAction(action, payload = {}) {
        let timerId;
        const timeoutMs = Math.max(1, Number(requestTimeoutMs) || 15000);
        const timeout = new Promise((_, reject) => {
          timerId = setTimeout(
            () =>
              reject(
                new Error("The admin request timed out. Please try again."),
              ),
            timeoutMs,
          );
        });
        let response;
        try {
          const request = (async () => {
            const { data: sessionData, error: sessionError } =
              await client.auth.getSession();
            if (sessionError) throw sessionError;
            const accessToken =
              sessionData &&
              sessionData.session &&
              sessionData.session.access_token;
            if (!accessToken)
              throw new Error(
                "Your admin session has expired. Please sign in again.",
              );
            return client.functions.invoke("admin-access", {
              body: { action, payload },
              headers: { Authorization: `Bearer ${accessToken}` },
            });
          })();
          response = await Promise.race([request, timeout]);
        } catch (error) {
          throw await normalizeAdminError(error);
        } finally {
          clearTimeout(timerId);
        }
        const { data, error } = response;
        if (error) throw await normalizeAdminError(error);
        if (!data || data.error)
          throw new Error((data && data.error) || "Admin request failed.");
        return data.data;
      }
      return Object.freeze({ invokeAction });
    }

    function createAccountListCache({
      ttlMs = 30000,
      maxEntries = 20,
      now = () => Date.now(),
    } = {}) {
      const entries = new Map();
      const inFlight = new Map();
      const lifetime = Math.max(0, Number(ttlMs) || 0);
      const limit = Math.max(1, Number(maxEntries) || 20);

      function keyFor(query = {}) {
        return JSON.stringify({
          role: String(query.role || ""),
          page: Math.max(1, Number(query.page) || 1),
          pageSize: Math.max(1, Number(query.pageSize) || 25),
          search: String(query.search || "")
            .trim()
            .toLowerCase(),
          status: String(query.status || ""),
        });
      }

      function read(key) {
        const entry = entries.get(key);
        if (!entry) return null;
        return {
          data: entry.data,
          fresh: now() - entry.fetchedAt < lifetime,
          fetchedAt: entry.fetchedAt,
        };
      }

      function store(key, data) {
        entries.delete(key);
        entries.set(key, { data, fetchedAt: now() });
        while (entries.size > limit)
          entries.delete(entries.keys().next().value);
        return data;
      }

      async function load(key, loader, { force = false } = {}) {
        const cached = read(key);
        if (!force && cached && cached.fresh) return cached.data;
        if (inFlight.has(key)) return inFlight.get(key);
        const request = Promise.resolve()
          .then(loader)
          .then((data) => store(key, data))
          .finally(() => inFlight.delete(key));
        inFlight.set(key, request);
        return request;
      }

      function invalidate() {
        entries.clear();
      }

      return Object.freeze({ keyFor, read, load, invalidate });
    }

    function roleOf(account) {
      const relation = account.user_roles;
      const row = Array.isArray(relation) ? relation[0] : relation;
      const role = row && row.app_roles;
      return (
        (Array.isArray(role) ? role[0] && role[0].name : role && role.name) ||
        "student"
      );
    }

    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(
        /[&<>'"]/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;",
          })[char],
      );
    }

    function formatAdminDate(value) {
      const date = new Date(value);
      if (!value || Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    }

    function formatBadgeLabel(value) {
      return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
    }

    function accountMarkup(account, mobile = false) {
      const role = roleOf(account);
      const name = escapeHtml(account.full_name || "Unnamed account");
      const email = escapeHtml(account.email || "");
      const registered = escapeHtml(formatAdminDate(account.created_at));
      const daily = Number(account.daily_login_count || 0);
      const weekly = Number(account.weekly_login_count || 0);
      const monthly = Number(account.monthly_login_count || 0);
      const total = Number(account.total_login_count || 0);
      const onboarding =
        role === "student"
          ? account.onboarding_completed
            ? "Complete"
            : "Pending"
          : "Not required";
      const open = `<button class="admin-secondary" type="button" data-open-profile="${escapeHtml(account.id)}">View</button>`;
      const roleLabel = escapeHtml(formatBadgeLabel(role));
      const statusLabel = escapeHtml(formatBadgeLabel(account.status));
      if (mobile)
        return `<article class="admin-account-card"><div class="account-cell"><span class="account-avatar">${name.charAt(0).toUpperCase()}</span><span class="account-copy"><strong>${name}</strong><small>${email}</small></span></div><div class="card-meta"><span class="role-pill">${roleLabel}</span><span class="status-pill" data-status="${escapeHtml(account.status)}">${statusLabel}</span><span class="registered-copy">First registered ${registered}</span><span class="registered-copy">Onboarding ${onboarding}</span></div><dl class="login-metrics"><div><dt>Daily</dt><dd>${daily}</dd></div><div><dt>Weekly</dt><dd>${weekly}</dd></div><div><dt>Monthly</dt><dd>${monthly}</dd></div><div><dt>Total</dt><dd>${total}</dd></div></dl><div class="card-actions">${open}</div></article>`;
      return `<tr><td><div class="account-cell"><span class="account-avatar">${name.charAt(0).toUpperCase()}</span><span class="account-copy"><strong>${name}</strong><small>${email}</small></span></div></td><td><span class="role-pill">${roleLabel}</span></td><td><span class="status-pill" data-status="${escapeHtml(account.status)}">${statusLabel}</span></td><td>${escapeHtml(account.program || "—")}</td><td>${registered}</td><td>${daily}</td><td>${weekly}</td><td>${monthly}</td><td>${total}</td><td>${onboarding}</td><td>${open}</td></tr>`;
    }

    function mountAdminPage(root) {
      const document = root.document;
      const $ = (selector) => document.querySelector(selector);
      const pageLoading = root.BracuUiStates.mountPageLoading({
        source: "admin",
      });
      const state = {
        context: null,
        capabilities: null,
        view: "users",
        page: 1,
        total: 0,
        pageSize: 25,
        accounts: [],
        loadVersion: 0,
        selectedId: null,
        deleteTarget: null,
        drawerOpener: null,
      };
      let controller;
      let searchTimer;
      let toastTimer;
      const profileRequests = createProfileRequestGate();
      const deleteSubmission = createSubmissionLock();
      const accountCache = createAccountListCache();
      let prefetchTimer;

      function refreshIcons() {
        if (root.lucide) root.lucide.createIcons();
      }
      function isCurrentProfile(request) {
        return profileRequests.isCurrent(
          request,
          state.selectedId,
          !$("#profileDrawer").hidden,
        );
      }
      function showToast(message) {
        clearTimeout(toastTimer);
        const toast = $("#adminToast");
        toast.textContent = message;
        toast.hidden = false;
        toastTimer = setTimeout(() => {
          toast.hidden = true;
        }, 3200);
      }
      function showState(name, message = "") {
        [
          "#adminLoading",
          "#adminEmpty",
          "#adminError",
          "#adminResults",
        ].forEach((selector) => {
          $(selector).hidden = selector !== name;
        });
        if (name === "#adminError") $("#adminErrorCopy").textContent = message;
      }

      function renderAccounts(result) {
        state.accounts = result.accounts || [];
        state.total = result.total || 0;
        if (!state.accounts.length) {
          showState("#adminEmpty");
          return;
        }
        $("#adminTableBody").innerHTML = state.accounts
          .map((account) => accountMarkup(account))
          .join("");
        $("#adminAccountCards").innerHTML = state.accounts
          .map((account) => accountMarkup(account, true))
          .join("");
        const pages = Math.max(1, Math.ceil(state.total / state.pageSize));
        $("#adminPageStatus").textContent = `Page ${state.page} of ${pages}`;
        $("#adminPrevPage").disabled = state.page <= 1;
        $("#adminNextPage").disabled = state.page >= pages;
        showState("#adminResults");
        refreshIcons();
      }

      function accountQuery(roleOverride, pageOverride) {
        const selectedRole = $("#adminRoleFilter").value;
        return {
          page: pageOverride || state.page,
          pageSize: state.pageSize,
          search: $("#adminSearch").value.trim(),
          status: $("#adminStatusFilter").value,
          role:
            roleOverride ||
            selectedRole ||
            (state.view === "admins" ? "admin" : "student"),
        };
      }

      function scheduleAlternatePrefetch() {
        if (!state.capabilities.readAdmins) return;
        if (prefetchTimer) {
          if (root.cancelIdleCallback) root.cancelIdleCallback(prefetchTimer);
          else clearTimeout(prefetchTimer);
        }
        const run = () => {
          prefetchTimer = null;
          const alternateRole = state.view === "admins" ? "student" : "admin";
          loadAccounts({
            prefetch: true,
            query: accountQuery(alternateRole, 1),
          });
        };
        prefetchTimer = root.requestIdleCallback
          ? root.requestIdleCallback(run, { timeout: 800 })
          : setTimeout(run, 120);
      }

      async function loadAccounts({
        force = false,
        prefetch = false,
        query = null,
      } = {}) {
        const requestQuery = query || accountQuery();
        const key = accountCache.keyFor(requestQuery);
        const cached = force ? null : accountCache.read(key);
        const version = prefetch ? 0 : ++state.loadVersion;
        if (!prefetch) {
          if (cached) renderAccounts(cached.data);
          else showState("#adminLoading");
          $(".admin-main").setAttribute("aria-busy", "true");
        }
        try {
          const result = await accountCache.load(
            key,
            () => controller.invokeAction("list-accounts", requestQuery),
            { force },
          );
          if (
            !prefetch &&
            version === state.loadVersion &&
            key === accountCache.keyFor(accountQuery())
          ) {
            renderAccounts(result);
            scheduleAlternatePrefetch();
          }
          return result;
        } catch (error) {
          if (!prefetch && version === state.loadVersion) {
            if (cached)
              showToast(`Could not refresh accounts: ${error.message}`);
            else showState("#adminError", error.message);
          }
          return null;
        } finally {
          if (!prefetch && version === state.loadVersion)
            $(".admin-main").setAttribute("aria-busy", "false");
        }
      }

      function invalidateAccountCache() {
        accountCache.invalidate();
      }

      function permissionMarkup(item, { checked, disabled }) {
        return `<label class="permission-option${disabled ? " permission-locked" : ""}"><input type="checkbox" value="${escapeHtml(item.key)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}/><span class="permission-option-copy"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span></label>`;
      }

      function renderCreateAdminPermissions(reset = false) {
        const catalog = root.AdminPermissions.CATALOG;
        const ownPermissions = new Set(state.context.permissions || []);
        const creatingSuperAdmin =
          $("#createAdminRole").value === "super_admin";
        $("#createAdminPermissions").innerHTML = catalog
          .map((item) => {
            const available =
              state.context.role === "super_admin" ||
              item.codes.every((code) => ownPermissions.has(code));
            return permissionMarkup(item, {
              checked:
                creatingSuperAdmin ||
                (reset && item.key === "view_profiles" && available),
              disabled: creatingSuperAdmin || !available,
            });
          })
          .join("");
      }

      function resetCreateAdminForm() {
        const form = $("#createAdminForm");
        form.reset();
        $("#createAdminRole").value = "admin";
        $("#createAdminError").textContent = "";
        $("#createAdminError").hidden = true;
        renderCreateAdminPermissions(true);
      }

      function focusDrawerClose() {
        $("#closeProfileDrawer").focus();
      }

      function drawerFocusableControls() {
        return Array.from(
          $("#profileDrawer").querySelectorAll(
            "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
          ),
        ).filter(
          (control) => !control.hidden && control.getClientRects().length,
        );
      }

      function visibleProfileOpeners() {
        return Array.from(
          document.querySelectorAll("[data-open-profile]"),
        ).filter(isVisibleFocusable);
      }

      function stableAccountsControl() {
        return (
          document.querySelector('[data-account-view][aria-selected="true"]') ||
          document.querySelector("[data-account-view]")
        );
      }

      function trapDrawerFocus(event) {
        if (
          $("#profileDrawer").hidden ||
          $("#createAdminDialog").open ||
          $("#deleteAccountDialog").open
        )
          return;
        if (event.key === "Escape") {
          event.preventDefault();
          closeProfile();
          return;
        }
        if (event.key !== "Tab") return;
        const controls = drawerFocusableControls();
        if (!controls.length) return;
        const target = getDrawerTabTarget({
          activeElement: document.activeElement,
          controls,
          shiftKey: event.shiftKey,
          isInsideDrawer: $("#profileDrawer").contains(document.activeElement),
        });
        if (target) {
          event.preventDefault();
          target.focus();
        }
      }

      async function openProfile(id, opener) {
        const request = profileRequests.start(id);
        state.selectedId = id;
        if (opener) state.drawerOpener = { id, element: opener };
        $("#profileDrawerBody").innerHTML =
          `<div class="skeleton-detail" aria-label="Loading profile"><span class="skeleton-block skeleton-detail-head"></span><span class="skeleton-block skeleton-detail-card"></span><span class="skeleton-block skeleton-detail-card"></span></div>`;
        $("#drawerBackdrop").hidden = false;
        $("#profileDrawer").hidden = false;
        focusDrawerClose();
        try {
          const profile = await controller.invokeAction("get-profile-summary", {
            id,
          });
          if (!isCurrentProfile(request)) return;
          const role = roleOf(profile);
          const actions = getProfileActionState(state.capabilities, role);
          const access = getProfileAccessState(
            state.capabilities,
            state.context.role,
            role,
          );
          const selectedPermissions = new Set(
            root.AdminPermissions.keysForCodes(
              profile.effective_permissions || [],
            ),
          );
          const ownPermissions = new Set(state.context.permissions || []);
          const canManagePermission = (item) =>
            state.context.role === "super_admin" ||
            item.codes.every((code) => ownPermissions.has(code));
          const roleLabels = {
            student: "Student",
            admin: "Admin",
            super_admin: "Super admin",
          };
          const roleOptions = access.roleOptions
            .map(
              (option) =>
                `<option value="${option}" ${role === option ? "selected" : ""}>${roleLabels[option]}</option>`,
            )
            .join("");
          $("#drawerTitle").textContent = profile.full_name || "Account";
          $("#profileDrawerBody").innerHTML = `
          <section id="profileIdentityCard" class="detail-card"></section>
          <section class="detail-card access-card"><h3>Access</h3><label>Role<select id="drawerRole" class="drawer-select" ${access.manageAccess ? "" : "disabled"}>${roleOptions}</select></label><div class="permission-list">${root.AdminPermissions.CATALOG.map((item) => permissionMarkup(item, { checked: selectedPermissions.has(item.key), disabled: !access.manageAccess || !canManagePermission(item) || role === "super_admin" })).join("")}</div><p id="accessError" class="dialog-error" role="alert" hidden></p><div class="drawer-actions">${access.manageAccess ? '<button id="saveAccess" class="admin-primary" type="button">Save permissions</button>' : ""}</div></section>
          <section class="detail-card account-status-card${actions.deleteAccount ? " danger-zone" : ""}"><h3>Account status</h3><div class="drawer-actions">${state.capabilities.manageStatus ? `<button id="toggleAccountStatus" class="admin-secondary" type="button">${profile.status === "suspended" ? "Reactivate" : "Suspend"} account</button>` : `<span class="status-pill" data-status="${escapeHtml(profile.status)}">${escapeHtml(formatBadgeLabel(profile.status))}</span>`}${actions.deleteAccount ? '<button id="openDeleteAccount" class="admin-danger" type="button"><i data-lucide="trash-2"></i>Delete account</button>' : ""}</div></section>`;

          async function refreshAfterMutation(message) {
            showToast(message);
            invalidateAccountCache();
            await loadAccounts();
            if (isCurrentProfile(request)) await openProfile(id);
          }

          function renderIdentityCard(editing = false, errorMessage = "") {
            if (!isCurrentProfile(request)) return;
            const card = $("#profileIdentityCard");
            if (!editing) {
              card.innerHTML = `<div class="detail-card-heading"><h3>Profile</h3>${actions.editIdentity ? '<button id="editProfileIdentity" class="admin-secondary" type="button">Edit details</button>' : ""}</div><div class="detail-grid"><span class="detail-item"><small>Name</small><strong>${escapeHtml(profile.full_name || "Unnamed account")}</strong></span><span class="detail-item"><small>Email</small><strong>${escapeHtml(profile.email)}</strong></span><span class="detail-item"><small>Student ID</small><strong>${escapeHtml(profile.student_id || "—")}</strong></span><span class="detail-item"><small>Program</small><strong>${escapeHtml(profile.program || "—")}</strong></span><span class="detail-item"><small>Starting semester</small><strong>${escapeHtml(profile.starting_term ? `${profile.starting_term} ${profile.starting_year}` : "—")}</strong></span></div>`;
              if ($("#editProfileIdentity"))
                $("#editProfileIdentity").addEventListener("click", () =>
                  renderIdentityCard(true),
                );
            } else {
              card.innerHTML = `<h3>Edit profile</h3><form id="profileIdentityForm" class="identity-form"><label>Full name<input name="fullName" value="${escapeHtml(profile.full_name || "")}" required autocomplete="name" /></label><label>Email<input name="email" type="email" value="${escapeHtml(profile.email || "")}" required autocomplete="email" /></label><p id="profileIdentityError" class="dialog-error" role="alert" ${errorMessage ? "" : "hidden"}>${escapeHtml(errorMessage)}</p><div class="drawer-actions"><button id="cancelIdentityEdit" class="admin-secondary" type="button">Cancel</button><button class="admin-primary" type="submit">Save details</button></div></form>`;
              $("#cancelIdentityEdit").addEventListener("click", () =>
                renderIdentityCard(false),
              );
              $("#profileIdentityForm").addEventListener(
                "submit",
                async (event) => {
                  event.preventDefault();
                  if (!isCurrentProfile(request)) return;
                  const form = event.currentTarget;
                  const values = Object.fromEntries(new FormData(form));
                  Array.from(form.elements).forEach((control) => {
                    control.disabled = true;
                  });
                  const action =
                    role === "student"
                      ? "update-user-identity"
                      : "update-admin-identity";
                  await withAriaBusy(form, async () => {
                    try {
                      await controller.invokeAction(action, {
                        id,
                        fullName: values.fullName,
                        email: values.email,
                      });
                      await refreshAfterMutation("Account details updated.");
                    } catch (error) {
                      renderIdentityCard(true, error.message);
                    }
                  });
                },
              );
            }
            refreshIcons();
          }

          renderIdentityCard();
          const updatePermissionLocks = () => {
            if (!isCurrentProfile(request)) return;
            const superAdminRole = $("#drawerRole").value === "super_admin";
            root.AdminPermissions.CATALOG.forEach((item, index) => {
              const input = $("#profileDrawerBody").querySelectorAll(
                ".permission-list input",
              )[index];
              if (superAdminRole) input.checked = true;
              input.disabled =
                !access.manageAccess ||
                !canManagePermission(item) ||
                superAdminRole;
              input
                .closest(".permission-option")
                .classList.toggle("permission-locked", input.disabled);
            });
          };
          $("#drawerRole").addEventListener("change", updatePermissionLocks);
          if ($("#saveAccess"))
            $("#saveAccess").addEventListener("click", async (event) => {
              if (!isCurrentProfile(request)) return;
              if (!root.confirm("Apply these role and permission changes?"))
                return;
              const button = event.currentTarget;
              button.disabled = true;
              const nextRole = $("#drawerRole").value;
              const permissions = Array.from(
                $("#profileDrawerBody").querySelectorAll(
                  ".permission-list input:checked",
                ),
                (input) => input.value,
              );
              await withAriaBusy($("#profileDrawerBody"), async () => {
                try {
                  await controller.invokeAction("set-user-permissions", {
                    id,
                    role: nextRole,
                    permissions,
                  });
                  await refreshAfterMutation("Permissions saved.");
                } catch (error) {
                  if (!isCurrentProfile(request)) return;
                  $("#accessError").textContent = error.message;
                  $("#accessError").hidden = false;
                  button.disabled = false;
                }
              });
            });
          if ($("#toggleAccountStatus"))
            $("#toggleAccountStatus").addEventListener(
              "click",
              async (event) => {
                if (!isCurrentProfile(request)) return;
                const status =
                  profile.status === "suspended" ? "active" : "suspended";
                if (
                  !root.confirm(
                    `${status === "suspended" ? "Suspend" : "Reactivate"} this account?`,
                  )
                )
                  return;
                const button = event.currentTarget;
                button.disabled = true;
                await withAriaBusy($("#profileDrawerBody"), async () => {
                  try {
                    await controller.invokeAction("set-account-status", {
                      id,
                      status,
                    });
                    await refreshAfterMutation(
                      status === "suspended"
                        ? "Account suspended."
                        : "Account reactivated.",
                    );
                  } catch (error) {
                    if (!isCurrentProfile(request)) return;
                    button.disabled = false;
                    showToast(error.message);
                  }
                });
              },
            );
          if ($("#openDeleteAccount"))
            $("#openDeleteAccount").addEventListener("click", () => {
              if (!isCurrentProfile(request)) return;
              state.deleteTarget = { id, email: profile.email, request };
              $("#deleteAccountForm").reset();
              $("#deleteAccountError").hidden = true;
              $("#deleteAccountDialog").showModal();
              refreshIcons();
            });
        } catch (error) {
          if (isCurrentProfile(request))
            $("#profileDrawerBody").innerHTML =
              `<div class="admin-state admin-error"><p>${escapeHtml(error.message)}</p></div>`;
        }
        if (isCurrentProfile(request)) refreshIcons();
      }

      function closeProfile({ restoreFocus = true } = {}) {
        const opener = state.drawerOpener;
        profileRequests.invalidate();
        $("#drawerBackdrop").hidden = true;
        $("#profileDrawer").hidden = true;
        state.selectedId = null;
        state.drawerOpener = null;
        const returnTarget = getFocusReturnTarget({
          openerId: opener && opener.id,
          originalOpener: opener && opener.element,
          openers: visibleProfileOpeners(),
          fallback: stableAccountsControl(),
        });
        if (
          restoreFocus &&
          returnTarget &&
          typeof returnTarget.focus === "function"
        )
          returnTarget.focus();
      }
      function setTheme(theme) {
        const safe = theme === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = safe;
        root.localStorage.setItem("bracuCourseTracker.theme", safe);
        $("#adminThemeToggle").innerHTML =
          `<i data-lucide="${safe === "dark" ? "sun" : "moon"}"></i>`;
        refreshIcons();
      }

      function bindEvents() {
        document.querySelectorAll("[data-account-view]").forEach((button) =>
          button.addEventListener("click", () => {
            state.view = button.dataset.accountView;
            state.page = 1;
            document.querySelectorAll("[data-account-view]").forEach((item) => {
              const active = item === button;
              item.classList.toggle("active", active);
              item.setAttribute("aria-selected", String(active));
            });
            $("#adminRoleFilter").value =
              state.view === "admins" ? "admin" : "student";
            loadAccounts();
          }),
        );
        $("#adminSearch").addEventListener("input", () => {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(() => {
            state.page = 1;
            loadAccounts();
          }, 260);
        });
        $("#adminStatusFilter").addEventListener("change", () => {
          state.page = 1;
          loadAccounts();
        });
        $("#adminRoleFilter").addEventListener("change", () => {
          state.page = 1;
          loadAccounts();
        });
        $("#refreshAdminList").addEventListener("click", () =>
          loadAccounts({ force: true }),
        );
        $("#retryAdminList").addEventListener("click", () =>
          loadAccounts({ force: true }),
        );
        $("#adminPrevPage").addEventListener("click", () => {
          if (state.page > 1) {
            state.page -= 1;
            loadAccounts();
          }
        });
        $("#adminNextPage").addEventListener("click", () => {
          state.page += 1;
          loadAccounts();
        });
        $("#adminResults").addEventListener("click", (event) => {
          const button = event.target.closest("[data-open-profile]");
          if (button) openProfile(button.dataset.openProfile, button);
        });
        $("#closeProfileDrawer").addEventListener("click", closeProfile);
        $("#drawerBackdrop").addEventListener("click", closeProfile);
        $("#adminSignOut").addEventListener("click", () =>
          root.BracuAccess.signOutAndRedirect(),
        );
        $("#adminThemeToggle").addEventListener("click", () =>
          setTheme(
            document.documentElement.dataset.theme === "dark"
              ? "light"
              : "dark",
          ),
        );
        $("#openCreateAdmin").addEventListener("click", () => {
          resetCreateAdminForm();
          $("#createAdminDialog").showModal();
        });
        $("#closeCreateAdmin").addEventListener("click", () =>
          $("#createAdminDialog").close(),
        );
        $("#cancelCreateAdmin").addEventListener("click", () =>
          $("#createAdminDialog").close(),
        );
        $("#createAdminDialog").addEventListener("close", resetCreateAdminForm);
        $("#cancelDeleteAccount").addEventListener("click", () => {
          if (!deleteSubmission.isActive()) $("#deleteAccountDialog").close();
        });
        $("#deleteAccountDialog").addEventListener("cancel", (event) => {
          if (deleteSubmission.isActive()) event.preventDefault();
        });
        $("#deleteAccountDialog").addEventListener("close", () => {
          state.deleteTarget = null;
          $("#deleteAccountForm").reset();
          $("#deleteAccountError").hidden = true;
        });
        $("#deleteAccountForm").addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!state.deleteTarget || !deleteSubmission.tryStart()) return;
          const form = event.currentTarget;
          const target = state.deleteTarget;
          const request = buildDeleteAccountRequest({
            id: target.id,
            confirmationInput: $("#deleteConfirmationEmail").value,
            expectedEmail: target.email,
          });
          const errorCopy = $("#deleteAccountError");
          if (!request.matches) {
            errorCopy.textContent = "The email does not match this account.";
            errorCopy.hidden = false;
            deleteSubmission.finish();
            return;
          }
          const controls = Array.from(form.elements);
          controls.forEach((control) => {
            control.disabled = true;
          });
          let restoreFocusAfterDeletion = false;
          await withAriaBusy(form, async () => {
            try {
              await controller.invokeAction("delete-account", request.payload);
              if (
                state.deleteTarget === target &&
                $("#deleteAccountDialog").open
              )
                $("#deleteAccountDialog").close();
              if (isCurrentProfile(target.request)) {
                closeProfile({ restoreFocus: false });
                restoreFocusAfterDeletion = true;
              }
              showToast("Account deleted.");
              invalidateAccountCache();
              await loadAccounts();
              if (restoreFocusAfterDeletion) {
                const returnTarget = getFocusReturnTarget({
                  openerId: target.id,
                  openers: visibleProfileOpeners(),
                  fallback: stableAccountsControl(),
                });
                if (returnTarget && typeof returnTarget.focus === "function")
                  returnTarget.focus();
              }
            } catch (error) {
              if (
                state.deleteTarget === target &&
                $("#deleteAccountDialog").open
              ) {
                errorCopy.textContent = error.message;
                errorCopy.hidden = false;
              }
            } finally {
              deleteSubmission.finish();
              controls.forEach((control) => {
                control.disabled = false;
              });
            }
          });
        });
        $("#createAdminRole").addEventListener("change", () =>
          renderCreateAdminPermissions(true),
        );
        $("#createAdminForm").addEventListener("submit", async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const payload = Object.fromEntries(new FormData(form));
          try {
            root.BracuPasswordPolicy.assertAdminPassword(payload.password);
          } catch (error) {
            $("#createAdminError").textContent = error.message;
            $("#createAdminError").hidden = false;
            return;
          }
          if (!root.confirm("Create this administrator account?")) return;
          payload.permissions = Array.from(
            document.querySelectorAll("#createAdminPermissions input:checked"),
            (input) => input.value,
          );
          const button = form.querySelector("button[type='submit']");
          button.disabled = true;
          await withAriaBusy(form, async () => {
            try {
              await controller.invokeAction("create-admin", payload);
              $("#createAdminDialog").close();
              state.view = "admins";
              $("#adminRoleFilter").value = "admin";
              invalidateAccountCache();
              await loadAccounts();
            } catch (error) {
              $("#createAdminError").textContent = error.message;
              $("#createAdminError").hidden = false;
            } finally {
              button.disabled = false;
            }
          });
        });
        document.addEventListener("keydown", trapDrawerFocus);
      }

      async function boot() {
        try {
          state.context = await root.BracuAccess.requireAdminAccess();
          if (!state.context) return;
          state.capabilities = getAdminCapabilities(state.context);
          controller = createAdminController({
            client: root.BracuSupabase.getClient(),
          });
          $("#createAdminRole").querySelector(
            'option[value="super_admin"]',
          ).hidden = state.context.role !== "super_admin";
          $("#createAdminRole").querySelector(
            'option[value="super_admin"]',
          ).disabled = state.context.role !== "super_admin";
          resetCreateAdminForm();
          $("#adminIdentity").textContent =
            `${state.context.profile.full_name} · ${state.context.role.replace("_", " ")}`;
          $("#openCreateAdmin").hidden = !state.capabilities.manageAdmins;
          if (!state.capabilities.readAdmins)
            document.querySelector("[data-account-view='admins']").hidden =
              true;
          bindEvents();
          setTheme(
            root.localStorage.getItem("bracuCourseTracker.theme") || "light",
          );
          $(".admin-main").setAttribute("aria-busy", "false");
          await loadAccounts();
          pageLoading.markReady();
          refreshIcons();
        } catch (error) {
          pageLoading.markFailed("The Admin Panel could not be loaded.");
          root.console?.error?.("Admin Panel could not start.", error);
          root.location.replace(
            root.BracuUiStates.buildErrorUrl({ code: 503, source: "admin" }),
          );
        }
      }

      if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", boot, { once: true });
      else boot();
    }

    return Object.freeze({
      getAdminCapabilities,
      getProfileActionState,
      getProfileAccessState,
      createProfileRequestGate,
      buildDeleteAccountRequest,
      createSubmissionLock,
      createAdminController,
      createAccountListCache,
      getFocusReturnTarget,
      getDrawerTabTarget,
      withAriaBusy,
      accountMarkup,
      formatAdminDate,
      mountAdminPage,
    });
  },
);
