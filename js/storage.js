(function exposeStorageModule(root, factory) {
  const profileApi =
    typeof module === "object" && module.exports
      ? require("./profile.js")
      : root.BracuProfile;
  const moduleApi = factory(profileApi);
  if (typeof module === "object" && module.exports) {
    module.exports = moduleApi;
    return;
  }

  const manager = moduleApi.createStorageManager({
    defaultData: root.DEFAULT_DATA,
    storage: root.localStorage,
    normalizeCourseCode: root.normalizeCode,
  });
  root.BracuStorage = manager;
  Object.assign(root, manager);
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildStorageModule(profileApi) {
    "use strict";

    const LEGACY_STORAGE_KEY = "bracuCsCourseTracker.v1";
    const USER_STORAGE_PREFIX = "bracuCsCourseTracker.v2:";
    const THEME_STORAGE_KEY = "bracuCourseTracker.theme";
    const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
    const SAFE_IDENTIFIER = /^[A-Za-z0-9_-]{1,100}$/;
    const REMOVED_DEFAULT_COURSES = new Set([
      "GED101",
      "GED102",
      "GED103",
      "GED104",
      "GED105",
      "CSE-E1",
      "CSE-E2",
      "ELEC1",
      "ELEC2",
      "ELEC3",
      "ELEC4",
      "ELEC5",
      "ELEC6",
      "ELEC-CSE",
      "COD-SOCIAL",
      "COD-COMM1",
      "COD-HUM1",
      "COD-HUM2",
      "COD-HUM3",
      "COD-SOCBEH1",
    ]);

    function clone(value) {
      if (typeof structuredClone === "function") return structuredClone(value);
      return JSON.parse(JSON.stringify(value));
    }

    function createStorageManager({
      defaultData,
      storage,
      normalizeCourseCode,
      now = () => new Date(),
    } = {}) {
      const data = defaultData || {};
      const store = storage || {
        getItem() {
          return null;
        },
        setItem() {},
        removeItem() {},
      };
      const normalize =
        typeof normalizeCourseCode === "function"
          ? normalizeCourseCode
          : (value) =>
              String(value || "")
                .trim()
                .toUpperCase();
      let activeUserId = null;
      let activeProfile = null;
      let lastLoadResolution = Object.freeze({
        source: "fresh",
        shouldSync: false,
      });

      function resolveFacultyEdit({
        faculties = [],
        departments = [],
        facultyId = "",
        action = "cancel",
        draft = {},
      } = {}) {
        const currentFaculties = Array.isArray(faculties) ? faculties : [];
        const unchanged = clone(currentFaculties);
        if (action === "cancel") return { faculties: unchanged, cancelled: true };
        const current = currentFaculties.find((faculty) => faculty.id === facultyId);
        if (!current) return { faculties: unchanged, error: "Faculty not found" };

        const name = String(draft?.name || "").trim();
        const initial = String(draft?.initial || "")
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "");
        const email = String(draft?.email || "").trim();
        const department = String(draft?.department || "").trim();
        if (!name || !initial)
          return {
            faculties: unchanged,
            error: "Faculty name and initial are required",
          };
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return { faculties: unchanged, error: "Enter a valid faculty email" };
        if (!departments.some((item) => item?.id === department))
          return { faculties: unchanged, error: "Select an existing department" };
        const duplicate = currentFaculties.some(
          (faculty) =>
            faculty.id !== facultyId &&
            String(faculty.initial || "")
              .trim()
              .toUpperCase()
              .replace(/\s+/g, "") === initial,
        );
        if (duplicate)
          return { faculties: unchanged, error: "Faculty initial already exists" };

        return {
          faculties: currentFaculties.map((faculty) =>
            faculty.id === facultyId
              ? { ...faculty, name, initial, email, department }
              : clone(faculty),
          ),
          saved: true,
        };
      }

      function keyForUser(userId) {
        if (!userId || !String(userId).trim())
          throw new Error("A user id is required for tracker storage.");
        return `${USER_STORAGE_PREFIX}${String(userId).trim()}`;
      }

      function defaultSettings() {
        return {
          theme: store.getItem(THEME_STORAGE_KEY) || "light",
          autoCountHighestRetake: true,
          facultyCatalogVersion: Number(data.facultyCatalogVersion || 0),
          catalogTombstones: {},
          lastUpdated: now().toISOString(),
          cloudSync: { provider: "supabase" },
        };
      }

      function createInitialState() {
        return {
          profile: clone(data.defaultProfile || {}),
          courses: clone(data.courses || []),
          departments: clone(data.departments || []),
          gradeScale: clone(data.gradeScale || []),
          faculties: clone(data.defaultFaculties || []),
          semesters: clone(data.defaultSemesters || []),
          settings: defaultSettings(),
        };
      }

      function profileFromAuth(profile = {}) {
        return profileApi.normalizeCanonicalProfile(profile);
      }

      function createFreshAuthenticatedState(profile = {}) {
        const fresh = createInitialState();
        fresh.profile = { ...fresh.profile, ...profileFromAuth(profile) };
        fresh.semesters = [];
        return fresh;
      }

      function validateBackupState(input) {
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          throw new Error("Backup data must be an object.");
        }

        const collections = [
          ["courses", 1000],
          ["departments", 100],
          ["faculties", 2000],
          ["semesters", 100],
        ];
        collections.forEach(([name, maximum]) => {
          if (input[name] !== undefined && !Array.isArray(input[name])) {
            throw new Error(`Backup ${name} must be a list.`);
          }
          if ((input[name] || []).length > maximum) {
            throw new Error(`Backup contains too many ${name}.`);
          }
        });

        const assertIdentifier = (value, label) => {
          if (
            value !== undefined &&
            value !== null &&
            String(value) !== "" &&
            !SAFE_IDENTIFIER.test(String(value))
          ) {
            throw new Error(
              `Backup contains an unsafe identifier for ${label}.`,
            );
          }
        };
        (input.courses || []).forEach((course, index) =>
          assertIdentifier(course?.code, `course ${index + 1}`),
        );
        (input.departments || []).forEach((department, index) =>
          assertIdentifier(department?.id, `department ${index + 1}`),
        );
        (input.faculties || []).forEach((faculty, index) =>
          assertIdentifier(faculty?.id, `faculty ${index + 1}`),
        );
        (input.semesters || []).forEach((semester, semesterIndex) => {
          assertIdentifier(semester?.id, `semester ${semesterIndex + 1}`);
          if (
            semester?.courses !== undefined &&
            !Array.isArray(semester.courses)
          ) {
            throw new Error(
              `Backup courses for semester ${semesterIndex + 1} must be a list.`,
            );
          }
          if ((semester?.courses || []).length > 500) {
            throw new Error(
              `Backup contains too many attempts in semester ${semesterIndex + 1}.`,
            );
          }
          (semester?.courses || []).forEach((attempt, attemptIndex) => {
            assertIdentifier(attempt?.id, `attempt ${attemptIndex + 1}`);
            assertIdentifier(
              attempt?.code,
              `attempt course ${attemptIndex + 1}`,
            );
            assertIdentifier(
              attempt?.facultyId,
              `attempt faculty ${attemptIndex + 1}`,
            );
          });
        });
        return true;
      }

      function migrateState(input, { authenticatedProfile } = {}) {
        const fresh = createInitialState();
        const state = input && typeof input === "object" ? clone(input) : {};
        const previousFacultyCatalogVersion = Number(
          state.settings?.facultyCatalogVersion || 0,
        );
        const currentFacultyCatalogVersion = Number(
          data.facultyCatalogVersion || 0,
        );
        state.profile = { ...fresh.profile, ...(state.profile || {}) };
        if (authenticatedProfile)
          state.profile = {
            ...state.profile,
            ...profileFromAuth(authenticatedProfile),
          };
        delete state.profile.profilePhoto;
        state.settings = {
          ...fresh.settings,
          ...(state.settings || {}),
          autoCountHighestRetake: true,
        };
        state.settings.cloudSync = { provider: "supabase" };
        const catalogTombstones = state.settings.catalogTombstones;
        state.settings.catalogTombstones =
          catalogTombstones &&
          typeof catalogTombstones === "object" &&
          !Array.isArray(catalogTombstones)
            ? catalogTombstones
            : {};

        state.courses =
          Array.isArray(state.courses) && state.courses.length
            ? state.courses
            : fresh.courses;
        const defaultCourseMap = new Map(
          fresh.courses.map((course) => [normalize(course.code), course]),
        );
        state.courses = state.courses
          .filter(
            (course) =>
              course &&
              course.code &&
              !REMOVED_DEFAULT_COURSES.has(normalize(course.code)),
          )
          .map((course) => {
            const code = normalize(course.code);
            const defaultCourse = defaultCourseMap.get(code);
            const normalized = { ...course, code };
            if (Object.prototype.hasOwnProperty.call(course, "title"))
              normalized.title = course.title || course.code;
            if (Object.prototype.hasOwnProperty.call(course, "credits"))
              normalized.credits = Number(course.credits ?? 3);
            if (Object.prototype.hasOwnProperty.call(course, "hardPrerequisites"))
              normalized.hardPrerequisites = (course.hardPrerequisites || [])
                .map(normalize)
                .filter(
                  (value) => value && !REMOVED_DEFAULT_COURSES.has(value),
                );
            if (Object.prototype.hasOwnProperty.call(course, "softPrerequisites"))
              normalized.softPrerequisites = (course.softPrerequisites || [])
                .map(normalize)
                .filter(
                  (value) => value && !REMOVED_DEFAULT_COURSES.has(value),
                );
            if (Object.prototype.hasOwnProperty.call(course, "roadmapOrder"))
              normalized.roadmapOrder = Number(course.roadmapOrder || 99);
            if (Object.prototype.hasOwnProperty.call(course, "isRoadmapSlot"))
              normalized.isRoadmapSlot = Boolean(course.isRoadmapSlot);
            if (!defaultCourse) {
              if (!Object.prototype.hasOwnProperty.call(course, "title"))
                normalized.title = code;
              if (!Object.prototype.hasOwnProperty.call(course, "credits"))
                normalized.credits = 3;
              if (!Object.prototype.hasOwnProperty.call(course, "hardPrerequisites"))
                normalized.hardPrerequisites = [];
              if (!Object.prototype.hasOwnProperty.call(course, "softPrerequisites"))
                normalized.softPrerequisites = [];
              if (!Object.prototype.hasOwnProperty.call(course, "roadmapOrder"))
                normalized.roadmapOrder = 99;
              if (!Object.prototype.hasOwnProperty.call(course, "isRoadmapSlot"))
                normalized.isRoadmapSlot = false;
            }
            return defaultCourse
              ? { ...clone(defaultCourse), ...normalized }
              : normalized;
          });
        fresh.courses.forEach((defaultCourse) => {
          if (
            !state.courses.some((course) => course.code === defaultCourse.code)
          )
            state.courses.push(clone(defaultCourse));
        });

        state.departments =
          Array.isArray(state.departments) && state.departments.length
            ? state.departments
            : fresh.departments;
        // BRAC University uses one published scale. Older local/cloud backups may
        // contain editable UI values, so always restore the canonical data here.
        state.gradeScale = clone(fresh.gradeScale);
        state.faculties = Array.isArray(state.faculties)
          ? state.faculties
          : fresh.faculties;
        state.faculties = state.faculties.map((faculty) => ({
          department: "CSE",
          ...faculty,
        }));
        if (previousFacultyCatalogVersion < currentFacultyCatalogVersion) {
          const existingInitials = new Set(
            state.faculties
              .map((faculty) => String(faculty.initial || "").trim().toUpperCase())
              .filter(Boolean),
          );
          fresh.faculties.forEach((faculty) => {
            const initial = String(faculty.initial || "").trim().toUpperCase();
            if (!initial || existingInitials.has(initial)) return;
            state.faculties.push(clone(faculty));
            existingInitials.add(initial);
          });
        }
        state.settings.facultyCatalogVersion = Math.max(
          previousFacultyCatalogVersion,
          currentFacultyCatalogVersion,
        );
        state.semesters = Array.isArray(state.semesters)
          ? state.semesters
          : fresh.semesters;
        state.semesters = state.semesters.map((semester, index) => ({
          ...semester,
          number: semester.number || index + 1,
          courses: (semester.courses || [])
            .filter(
              (attempt) =>
                attempt &&
                attempt.code &&
                !REMOVED_DEFAULT_COURSES.has(normalize(attempt.code)),
            )
            .map((attempt) => ({
              repeatType: attempt.repeatType || "",
              countsInCGPA:
                attempt.status === "completed"
                  ? attempt.countsInCGPA !== false
                  : false,
              ...attempt,
              code: normalize(attempt.code),
            })),
        }));
        return state;
      }

      function parseStored(key) {
        const stored = store.getItem(key);
        if (!stored) return null;
        try {
          return JSON.parse(stored);
        } catch (error) {
          if (typeof console !== "undefined" && console.warn)
            console.warn(`Could not parse tracker data at ${key}.`, error);
          return null;
        }
      }

      function findLegacyMigrationCandidate(email) {
        const normalizedEmail = String(email || "")
          .trim()
          .toLowerCase();
        if (!normalizedEmail) return null;
        const legacy = parseStored(LEGACY_STORAGE_KEY);
        const legacyEmail = String(
          (legacy && legacy.profile && legacy.profile.email) || "",
        )
          .trim()
          .toLowerCase();
        return legacy && legacyEmail === normalizedEmail
          ? migrateState(legacy)
          : null;
      }

      function hasAcademicHistory(state) {
        return Boolean(
          state &&
            Array.isArray(state.semesters) &&
            state.semesters.length > 0,
        );
      }

      function lastUpdatedTime(state) {
        const value = Date.parse(state?.settings?.lastUpdated || "");
        return Number.isFinite(value) ? value : 0;
      }

      function resolveAuthenticatedSource({ local, legacy, cloudState, profile }) {
        const deviceState = local || legacy;
        const deviceSource = local ? "local" : legacy ? "legacy" : "";
        if (deviceState && cloudState) {
          const deviceHasHistory = hasAcademicHistory(deviceState);
          const cloudHasHistory = hasAcademicHistory(cloudState);
          if (deviceHasHistory && !cloudHasHistory) {
            return { state: deviceState, source: deviceSource, shouldSync: true };
          }
          if (cloudHasHistory && !deviceHasHistory) {
            return { state: cloudState, source: "cloud", shouldSync: false };
          }
          if (
            deviceHasHistory &&
            cloudHasHistory &&
            lastUpdatedTime(deviceState) > lastUpdatedTime(cloudState)
          ) {
            return { state: deviceState, source: deviceSource, shouldSync: true };
          }
          return { state: cloudState, source: "cloud", shouldSync: false };
        }
        if (cloudState) {
          return { state: cloudState, source: "cloud", shouldSync: false };
        }
        if (deviceState) {
          return { state: deviceState, source: deviceSource, shouldSync: true };
        }
        return {
          state: createFreshAuthenticatedState(profile),
          source: "fresh",
          shouldSync: false,
        };
      }

      function saveUserState(userId, state) {
        const next = state;
        next.settings = {
          ...(next.settings || {}),
          lastUpdated: now().toISOString(),
          cloudSync: { provider: "supabase" },
        };
        store.setItem(keyForUser(userId), JSON.stringify(next));
        return next;
      }

      function loadUserState(userId, { profile = {}, cloudState = null } = {}) {
        activeProfile = profile;
        const key = keyForUser(userId);
        const local = parseStored(key);
        const legacy = !local
          ? findLegacyMigrationCandidate(profile.email)
          : null;
        const resolution = resolveAuthenticatedSource({
          local,
          legacy,
          cloudState,
          profile,
        });
        const source = resolution.state;
        lastLoadResolution = Object.freeze({
          source: resolution.source,
          shouldSync: resolution.shouldSync,
        });
        const sourceFacultyCatalogVersion = Number(
          source?.settings?.facultyCatalogVersion || 0,
        );
        const next = migrateState(source, { authenticatedProfile: profile });
        const facultyCatalogWasUpgraded =
          Number(next.settings?.facultyCatalogVersion || 0) >
          sourceFacultyCatalogVersion;
        if (
          cloudState ||
          legacy ||
          (!local && !cloudState) ||
          facultyCatalogWasUpgraded
        )
          saveUserState(userId, next);
        return next;
      }

      function getLastLoadResolution() {
        return lastLoadResolution;
      }

      function setActiveStorageUser(userId) {
        activeUserId = userId || null;
      }

      function loadState() {
        if (activeUserId) return loadUserState(activeUserId);
        const legacy = parseStored(LEGACY_STORAGE_KEY);
        return legacy ? migrateState(legacy) : createInitialState();
      }

      function saveState(state) {
        if (!activeUserId)
          throw new Error("Tracker storage requires an authenticated user.");
        return saveUserState(activeUserId, state);
      }

      function resetState() {
        if (!activeUserId)
          throw new Error("Tracker storage requires an authenticated user.");
        store.removeItem(keyForUser(activeUserId));
        return createFreshAuthenticatedState(activeProfile || {});
      }

      function exportState(state) {
        const blob = new Blob([JSON.stringify(state, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `bracu-course-tracker-backup-${now().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      }

      function importStateFile(file) {
        return new Promise((resolve, reject) => {
          if (!file || Number(file.size || 0) > MAX_BACKUP_BYTES) {
            reject(new Error("Backup file must be 2 MB or smaller."));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(reader.result);
              validateBackupState(parsed);
              resolve(migrateState(parsed));
            } catch (_error) {
              reject(new Error("Invalid JSON backup file."));
            }
          };
          reader.onerror = () =>
            reject(new Error("Could not read backup file."));
          reader.readAsText(file);
        });
      }

      return Object.freeze({
        LEGACY_STORAGE_KEY,
        USER_STORAGE_PREFIX,
        THEME_STORAGE_KEY,
        keyForUser,
        createInitialState,
        createFreshAuthenticatedState,
        validateBackupState,
        resolveFacultyEdit,
        migrateState,
        findLegacyMigrationCandidate,
        loadUserState,
        getLastLoadResolution,
        saveUserState,
        setActiveStorageUser,
        loadState,
        saveState,
        resetState,
        exportState,
        importStateFile,
      });
    }

    return Object.freeze({ createStorageManager });
  },
);
