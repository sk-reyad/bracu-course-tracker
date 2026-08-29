(function exposeCatalogModule(root, factory) {
  const moduleApi = factory();
  if (typeof module === "object" && module.exports) module.exports = moduleApi;
  else root.BracuCatalog = moduleApi;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildCatalogModule() {
    "use strict";

    const KIND_ALIASES = {
      course: "courses",
      courses: "courses",
      department: "departments",
      departments: "departments",
      faculty: "faculties",
      faculties: "faculties",
    };
    const IDENTITY_FIELDS = {
      courses: "code",
      departments: "id",
      faculties: "initial",
    };
    const PUBLIC_COLUMNS = {
      departments: "id, name, color",
      courses:
        "code, title, credits, department, category, visibility, roadmap_level, roadmap_order, hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot",
      faculties: "initial, name, email, department",
    };
    const CATEGORY_LABELS = Object.freeze({
      "stream-1-writing": "Stream 1: Writing Comprehension",
      "stream-2-math-and-natural-sciences":
        "Stream 2: Math and Natural Sciences",
      "stream-3-arts-and-humanities": "Stream 3: Arts and Humanities",
      "stream-4-social-sciences": "Stream 4: Social Sciences",
      "stream-5-communities-seeking-transformation":
        "Stream 5: Communities Seeking Transformation",
      "school-core": "School Core",
      "program-core": "Program Core",
      "program-elective": "Program Elective",
      "general-elective": "General Elective",
      gened: "GenEd",
      "non-credit": "Non-credit",
      capstone: "Project / Internship / Thesis",
    });
    const CURRICULUM_FIELDS = Object.freeze([
      Object.freeze({ id: "stream-1", label: "Stream 1: Writing Comprehension", categories: ["stream-1-writing"] }),
      Object.freeze({ id: "stream-2", label: "Stream 2: Math and Natural Sciences", categories: ["stream-2-math-and-natural-sciences"] }),
      Object.freeze({ id: "stream-3", label: "Stream 3: Arts and Humanities", categories: ["stream-3-arts-and-humanities"] }),
      Object.freeze({ id: "stream-4", label: "Stream 4: Social Sciences", categories: ["stream-4-social-sciences"] }),
      Object.freeze({ id: "stream-5", label: "Stream 5: Communities, Seeking Transformation", categories: ["stream-5-communities-seeking-transformation"] }),
      Object.freeze({ id: "gened-electives", label: "GenEd Electives", categories: ["gened", "general-elective"] }),
      Object.freeze({ id: "school-core", label: "School Core", categories: ["school-core"] }),
      Object.freeze({ id: "program-core", label: "Program Core", categories: ["program-core"] }),
      Object.freeze({ id: "program-elective", label: "Program Elective", categories: ["program-elective"] }),
      Object.freeze({ id: "project", label: "Project / Internship / Thesis", categories: ["capstone", "thesis-project"] }),
    ]);
    const ALTERNATIVE_EQUIVALENCES = Object.freeze({
      CSE110: Object.freeze([
        Object.freeze(["CSE161", "CSE162L"]),
        Object.freeze(["EEE103", "EEE103L"]),
        Object.freeze(["ECE103", "ECE103L"]),
      ]),
      CSE260: Object.freeze([
        Object.freeze(["EEE283", "EEE283L"]),
        Object.freeze(["ECE283", "ECE283L"]),
        Object.freeze(["EEE301", "EEE302"]),
      ]),
    });

    function canonicalKind(kind) {
      return KIND_ALIASES[String(kind || "").trim().toLowerCase()] || "";
    }

    function normalizeCatalogKey(kind, item) {
      const collection = canonicalKind(kind);
      const field = IDENTITY_FIELDS[collection];
      if (!field) return "";
      const value = item && typeof item === "object" ? item[field] : item;
      return String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
    }

    function filterCatalogItems(kind, items, filters = {}) {
      const collection = canonicalKind(kind);
      const rows = Array.isArray(items) ? items : [];
      const query = String(filters.query || "").trim().toLowerCase();
      const department = String(filters.department || "").trim().toUpperCase();
      const category = String(filters.category || "").trim().toLowerCase();
      const visibility = String(filters.visibility || "").trim().toLowerCase();
      const preserveValue = String(filters.preserveKey || "").trim();
      const preserveKey = normalizeCatalogKey(collection, preserveValue);
      const searchFields = {
        departments: ["id", "name"],
        courses: ["code", "title"],
        faculties: ["initial", "name", "email"],
      }[collection];
      if (!searchFields) return [];

      return rows.filter((item) => {
        if (
          preserveValue &&
          (String(item?.id || "") === preserveValue ||
            normalizeCatalogKey(collection, item) === preserveKey)
        ) {
          return true;
        }
        if (
          department &&
          department !== "ALL" &&
          String(item?.department || "").trim().toUpperCase() !== department
        ) {
          return false;
        }
        if (
          collection === "courses" &&
          category &&
          category !== "ALL" &&
          String(item?.category || "").trim().toLowerCase() !== category
        ) {
          return false;
        }
        if (
          collection === "courses" &&
          visibility &&
          visibility !== "all" &&
          String(item?.visibility || "curriculum").trim().toLowerCase() !==
            visibility
        ) {
          return false;
        }
        if (!query) return true;
        return searchFields.some((field) =>
          String(item?.[field] || "").toLowerCase().includes(query),
        );
      });
    }

    function partitionCatalogCourses(items) {
      const all = Array.isArray(items) ? items.filter(Boolean) : [];
      const searchOnly = all.filter(
        (course) => String(course?.visibility || "curriculum").toLowerCase() === "search_only",
      );
      const alternatives = all.filter(
        (course) => String(course?.visibility || "curriculum").toLowerCase() === "alternative",
      );
      const curriculum = all.filter(
        (course) => !["search_only", "alternative"].includes(
          String(course?.visibility || "curriculum").toLowerCase(),
        ),
      );
      return Object.freeze({ all, curriculum, searchOnly, alternatives, addable: all });
    }

    function curriculumFieldOptions() {
      return CURRICULUM_FIELDS.map((field) => ({
        id: field.id,
        label: field.label,
        categories: [...field.categories],
      }));
    }

    function curriculumFieldForCategory(category) {
      const slug = slugifyCategoryLabel(category);
      return CURRICULUM_FIELDS.find((field) => field.categories.includes(slug))?.id || "";
    }

    function matchesCurriculumField(category, fieldId) {
      if (!fieldId || fieldId === "all") return true;
      return curriculumFieldForCategory(category) === fieldId;
    }

    function isAlternativeCourseCode(code) {
      const normalizedCode = normalizeCatalogKey("courses", code);
      return Object.values(ALTERNATIVE_EQUIVALENCES).some((groups) =>
        groups.some((group) => group.includes(normalizedCode)),
      );
    }

    function departmentDisplayId(id) {
      const normalizedId = normalizeCatalogKey("departments", id);
      return normalizedId === "GENED" ? "GenEd" : normalizedId;
    }

    function resolveAlternativeReplacement(state, canonicalCode) {
      const groups = ALTERNATIVE_EQUIVALENCES[normalizeCatalogKey("courses", canonicalCode)] || [];
      const attempts = (Array.isArray(state?.semesters) ? state.semesters : [])
        .flatMap((semester) => Array.isArray(semester?.courses) ? semester.courses : [])
        .filter(Boolean);
      const attemptsByCode = new Map();
      attempts.forEach((attempt, index) => {
        const code = normalizeCatalogKey("courses", attempt);
        if (!attemptsByCode.has(code)) attemptsByCode.set(code, []);
        attemptsByCode.get(code).push({ attempt, index });
      });
      const candidates = groups
        .map((codes) => {
          const entries = codes.flatMap((code) => attemptsByCode.get(code) || []);
          if (!entries.length) return null;
          const matchedAttempts = entries.map((entry) => entry.attempt);
          const completedCodes = codes.filter((code) =>
            (attemptsByCode.get(code) || []).some(
              ({ attempt }) =>
                attempt.status === "completed" && attempt.countsInCGPA !== false,
            ),
          );
          const satisfied = completedCodes.length === codes.length;
          const status = satisfied
            ? "completed"
            : matchedAttempts.some((attempt) => attempt.status === "current") ||
                completedCodes.length
              ? "current"
              : matchedAttempts.some((attempt) => attempt.status === "planned")
                ? "planned"
                : "not-started";
          return {
            codes,
            matchedAttempts,
            completedCodes,
            satisfied,
            status,
            latestIndex: Math.max(...entries.map((entry) => entry.index)),
          };
        })
        .filter(Boolean)
        .sort((left, right) =>
          Number(right.satisfied) - Number(left.satisfied) ||
          right.completedCodes.length - left.completedCodes.length ||
          ({ completed: 4, current: 3, planned: 2, "not-started": 1 }[right.status] || 0) -
            ({ completed: 4, current: 3, planned: 2, "not-started": 1 }[left.status] || 0) ||
          right.latestIndex - left.latestIndex,
        );
      const selected = candidates[0];
      if (!selected) return null;
      return Object.freeze({
        canonicalCode: normalizeCatalogKey("courses", canonicalCode),
        codes: [...selected.codes],
        attempts: selected.matchedAttempts,
        completedCount: selected.completedCodes.length,
        satisfied: selected.satisfied,
        status: selected.status,
      });
    }

    function searchCatalogCourses(items, filters = {}) {
      return filterCatalogItems("course", items, filters).sort((left, right) =>
        String(left?.code || "").localeCompare(String(right?.code || ""), undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      );
    }

    function addCatalogCourse(state, source, options = {}) {
      if (!state || typeof state !== "object")
        return { added: false, error: "Course data is unavailable." };
      if (!Array.isArray(state.courses)) state.courses = [];
      const code = normalizeCatalogKey("course", source);
      if (!code) return { added: false, error: "Course code is required." };
      if (
        state.courses.some(
          (course) => normalizeCatalogKey("course", course) === code,
        )
      ) {
        return { added: false, error: `${code} is already in your Course List.` };
      }

      const sourceCredits = source?.credits;
      const creditValue =
        sourceCredits === null || sourceCredits === undefined || sourceCredits === ""
          ? options.credits
          : sourceCredits;
      const credits = Number(creditValue);
      if (
        creditValue === null ||
        creditValue === undefined ||
        creditValue === "" ||
        !Number.isFinite(credits) ||
        credits < 0 ||
        credits > 20
      ) {
        return {
          added: false,
          error: "Enter valid course credits before adding this course.",
        };
      }

      const course = {
        ...normalizeServerRow("courses", source || {}),
        code,
        credits,
      };
      course.catalogVisibility = String(source?.visibility || "curriculum")
        .trim()
        .toLowerCase();
      delete course.visibility;
      delete course.catalogOrigin;
      delete course.catalogKey;
      delete course.catalogOverridden;
      state.courses.push(course);
      return { added: true, course };
    }

    function slugifyCategoryLabel(value) {
      return (
        String(value || "")
          .trim()
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[’']/g, "")
          .replace(/&/g, " and ")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50)
          .replace(/-+$/g, "") || ""
      );
    }

    function categoryDisplayLabel(value) {
      const slug = slugifyCategoryLabel(value);
      if (!slug) return "Uncategorized";
      if (CATEGORY_LABELS[slug]) return CATEGORY_LABELS[slug];
      const acronyms = new Set(["cse", "eee", "ece", "mps", "bba", "cst"]);
      return slug
        .split("-")
        .filter(Boolean)
        .map((word) =>
          acronyms.has(word)
            ? word.toUpperCase()
            : `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
        )
        .join(" ")
        .replace(/\bAnd\b/g, "and");
    }

    async function functionErrorMessage(error, data, fallback = "Request failed.") {
      if (data?.error) return String(data.error);
      const response = error?.context;
      if (response && typeof response.json === "function") {
        try {
          const body = await response.json();
          if (body?.error) return String(body.error);
        } catch (_) {
          // Fall through to the SDK message when the body is unavailable.
        }
      }
      return String(error?.message || fallback);
    }

    function createFacultyEditDraft(item = {}) {
      const editableFields = new Set(["name", "email", "initial", "department"]);
      const value = { ...item };
      return Object.freeze({
        update(field, nextValue) {
          if (!editableFields.has(field))
            throw new Error("That faculty field cannot be edited.");
          value[field] = nextValue;
        },
        snapshot() {
          return { ...value };
        },
      });
    }

    function tombstoneSet(settings, collection) {
      const existing = settings.catalogTombstones;
      if (!existing || typeof existing !== "object" || Array.isArray(existing))
        settings.catalogTombstones = {};
      if (!Array.isArray(settings.catalogTombstones[collection])) {
        const legacy = settings.catalogTombstones[collection];
        settings.catalogTombstones[collection] =
          legacy && typeof legacy === "object"
            ? Object.keys(legacy)
                .filter((key) => legacy[key] === true)
                .map((key) => normalizeCatalogKey(collection, key))
            : [];
      }
      return settings.catalogTombstones[collection];
    }

    function hasTombstone(settings, collection, key) {
      const tombstones = settings?.catalogTombstones;
      if (!tombstones || typeof tombstones !== "object") return false;
      const values = tombstones[collection];
      if (Array.isArray(values))
        return values.some(
          (value) => normalizeCatalogKey(collection, value) === key,
        );
      if (values && typeof values === "object")
        return Object.keys(values).some(
          (value) =>
            normalizeCatalogKey(collection, value) === key && values[value] === true,
        );
      return false;
    }

    function clearLegacyCourseTombstones(settings) {
      const tombstones = settings?.catalogTombstones;
      if (
        !tombstones ||
        typeof tombstones !== "object" ||
        Array.isArray(tombstones) ||
        !Object.prototype.hasOwnProperty.call(tombstones, "courses")
      ) {
        return;
      }
      delete tombstones.courses;
      if (Object.keys(tombstones).length === 0) delete settings.catalogTombstones;
    }

    function mergeGlobalCatalog(state, catalog = {}) {
      if (!state || typeof state !== "object") return state;
      if (!state.settings || typeof state.settings !== "object") state.settings = {};
      // Curriculum courses are shared reference data. Older account snapshots could
      // permanently hide one with a per-user tombstone, producing different course
      // lists for different users. Repair those snapshots during every catalog merge.
      clearLegacyCourseTombstones(state.settings);

      const coursePartitions = partitionCatalogCourses(catalog.courses);
      const searchOnlyCourseKeys = new Set(
        coursePartitions.searchOnly.map((course) =>
          normalizeCatalogKey("courses", course),
        ),
      );
      const referencedCourseKeys = new Set(
        [
          ...(Array.isArray(state.courses) ? state.courses : []),
          ...(Array.isArray(state.semesters)
            ? state.semesters.flatMap((semester) =>
                Array.isArray(semester?.courses) ? semester.courses : [],
              )
            : []),
        ].map((course) => normalizeCatalogKey("courses", course)),
      );
      const retainedAlternatives = coursePartitions.alternatives.filter((course) =>
        referencedCourseKeys.has(normalizeCatalogKey("courses", course)),
      );

      for (const collection of Object.keys(IDENTITY_FIELDS)) {
        const sourceRows =
          (collection === "courses"
            ? [...coursePartitions.curriculum, ...retainedAlternatives]
            : catalog[collection]) ||
          (collection === "faculties" ? catalog.faculty : undefined);
        const rows = Array.isArray(sourceRows) ? sourceRows : [];
        if (!Array.isArray(state[collection])) state[collection] = [];
        state[collection] = state[collection].filter((item) => {
          const key = normalizeCatalogKey(collection, item);
          if (
            item?.catalogOrigin === "global" &&
            item?.catalogOverridden !== true &&
            collection === "courses" &&
            searchOnlyCourseKeys.has(key)
          ) {
            return false;
          }
          return !(
            item?.catalogOrigin === "global" &&
            hasTombstone(state.settings, collection, key)
          );
        });
        for (const row of rows) {
          if (!row || typeof row !== "object") continue;
          const key = normalizeCatalogKey(collection, row);
          if (!key || hasTombstone(state.settings, collection, key))
            continue;
          const field = IDENTITY_FIELDS[collection];
          const existingIndex = state[collection].findIndex(
            (item) => normalizeCatalogKey(collection, item) === key,
          );
          if (existingIndex >= 0) {
            const existing = state[collection][existingIndex];
            if (
              collection === "courses" &&
              String(row?.visibility || "curriculum").toLowerCase() === "alternative" &&
              existing?.catalogOrigin !== "global"
            ) {
              // Preserve every user-owned course field while adopting the shared
              // visibility classification used by Course List and Add Courses.
              existing.catalogVisibility = "alternative";
            }
            if (
              existing?.catalogOrigin === "global" &&
              existing?.catalogOverridden !== true &&
              normalizeCatalogKey(collection, existing.catalogKey || existing) === key
            ) {
              const localIdentity =
                collection === "faculties" && existing.id
                  ? { id: existing.id }
                  : {};
              state[collection][existingIndex] = {
                ...normalizeServerRow(collection, row),
                ...localIdentity,
                [field]: key,
                catalogOrigin: "global",
                catalogKey: key,
              };
            }
            continue;
          }
          const localIdentity =
            collection === "faculties"
              ? { id: row.id || `catalog-faculty-${key.toLowerCase()}` }
              : {};
          state[collection].push({
            ...normalizeServerRow(collection, row),
            ...localIdentity,
            [field]: key,
            catalogOrigin: "global",
            catalogKey: key,
          });
        }
      }
      return state;
    }

    function prepareCatalogEdit(kind, original, edited) {
      const item = { ...(edited || {}) };
      const collection = canonicalKind(kind);
      if (original?.catalogOrigin !== "global" || !collection)
        return { item };
      const originalKey = normalizeCatalogKey(
        collection,
        original.catalogKey || original,
      );
      const editedKey = normalizeCatalogKey(collection, item);
      if (!originalKey || !editedKey || originalKey !== editedKey) {
        delete item.catalogOrigin;
        item.catalogKey = originalKey;
        item.catalogOverridden = true;
        return { item, catalogTombstoneKey: originalKey || undefined };
      }
      item.catalogOrigin = "global";
      item.catalogKey = originalKey;
      item.catalogOverridden = true;
      return { item };
    }

    function markCatalogDeleted(state, kind, item) {
      if (!state || typeof state !== "object") return state;
      const collection = canonicalKind(kind);
      const key = normalizeCatalogKey(collection, item?.catalogKey || item);
      if (!collection || !key || item?.catalogOrigin !== "global") return state;
      // Global courses are canonical and must remain discoverable for every account.
      // Search-only courses are copied as user-owned rows when added, so they do not
      // need a global course tombstone either.
      if (collection === "courses") return state;
      if (!state.settings || typeof state.settings !== "object") state.settings = {};
      const values = tombstoneSet(state.settings, collection);
      if (!values.includes(key)) values.push(key);
      return state;
    }

    async function fetchGlobalCatalog(client, { tables = {} } = {}) {
      if (!client || typeof client.from !== "function")
        throw new Error("A Supabase client is required to read the catalog.");
      const tableNames = {
        departments: tables.departments || "catalog_departments",
        courses: tables.courses || "catalog_courses",
        faculties: tables.faculties || "catalog_faculties",
      };
      const result = await Promise.all(
        Object.entries(tableNames).map(async ([collection, table]) => {
          const response = await client
            .from(table)
            .select(PUBLIC_COLUMNS[collection]);
          if (response?.error) throw response.error;
          return [
            collection,
            Array.isArray(response?.data)
              ? response.data.map((row) => normalizeServerRow(collection, row))
              : [],
          ];
        }),
      );
      return Object.fromEntries(result);
    }

    function normalizeServerRow(collection, row) {
      if (collection !== "courses") return { ...row };
      return {
        code: row.code,
        title: row.title,
        credits: row.credits,
        department: row.department,
        category: row.category,
        visibility: row.visibility || "curriculum",
        roadmapLevel: row.roadmapLevel ?? row.roadmap_level ?? null,
        roadmapOrder: row.roadmapOrder ?? row.roadmap_order ?? null,
        hardPrerequisites:
          row.hardPrerequisites ?? row.hard_prerequisites ?? [],
        softPrerequisites:
          row.softPrerequisites ?? row.soft_prerequisites ?? [],
        sourceNote: row.sourceNote ?? row.source_note ?? null,
        isRoadmapSlot: row.isRoadmapSlot ?? row.is_roadmap_slot ?? false,
      };
    }

    return Object.freeze({
      normalizeCatalogKey,
      filterCatalogItems,
      partitionCatalogCourses,
      searchCatalogCourses,
      addCatalogCourse,
      slugifyCategoryLabel,
      categoryDisplayLabel,
      curriculumFieldOptions,
      curriculumFieldForCategory,
      matchesCurriculumField,
      isAlternativeCourseCode,
      departmentDisplayId,
      resolveAlternativeReplacement,
      ALTERNATIVE_EQUIVALENCES,
      functionErrorMessage,
      createFacultyEditDraft,
      prepareCatalogEdit,
      mergeGlobalCatalog,
      markCatalogDeleted,
      fetchGlobalCatalog,
    });
  },
);
