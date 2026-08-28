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

    function catalogFingerprint(state) {
      return JSON.stringify({
        courses: Array.isArray(state?.courses) ? state.courses : [],
        departments: Array.isArray(state?.departments) ? state.departments : [],
        faculties: Array.isArray(state?.faculties) ? state.faculties : [],
        catalogTombstones: state?.settings?.catalogTombstones || null,
      });
    }

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
      let pendingOptions = null;
      let cloudRevision = 0;
      let writeChain = Promise.resolve();

      async function readCloudState(userId) {
        const { data, error } = await client
          .from("course_tracker_data")
          .select("data, revision, updated_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        if (!data || !data.data) return null;
        return {
          data: data.data,
          revision: Number(data.revision || 0),
          updatedAt: data.updated_at || null,
        };
      }

      function normalizeSyncError(error) {
        const message = String(error?.message || "");
        if (error?.code === "40001" || message.includes("tracker_revision_conflict")) {
          const conflict = new Error(
            "Your tracker changed on another device. Your local copy is preserved; reload before syncing again.",
          );
          conflict.code = "SYNC_CONFLICT";
          return conflict;
        }
        if (message.includes("tracker_blank_overwrite_blocked")) {
          const blocked = new Error(
            "A blank tracker cannot replace your existing course history without an explicit reset.",
          );
          blocked.code = "SYNC_BLANK_BLOCKED";
          return blocked;
        }
        return error;
      }

      async function writeCloudState(state, { allowDestructive = false } = {}) {
        if (!context || context.preview || !client) return { skipped: true };
        storageManager.markSyncPending?.(context.user.id, cloudRevision);
        const { data, error } = await client.rpc("save_course_tracker_state", {
          p_expected_revision: cloudRevision,
          p_data: state,
          p_allow_destructive: Boolean(allowDestructive),
        });
        if (error) throw normalizeSyncError(error);
        const result = Array.isArray(data) ? data[0] : data;
        const newRevision = Number(result?.new_revision);
        if (!Number.isSafeInteger(newRevision) || newRevision < 1)
          throw new Error("Cloud sync returned an invalid revision.");
        cloudRevision = newRevision;
        storageManager.markSyncComplete?.(context.user.id, cloudRevision);
        return {
          skipped: false,
          revision: cloudRevision,
          savedAt: result?.saved_at || null,
        };
      }

      function runSerializedWrite(state, options = {}) {
        const write = writeChain
          .catch(() => undefined)
          .then(() => writeCloudState(state, options));
        writeChain = write;
        return write;
      }

      function syncNow(state, options = {}) {
        if (syncTimer) clearTimer(syncTimer);
        syncTimer = null;
        pendingState = null;
        pendingOptions = null;
        return runSerializedWrite(state, options);
      }

      function queueCloudSync(nextState, options = {}) {
        if (!context || context.preview) return;
        pendingState = nextState;
        pendingOptions = options;
        storageManager.markSyncPending?.(context.user.id, cloudRevision);
        if (syncTimer) clearTimer(syncTimer);
        syncTimer = setTimer(async () => {
          const stateToWrite = pendingState;
          const optionsForWrite = pendingOptions;
          pendingState = null;
          pendingOptions = null;
          syncTimer = null;
          try {
            await runSerializedWrite(stateToWrite, optionsForWrite);
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
        let cloudRecord = null;
        let cloudReadFailed = false;
        try {
          cloudRecord = await readCloudState(context.user.id);
        } catch (error) {
          cloudReadFailed = true;
          if (typeof console !== "undefined" && console.warn)
            console.warn(
              "Cloud data could not be loaded; using the local user copy.",
              error,
            );
        }
        storageManager.setActiveStorageUser?.(context.user.id);
        cloudRevision = Number(cloudRecord?.revision || 0);
        const trackerState = storageManager.loadUserState(context.user.id, {
          profile: context.profile,
          cloudRecord,
        });
        const loadResolution = storageManager.getLastLoadResolution?.();
        let availableCatalogCourses = trackerState.courses || [];
        let catalogChanged = false;
        if (catalogApi?.fetchGlobalCatalog) {
          try {
            const globalCatalog = await catalogApi.fetchGlobalCatalog(client);
            availableCatalogCourses = Array.isArray(globalCatalog?.courses)
              ? globalCatalog.courses
              : availableCatalogCourses;
            const catalogBeforeMerge = catalogFingerprint(trackerState);
            catalogApi.mergeGlobalCatalog?.(trackerState, globalCatalog);
            catalogChanged =
              catalogBeforeMerge !== catalogFingerprint(trackerState);
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
          syncNow,
          syncConflict: Boolean(loadResolution?.conflict),
        });
        if (
          !cloudReadFailed &&
          !loadResolution?.conflict &&
          (loadResolution?.shouldSync || catalogChanged)
        )
          queueCloudSync(trackerState);
        return Object.freeze({
          context,
          state: trackerState,
          queueCloudSync,
          writeCloudState: syncNow,
        });
      }

      return Object.freeze({ start });
    }

    return Object.freeze({ createTrackerBoot });
  },
);
