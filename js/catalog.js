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
        "code, title, credits, department, category, roadmap_level, roadmap_order, hard_prerequisites, soft_prerequisites, source_note, is_roadmap_slot",
      faculties: "initial, name, email, department",
    };

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
        if (!query) return true;
        return searchFields.some((field) =>
          String(item?.[field] || "").toLowerCase().includes(query),
        );
      });
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

    function mergeGlobalCatalog(state, catalog = {}) {
      if (!state || typeof state !== "object") return state;
      if (!state.settings || typeof state.settings !== "object") state.settings = {};

      for (const collection of Object.keys(IDENTITY_FIELDS)) {
        const sourceRows =
          catalog[collection] ||
          (collection === "faculties" ? catalog.faculty : undefined);
        const rows = Array.isArray(sourceRows) ? sourceRows : [];
        if (!Array.isArray(state[collection])) state[collection] = [];
        state[collection] = state[collection].filter(
          (item) =>
            !(
              item?.catalogOrigin === "global" &&
              hasTombstone(state.settings, collection, normalizeCatalogKey(collection, item))
            ),
        );
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
      createFacultyEditDraft,
      prepareCatalogEdit,
      mergeGlobalCatalog,
      markCatalogDeleted,
      fetchGlobalCatalog,
    });
  },
);
