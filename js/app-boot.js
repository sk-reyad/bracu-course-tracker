(function exposeBootModule(root, factory) {
  const moduleApi = factory();
  if (typeof module === "object" && module.exports) module.exports = moduleApi;
  else
    root.BracuTrackerBoot = moduleApi.createTrackerBoot({
      accessManager: root.BracuAccess,
      previewManager: root.BracuPreview,
      storageManager: root.BracuStorage,
      supabaseApi: root.BracuSupabase,
      catalogApi: root.BracuCatalog,
      initializeApp: (payload) => root.initializeTrackerApp(payload),
    });
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildBootModule() {
    "use strict";

    function createTrackerBoot({
      accessManager,
      previewManager,
      storageManager,
      supabaseApi,
      catalogApi,
      initializeApp,
      setTimer = (callback, delay) => setTimeout(callback, delay),
      clearTimer = (timer) => clearTimeout(timer),
      syncDelay = 700,
    } = {}) {
      let context = null;
      let client = null;
      let syncTimer = null;
      let pendingState = null;

      async function readCloudState(userId) {
        const { data, error } = await client
          .from("course_tracker_data")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        return data && data.data ? data.data : null;
      }

      async function writeCloudState(state) {
        if (!context || context.preview || !client) return { skipped: true };
        const row = {
          user_id: context.user.id,
          user_email: context.user.email,
          data: state,
          updated_at: new Date().toISOString(),
        };
        const { error } = await client
          .from("course_tracker_data")
          .upsert(row, { onConflict: "user_id" });
        if (error) throw error;
        return { skipped: false };
      }

      function queueCloudSync(nextState) {
        if (!context || context.preview) return;
        pendingState = nextState;
        if (syncTimer) clearTimer(syncTimer);
        syncTimer = setTimer(async () => {
          const stateToWrite = pendingState;
          pendingState = null;
          syncTimer = null;
          try {
            await writeCloudState(stateToWrite);
          } catch (error) {
            if (typeof console !== "undefined" && console.warn)
              console.warn(
                "Cloud sync is temporarily unavailable; the local user copy is safe.",
                error,
              );
          }
        }, syncDelay);
      }

      async function start() {
        context = await accessManager.requireMainAccess();
        if (!context) return null;

        if (context.preview) {
          const previewState = previewManager.createSanitizedState();
          initializeApp({
            state: previewState,
            availableCatalogCourses: previewState.courses || [],
            context,
            queueCloudSync() {},
            syncNow: async () => ({ skipped: true }),
          });
          return Object.freeze({
            context,
            state: previewState,
            queueCloudSync() {},
            writeCloudState: async () => ({ skipped: true }),
          });
        }

        client = supabaseApi.getClient();
        let cloudState = null;
        try {
          cloudState = await readCloudState(context.user.id);
        } catch (error) {
          if (typeof console !== "undefined" && console.warn)
            console.warn(
              "Cloud data could not be loaded; using the local user copy.",
              error,
            );
        }
        storageManager.setActiveStorageUser?.(context.user.id);
        const trackerState = storageManager.loadUserState(context.user.id, {
          profile: context.profile,
          cloudState,
        });
        let availableCatalogCourses = trackerState.courses || [];
        if (catalogApi?.fetchGlobalCatalog) {
          try {
            const globalCatalog = await catalogApi.fetchGlobalCatalog(client);
            availableCatalogCourses = Array.isArray(globalCatalog?.courses)
              ? globalCatalog.courses
              : availableCatalogCourses;
            catalogApi.mergeGlobalCatalog?.(trackerState, globalCatalog);
            storageManager.saveUserState?.(context.user.id, trackerState);
          } catch (error) {
            if (typeof console !== "undefined" && console.warn)
              console.warn(
                "Global catalog could not be loaded; using the local user copy.",
                error,
              );
          }
        }
        initializeApp({
          state: trackerState,
          availableCatalogCourses,
          context,
          queueCloudSync,
          syncNow: writeCloudState,
        });
        return Object.freeze({
          context,
          state: trackerState,
          queueCloudSync,
          writeCloudState,
        });
      }

      return Object.freeze({ start });
    }

    return Object.freeze({ createTrackerBoot });
  },
);
