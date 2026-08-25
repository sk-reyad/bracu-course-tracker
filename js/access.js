(function exposeAccessModule(root, factory) {
  const moduleApi = factory();
  if (typeof module === "object" && module.exports) module.exports = moduleApi;
  else
    root.BracuAccess = moduleApi.createAccessManager({
      supabaseApi: root.BracuSupabase,
      location: root.location,
      config: root.BRACU_CONFIG,
    });
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildAccessModule() {
    "use strict";

    function createAccessManager({ supabaseApi, location, config = {} } = {}) {
      const authPage = config.authPageUrl || "auth.html";
      const errorPage = config.errorPageUrl || "error.html";

      function navigate(target) {
        if (location && typeof location.replace === "function")
          location.replace(target);
      }

      function errorUrl(code, source) {
        return `${errorPage}?code=${Number(code)}&source=${source === "admin" ? "admin" : "tracker"}`;
      }

      function isPreviewRequest() {
        const params = new URLSearchParams((location && location.search) || "");
        return params.get("preview") === "1";
      }

      function hasPermission(context, permission) {
        return Boolean(
          context &&
          Array.isArray(context.permissions) &&
          context.permissions.includes(permission),
        );
      }

      async function rejectSuspended(context) {
        if (
          !context ||
          !context.profile ||
          context.profile.status !== "suspended"
        )
          return false;
        if (supabaseApi && typeof supabaseApi.signOut === "function")
          await supabaseApi.signOut();
        navigate(`${authPage}?error=suspended`);
        return true;
      }

      async function requireMainAccess() {
        if (isPreviewRequest()) {
          return Object.freeze({
            preview: true,
            role: "preview",
            status: "active",
            permissions: [],
          });
        }
        const context = await supabaseApi.getSessionContext();
        if (!context || !context.session) {
          navigate(authPage);
          return null;
        }
        if (await rejectSuspended(context)) return null;
        if (
          !context.profile ||
          context.profile.status === "pending" ||
          !context.profile.onboarding_completed
        ) {
          navigate(`${authPage}?step=onboarding`);
          return null;
        }
        if (context.profile.status !== "active") {
          navigate(`${authPage}?error=inactive`);
          return null;
        }
        return context;
      }

      async function requireAdminAccess(requiredPermission) {
        const context = await supabaseApi.getSessionContext({
          verifyUser: true,
        });
        if (!context || !context.session) {
          navigate(`${authPage}?mode=admin`);
          return null;
        }
        if (await rejectSuspended(context)) return null;
        if (context.profile && context.profile.status !== "active") {
          navigate(`${authPage}?error=inactive`);
          return null;
        }
        if (context.role !== "admin" && context.role !== "super_admin") {
          navigate(errorUrl(403, "admin"));
          return null;
        }
        const assurance = await supabaseApi.getAuthenticatorAssuranceLevel();
        if (!assurance || assurance.currentLevel !== "aal2") {
          navigate(`${authPage}?mode=admin&mfa=1`);
          return null;
        }
        if (
          requiredPermission &&
          context.role !== "super_admin" &&
          !hasPermission(context, requiredPermission)
        ) {
          navigate(errorUrl(403, "admin"));
          return null;
        }
        return context;
      }

      async function signOutAndRedirect() {
        await supabaseApi.signOut();
        navigate(authPage);
      }

      return Object.freeze({
        isPreviewRequest,
        hasPermission,
        requireMainAccess,
        requireAdminAccess,
        signOutAndRedirect,
      });
    }

    return Object.freeze({ createAccessManager });
  },
);
