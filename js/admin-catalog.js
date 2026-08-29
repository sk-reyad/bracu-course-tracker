(function mountAdminCatalog(root) {
  "use strict";
  if (
    !root.document ||
    !root.BracuSupabase ||
    !root.BracuAccess ||
    !root.BracuCatalog
  )
    return;

  const documentObject = root.document;
  const $ = (selector) => documentObject.querySelector(selector);
  const COLLECTIONS = {
    department: "departments",
    course: "courses",
    faculty: "faculties",
  };
  const LABELS = {
    department: "department",
    course: "course",
    faculty: "faculty member",
  };
  const KEYS = { department: "id", course: "code", faculty: "initial" };
  let context = null;
  let kind = "department";
  let catalog = { departments: [], courses: [], faculties: [] };
  let editingKey = null;
  let loading = false;
  const filters = {
    department: { query: "", department: "", category: "", visibility: "" },
    course: { query: "", department: "", category: "", visibility: "" },
    faculty: { query: "", department: "", category: "", visibility: "" },
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(
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

  function canManageCatalog() {
    return (
      context?.role === "super_admin" ||
      (context?.permissions || []).includes("catalog.manage")
    );
  }

  async function invoke(action, payload = {}) {
    const { data, error } =
      await root.BracuSupabase.getClient().functions.invoke("admin-access", {
        body: { action, payload },
      });
    if (error || data?.error) {
      const message = await root.BracuCatalog.functionErrorMessage(
        error,
        data,
        "Request failed.",
      );
      throw new Error(message);
    }
    return data?.data;
  }

  function notify(message) {
    const toast = $("#adminToast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = root.setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  function departmentOptions(selected = "") {
    const options = catalog.departments.map(
      (department) =>
        `<option value="${escapeHtml(department.id)}" ${department.id === selected ? "selected" : ""}>${escapeHtml(root.BracuCatalog.departmentDisplayId(department.id))} — ${escapeHtml(department.name)}</option>`,
    );
    return `<option value="">Select department</option>${options.join("")}`;
  }

  function categoryPresetOptions(selected = "") {
    const categories = new Set([
      "stream-1-writing",
      "stream-2-math-and-natural-sciences",
      "stream-3-arts-and-humanities",
      "stream-4-social-sciences",
      "stream-5-communities-seeking-transformation",
      "school-core",
      "program-core",
      "program-elective",
      "general-elective",
      "capstone",
      ...catalog.courses.map((course) => course.category).filter(Boolean),
    ]);
    if (selected) categories.add(selected);
    return [
      '<option value="">Select category</option>',
      ...[...categories]
        .sort((left, right) =>
          root.BracuCatalog
            .categoryDisplayLabel(left)
            .localeCompare(root.BracuCatalog.categoryDisplayLabel(right)),
        )
        .map(
          (category) =>
            `<option value="${escapeHtml(category)}" ${category === selected ? "selected" : ""}>${escapeHtml(root.BracuCatalog.categoryDisplayLabel(category))}</option>`,
        ),
      '<option value="__custom__">Custom category…</option>',
    ].join("");
  }

  function fieldMarkup(current = {}) {
    if (kind === "department") {
      return `<label>Department ID<input name="id" maxlength="16" required value="${escapeHtml(current.id)}" ${editingKey ? "readonly" : ""} placeholder="CSE"></label>
        <label>Department name<input name="name" maxlength="180" required value="${escapeHtml(current.name)}" placeholder="Computer Science and Engineering"></label>
        <label>Theme color<select name="color"><option value="blue" ${current.color === "blue" ? "selected" : ""}>Blue</option><option value="green" ${current.color === "green" ? "selected" : ""}>Green</option><option value="amber" ${current.color === "amber" ? "selected" : ""}>Amber</option><option value="violet" ${current.color === "violet" ? "selected" : ""}>Violet</option><option value="gray" ${!current.color || current.color === "gray" ? "selected" : ""}>Gray</option></select></label>`;
    }
    if (kind === "faculty") {
      return `<label>Initial<input name="initial" maxlength="10" required value="${escapeHtml(current.initial)}" ${editingKey ? "readonly" : ""} placeholder="ABC"></label>
        <label>Full name<input name="name" maxlength="180" required value="${escapeHtml(current.name)}" placeholder="Faculty name"></label>
        <label>Email <span class="catalog-optional">Optional</span><input name="email" type="email" maxlength="254" value="${escapeHtml(current.email)}" placeholder="faculty@bracu.ac.bd"></label>
        <label>Department<select name="department" required>${departmentOptions(current.department)}</select></label>`;
    }
    const hard = current.hard_prerequisites || [];
    const soft = current.soft_prerequisites || [];
    return `<label>Course code<input name="code" maxlength="11" required value="${escapeHtml(current.code)}" ${editingKey ? "readonly" : ""} placeholder="CSE110"></label>
      <label class="catalog-field-wide">Course title<input name="title" maxlength="180" required value="${escapeHtml(current.title)}" placeholder="Programming Language I"></label>
      <label>Credits <span class="catalog-optional">Optional</span><input name="credits" type="number" min="0" max="20" step="0.1" value="${escapeHtml(current.credits ?? "")}" placeholder="Not set"></label>
      <label>Department<select name="department" required>${departmentOptions(current.department)}</select></label>
      <label>Category<select name="categoryPreset" required>${categoryPresetOptions(current.category || "program-core")}</select></label>
      <label class="catalog-custom-category" hidden>Custom category<input name="categoryCustom" maxlength="80" placeholder="Example: Architecture Studio"></label>
      <label>Student visibility<select name="visibility" required><option value="curriculum" ${(current.visibility || "curriculum") === "curriculum" ? "selected" : ""}>Visible in Course List</option><option value="search_only" ${current.visibility === "search_only" ? "selected" : ""}>Add Course only</option><option value="alternative" ${current.visibility === "alternative" ? "selected" : ""}>Alternative course</option></select></label>
      <label>Roadmap level <span class="catalog-optional">Optional</span><input name="roadmapLevel" type="number" min="1" max="30" value="${escapeHtml(current.roadmap_level)}"></label>
      <label>Roadmap order <span class="catalog-optional">Optional</span><input name="roadmapOrder" type="number" min="1" max="100" value="${escapeHtml(current.roadmap_order)}"></label>
      <label class="catalog-field-wide">Hard prerequisites <span class="catalog-optional">Comma-separated</span><input name="hardPrerequisites" value="${escapeHtml(hard.join(", "))}" placeholder="CSE110, MAT110"></label>
      <label class="catalog-field-wide">Soft prerequisites <span class="catalog-optional">Comma-separated</span><input name="softPrerequisites" value="${escapeHtml(soft.join(", "))}" placeholder="CSE111"></label>
      <label class="catalog-field-wide">Source note <span class="catalog-optional">Optional</span><input name="sourceNote" maxlength="500" value="${escapeHtml(current.source_note)}"></label>
      <label class="catalog-check"><input name="isRoadmapSlot" type="checkbox" ${current.is_roadmap_slot ? "checked" : ""}><span>Show as a roadmap slot</span></label>`;
  }

  function openEditor(item = null) {
    const keyName = KEYS[kind];
    editingKey = item ? String(item[keyName]) : null;
    $("#catalogFormTitle").textContent = `${item ? "Edit" : "Add"} ${LABELS[kind]}`;
    $("#catalogFormFields").innerHTML = fieldMarkup(item || {});
    syncCustomCategoryField();
    $("#catalogFormError").hidden = true;
    $("#catalogItemForm").hidden = false;
    const deleteButton = $("#catalogItemForm .catalog-delete");
    if (deleteButton) deleteButton.hidden = !item;
    $("#catalogItemForm").scrollIntoView({ behavior: "smooth", block: "nearest" });
    $("#catalogFormFields input:not([readonly]), #catalogFormFields select")?.focus();
  }

  function closeEditor() {
    editingKey = null;
    $("#catalogItemForm").hidden = true;
    $("#catalogItemForm").reset();
    $("#catalogFormError").hidden = true;
    const deleteButton = $("#catalogItemForm .catalog-delete");
    if (deleteButton) deleteButton.hidden = true;
  }

  function splitCodes(value) {
    return [...new Set(String(value || "").split(",").map((code) => code.trim().toUpperCase()).filter(Boolean))];
  }

  function syncCustomCategoryField() {
    const form = $("#catalogItemForm");
    const preset = form?.elements?.categoryPreset;
    const custom = form?.elements?.categoryCustom;
    const label = custom?.closest(".catalog-custom-category");
    if (!preset || !custom || !label) return;
    const active = preset.value === "__custom__";
    label.hidden = !active;
    custom.required = active;
    if (active) custom.focus();
  }

  function formPayload(form) {
    const values = Object.fromEntries(new FormData(form));
    if (kind === "course") {
      values.credits = values.credits === "" ? null : Number(values.credits);
      const categoryValue =
        values.categoryPreset === "__custom__"
          ? values.categoryCustom
          : values.categoryPreset;
      values.category = root.BracuCatalog.slugifyCategoryLabel(categoryValue);
      delete values.categoryPreset;
      delete values.categoryCustom;
      values.roadmapLevel = values.roadmapLevel ? Number(values.roadmapLevel) : null;
      values.roadmapOrder = values.roadmapOrder ? Number(values.roadmapOrder) : null;
      values.hardPrerequisites = splitCodes(values.hardPrerequisites);
      values.softPrerequisites = splitCodes(values.softPrerequisites);
      values.isRoadmapSlot = form.elements.isRoadmapSlot.checked;
    }
    return { kind, ...values };
  }

  function itemSummary(item) {
    if (kind === "department")
      return `<span>${escapeHtml(item.id)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.color)}</small>`;
    if (kind === "faculty")
      return `<span>${escapeHtml(item.initial)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email || "No email")} · ${escapeHtml(root.BracuCatalog.departmentDisplayId(item.department))}</small>`;
    const creditCopy =
      item.credits === null || item.credits === undefined
        ? "Credits not set"
        : `${escapeHtml(item.credits)} credits`;
    const visibility = item.visibility || "curriculum";
    const visibilityCopy =
      visibility === "search_only"
        ? "Add Course only"
        : visibility === "alternative"
          ? "Alternative course"
          : "Visible in Course List";
    return `<span>${escapeHtml(item.code)}</span><strong>${escapeHtml(item.title)}</strong><small>${creditCopy} · ${escapeHtml(root.BracuCatalog.departmentDisplayId(item.department))} · ${escapeHtml(root.BracuCatalog.categoryDisplayLabel(item.category))}<span class="catalog-visibility-badge" data-visibility="${escapeHtml(visibility)}">${visibilityCopy}</span></small>`;
  }

  function optionMarkup(value, label) {
    return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
  }

  function syncFilterControls() {
    const current = filters[kind];
    const departmentWrap = $("#catalogDepartmentFilterWrap");
    const categoryWrap = $("#catalogCategoryFilterWrap");
    const visibilityWrap = $("#catalogVisibilityFilterWrap");
    const departmentSelect = $("#catalogDepartmentFilter");
    const categorySelect = $("#catalogCategoryFilter");
    const visibilitySelect = $("#catalogVisibilityFilter");
    $("#catalogSearch").placeholder = {
      department: "Search code or department name",
      course: "Search course code or title",
      faculty: "Search initial, name, or email",
    }[kind];
    $("#catalogSearch").value = current.query;

    departmentWrap.hidden = kind === "department";
    departmentSelect.innerHTML =
      '<option value="">All departments</option>' +
      catalog.departments
        .map((department) =>
          optionMarkup(
            department.id,
            `${root.BracuCatalog.departmentDisplayId(department.id)} — ${department.name}`,
          ),
        )
        .join("");
    if (
      !catalog.departments.some(
        (department) => department.id === current.department,
      )
    )
      current.department = "";
    departmentSelect.value = current.department;

    categoryWrap.hidden = kind !== "course";
    const categories = [...new Set(catalog.courses.map((course) => course.category).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
    categorySelect.innerHTML =
      '<option value="">All categories</option>' +
      categories
        .map((category) =>
          optionMarkup(
            category,
            root.BracuCatalog.categoryDisplayLabel(category),
          ),
        )
        .join("");
    if (!categories.includes(current.category)) current.category = "";
    categorySelect.value = current.category;

    visibilityWrap.hidden = kind !== "course";
    visibilitySelect.value = current.visibility;
  }

  function renderList() {
    const rows = catalog[COLLECTIONS[kind]] || [];
    const visibleRows = root.BracuCatalog.filterCatalogItems(
      kind,
      rows,
      filters[kind],
    );
    const hasItems = rows.length > 0;
    const hasMatches = visibleRows.length > 0;
    $("#catalogEmpty").hidden = hasItems;
    $("#catalogNoResults").hidden = !hasItems || hasMatches;
    $("#catalogList").hidden = !hasMatches;
    $("#catalogFilterCount").textContent = `${visibleRows.length} of ${rows.length} ${rows.length === 1 ? "item" : "items"}`;
    $("#catalogList").innerHTML = visibleRows
      .map(
        (item) => `<article class="catalog-row" data-catalog-key="${escapeHtml(item[KEYS[kind]])}">
          <div class="catalog-row-copy">${itemSummary(item)}</div>
          <button class="admin-secondary catalog-edit" type="button"><i data-lucide="pencil"></i>Edit</button>
        </article>`,
      )
      .join("");
    root.lucide?.createIcons?.();
  }

  function selectKind(nextKind) {
    if (!COLLECTIONS[nextKind]) return;
    kind = nextKind;
    closeEditor();
    documentObject.querySelectorAll("[data-catalog-kind]").forEach((button) => {
      const active = button.dataset.catalogKind === kind;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const activeTab = documentObject.querySelector(`[data-catalog-kind="${kind}"]`);
    if (activeTab?.id)
      $("#catalogContent").setAttribute("aria-labelledby", activeTab.id);
    $("#addCatalogItem").innerHTML = `<i data-lucide="plus"></i>Add ${LABELS[kind]}`;
    syncFilterControls();
    renderList();
  }

  async function loadCatalog() {
    if (!canManageCatalog() || loading) return;
    loading = true;
    $("#catalogLoading").hidden = false;
    $("#catalogError").hidden = true;
    $("#catalogEmpty").hidden = true;
    $("#catalogNoResults").hidden = true;
    $("#catalogList").hidden = true;
    try {
      const result = await invoke("list-catalog");
      catalog = {
        departments: Array.isArray(result?.departments) ? result.departments : [],
        courses: Array.isArray(result?.courses) ? result.courses : [],
        faculties: Array.isArray(result?.faculties) ? result.faculties : [],
      };
      syncFilterControls();
      renderList();
    } catch (error) {
      $("#catalogErrorCopy").textContent = error.message || "Please try again.";
      $("#catalogError").hidden = false;
    } finally {
      loading = false;
      $("#catalogLoading").hidden = true;
    }
  }

  async function deleteItem(item) {
    const keyName = KEYS[kind];
    if (!root.confirm(`Delete ${item[keyName]} from the global catalog? Existing user data will stay unchanged.`)) return;
    try {
      await invoke("delete-catalog-item", { kind, [keyName]: item[keyName] });
      closeEditor();
      await loadCatalog();
      notify("Catalog item deleted.");
    } catch (error) {
      notify(error.message || "Couldn’t delete the catalog item.");
    }
  }

  function bindEvents() {
    documentObject.addEventListener("admin:view-change", (event) => {
      if (event.detail?.context) context = event.detail.context;
      if (event.detail?.view === "catalog") loadCatalog();
    });
    documentObject.querySelectorAll("[data-catalog-kind]").forEach((button) =>
      button.addEventListener("click", () => selectKind(button.dataset.catalogKind)),
    );
    documentObject.querySelector(".catalog-tabs")?.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = [...documentObject.querySelectorAll("[data-catalog-kind]")];
      const currentIndex = tabs.indexOf(event.target.closest("[data-catalog-kind]"));
      if (currentIndex < 0) return;
      event.preventDefault();
      let nextIndex = currentIndex;
      if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else if (event.key === "ArrowLeft")
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else nextIndex = (currentIndex + 1) % tabs.length;
      selectKind(tabs[nextIndex].dataset.catalogKind);
      tabs[nextIndex].focus();
    });
    $("#addCatalogItem").addEventListener("click", () => openEditor());
    $("#closeCatalogForm").addEventListener("click", closeEditor);
    $("#cancelCatalogEdit").addEventListener("click", closeEditor);
    $("#retryCatalog").addEventListener("click", loadCatalog);
    $("#catalogSearch").addEventListener("input", (event) => {
      filters[kind].query = event.target.value;
      renderList();
    });
    $("#catalogDepartmentFilter").addEventListener("change", (event) => {
      filters[kind].department = event.target.value;
      renderList();
    });
    $("#catalogCategoryFilter").addEventListener("change", (event) => {
      filters[kind].category = event.target.value;
      renderList();
    });
    $("#catalogVisibilityFilter").addEventListener("change", (event) => {
      filters[kind].visibility = event.target.value;
      renderList();
    });
    $("#catalogItemForm").addEventListener("change", (event) => {
      if (event.target.name === "categoryPreset") syncCustomCategoryField();
    });
    $("#catalogList").addEventListener("click", (event) => {
      const edit = event.target.closest(".catalog-edit");
      if (!edit) return;
      const key = edit.closest("[data-catalog-key]").dataset.catalogKey;
      const item = (catalog[COLLECTIONS[kind]] || []).find(
        (entry) => String(entry[KEYS[kind]]) === key,
      );
      if (item) openEditor(item);
    });
    $("#catalogItemForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector("button[type='submit']");
      const errorNode = $("#catalogFormError");
      errorNode.hidden = true;
      submit.disabled = true;
      try {
        await invoke("upsert-catalog-item", formPayload(form));
        closeEditor();
        await loadCatalog();
        notify("Catalog item saved.");
      } catch (error) {
        errorNode.textContent = error.message || "Couldn’t save the catalog item.";
        errorNode.hidden = false;
      } finally {
        submit.disabled = false;
      }
    });
    $("#catalogItemForm").addEventListener("click", (event) => {
      if (!event.target.closest(".catalog-delete")) return;
      const item = (catalog[COLLECTIONS[kind]] || []).find(
        (entry) => String(entry[KEYS[kind]]) === editingKey,
      );
      if (item) deleteItem(item);
    });
  }

  async function boot() {
    context = await root.BracuAccess.requireAdminAccess();
    if (!context || !canManageCatalog()) return;
    bindEvents();
    const actions = $("#catalogItemForm .catalog-form-actions");
    const deleteButton = documentObject.createElement("button");
    deleteButton.className = "admin-danger catalog-delete";
    deleteButton.type = "button";
    deleteButton.innerHTML = '<i data-lucide="trash-2"></i>Delete';
    actions.prepend(deleteButton);
    deleteButton.hidden = true;
  }

  if (documentObject.readyState === "loading")
    documentObject.addEventListener("DOMContentLoaded", () => boot().catch(() => {}), { once: true });
  else boot().catch(() => {});
})(typeof globalThis !== "undefined" ? globalThis : window);
