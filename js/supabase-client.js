(function exposeSupabaseModule(root, factory) {
  const moduleApi = factory();
  if (typeof module === "object" && module.exports) module.exports = moduleApi;
  else
    root.BracuSupabase = moduleApi.createSupabaseApi({
      config: root.BRACU_CONFIG,
      sdk: root.supabase,
    });
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildSupabaseModule() {
    "use strict";

    function decodeJwtPayload(token) {
      if (!token || typeof token !== "string") return {};
      try {
        const value = token.split(".")[1];
        if (!value) return {};
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const json =
          typeof atob === "function"
            ? decodeURIComponent(
                Array.from(
                  atob(normalized),
                  (char) =>
                    `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
                ).join(""),
              )
            : Buffer.from(normalized, "base64url").toString("utf8");
        return JSON.parse(json);
      } catch (_error) {
        return {};
      }
    }

    function createSupabaseApi({ config = {}, sdk } = {}) {
      let client = null;
      let recordedAccessToken = "";

      function getClient() {
        if (client) return client;
        if (
          !config.supabaseUrl ||
          !config.supabasePublishableKey ||
          !sdk ||
          typeof sdk.createClient !== "function"
        ) {
          throw new Error("Supabase public configuration is incomplete.");
        }
        client = sdk.createClient(
          config.supabaseUrl,
          config.supabasePublishableKey,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
            },
          },
        );
        return client;
      }

      async function recordLoginEvent(current, session) {
        const accessToken = session && session.access_token;
        if (
          !accessToken ||
          recordedAccessToken === accessToken ||
          typeof current.rpc !== "function"
        )
          return;
        recordedAccessToken = accessToken;
        try {
          await current.rpc("record_login_event");
        } catch (_error) {
          // Login analytics must never block access to the application.
        }
      }

      async function getSessionContext({ verifyUser = false } = {}) {
        const current = getClient();
        const { data: sessionData, error: sessionError } =
          await current.auth.getSession();
        if (sessionError) throw sessionError;
        const session = sessionData && sessionData.session;
        if (!session)
          return {
            session: null,
            user: null,
            profile: null,
            role: null,
            permissions: [],
          };

        // Login analytics is best-effort and must never delay authentication.
        void recordLoginEvent(current, session);

        let user = session.user;
        if (verifyUser) {
          const { data: userData, error: userError } =
            await current.auth.getUser();
          if (userError) throw userError;
          user = userData.user;
        }

        const { data: profile, error: profileError } = await current
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        const claims = decodeJwtPayload(session.access_token);
        return {
          session,
          user,
          profile,
          role:
            claims.app_role ||
            (user.app_metadata && user.app_metadata.app_role) ||
            "student",
          permissions: Array.isArray(claims.app_permissions)
            ? claims.app_permissions
            : [],
          status: profile ? profile.status : claims.account_status,
        };
      }

      async function signOut() {
        if (!client) return;
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }

      async function getAuthenticatorAssuranceLevel() {
        const current = getClient();
        const { data, error } =
          await current.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;
        return data;
      }

      return Object.freeze({
        getClient,
        getSessionContext,
        getAuthenticatorAssuranceLevel,
        signOut,
        decodeJwtPayload,
      });
    }

    return Object.freeze({ createSupabaseApi, decodeJwtPayload });
  },
);
