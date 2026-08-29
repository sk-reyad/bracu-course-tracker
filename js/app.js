let state = null;
let availableCatalogCourses = [];
let appAccessContext = null;
let queueTrackerCloudSync = () => {};
let syncTrackerNow = async () => ({ skipped: true });
let toastTimer = null;
let modalReturnFocus = null;
let editingCourseCode = null;
let editingDepartmentId = null;
let editingFacultyId = null;
let facultyEditDraftState = null;
let dashboardProfileEditing = false;
let dashboardAvatarDraft = null;
let dashboardSelectedPhotoUrl = "";
let dashboardAvatarRuntime = null;
let dashboardProfileService = null;
let dashboardAvatarResolvedKey = "";
let dashboardAvatarResolveToken = 0;
let dashboardAvatarDisplay = {
  kind: "initials",
  src: "",
  initials: "CS",
  external: false,
  error: null,
};
let editingSemesterId = null;
let facultySearchQuery = "";
let facultyDepartmentFilter = "";
let activeFacultyTooltipTimer = null;
let siteChromeFrame = null;
let pageLoadingController = null;

function $(selector, root = document) {
  return root.querySelector(selector);
}
function $all(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}
function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function safe(value, fallback = "Not added") {
  return value && String(value).trim() ? value : fallback;
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
}

function setSaveState(message = "Saved locally") {
  const saveStateElement = $("#saveState");
  if (!saveStateElement) return;
  saveStateElement.innerHTML = `<span class="save-state-dot" aria-hidden="true"></span><span>${escapeHtml(message)}</span>`;
}

function persist(message = "Saved locally", options = {}) {
  if (appAccessContext?.preview) {
    showToast("Preview mode is read-only");
    return false;
  }
  saveState(state);
  queueTrackerCloudSync(state, options);
  setSaveState(message);
  showToast(message);
  renderAll();
  return true;
}

function saveWithoutFullRender(message = "Saved locally") {
  if (appAccessContext?.preview) return false;
  saveState(state);
  queueTrackerCloudSync(state);
  setSaveState(message);
  return true;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    return true;
  } finally {
    textarea.remove();
  }
}

function closeFacultyTooltips() {
  clearTimeout(activeFacultyTooltipTimer);
  activeFacultyTooltipTimer = null;
  $all(".faculty-tooltip-card-active").forEach((card) =>
    card.classList.remove("faculty-tooltip-card-active"),
  );
  $all(
    ".has-faculty-tooltip.tooltip-open, .has-path-faculty-tooltip.tooltip-open",
  ).forEach((item) => {
    item.classList.remove("tooltip-open");
    item.setAttribute("aria-expanded", "false");
  });
}

function scheduleFacultyTooltipClose(delay = 1500) {
  clearTimeout(activeFacultyTooltipTimer);
  activeFacultyTooltipTimer = window.setTimeout(closeFacultyTooltips, delay);
}

function openFacultyTooltip(trigger) {
  closeFacultyTooltips();
  const parentCard = trigger.closest(".course-card, .path-course-card");
  if (parentCard) parentCard.classList.add("faculty-tooltip-card-active");
  trigger.classList.add("tooltip-open");
  trigger.setAttribute("aria-expanded", "true");
  scheduleFacultyTooltipClose(1500);
}

function markFacultyEmailCopied(button) {
  button.classList.add("copied");
  button.setAttribute("aria-label", "Email address copied");
  showToast("Email address copied");
  scheduleFacultyTooltipClose(1500);
  window.setTimeout(() => {
    button.classList.remove("copied");
    const initial = button.dataset.facultyInitial || "faculty";
    button.setAttribute("aria-label", `Copy ${initial} email address`);
  }, 1000);
}

async function copyFacultyEmail(button) {
  const email = button.dataset.copyFacultyEmail || "";
  if (!email || email === "Email not added")
    return showToast("Faculty email not added");

  try {
    if (navigator.clipboard?.writeText)
      await navigator.clipboard.writeText(email);
    else fallbackCopyText(email);
    markFacultyEmailCopied(button);
  } catch (error) {
    try {
      fallbackCopyText(email);
      markFacultyEmailCopied(button);
    } catch (fallbackError) {
      showToast("Could not copy email");
    }
  }
}

function renderAll() {
  applyTheme();
  renderRoadmap(state);
  renderQuickAddOptions();
  populateSemesterCreateOptions();
  updateQuickAddVisibility();
  renderSemesters();
  renderCourseList();
  renderDepartments();
  renderReport();
  renderSettings();
  if (!$("#dashboardModal").hidden) renderDashboardModal(false);
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.settings.theme || "light";
  $("#themeToggle").innerHTML =
    `<i data-lucide="${state.settings.theme === "dark" ? "sun" : "moon"}"></i>`;
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, state.settings.theme);
  if (appAccessContext?.preview) {
    renderAll();
    BracuPreview.applyLockdown(document);
    return;
  }
  persist("Theme updated");
}

function configureFooter() {
  const program = DEFAULT_DATA.program || {};
  const year = $("#footerYear");
  const developer = $("#footerDeveloper");
  const version = $("#footerVersion");
  if (year) year.textContent = new Date().getFullYear();
  if (developer)
    developer.textContent = program.developerName || "SK Reyad Ali";
  if (version) version.textContent = program.version || "v0.9.0-beta.1";
}

function updateSiteChrome() {
  siteChromeFrame = null;
  const header = $(".site-header");
  const backToTop = $("#backToTopBtn");
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  if (header) header.classList.toggle("is-scrolled", scrollTop > 12);
  if (backToTop)
    backToTop.classList.toggle(
      "is-visible",
      scrollTop > Math.max(360, window.innerHeight * 0.45),
    );

  const sections = $all("main > .section[id]");
  if (!sections.length) return;
  const marker = scrollTop + (header?.offsetHeight || 74) + 120;
  let activeId = sections[0].id;
  sections.forEach((section) => {
    if (section.offsetTop <= marker) activeId = section.id;
  });
  $all('.nav-links a[href^="#"]').forEach((link) => {
    const active = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function scheduleSiteChromeUpdate() {
  if (siteChromeFrame !== null) return;
  siteChromeFrame = window.requestAnimationFrame(updateSiteChrome);
}

function optionText(value) {
  return String(value || "")
    .split("—")[0]
    .trim();
}

function resolveCourseCode(inputValue) {
  const raw = optionText(inputValue);
  const normalized = normalizeCode(raw);
  if (state.courses.some((course) => course.code === normalized))
    return normalized;
  const found = state.courses.find((course) =>
    `${course.code} ${course.title}`.toLowerCase().includes(
      String(inputValue || "")
        .toLowerCase()
        .trim(),
    ),
  );
  return found?.code || "";
}

function resolveFacultyId(inputValue) {
  const text = String(inputValue || "")
    .toLowerCase()
    .trim();
  if (!text) return "";
  const found = state.faculties.find(
    (faculty) =>
      faculty.id === inputValue ||
      (faculty.initial || "").toLowerCase() ===
        optionText(inputValue).toLowerCase() ||
      `${faculty.initial || ""} ${faculty.name || ""} ${faculty.email || ""}`
        .toLowerCase()
        .includes(text),
  );
  return found?.id || "";
}

function getFacultiesAlphabetically() {
  return [...state.faculties].sort((a, b) => {
    const nameCompare = String(a.name || a.initial || "").localeCompare(
      String(b.name || b.initial || ""),
      undefined,
      { sensitivity: "base", numeric: true },
    );
    if (nameCompare !== 0) return nameCompare;
    return String(a.initial || "").localeCompare(
      String(b.initial || ""),
      undefined,
      {
        sensitivity: "base",
        numeric: true,
      },
    );
  });
}

function renderQuickAddOptions() {
  const semesterSelect = $("#quickSemester");
  const currentSemesterValue = semesterSelect.value;
  semesterSelect.innerHTML = state.semesters.length
    ? state.semesters
        .map(
          (semester, index) =>
            `<option value="${semester.id}" ${semester.id === currentSemesterValue ? "selected" : ""}>Semester ${semester.number || index + 1} — ${escapeHtml(semester.name)}</option>`,
        )
        .join("")
    : `<option value="">Add a semester first</option>`;

  $("#courseOptions").innerHTML = [
    ...state.courses.filter((course) => !course.isRoadmapSlot),
  ]
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map(
      (course) =>
        `<option value="${formatCode(course.code)} — ${escapeHtml(course.title)}"></option>`,
    )
    .join("");

  $("#quickGrade").innerHTML =
    `<option value="">No grade yet</option>` +
    state.gradeScale
      .map(
        (item) =>
          `<option value="${item.grade}">${item.grade}${item.point !== null ? ` (${Number(item.point).toFixed(1)})` : ""}</option>`,
      )
      .join("");

  $("#facultyOptions").innerHTML = getFacultiesAlphabetically()
    .map(
      (faculty) =>
        `<option value="${escapeHtml(faculty.initial || "---")} — ${escapeHtml(faculty.name || "Unnamed")}"></option>`,
    )
    .join("");
}

function semesterTermOptions(selected = "") {
  return (
    '<option value="">Select term</option>' +
    BracuProfile.TERMS.map(
      (term) =>
        `<option value="${term}" ${term === selected ? "selected" : ""}>${term}</option>`,
    ).join("")
  );
}

function semesterYearOptions(selected = "") {
  return (
    '<option value="">Select year</option>' +
    BracuProfile.semesterYearOptions(undefined, selected)
      .map(
        (year) =>
          `<option value="${year}" ${year === Number(selected) ? "selected" : ""}>${year}</option>`,
      )
      .join("")
  );
}

function populateSemesterCreateOptions() {
  const termSelect = $("#semesterTermInput");
  const yearSelect = $("#semesterYearInput");
  if (!termSelect || !yearSelect) return;
  const selectedTerm = termSelect.value;
  const selectedYear = yearSelect.value;
  termSelect.innerHTML = semesterTermOptions(selectedTerm);
  yearSelect.innerHTML = semesterYearOptions(selectedYear);
}

function validateSemesterChoice(term, year, excludeId = "") {
  return BracuProfile.validateSemesterSelection({
    term,
    year,
    semesters: state.semesters,
    excludeId,
  });
}

function renderSemesters() {
  const list = $("#semesterList");
  if (!state.semesters.length) {
    list.innerHTML = `<div class="empty-state">No semester added yet. Add your first semester, then add courses from Add Courses.</div>`;
    return;
  }

  list.innerHTML = state.semesters
    .map((semester, index) => {
      semester.number = semester.number || index + 1;
      const isEditing = editingSemesterId === semester.id;
      const semGpa = calculateSemesterGpa(state, semester);
      const credits = (semester.courses || []).reduce((sum, attempt) => {
        if (!isAttemptCounted(state, attempt) && attempt.status === "completed")
          return sum;
        const course = courseByCode(state, attempt.code);
        return sum + Number(attempt.creditsOverride || course?.credits || 0);
      }, 0);
      const semesterSelection = BracuProfile.parseSemesterName(semester.name);
      const titleBlock = isEditing
        ? `<div class="semester-name-edit semester-name-selects"><label><span class="visually-hidden">Semester term</span><select data-semester-term-draft="${semester.id}" aria-label="Semester term">${semesterTermOptions(semesterSelection?.term)}</select></label><label><span class="visually-hidden">Semester year</span><select data-semester-year-draft="${semester.id}" aria-label="Semester year">${semesterYearOptions(semesterSelection?.year)}</select></label></div>`
        : `<h3>${escapeHtml(semester.name)}</h3>`;
      const actionBlock = isEditing
        ? `<div class="button-row semester-edit-actions"><button class="primary-btn small-btn" type="button" data-action="save-semester-edit" data-semester-id="${semester.id}">Save</button><button class="ghost-btn small-btn" type="button" data-action="cancel-semester-edit" data-semester-id="${semester.id}"><i data-lucide="x"></i> Cancel</button><button class="danger-btn small-btn" type="button" data-action="delete-semester" data-semester-id="${semester.id}"><i data-lucide="trash-2"></i> Delete</button></div>`
        : `<button class="secondary-btn small-btn" type="button" data-action="edit-semester" data-semester-id="${semester.id}"><i data-lucide="pencil"></i> Edit</button>`;
      return `
      <article class="semester-card semester-roadmap-card" data-semester-id="${semester.id}">
        <div class="semester-head roadmap-like-head ${isEditing ? "is-editing" : ""}">
          <div class="semester-index"><strong>Semester ${semester.number}</strong></div>
          <div class="semester-title-wrap">
            ${titleBlock}
            <div class="semester-meta">${credits} credits added · Semester GPA ${formatNumber(semGpa.gpa)}</div>
          </div>
          ${actionBlock}
        </div>
        <div class="semester-course-grid">
          ${(semester.courses || []).length ? semester.courses.map((attempt) => renderAttemptCard(semester, attempt, isEditing)).join("") : `<div class="empty-state">No courses in this semester yet.</div>`}
        </div>
      </article>
    `;
    })
    .join("");
}

function renderPathFacultyChip(faculty) {
  if (!faculty) {
    return `<span class="faculty-chip"><small>Faculty</small><strong>—</strong></span>`;
  }

  const initialText = faculty.initial || "—";
  const nameText = faculty.name || "Faculty name not added";
  const emailText = faculty.email || "Email not added";
  const copyButton = faculty.email
    ? `
        <button type="button" class="faculty-email-copy-btn" data-copy-faculty-email="${escapeHtml(faculty.email)}" data-faculty-initial="${escapeHtml(initialText)}" aria-label="Copy ${escapeHtml(initialText)} email address">
          <i data-lucide="copy"></i>
          <span class="faculty-copy-check" aria-hidden="true">✓</span>
        </button>`
    : "";

  return `
    <span class="faculty-chip has-path-faculty-tooltip" tabindex="0" aria-label="Faculty details for ${escapeHtml(initialText)}">
      <small>Faculty</small>
      <strong>${escapeHtml(initialText)}</strong>
      <span class="path-faculty-tooltip" role="tooltip">
        <b>${escapeHtml(nameText)}</b>
        <span class="path-faculty-tooltip-email-row">
          <span class="path-faculty-tooltip-email">${escapeHtml(emailText)}</span>
          ${copyButton}
        </span>
      </span>
    </span>
  `;
}

function isNotTakenAttempt(attempt) {
  if (
    !attempt ||
    attempt.status !== "completed" ||
    isAttemptCounted(state, attempt)
  )
    return false;

  const point = attemptGradePoint(state, attempt);
  if (point === null || point === undefined) return false;

  return getAllAttempts(state).some(
    (otherAttempt) =>
      otherAttempt.id !== attempt.id &&
      otherAttempt.code === attempt.code &&
      otherAttempt.status === "completed" &&
      isAttemptCounted(state, otherAttempt),
  );
}

function facultyOptionLabels(faculty) {
  const initial = faculty?.initial || "---";
  const name = faculty?.name || "Unnamed";
  return {
    compact: initial,
    full: `${initial} — ${name}`,
  };
}

function renderAttemptFacultyOption(faculty, selectedFacultyId) {
  const labels = facultyOptionLabels(faculty);
  const selected = selectedFacultyId === faculty.id;

  return `<option value="${escapeHtml(faculty.id)}" ${selected ? "selected" : ""} data-compact-label="${escapeHtml(labels.compact)}" data-full-label="${escapeHtml(labels.full)}">${escapeHtml(labels.full)}</option>`;
}

function expandFacultySelectOptions(select) {
  [...select.options].forEach((option) => {
    if (option.dataset.fullLabel) option.textContent = option.dataset.fullLabel;
  });
}

function compactFacultySelectOptions(select) {
  const selectedOption = select.selectedOptions?.[0];
  if (selectedOption?.dataset.compactLabel)
    selectedOption.textContent = selectedOption.dataset.compactLabel;
}

function renderAttemptCard(semester, attempt, isEditing = false) {
  const course = courseByCode(state, attempt.code) || {
    code: attempt.code,
    title: "Unknown course",
    credits: 0,
  };
  const faculty = state.faculties.find((item) => item.id === attempt.facultyId);
  const counted = isAttemptCounted(state, attempt);
  const notTaken = isNotTakenAttempt(attempt);
  const rawPoint = attemptGradePoint(state, attempt);
  const point = counted ? rawPoint : null;
  const originalCreditValue = Number(
    attempt.creditsOverride || course.credits || 0,
  );
  const creditValue = notTaken
    ? originalCreditValue
    : counted || attempt.status !== "completed"
      ? originalCreditValue
      : 0;
  const gradeText = notTaken
    ? attempt.grade || "No grade"
    : counted
      ? attempt.grade || "No grade"
      : "Omitted";
  const gpText =
    notTaken && rawPoint !== null && rawPoint !== undefined
      ? Number(rawPoint).toFixed(1)
      : counted && point !== null && point !== undefined
        ? Number(point).toFixed(1)
        : "—";
  const displayCode = `${formatCode(course.code)}${notTaken ? " (NT)" : attempt.repeatType ? ` (${attempt.repeatType})` : ""}`;
  const statusBadge = notTaken
    ? `<span class="path-status-badge path-status-not-taken">Not Taken</span>`
    : "";
  const displayStatus = notTaken ? "not-taken" : attempt.status;
  const gradeField =
    attempt.status === "completed" || attempt.status === "omitted"
      ? `
        <select data-action="update-attempt" data-field="grade" data-semester-id="${semester.id}" data-attempt-id="${attempt.id}">
          <option value="">No grade</option>
          ${state.gradeScale.map((item) => `<option value="${item.grade}" ${attempt.grade === item.grade ? "selected" : ""}>${item.grade}${item.point !== null ? ` (${Number(item.point).toFixed(1)})` : ""}</option>`).join("")}
        </select>`
      : "";
  const facultyDisplayLabel = faculty
    ? facultyOptionLabels(faculty).compact
    : "No faculty";
  const facultyField =
    attempt.status === "planned"
      ? ""
      : `
        <div class="path-faculty-select-wrap">
          <select class="path-faculty-select" data-action="update-attempt" data-field="facultyId" data-semester-id="${semester.id}" data-attempt-id="${attempt.id}" aria-label="Faculty">
            <option value="" data-compact-label="No faculty" data-full-label="No faculty">No faculty</option>
            ${getFacultiesAlphabetically()
              .map((f) => renderAttemptFacultyOption(f, attempt.facultyId))
              .join("")}
          </select>
          <span class="path-faculty-select-display" aria-hidden="true">${escapeHtml(facultyDisplayLabel)}</span>
        </div>`;
  const editFields = isEditing
    ? `
      <div class="path-fields">
        <select data-action="update-attempt" data-field="status" data-semester-id="${semester.id}" data-attempt-id="${attempt.id}">
          ${["completed", "current", "planned", "omitted"].map((status) => `<option value="${status}" ${attempt.status === status ? "selected" : ""}>${statusLabel(status)}</option>`).join("")}
        </select>
        ${gradeField}
        <select data-action="update-attempt" data-field="repeatType" data-semester-id="${semester.id}" data-attempt-id="${attempt.id}">
          <option value="" ${!attempt.repeatType ? "selected" : ""}>Normal</option>
          <option value="RT" ${attempt.repeatType === "RT" ? "selected" : ""}>Retake (RT)</option>
          <option value="RP" ${attempt.repeatType === "RP" ? "selected" : ""}>Repeat (RP)</option>
        </select>
        ${facultyField}
      </div>
      <button class="danger-btn small-btn path-remove-btn" type="button" data-action="delete-attempt" data-semester-id="${semester.id}" data-attempt-id="${attempt.id}"><i data-lucide="trash-2"></i> Remove</button>
    `
    : "";
  return `
    <article class="path-course-card" data-status="${displayStatus}" data-attempt-id="${attempt.id}" data-semester-id="${semester.id}">
      <div class="path-card-top">
        <div><strong>${displayCode}</strong><small>${escapeHtml(course.title)}</small></div>
        ${statusBadge}
      </div>
      ${editFields}
      <div class="path-meta"><span><small>Credits</small>${creditValue} cr</span><span><small>Grade</small>${gradeText}</span><span><small>GP</small>${gpText}</span>${renderPathFacultyChip(faculty)}</div>
    </article>
  `;
}

function getDashboardProfile() {
  return BracuProfile.normalizeCanonicalProfile(
    appAccessContext?.profile || state.profile || {},
  );
}

function dashboardYearOptions(selectedYear) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear + 1; year >= 2001; year -= 1) years.push(year);
  return years
    .map(
      (year) =>
        `<option value="${year}" ${year === Number(selectedYear) ? "selected" : ""}>${year}</option>`,
    )
    .join("");
}

function clearDashboardSelectedPhoto() {
  if (dashboardSelectedPhotoUrl) URL.revokeObjectURL(dashboardSelectedPhotoUrl);
  dashboardSelectedPhotoUrl = "";
}

function resetDashboardProfileDraft() {
  clearDashboardSelectedPhoto();
  dashboardAvatarDraft = null;
}

function dashboardAvatarMarkup(display, className = "") {
  const classAttribute = className ? ` class="${className}"` : "";
  if (display?.kind === "image" && display.src) {
    return `<img${classAttribute} src="${escapeHtml(display.src)}" alt="Profile photo" referrerpolicy="no-referrer" />`;
  }
  return `<span${classAttribute}>${escapeHtml(display?.initials || "CS")}</span>`;
}

function dashboardDraftDisplay(profile) {
  const snapshot = dashboardAvatarDraft?.snapshot();
  const initials = BracuProfile.getInitials(profile.name);
  if (!snapshot) return dashboardAvatarDisplay;
  if (snapshot.avatarPreference === "none")
    return {
      kind: "initials",
      src: "",
      initials,
      external: false,
      error: null,
    };
  if (snapshot.avatarPreference === "google") {
    const src = snapshot.googleAvatarUrl;
    return src
      ? { kind: "image", src, initials, external: true, error: null }
      : { kind: "initials", src: "", initials, external: false, error: null };
  }
  if (snapshot.photoFile && dashboardSelectedPhotoUrl) {
    return {
      kind: "image",
      src: dashboardSelectedPhotoUrl,
      initials,
      external: false,
      error: null,
    };
  }
  return dashboardAvatarDisplay;
}

function updateDashboardAvatarNodes(display) {
  const profilePhoto = $("#profileCard .profile-photo");
  const editorPhoto = $("#dashboardPhotoMedia");
  if (profilePhoto) profilePhoto.innerHTML = dashboardAvatarMarkup(display);
  if (editorPhoto) editorPhoto.innerHTML = dashboardAvatarMarkup(display);
}

async function resolveDashboardAvatar(force = false) {
  if (!dashboardAvatarRuntime) return;
  const profile = appAccessContext?.profile || state.profile || {};
  const canonical = BracuProfile.normalizeCanonicalProfile(profile);
  const key = `${canonical.avatarPreference}:${canonical.avatarPath}:${BracuProfile.getGoogleAvatarUrl(appAccessContext?.user || {})}`;
  if (!force && dashboardAvatarResolvedKey === key) return;
  const token = ++dashboardAvatarResolveToken;
  const display = await dashboardAvatarRuntime.resolve(
    profile,
    appAccessContext?.user || {},
  );
  if (token !== dashboardAvatarResolveToken) return;
  dashboardAvatarResolvedKey = key;
  dashboardAvatarDisplay = display;
  if (!dashboardProfileEditing || !dashboardAvatarDraft?.snapshot().photoFile)
    updateDashboardAvatarNodes(dashboardDraftDisplay(canonical));
}

function renderDashboardProfileView(profile) {
  const fields = [
    ["Name", safe(profile.name, "Student Name"), ""],
    ["Student ID", safe(profile.studentId), ""],
    ["G-Suite Email", safe(profile.email), ""],
    ["Program", safe(profile.program, DEFAULT_DATA.program.name), ""],
    ["University", "BRAC University", ""],
    ["Starting Semester", safe(profile.startingSemester), ""],
  ];
  return `<div class="dashboard-profile-fields">${fields
    .map(
      ([label, value, note]) => `
    <div class="profile-detail-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ""}</div>
  `,
    )
    .join("")}</div>`;
}

function renderDashboardPhotoEditor(profile) {
  const display = dashboardDraftDisplay(profile);
  const snapshot = dashboardAvatarDraft.snapshot();
  const hasGooglePhoto = Boolean(snapshot.googleAvatarUrl);
  const customFileName =
    snapshot.photoFile?.name ||
    (snapshot.avatarPreference === "custom"
      ? "Current custom photo"
      : "No custom photo selected");
  return `
    <div class="dashboard-photo-control" id="dashboardPhotoDropzone" tabindex="0" role="group" aria-label="Profile photo uploader">
      <div class="dashboard-photo-media" id="dashboardPhotoMedia">${dashboardAvatarMarkup(display)}</div>
      <div class="dashboard-photo-copy">
        <strong>Profile photo</strong>
        <span>${escapeHtml(customFileName)}</span>
        <small>Drag and drop, or choose JPEG, PNG or WebP · max 5 MB</small>
      </div>
      <div class="dashboard-photo-actions">
        <label class="secondary-btn small-btn" for="dashboardPhotoInput"><i data-lucide="upload"></i> ${snapshot.photoFile ? "Replace" : "Choose photo"}</label>
        <input id="dashboardPhotoInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" />
        <button class="ghost-btn small-btn" type="button" data-action="use-google-photo" ${hasGooglePhoto ? "" : "disabled"}><i data-lucide="circle-user-round"></i> Use Google photo</button>
        <button class="danger-btn icon-button" type="button" data-action="remove-profile-photo" aria-label="Remove profile photo"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`;
}

function renderDashboardProfileEditor(profile) {
  return `
    <form id="dashboardProfileForm">
      <div class="dashboard-profile-fields">
        <label class="profile-detail-card identity-field"><span>Name</span><input value="${escapeHtml(profile.name)}" readonly aria-readonly="true" /></label>
        <label class="profile-detail-card"><span>Student ID</span><input value="${escapeHtml(profile.studentId)}" data-profile-field="studentId" required /></label>
        <label class="profile-detail-card identity-field"><span>G-Suite Email</span><input type="email" value="${escapeHtml(profile.email)}" readonly aria-readonly="true" /></label>
        <label class="profile-detail-card"><span>Program</span><select data-profile-field="program" required>${BracuProfile.PROGRAMS.map((program) => `<option value="${escapeHtml(program)}" ${program === profile.program ? "selected" : ""}>${escapeHtml(program)}</option>`).join("")}</select></label>
        <label class="profile-detail-card identity-field"><span>University</span><input value="BRAC University" readonly aria-readonly="true" /></label>
        <div class="profile-detail-card starting-semester-fields"><span>Starting Semester</span><div><select data-profile-field="startingTerm" aria-label="Starting term" required>${BracuProfile.TERMS.map((term) => `<option value="${term}" ${term === profile.startingTerm ? "selected" : ""}>${term}</option>`).join("")}</select><select data-profile-field="startingYear" aria-label="Starting year" required>${dashboardYearOptions(profile.startingYear)}</select></div></div>
      </div>
      ${renderDashboardPhotoEditor(profile)}
      <p class="form-error" id="dashboardProfileError" role="alert" hidden></p>
    </form>`;
}

function bindDashboardPhotoDropzone() {
  const dashboardPhotoDropzone = $("#dashboardPhotoDropzone");
  if (!dashboardPhotoDropzone) return;
  ["dragenter", "dragover"].forEach((type) =>
    dashboardPhotoDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dashboardPhotoDropzone.classList.add("is-dragging");
    }),
  );
  ["dragleave", "drop"].forEach((type) =>
    dashboardPhotoDropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dashboardPhotoDropzone.classList.remove("is-dragging");
    }),
  );
  dashboardPhotoDropzone.addEventListener("drop", (event) =>
    selectDashboardPhoto(event.dataTransfer?.files?.[0]),
  );
}

function renderDashboardModal(open = true) {
  const profile = getDashboardProfile();
  const summary = calculateSummary(state);
  const avatarDisplay = dashboardDraftDisplay(profile);
  $("#dashboardContent").innerHTML = `
    <div class="dashboard-grid modal-dashboard-grid">
      <article class="profile-card" id="profileCard">
        <div class="profile-photo">${dashboardAvatarMarkup(avatarDisplay)}</div>
        <h3>${escapeHtml(safe(profile.name, "Student Name"))}</h3>
        <p>${escapeHtml(safe(profile.program, DEFAULT_DATA.program.name))}</p>
        <dl>
          <div><dt>Student ID</dt><dd>${escapeHtml(safe(profile.studentId))}</dd></div>
          <div><dt>Email</dt><dd>${escapeHtml(safe(profile.email))}</dd></div>
          <div><dt>University</dt><dd>BRAC University</dd></div>
          <div><dt>Starting Semester</dt><dd>${escapeHtml(safe(profile.startingSemester))}</dd></div>
        </dl>
      </article>
      <div class="stats-grid" id="statsGrid">
        ${[
          {
            label: "Completed Credits",
            value: summary.completedCredits,
            sub: `${summary.completedCredits}/${summary.totalRequired} credits`,
            progress: summary.progressPercent,
          },
          {
            label: "Current Credits",
            value: summary.currentCredits,
            sub: "Running this semester",
          },
          {
            label: "Remaining Credits",
            value: summary.remainingCredits,
            sub: "Based on 124 credits",
          },
          {
            label: "Overall CGPA",
            value: formatNumber(summary.cgpa),
            sub: `${summary.countedCredits} counted credits`,
          },
          {
            label: "Completed Courses",
            value: summary.completedCourses,
            sub: "Unique counted courses",
          },
          {
            label: "Current Courses",
            value: summary.currentCourses,
            sub: "Marked as current",
          },
          {
            label: "Planned Courses",
            value: summary.plannedCourses,
            sub: "Next semester / wishlist",
          },
          {
            label: "Completed Semesters",
            value: summary.completedSemesters,
            sub: `Active: ${summary.activeSemester}`,
          },
        ]
          .map(
            (card) =>
              `<article class="stat-card"><span>${card.label}</span><strong>${card.value}</strong><small>${card.sub}</small>${card.progress !== undefined ? `<div class="progress-bar"><b style="width:${card.progress}%"></b></div>` : ""}</article>`,
          )
          .join("")}
      </div>
    </div>
    <section class="profile-edit-panel" aria-labelledby="profileDetailsHeading">
      <div class="profile-panel-head">
        <div><h3 id="profileDetailsHeading">Profile details</h3><p>${dashboardProfileEditing ? "Update your academic details and profile photo." : "Your verified identity and academic profile."}</p></div>
        <div class="profile-panel-actions">
          ${
            dashboardProfileEditing
              ? `<button class="primary-btn small-btn" type="button" data-action="save-profile"><i data-lucide="check"></i> Save</button><button class="ghost-btn small-btn" type="button" data-action="cancel-profile-edit"><i data-lucide="x"></i> Cancel</button>`
              : `<button class="secondary-btn small-btn" type="button" data-action="edit-profile"><i data-lucide="pencil"></i> Edit</button>`
          }
        </div>
      </div>
      ${dashboardProfileEditing ? renderDashboardProfileEditor(profile) : renderDashboardProfileView(profile)}
    </section>
  `;
  const dashboardSignOutButton = document.getElementById("accountSignOutBtn");
  if (dashboardSignOutButton)
    dashboardSignOutButton.disabled = Boolean(appAccessContext?.preview);
  if (open) openModal("dashboardModal");
  if (dashboardProfileEditing) bindDashboardPhotoDropzone();
  resolveDashboardAvatar().catch((error) =>
    console.error("Profile photo could not be displayed.", error),
  );
  refreshIcons();
}

function beginDashboardProfileEdit() {
  if (appAccessContext?.preview) return showToast("Preview mode is read-only");
  dashboardProfileEditing = true;
  resetDashboardProfileDraft();
  dashboardAvatarDraft = BracuProfile.createAvatarDraft({
    profile: appAccessContext?.profile || state.profile,
    user: appAccessContext?.user || {},
  });
  renderDashboardModal(false);
}

function cancelDashboardProfileEdit() {
  dashboardProfileEditing = false;
  resetDashboardProfileDraft();
  renderDashboardModal(false);
}

function selectDashboardPhoto(file) {
  if (!file || !dashboardAvatarDraft) return;
  try {
    dashboardAvatarDraft.chooseCustom(file);
    clearDashboardSelectedPhoto();
    dashboardSelectedPhotoUrl = URL.createObjectURL(file);
    renderDashboardModal(false);
    showToast("Custom photo ready to save");
  } catch (error) {
    showToast(error.message || "Could not use that photo");
  }
}

function chooseDashboardGooglePhoto() {
  if (!dashboardAvatarDraft) return;
  dashboardAvatarDraft.chooseGoogle();
  clearDashboardSelectedPhoto();
  renderDashboardModal(false);
}

function removeDashboardProfilePhoto() {
  if (!dashboardAvatarDraft) return;
  dashboardAvatarDraft.chooseNone();
  clearDashboardSelectedPhoto();
  renderDashboardModal(false);
}

async function saveDashboardProfile() {
  const form = $("#dashboardProfileForm");
  if (!form || !dashboardAvatarDraft || !dashboardProfileService) return;
  const errorElement = $("#dashboardProfileError");
  const saveButton = $('[data-action="save-profile"]');
  const value = (field) =>
    $(`[data-profile-field="${field}"]`, form)?.value || "";
  const avatar = dashboardAvatarDraft.snapshot();
  if (!form.reportValidity()) return;
  if (saveButton) saveButton.disabled = true;
  if (errorElement) errorElement.hidden = true;

  try {
    await dashboardProfileService.updateStudentProfile({
      studentId: value("studentId"),
      program: value("program"),
      startingTerm: value("startingTerm"),
      startingYear: value("startingYear"),
      avatarPreference: avatar.avatarPreference,
      avatarPath: avatar.avatarPath,
      photoFile: avatar.photoFile,
    });
    const freshContext = await BracuSupabase.getSessionContext({
      verifyUser: true,
    });
    const canonical = BracuProfile.normalizeCanonicalProfile(
      freshContext.profile || {},
    );
    appAccessContext = freshContext;
    const { profilePhoto: _legacyBrowserPhoto, ...serializableProfile } = {
      ...state.profile,
      ...canonical,
    };
    state.profile = serializableProfile;
    saveState(state);
    queueTrackerCloudSync(state);
    setSaveState("Profile synced");
    dashboardProfileEditing = false;
    resetDashboardProfileDraft();
    dashboardAvatarResolvedKey = "";
    renderReport();
    renderDashboardModal(false);
    showToast("Profile updated");
  } catch (error) {
    console.error("Profile could not be updated.", error);
    if (errorElement) {
      errorElement.textContent =
        error.message || "Could not update your profile.";
      errorElement.hidden = false;
    }
    showToast(error.message || "Could not update your profile");
  } finally {
    if (saveButton?.isConnected) saveButton.disabled = false;
  }
}

function renderCourseList() {
  const departmentFilter = $("#departmentFilter");
  const currentDepartmentValue = departmentFilter.value || "all";
  departmentFilter.innerHTML =
    `<option value="all">All departments</option>` +
    state.departments
      .map((dept) => `<option value="${dept.id}">${BracuCatalog.departmentDisplayId(dept.id)}</option>`)
      .join("");
  departmentFilter.value = state.departments.some(
    (d) => d.id === currentDepartmentValue,
  )
    ? currentDepartmentValue
    : "all";

  const query = ($("#courseSearch").value || "").toLowerCase().trim();
  const statusFilter = $("#statusFilter").value || "all";
  const deptFilter = $("#departmentFilter").value || "all";
  const curriculumFieldFilter = $("#curriculumFieldFilter").value || "all";

  const courses = state.courses
    .filter((course) => {
      if (course.isRoadmapSlot) return false;
      if (
        BracuCatalog.isAlternativeCourseCode(course.code) ||
        String(course.visibility || course.catalogVisibility || "").toLowerCase() ===
          "alternative"
      )
        return false;
      const status = getCourseStatus(state, course.code);
      const prereq = checkPrerequisites(state, course);
      const text =
        `${course.code} ${course.title} ${course.department} ${course.category} ${(course.hardPrerequisites || []).join(" ")} ${(course.softPrerequisites || []).join(" ")}`.toLowerCase();
      return (
        (!query || text.includes(query)) &&
        (deptFilter === "all" || course.department === deptFilter) &&
        BracuCatalog.matchesCurriculumField(course.category, curriculumFieldFilter) &&
        (statusFilter === "all" ||
          status === statusFilter ||
          (statusFilter === "locked" && !prereq.eligible))
      );
    })
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  $("#courseList").innerHTML = courses.length
    ? courses
        .map((course) => {
          const status = getCourseStatus(state, course.code);
          const prereq = checkPrerequisites(state, course);
          const removeButton =
            course.catalogOrigin === "global"
              ? ""
              : `<button class="danger-btn small-btn" data-action="remove-course" data-code="${course.code}" type="button"><i data-lucide="trash-2"></i> Remove</button>`;
          return `
      <article class="list-course-card" data-status="${status}">
        <div class="list-top">
          <div><strong>${formatCode(course.code)}</strong><h3>${escapeHtml(course.title)}</h3></div>
          <span class="badge status-badge status-${status}">${statusLabel(status)}</span>
        </div>
        <div class="card-meta"><span class="badge">${BracuCatalog.departmentDisplayId(course.department)}</span><span class="badge">${course.credits} credits</span>${renderCategoryBadge(state, course.category)}</div>
        <div class="course-prereq-row">${renderPrereqBadge(state, "HP", course.hardPrerequisites)}${renderPrereqBadge(state, "SP", course.softPrerequisites)}</div>
        <div class="button-row"><button class="secondary-btn small-btn" data-action="edit-course" data-code="${course.code}" type="button">Edit</button>${removeButton}</div>
      </article>
    `;
        })
        .join("")
    : `<div class="empty-state">No course found with current filters.</div>`;
  refreshIcons();
}

function closeStreamCategoryTooltips(except = null) {
  $all(".stream-category-trigger.tooltip-open").forEach((trigger) => {
    if (trigger === except) return;
    trigger.classList.remove("tooltip-open");
    trigger.setAttribute("aria-expanded", "false");
  });
}

function openCurriculumField(fieldId) {
  const curriculumFieldFilter = document.getElementById("curriculumFieldFilter");
  const coursesSection = document.getElementById("courses");
  if (!curriculumFieldFilter || !coursesSection || !fieldId) return;
  curriculumFieldFilter.value = fieldId;
  renderCourseList();
  coursesSection.scrollIntoView({ behavior: "smooth", block: "start" });
  curriculumFieldFilter.focus({ preventScroll: true });
}

function renderDepartments() {
  $("#departmentGrid").innerHTML = state.departments
    .map((dept) => {
      const courses = state.courses.filter(
        (course) => course.department === dept.id && !course.isRoadmapSlot,
      );
      const completed = courses.filter(
        (course) => getCourseStatus(state, course.code) === "completed",
      ).length;
      return `
      <article class="department-card">
        <div class="department-top"><div><h3>${BracuCatalog.departmentDisplayId(dept.id)}</h3><p>${escapeHtml(dept.name)}</p></div><button class="secondary-btn small-btn" data-action="edit-department" data-dept-id="${dept.id}" type="button">Edit</button></div>
        <ul>
          <li><span>Total courses</span><strong>${courses.length}</strong></li>
          <li><span>Completed</span><strong>${completed}</strong></li>
          <li><span>Program core</span><strong>${courses.filter((c) => c.category === "program-core").length}</strong></li>
          <li><span>Electives</span><strong>${courses.filter((c) => c.category === "program-elective").length}</strong></li>
        </ul>
      </article>
    `;
    })
    .join("");
}

function getReportAttemptTag(state, attempt, bestIds, attemptsByCode) {
  const sameCodeAttempts = attemptsByCode.get(attempt.code) || [];
  const completedGradedAttempts = sameCodeAttempts.filter(
    (item) =>
      item.status === "completed" &&
      attemptGradePoint(state, item) !== null &&
      attemptGradePoint(state, item) !== undefined,
  );
  const repeatType =
    [...sameCodeAttempts]
      .reverse()
      .find((item) => ["RP", "RT"].includes(item.repeatType))?.repeatType ||
    (completedGradedAttempts.length > 1 ? "RT" : "");

  if (completedGradedAttempts.length > 1 && attempt.status === "completed") {
    return bestIds.has(attempt.id) ? ` (${repeatType})` : " (NT)";
  }

  return attempt.repeatType ? ` (${attempt.repeatType})` : "";
}

function reportCell(value) {
  return `<span class="report-cell-text">${value}</span>`;
}

function renderReportWatermarks(itemCount = 1) {
  const count = Math.max(1, Math.ceil(Number(itemCount || 1) / 4));
  return `<div class="report-watermark-layer" aria-hidden="true">${Array.from({ length: count }, () => `<span>NOT FOR OFFICIAL USE</span>`).join("")}</div>`;
}

function renderReport() {
  const summary = calculateSummary(state);
  const profile = state.profile;
  const date = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const reportWebsiteUrl = resolveReportWebsiteUrl(
    DEFAULT_DATA.program.websiteUrl,
    window.location.href,
  );
  const bestIds = getBestAttemptIds(state);
  const allAttempts = getAllAttempts(state);
  const attemptsByCode = new Map();

  allAttempts.forEach((attempt) => {
    if (!attemptsByCode.has(attempt.code)) attemptsByCode.set(attempt.code, []);
    attemptsByCode.get(attempt.code).push(attempt);
  });

  const semestersHtml = state.semesters.length
    ? state.semesters
        .map((semester, index) => {
          const semGpa = calculateSemesterGpa(state, semester);
          const cumulative = calculateCumulativeAfterSemester(state, index);
          const semesterAttempts = semester.courses || [];
          const rows = semesterAttempts
            .map((attempt) => {
              const course = courseByCode(state, attempt.code) || {
                code: attempt.code,
                title: "Unknown",
                credits: 0,
              };
              const faculty = state.faculties.find(
                (item) => item.id === attempt.facultyId,
              );
              const counted = bestIds.has(attempt.id);
              const point = counted ? attemptGradePoint(state, attempt) : null;
              const tag = getReportAttemptTag(
                state,
                attempt,
                bestIds,
                attemptsByCode,
              );
              const displayCredits =
                counted || attempt.status !== "completed"
                  ? attempt.creditsOverride || course.credits || 0
                  : 0;
              const displayGrade = counted
                ? escapeHtml(attempt.grade || "")
                : "";
              const displayPoint =
                point !== null && point !== undefined
                  ? Number(point).toFixed(1)
                  : "";
              const facultyText = faculty
                ? `${escapeHtml(faculty.name)} ${faculty.initial ? `(${escapeHtml(faculty.initial)})` : ""}`
                : "";

              return `<tr>
        <td>${reportCell(`${formatCode(course.code)}${tag}`)}</td>
        <td>${reportCell(escapeHtml(course.title))}</td>
        <td>${reportCell(displayCredits)}</td>
        <td>${reportCell(escapeHtml(statusLabel(attempt.status || "")))}</td>
        <td>${reportCell(displayGrade)}</td>
        <td>${reportCell(displayPoint)}</td>
        <td>${reportCell(facultyText)}</td>
      </tr>`;
            })
            .join("");

          return `
      <section class="report-semester-block">
        <h3>Semester ${semester.number || index + 1} — ${escapeHtml(semester.name)}</h3>
        <table class="report-grade-table">
          <colgroup>
            <col class="report-col-code" />
            <col class="report-col-course" />
            <col class="report-col-credit" />
            <col class="report-col-status" />
            <col class="report-col-grade" />
            <col class="report-col-gp" />
            <col class="report-col-faculty" />
          </colgroup>
          <thead><tr><th>${reportCell("Code")}</th><th>${reportCell("Course")}</th><th>${reportCell("Credit")}</th><th>${reportCell("Status")}</th><th>${reportCell("Grade")}</th><th>${reportCell("GP")}</th><th>${reportCell("Faculty")}</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="7">${reportCell("No courses added.")}</td></tr>`}</tbody>
        </table>
        <div class="semester-report-summary"><span>Semester GPA: <strong>${formatNumber(semGpa.gpa)}</strong></span><span>Overall CGPA: <strong>${formatNumber(cumulative.gpa)}</strong></span></div>
      </section>
    `;
        })
        .join("")
    : `<p>No semester data has been added yet.</p>`;

  const plannedRows = allAttempts
    .filter((attempt) => attempt.status === "planned")
    .map((attempt) => {
      const course = courseByCode(state, attempt.code) || {
        code: attempt.code,
        title: "Unknown",
        credits: 0,
      };
      const tag = getReportAttemptTag(state, attempt, bestIds, attemptsByCode);
      return `<tr><td>${reportCell(`${formatCode(course.code)}${tag}`)}</td><td>${reportCell(escapeHtml(course.title))}</td><td>${reportCell(attempt.creditsOverride || course.credits || 0)}</td></tr>`;
    })
    .join("");

  $("#reportContent").innerHTML = `
    <h2>BRACU Course Tracker Academic Progress Report</h2>
    <p>Generated on ${date}</p>
    <table class="report-profile-table">
      <colgroup><col class="report-profile-label" /><col class="report-profile-value" /><col class="report-profile-label" /><col class="report-profile-value" /></colgroup>
      <tbody>
        <tr><th>${reportCell("Name")}</th><td>${reportCell(escapeHtml(safe(profile.name, "Student Name")))}</td><th>${reportCell("Student ID")}</th><td>${reportCell(escapeHtml(safe(profile.studentId)))}</td></tr>
        <tr><th>${reportCell("Email")}</th><td>${reportCell(escapeHtml(safe(profile.email)))}</td><th>${reportCell("Program")}</th><td>${reportCell(escapeHtml(safe(profile.program, DEFAULT_DATA.program.name)))}</td></tr>
        <tr><th>${reportCell("University")}</th><td>${reportCell(escapeHtml(safe(profile.university, DEFAULT_DATA.program.university)))}</td><th>${reportCell("Starting Semester")}</th><td>${reportCell(escapeHtml(safe(profile.startingSemester || profile.batch)))}</td></tr>
      </tbody>
    </table>
    <div class="report-metrics"><div class="report-metric"><span>Required Credits</span><strong>${summary.totalRequired}</strong></div><div class="report-metric"><span>Completed Credits</span><strong>${summary.completedCredits}</strong></div><div class="report-metric"><span>Remaining Credits</span><strong>${summary.remainingCredits}</strong></div><div class="report-metric"><span>Overall CGPA</span><strong>${formatNumber(summary.cgpa)}</strong></div></div>
    <section class="report-academic-results">
      ${renderReportWatermarks(Math.max(1, allAttempts.length))}
      <h3>Semester-wise Grade Sheet</h3>
      ${semestersHtml}
      <section class="report-planned-block">
        <h3>Planned / Wishlist Courses</h3>
        <table class="report-planned-table">
          <colgroup><col class="report-planned-code" /><col class="report-planned-course" /><col class="report-planned-credit" /></colgroup>
          <thead><tr><th>${reportCell("Code")}</th><th>${reportCell("Course")}</th><th>${reportCell("Credits")}</th></tr></thead>
          <tbody>${plannedRows || `<tr><td colspan="3">${reportCell("No planned courses added.")}</td></tr>`}</tbody>
        </table>
      </section>
    </section>
    <footer class="report-footer">Generated from ${escapeHtml(reportWebsiteUrl)}. Developed by ${escapeHtml(DEFAULT_DATA.program.developerName || "SK Reyad Ali")}. GitHub: ${escapeHtml(DEFAULT_DATA.program.githubUrl || "")}. LinkedIn: ${escapeHtml(DEFAULT_DATA.program.linkedinUrl || "")}</footer>
  `;
}

function renderSettings() {
  renderFacultyEditor();
  renderGradeEditor();
  renderBackupEditor();
  renderCloudEditor();
}

function facultyDepartmentLabel(id) {
  const department = state.departments.find((item) => item.id === id);
  return department
    ? `${BracuCatalog.departmentDisplayId(department.id)} — ${department.name}`
    : BracuCatalog.departmentDisplayId(id) || "Not assigned";
}

function validateFacultyDraft(draft, { excludeId = "" } = {}) {
  const name = String(draft?.name || "").trim();
  const initial = String(draft?.initial || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const email = String(draft?.email || "").trim();
  const department = String(draft?.department || "").trim();
  if (!name || !initial)
    return { error: "Faculty name and initial are required" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid faculty email" };
  if (!state.departments.some((item) => item.id === department))
    return { error: "Select an existing department" };
  const duplicate = state.faculties.some(
    (faculty) =>
      faculty.id !== excludeId &&
      String(faculty.initial || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "") === initial,
  );
  if (duplicate) return { error: "Faculty initial already exists" };
  return { value: { name, initial, email, department } };
}

function facultyEditDraft(facultyId) {
  if (editingFacultyId === facultyId && facultyEditDraftState)
    return facultyEditDraftState.snapshot();
  const fieldValue = (field) =>
    document.querySelector(
      `[data-faculty-draft="${facultyId}"][data-field="${field}"]`,
    )?.value;
  return {
    name: fieldValue("name"),
    email: fieldValue("email"),
    initial: fieldValue("initial"),
    department: fieldValue("department"),
  };
}

function facultyDepartmentFilterOptions(selected = "") {
  return (
    '<option value="">All departments</option>' +
    state.departments
      .map(
        (department) =>
          `<option value="${escapeHtml(department.id)}" ${department.id === selected ? "selected" : ""}>${escapeHtml(BracuCatalog.departmentDisplayId(department.id))} — ${escapeHtml(department.name)}</option>`,
      )
      .join("")
  );
}

function facultyRowMarkup(faculty) {
  const isEditing = editingFacultyId === faculty.id;
  const displayedFaculty =
    isEditing && facultyEditDraftState
      ? facultyEditDraftState.snapshot()
      : faculty;
  if (isEditing)
    return `<article class="faculty-row faculty-row-editing" data-faculty-id="${faculty.id}">
          <label>Faculty name<input value="${escapeHtml(displayedFaculty.name)}" data-faculty-draft="${faculty.id}" data-field="name" autocomplete="off" /></label>
          <label>Email <span class="field-optional">optional</span><input type="email" value="${escapeHtml(displayedFaculty.email || "")}" data-faculty-draft="${faculty.id}" data-field="email" autocomplete="off" /></label>
          <label>Initial<input value="${escapeHtml(displayedFaculty.initial || "")}" data-faculty-draft="${faculty.id}" data-field="initial" maxlength="20" autocomplete="off" /></label>
          <label>Department<select data-faculty-draft="${faculty.id}" data-field="department">${departmentOptions(displayedFaculty.department)}</select></label>
          <div class="faculty-edit-actions">
            <button class="primary-btn" type="button" data-action="save-faculty-edit" data-faculty-id="${faculty.id}"><i data-lucide="check"></i> Save</button>
            <button class="ghost-btn" type="button" data-action="cancel-faculty-edit"><i data-lucide="x"></i> Cancel</button>
            <button class="danger-btn" type="button" data-action="delete-faculty" data-faculty-id="${faculty.id}"><i data-lucide="trash-2"></i> Delete</button>
          </div>
        </article>`;
  return `<article class="faculty-row" data-faculty-id="${faculty.id}">
        <div class="faculty-row-summary">
          <span class="faculty-row-initial">${escapeHtml(faculty.initial || "—")}</span>
          <div><strong>${escapeHtml(faculty.name || "Unnamed faculty")}</strong><small>${escapeHtml(faculty.email || "Email not added")}</small></div>
          <span class="faculty-row-department">${escapeHtml(facultyDepartmentLabel(faculty.department))}</span>
        </div>
        <button class="secondary-btn" type="button" data-action="edit-faculty" data-faculty-id="${faculty.id}"><i data-lucide="pencil"></i> Edit</button>
      </article>`;
}

function renderFacultyList() {
  const list = $("#facultyList");
  const count = $("#facultyFilterCount");
  if (!list || !count) return;
  const allFaculties = getFacultiesAlphabetically();
  const visibleFaculties = BracuCatalog.filterCatalogItems("faculty", allFaculties, {
    query: facultySearchQuery,
    department: facultyDepartmentFilter,
    preserveKey: editingFacultyId,
  });
  count.textContent = `${visibleFaculties.length} of ${allFaculties.length} ${allFaculties.length === 1 ? "faculty member" : "faculty members"}`;
  list.innerHTML = visibleFaculties.length
    ? visibleFaculties.map(facultyRowMarkup).join("")
    : `<div class="empty-state">${allFaculties.length ? "No matching faculty. Try changing your search or department." : "No faculty added yet."}</div>`;
  refreshIcons();
}

function renderFacultyEditor() {
  $("#facultyEditor").innerHTML = `
    <div class="editor-card">
      <h3>Add Faculty</h3>
      <form id="facultyForm" class="stacked-form">
        <label>Faculty Name<input id="facultyName" placeholder="Example: Ahmed Mahir Ruhan" /></label>
        <label>Faculty Email<input id="facultyEmail" type="email" placeholder="example@bracu.ac.bd" /></label>
        <label>Faculty Initial<input id="facultyInitial" placeholder="Example: ADU" /></label>
        <label>Faculty Department<select id="facultyDepartment">${departmentOptions()}</select></label>
        <button class="primary-btn" type="submit">Add faculty</button>
      </form>
    </div>
    <div class="faculty-filter-bar" aria-label="Faculty filters">
      <label class="faculty-search"><span>Search faculty</span><input id="facultySearch" type="search" value="${escapeHtml(facultySearchQuery)}" placeholder="Search initial, name, or email" autocomplete="off" /></label>
      <label><span>Department</span><select id="facultyDepartmentFilter">${facultyDepartmentFilterOptions(facultyDepartmentFilter)}</select></label>
      <p id="facultyFilterCount" class="faculty-filter-count" role="status" aria-live="polite"></p>
    </div>
    <div id="facultyList" class="faculty-list"></div>`;
  renderFacultyList();
}

function renderGradeEditor() {
  const scale = DEFAULT_DATA.gradeScale || state.gradeScale || [];
  $("#gradeEditor").innerHTML = `<section class="grade-scale-panel" aria-labelledby="gradeScaleTitle">
    <div class="grade-scale-heading"><div><h3 id="gradeScaleTitle">BRACU unified grading scale</h3><p>This official scale is used for all CGPA calculations.</p></div><span class="grade-scale-lock"><i data-lucide="lock-keyhole"></i> Fixed scale</span></div>
    <div class="grade-scale-table-wrap" tabindex="0"><table class="grade-scale-table"><thead><tr><th scope="col">Grade</th><th scope="col">Grade point</th><th scope="col">Marks range</th></tr></thead><tbody>${scale.map((item) => `<tr><th scope="row">${escapeHtml(item.grade)}</th><td>${item.point === null || item.point === undefined ? "—" : escapeHtml(Number(item.point).toFixed(1).replace(/\.0$/, ""))}</td><td>${escapeHtml(item.range || "—")}</td></tr>`).join("")}</tbody></table></div>
  </section>`;
}

function renderBackupEditor() {
  $("#backupEditor").innerHTML =
    `<div class="editor-grid"><div class="editor-card"><h3>Export Backup</h3><p>Download all data as JSON.</p><button class="primary-btn" id="exportBackupBtn" type="button">Export JSON</button></div><div class="editor-card"><h3>Import Backup</h3><p>Restore a previously exported JSON backup.</p><input class="file-input" id="importBackupInput" type="file" accept="application/json" /></div><div class="editor-card"><h3>Reset</h3><p>Clear localStorage and return to default data.</p><button class="danger-btn" id="resetDataBtn" type="button">Reset all data</button></div></div>`;
}

function renderCloudEditor() {
  const profile = state.profile || {};
  const isPreview = Boolean(appAccessContext?.preview);
  const syncLabel = isPreview
    ? "Cloud sync is disabled in Preview mode."
    : "Your tracker is connected to your signed-in account and syncs automatically.";
  $("#cloudEditor").innerHTML = `
    <div class="editor-grid">
      <div class="editor-card full">
        <div class="account-sync-heading"><span class="account-sync-icon"><i data-lucide="cloud"></i></span><div><h3>Account &amp; Sync</h3><p>${syncLabel}</p></div></div>
      </div>
      <div class="editor-card account-summary-card">
        <span>Signed in as</span><strong>${escapeHtml(profile.name || "BRACU student")}</strong><small>${escapeHtml(profile.email || "")}</small>
      </div>
      <div class="editor-card account-summary-card">
        <span>Last local update</span><strong>${state.settings.lastUpdated ? new Date(state.settings.lastUpdated).toLocaleString() : "Not synced yet"}</strong><small>Automatic sync is debounced to keep editing fast.</small>
      </div>
      <div class="editor-card full account-sync-actions">
        <button class="primary-btn" id="syncNowBtn" type="button" ${isPreview ? "disabled" : ""}><i data-lucide="refresh-cw"></i> Sync now</button>
      </div>
    </div>`;
}

function departmentOptions(selected = "") {
  return state.departments
    .map(
      (dept) =>
        `<option value="${dept.id}" ${selected === dept.id ? "selected" : ""}>${BracuCatalog.departmentDisplayId(dept.id)} — ${escapeHtml(dept.name)}</option>`,
    )
    .join("");
}
function categoryOptions(selected = "") {
  const categories = new Map(
    DEFAULT_DATA.categories.map((category) => [category.id, category.label]),
  );
  BracuCatalog.curriculumFieldOptions().forEach((field) =>
    field.categories.forEach((category) => {
      if (!categories.has(category))
        categories.set(category, BracuCatalog.categoryDisplayLabel(category));
    }),
  );
  if (selected && !categories.has(selected))
    categories.set(selected, BracuCatalog.categoryDisplayLabel(selected));
  return [...categories]
    .map(
      ([id, label]) =>
        `<option value="${escapeHtml(id)}" ${selected === id ? "selected" : ""}>${escapeHtml(label)}</option>`,
    )
    .join("");
}

function addSemester(term, year) {
  const result = validateSemesterChoice(term, year);
  if (result.error) {
    showToast(result.error);
    return false;
  }
  state.semesters.push({
    id: uid("sem"),
    number: state.semesters.length + 1,
    name: result.value.name,
    courses: [],
  });
  persist("Semester added");
  return true;
}

function addAttempt(data) {
  const semester = state.semesters.find((item) => item.id === data.semesterId);
  if (!semester) return showToast("Add a semester first");
  const course = courseByCode(state, data.code);
  if (!course) return showToast("Select a valid course");
  if (data.status === "current") data.grade = "";
  if (data.status === "planned") {
    data.grade = "";
    data.facultyId = "";
  }
  const gradePoint = data.grade ? getGradePoint(state, data.grade) : null;
  semester.courses = semester.courses || [];
  semester.courses.push({
    id: uid("attempt"),
    code: data.code,
    status: data.status,
    repeatType: data.repeatType || "",
    grade: data.grade,
    gradePoint,
    facultyId: data.facultyId,
    creditsOverride: course?.credits || 0,
    countsInCGPA: data.status === "completed",
    createdAt: new Date().toISOString(),
  });
  persist("Course attempt added");
}

function findAttempt(semesterId, attemptId) {
  const semester = state.semesters.find((item) => item.id === semesterId);
  const attempt = semester?.courses?.find((item) => item.id === attemptId);
  return { semester, attempt };
}
function updateAttempt(semesterId, attemptId, field, value) {
  const { attempt } = findAttempt(semesterId, attemptId);
  if (!attempt) return;
  if (field === "creditsOverride") attempt[field] = Number(value || 0);
  else attempt[field] = value;
  if (field === "grade")
    attempt.gradePoint = value ? getGradePoint(state, value) : null;
  if (field === "status") {
    attempt.countsInCGPA = value === "completed";
    if (value === "current") {
      attempt.grade = "";
      attempt.gradePoint = null;
    }
    if (value === "planned") {
      attempt.grade = "";
      attempt.gradePoint = null;
      attempt.facultyId = "";
    }
  }
  persist("Attempt updated");
}
function deleteAttempt(semesterId, attemptId) {
  const semester = state.semesters.find((item) => item.id === semesterId);
  if (!semester) return;
  semester.courses = semester.courses.filter((item) => item.id !== attemptId);
  persist("Course removed");
}

function openCourseModal(code = null) {
  editingCourseCode = code;
  if (!code) {
    openCourseCatalogPicker();
    return;
  }
  const course = code
    ? state.courses.find((item) => item.code === code)
    : {
        code: "",
        title: "",
        credits: 3,
        department: state.departments[0]?.id || "CSE",
        category: "custom",
        roadmapLevel: "",
        hardPrerequisites: [],
        softPrerequisites: [],
        sourceNote: "Custom course",
      };
  $("#courseModalTitle").textContent = `Edit ${code}`;
  $("#courseForm").innerHTML = `
    <label class="editor-card">Course Code<input name="code" value="${escapeHtml(course.code)}" required /></label>
    <label class="editor-card">Course Title<input name="title" value="${escapeHtml(course.title)}" required /></label>
    <label class="editor-card">Credits<input name="credits" type="number" step="0.5" value="${course.credits ?? 3}" /></label>
    <label class="editor-card">Department<select name="department">${departmentOptions(course.department)}</select></label>
    <label class="editor-card">Category<select name="category">${categoryOptions(course.category)}</select></label>
    <label class="editor-card">Roadmap Semester<input name="roadmapLevel" type="number" min="1" max="12" value="${course.roadmapLevel || ""}" placeholder="Optional" /></label>
    <label class="editor-card">Hard Prerequisites<input name="hardPrerequisites" value="${(course.hardPrerequisites || []).join(", ")}" /></label>
    <label class="editor-card">Soft Prerequisites<input name="softPrerequisites" value="${(course.softPrerequisites || []).join(", ")}" /></label>
    <label class="editor-card full">Source Note<textarea name="sourceNote">${escapeHtml(course.sourceNote || "")}</textarea></label>
    <div class="button-row full"><button class="primary-btn" type="submit">Save course</button><button class="ghost-btn" type="button" data-close-modal="courseModal"><i data-lucide="x"></i> Cancel</button></div>`;
  openModal("courseModal");
}

function catalogDepartmentOptions(selected = "") {
  const departments = [
    ...new Set(
      availableCatalogCourses
        .map((course) => String(course.department || "").trim().toUpperCase())
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right));
  return [
    `<option value="">All departments</option>`,
    ...departments.map((department) => {
      const details = state.departments.find(
        (item) => String(item.id || "").toUpperCase() === department,
      );
      const label = details?.name
        ? `${department} — ${details.name}`
        : department;
      return `<option value="${escapeHtml(department)}" ${department === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
    }),
  ].join("");
}

function courseAlreadyAdded(code) {
  const key = BracuCatalog.normalizeCatalogKey("course", code);
  return state.courses.some(
    (course) => BracuCatalog.normalizeCatalogKey("course", course) === key,
  );
}

function renderCourseCatalogResults() {
  const resultsElement = $("#courseCatalogResults");
  if (!resultsElement) return;
  const query = $("#courseCatalogSearch")?.value || "";
  const department = $("#courseCatalogDepartment")?.value || "";
  const matches = BracuCatalog.searchCatalogCourses(availableCatalogCourses, {
    query,
    department,
  });
  const visible = matches.slice(0, 50);
  const countElement = $("#courseCatalogCount");
  if (countElement) {
    countElement.textContent = matches.length > visible.length
      ? `${visible.length} of ${matches.length} matches`
      : `${matches.length} ${matches.length === 1 ? "match" : "matches"}`;
  }
  if (!visible.length) {
    resultsElement.innerHTML = `
      <div class="catalog-course-empty">
        <i data-lucide="search-x" aria-hidden="true"></i>
        <strong>No matching courses</strong>
        <span>Try a course code, title, or another department.</span>
      </div>`;
    refreshIcons();
    return;
  }

  resultsElement.innerHTML = visible
    .map((course) => {
      const added = courseAlreadyAdded(course.code);
      const creditsMissing =
        course.credits === null ||
        course.credits === undefined ||
        course.credits === "";
      const curriculum =
        String(course.visibility || "curriculum").toLowerCase() === "curriculum";
      return `
        <article class="catalog-course-result" data-catalog-course-row="${escapeHtml(course.code)}">
          <div class="catalog-course-code">${escapeHtml(course.code)}</div>
          <div class="catalog-course-copy">
            <strong>${escapeHtml(course.title || "Untitled course")}</strong>
            ${curriculum ? `<span class="catalog-course-plan-badge">CS degree plan</span>` : ""}
          </div>
          <div class="catalog-course-meta">
            <span>${escapeHtml(BracuCatalog.departmentDisplayId(course.department) || "Department not set")}</span>
            ${creditsMissing
              ? `<label class="catalog-credit-input">Credits<input data-catalog-credits="${escapeHtml(course.code)}" type="number" min="0" max="20" step="0.5" inputmode="decimal" placeholder="Required" ${added ? "disabled" : ""} /></label>`
              : `<span>${Number(course.credits)} ${Number(course.credits) === 1 ? "credit" : "credits"}</span>`}
          </div>
          <button class="${added ? "secondary-btn" : "primary-btn"} small-btn" type="button" data-action="add-catalog-course" data-add-catalog-course="${escapeHtml(course.code)}" ${added ? "disabled" : ""}>
            ${added ? `<i data-lucide="check"></i> Added` : `<i data-lucide="plus"></i> Add`}
          </button>
        </article>`;
    })
    .join("");
  refreshIcons();
}

function openCourseCatalogPicker() {
  $("#courseModalTitle").textContent = "Add a course";
  $("#courseForm").innerHTML = `
    <div class="catalog-course-picker full">
      <p class="catalog-course-intro">Search all BRACU courses. Adding one places it in your Course List.</p>
      <div class="catalog-course-filters">
        <label>
          <span class="sr-only">Search courses</span>
          <input id="courseCatalogSearch" type="search" autocomplete="off" placeholder="Search course code or title" />
        </label>
        <label>
          <span class="sr-only">Filter by department</span>
          <select id="courseCatalogDepartment">${catalogDepartmentOptions()}</select>
        </label>
      </div>
      <div class="catalog-course-summary">
        <span>Search results</span>
        <span id="courseCatalogCount" role="status"></span>
      </div>
      <div id="courseCatalogResults" class="catalog-course-results"></div>
    </div>`;
  openModal("courseModal");
  renderCourseCatalogResults();
  $("#courseCatalogSearch")?.addEventListener(
    "input",
    renderCourseCatalogResults,
  );
  $("#courseCatalogDepartment")?.addEventListener(
    "change",
    renderCourseCatalogResults,
  );
  $("#courseCatalogSearch")?.focus();
}

function saveCourseFromForm(form) {
  const fd = new FormData(form);
  const newCode = normalizeCode(fd.get("code"));
  if (!newCode) return showToast("Course code is required");
  const payload = {
    code: newCode,
    title: String(fd.get("title") || "").trim(),
    credits: Number(fd.get("credits") || 0),
    department: fd.get("department"),
    category: fd.get("category"),
    roadmapLevel: fd.get("roadmapLevel")
      ? Number(fd.get("roadmapLevel"))
      : null,
    hardPrerequisites: String(fd.get("hardPrerequisites") || "")
      .split(",")
      .map(normalizeCode)
      .filter(Boolean),
    softPrerequisites: String(fd.get("softPrerequisites") || "")
      .split(",")
      .map(normalizeCode)
      .filter(Boolean),
    sourceNote: String(fd.get("sourceNote") || "").trim(),
  };
  if (!payload.title) return showToast("Course title is required");
  if (editingCourseCode) {
    const existingCourse = state.courses.find(
      (course) => course.code === editingCourseCode,
    );
    const catalogEdit =
      typeof BracuCatalog !== "undefined"
        ? BracuCatalog.prepareCatalogEdit("course", existingCourse, payload)
        : { item: payload };
    const nextCourse = catalogEdit.item;
    if (
      editingCourseCode !== newCode &&
      state.courses.some((course) => course.code === newCode)
    )
      return showToast("Another course already uses this code");
    if (catalogEdit.catalogTombstoneKey)
      BracuCatalog.markCatalogDeleted(state, "course", {
        code: catalogEdit.catalogTombstoneKey,
        catalogOrigin: "global",
        catalogKey: catalogEdit.catalogTombstoneKey,
      });
    state.courses = state.courses.map((course) =>
      course.code === editingCourseCode ? nextCourse : course,
    );
    state.courses.forEach((course) => {
      course.hardPrerequisites = (course.hardPrerequisites || []).map((code) =>
        code === editingCourseCode ? newCode : code,
      );
      course.softPrerequisites = (course.softPrerequisites || []).map((code) =>
        code === editingCourseCode ? newCode : code,
      );
    });
    state.semesters.forEach((semester) =>
      semester.courses?.forEach((attempt) => {
        if (attempt.code === editingCourseCode) attempt.code = newCode;
      }),
    );
  } else {
    if (state.courses.some((course) => course.code === newCode))
      return showToast("This course code already exists");
    state.courses.push(payload);
  }
  closeModal("courseModal");
  persist("Course saved");
}

function removeCourse(code) {
  const removedCourse = state.courses.find((course) => course.code === code);
  if (removedCourse?.catalogOrigin === "global") {
    showToast("Shared catalog courses cannot be removed from the Course List");
    return;
  }
  const used = getAllAttempts(state).some((attempt) => attempt.code === code);
  if (
    used &&
    !confirm(
      "This course is used in My Path. Remove it and all related attempts?",
    )
  )
    return;
  if (!used && !confirm(`Remove ${code}?`)) return;
  if (typeof BracuCatalog !== "undefined")
    BracuCatalog.markCatalogDeleted(state, "course", removedCourse);
  state.courses = state.courses.filter((course) => course.code !== code);
  state.courses.forEach((course) => {
    course.hardPrerequisites = (course.hardPrerequisites || []).filter(
      (item) => item !== code,
    );
    course.softPrerequisites = (course.softPrerequisites || []).filter(
      (item) => item !== code,
    );
  });
  state.semesters.forEach((semester) => {
    semester.courses = (semester.courses || []).filter(
      (attempt) => attempt.code !== code,
    );
  });
  persist("Course removed");
}

function openDepartmentModal(id = null) {
  editingDepartmentId = id;
  const dept = id
    ? state.departments.find((item) => item.id === id)
    : { id: "", name: "", color: "blue" };
  $("#departmentModalTitle").textContent = id ? `Edit ${id}` : "Add Department";
  $("#departmentForm").innerHTML =
    `<label class="editor-card">Department Code<input name="id" value="${escapeHtml(dept.id)}" required /></label><label class="editor-card">Department Name<input name="name" value="${escapeHtml(dept.name)}" required /></label><label class="editor-card">Color Note<input name="color" value="${escapeHtml(dept.color || "blue")}" /></label><div class="button-row full"><button class="primary-btn" type="submit">Save department</button>${id ? `<button class="danger-btn" type="button" data-action="remove-department" data-dept-id="${id}"><i data-lucide="trash-2"></i> Remove department</button>` : ""}<button class="ghost-btn" type="button" data-close-modal="departmentModal"><i data-lucide="x"></i> Cancel</button></div>`;
  openModal("departmentModal");
}

function saveDepartmentFromForm(form) {
  const fd = new FormData(form);
  const newId = normalizeCode(fd.get("id"));
  const name = String(fd.get("name") || "").trim();
  if (!newId || !name)
    return showToast("Department code and name are required");
  const payload = {
    id: newId,
    name,
    color: String(fd.get("color") || "blue").trim(),
  };
  if (editingDepartmentId) {
    const existingDepartment = state.departments.find(
      (department) => department.id === editingDepartmentId,
    );
    const catalogEdit =
      typeof BracuCatalog !== "undefined"
        ? BracuCatalog.prepareCatalogEdit(
            "department",
            existingDepartment,
            payload,
          )
        : { item: payload };
    const nextDepartment = catalogEdit.item;
    if (
      editingDepartmentId !== newId &&
      state.departments.some((dept) => dept.id === newId)
    )
      return showToast("Another department already uses this code");
    if (catalogEdit.catalogTombstoneKey)
      BracuCatalog.markCatalogDeleted(state, "department", {
        id: catalogEdit.catalogTombstoneKey,
        catalogOrigin: "global",
        catalogKey: catalogEdit.catalogTombstoneKey,
      });
    state.departments = state.departments.map((dept) =>
      dept.id === editingDepartmentId ? nextDepartment : dept,
    );
    state.courses.forEach((course) => {
      if (course.department === editingDepartmentId) course.department = newId;
    });
    state.faculties.forEach((faculty) => {
      if (faculty.department === editingDepartmentId)
        faculty.department = newId;
    });
  } else {
    if (state.departments.some((dept) => dept.id === newId))
      return showToast("This department already exists");
    state.departments.push(payload);
  }
  closeModal("departmentModal");
  persist("Department saved");
}

function removeDepartment(id) {
  if (id === "OTH") return showToast("OTH department cannot be removed");
  if (!confirm(`Remove ${id}? Courses and faculty will move to OTH.`)) return;
  const removedDepartment = state.departments.find((department) => department.id === id);
  if (typeof BracuCatalog !== "undefined")
    BracuCatalog.markCatalogDeleted(state, "department", removedDepartment);
  if (!state.departments.some((dept) => dept.id === "OTH"))
    state.departments.push({
      id: "OTH",
      name: "Other / Custom",
      color: "gray",
    });
  state.courses.forEach((course) => {
    if (course.department === id) course.department = "OTH";
  });
  state.faculties.forEach((faculty) => {
    if (faculty.department === id) faculty.department = "OTH";
  });
  state.departments = state.departments.filter((dept) => dept.id !== id);
  closeModal("departmentModal");
  persist("Department removed");
}

function openModal(id) {
  const modal = document.getElementById(id);
  modalReturnFocus = document.activeElement;
  modal.hidden = false;
  mountDotGridInModal(modal);
  refreshIcons();
}

function closeModal(id) {
  document.getElementById(id).hidden = true;
  if (id === "dashboardModal") {
    dashboardProfileEditing = false;
    resetDashboardProfileDraft();
  }
  restoreDotGridHost();
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
}

function downloadPdfReport() {
  renderReport();
  const element = document.getElementById("reportContent");
  const fileName = `bracu-cs-academic-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  if (!window.BracuReportPdf) {
    showToast("PDF generator could not load. Refresh and try again.");
    return;
  }
  window.BracuReportPdf.download({
    html2pdf: window.html2pdf,
    element,
    filename: fileName,
  }).catch(() => showToast("PDF download failed. Please try again."));
}

function bindEvents() {
  $("#themeToggle").addEventListener("click", toggleTheme);
  $("#backToTopBtn")?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  window.addEventListener("scroll", scheduleSiteChromeUpdate, {
    passive: true,
  });
  $("#openDashboardBtn").addEventListener("click", () =>
    renderDashboardModal(true),
  );
  $("#openDashboardFromRoadmap").addEventListener("click", () =>
    renderDashboardModal(true),
  );
  $("#openSettingsBtn").addEventListener("click", () =>
    openModal("settingsModal"),
  );
  $("#addSemesterBtn").addEventListener("click", () => {
    $("#semesterCreate").hidden = false;
    populateSemesterCreateOptions();
    $("#semesterTermInput").focus();
  });
  $("#cancelSemesterBtn").addEventListener("click", () => {
    $("#semesterCreate").hidden = true;
    $("#semesterTermInput").value = "";
    $("#semesterYearInput").value = "";
  });
  $("#saveSemesterBtn").addEventListener("click", () => {
    const added = addSemester(
      $("#semesterTermInput").value,
      $("#semesterYearInput").value,
    );
    if (!added) return;
    $("#semesterTermInput").value = "";
    $("#semesterYearInput").value = "";
    $("#semesterCreate").hidden = true;
  });
  $("#quickStatus").addEventListener("change", updateQuickAddVisibility);
  $("#quickAddForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const status = $("#quickStatus").value;
    addAttempt({
      semesterId: $("#quickSemester").value,
      code: resolveCourseCode($("#quickCourseSearch").value),
      status,
      repeatType: $("#quickRepeatType").value,
      grade: status === "completed" ? $("#quickGrade").value : "",
      facultyId:
        status === "planned"
          ? ""
          : resolveFacultyId($("#quickFacultySearch").value),
    });
    $("#quickCourseSearch").value = "";
    $("#quickFacultySearch").value = "";
    updateQuickAddVisibility();
  });

  // Course and department editor forms are permanent modal forms. Bind their
  // submit handlers directly so saving does not depend on document-level event delegation.
  $("#courseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!editingCourseCode) return;
    saveCourseFromForm(event.currentTarget);
  });
  $("#departmentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveDepartmentFromForm(event.currentTarget);
  });

  $("#courseSearch").addEventListener("input", renderCourseList);
  $("#statusFilter").addEventListener("change", renderCourseList);
  $("#departmentFilter").addEventListener("change", renderCourseList);
  const curriculumFieldFilter = $("#curriculumFieldFilter");
  curriculumFieldFilter.addEventListener("change", renderCourseList);
  $("#redrawLinesBtn").addEventListener("click", () => drawRoadmapLines(state));
  $("#refreshReportBtn").addEventListener("click", () => {
    renderReport();
    showToast("Report refreshed");
  });
  $("#downloadReportBtn").addEventListener("click", downloadPdfReport);
  $("#addCourseBtn").addEventListener("click", () => openCourseModal(null));
  $("#addDepartmentBtn").addEventListener("click", () =>
    openDepartmentModal(null),
  );
  window.addEventListener("resize", () => drawRoadmapLines(state));
  $("#roadmapWrapper").addEventListener("scroll", () =>
    drawRoadmapLines(state),
  );

  document.addEventListener("click", (event) => {
    const streamSeeMore = event.target.closest("[data-stream-see-more]");
    if (streamSeeMore) {
      event.preventDefault();
      event.stopPropagation();
      openCurriculumField(streamSeeMore.dataset.curriculumField);
      return;
    }
    const streamTrigger = event.target.closest(".stream-category-trigger");
    if (streamTrigger) {
      event.preventDefault();
      event.stopPropagation();
      const wasOpen = streamTrigger.classList.contains("tooltip-open");
      closeStreamCategoryTooltips();
      if (!wasOpen) {
        streamTrigger.classList.add("tooltip-open");
        streamTrigger.setAttribute("aria-expanded", "true");
      }
      return;
    }
    closeStreamCategoryTooltips();
    const facultyEmailCopyBtn = event.target.closest(
      "[data-copy-faculty-email]",
    );
    if (facultyEmailCopyBtn) {
      event.preventDefault();
      event.stopPropagation();
      copyFacultyEmail(facultyEmailCopyBtn);
      return;
    }
    const facultyTooltipTrigger = event.target.closest(
      ".has-faculty-tooltip, .has-path-faculty-tooltip",
    );
    if (facultyTooltipTrigger) {
      event.preventDefault();
      event.stopPropagation();
      openFacultyTooltip(facultyTooltipTrigger);
      return;
    }
    closeFacultyTooltips();
    const closeBtn = event.target.closest("[data-close-modal]");
    if (closeBtn) return closeModal(closeBtn.dataset.closeModal);
    if (event.target.classList.contains("modal-backdrop"))
      return closeModal(event.target.id);
    if (event.target.id === "exportBackupBtn") return exportState(state);
    if (event.target.closest("#syncNowBtn")) {
      setSaveState("Syncing…");
      syncTrackerNow(state)
        .then(() => {
          setSaveState("Synced just now");
          showToast("Your tracker is up to date");
        })
        .catch((error) => {
          console.error(error);
          if (error?.code === "SYNC_CONFLICT") {
            setSaveState("Sync conflict · local data preserved");
            showToast("Another device changed this tracker. Reload before syncing.");
          } else if (error?.code === "SYNC_BLANK_BLOCKED") {
            setSaveState("Protected from blank overwrite");
            showToast(error.message);
          } else {
            setSaveState("Sync paused");
            showToast("Could not sync right now");
          }
        });
      return;
    }
    if (event.target.closest("#accountSignOutBtn")) {
      BracuAccess.signOutAndRedirect().catch((error) => {
        console.error(error);
        showToast("Could not sign out");
      });
      return;
    }
    if (event.target.id === "resetDataBtn") {
      if (
        confirm(
          "Reset all local data? This cannot be undone unless you exported a backup.",
        )
      ) {
        state = resetState();
        state.settings = {
          ...(state.settings || {}),
          intentionalResetAt: new Date().toISOString(),
        };
        editingSemesterId = null;
        editingFacultyId = null;
        facultyEditDraftState = null;
        persist("Data reset", { allowDestructive: true });
      }
      return;
    }
    const addCatalogButton = event.target.closest("[data-add-catalog-course]");
    if (addCatalogButton) {
      if (appAccessContext?.preview)
        return showToast("Preview mode is read-only");
      const code = addCatalogButton.dataset.addCatalogCourse;
      const source = availableCatalogCourses.find(
        (course) =>
          BracuCatalog.normalizeCatalogKey("course", course) ===
          BracuCatalog.normalizeCatalogKey("course", code),
      );
      if (!source) return showToast("Course not found in the catalog");
      const row = addCatalogButton.closest("[data-catalog-course-row]");
      const creditsInput = row?.querySelector("[data-catalog-credits]");
      const result = BracuCatalog.addCatalogCourse(state, source, {
        credits: creditsInput?.value,
      });
      if (!result.added) return showToast(result.error);
      persist(`${result.course.code} added`);
      renderCourseCatalogResults();
      return;
    }
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "edit-semester") {
      editingSemesterId = target.dataset.semesterId;
      renderSemesters();
      refreshIcons();
    }
    if (action === "cancel-semester-edit") {
      editingSemesterId = null;
      renderSemesters();
      refreshIcons();
    }
    if (action === "save-semester-edit") {
      const termSelect = document.querySelector(
        `[data-semester-term-draft="${target.dataset.semesterId}"]`,
      );
      const yearSelect = document.querySelector(
        `[data-semester-year-draft="${target.dataset.semesterId}"]`,
      );
      const semester = state.semesters.find(
        (item) => item.id === target.dataset.semesterId,
      );
      const result = validateSemesterChoice(
        termSelect?.value,
        yearSelect?.value,
        target.dataset.semesterId,
      );
      if (result.error) return showToast(result.error);
      if (semester) semester.name = result.value.name;
      editingSemesterId = null;
      persist("Semester saved");
    }
    if (
      action === "delete-semester" &&
      confirm("Delete this semester and all course attempts?")
    ) {
      state.semesters = state.semesters.filter(
        (item) => item.id !== target.dataset.semesterId,
      );
      state.semesters.forEach(
        (semester, index) => (semester.number = index + 1),
      );
      editingSemesterId = null;
      persist("Semester deleted");
    }
    if (action === "delete-attempt")
      deleteAttempt(target.dataset.semesterId, target.dataset.attemptId);
    if (action === "delete-faculty") {
      const removedFaculty = state.faculties.find(
        (item) => item.id === target.dataset.facultyId,
      );
      if (!removedFaculty) return showToast("Faculty not found");
      const facultyLabel = removedFaculty.name || removedFaculty.initial;
      if (
        !confirm(
          `Delete ${facultyLabel}? Faculty assignments will be cleared from linked course attempts.`,
        )
      )
        return;
      if (typeof BracuCatalog !== "undefined")
        BracuCatalog.markCatalogDeleted(state, "faculty", removedFaculty);
      state.faculties = state.faculties.filter(
        (item) => item.id !== target.dataset.facultyId,
      );
      state.semesters.forEach((semester) =>
        semester.courses?.forEach((attempt) => {
          if (attempt.facultyId === target.dataset.facultyId)
            attempt.facultyId = "";
        }),
      );
      editingFacultyId = null;
      facultyEditDraftState = null;
      persist("Faculty deleted");
    }
    if (action === "edit-faculty") {
      editingFacultyId = target.dataset.facultyId;
      const faculty = state.faculties.find(
        (item) => item.id === editingFacultyId,
      );
      facultyEditDraftState = faculty
        ? BracuCatalog.createFacultyEditDraft(faculty)
        : null;
      renderFacultyEditor();
      refreshIcons();
    }
    if (action === "cancel-faculty-edit") {
      state.faculties = BracuStorage.resolveFacultyEdit({
        faculties: state.faculties,
        action: "cancel",
      }).faculties;
      editingFacultyId = null;
      facultyEditDraftState = null;
      renderFacultyEditor();
      refreshIcons();
    }
    if (action === "save-faculty-edit") {
      if (appAccessContext?.preview)
        return showToast("Preview mode is read-only");
      const result = BracuStorage.resolveFacultyEdit({
        faculties: state.faculties,
        departments: state.departments,
        facultyId: target.dataset.facultyId,
        action: "save",
        draft: facultyEditDraft(target.dataset.facultyId),
      });
      if (result.error) {
        showToast(result.error);
        return;
      }
      const currentFaculty = state.faculties.find(
        (faculty) => faculty.id === target.dataset.facultyId,
      );
      const editedFaculty = result.faculties.find(
        (faculty) => faculty.id === target.dataset.facultyId,
      );
      const catalogEdit =
        typeof BracuCatalog !== "undefined"
          ? BracuCatalog.prepareCatalogEdit(
              "faculty",
              currentFaculty,
              editedFaculty,
            )
          : { item: editedFaculty };
      if (catalogEdit.catalogTombstoneKey)
        BracuCatalog.markCatalogDeleted(state, "faculty", {
          initial: catalogEdit.catalogTombstoneKey,
          catalogOrigin: "global",
          catalogKey: catalogEdit.catalogTombstoneKey,
        });
      state.faculties = result.faculties.map((faculty) =>
        faculty.id === target.dataset.facultyId ? catalogEdit.item : faculty,
      );
      editingFacultyId = null;
      facultyEditDraftState = null;
      persist("Faculty saved");
    }
    if (action === "edit-course") openCourseModal(target.dataset.code);
    if (action === "remove-course") removeCourse(target.dataset.code);
    if (action === "edit-department")
      openDepartmentModal(target.dataset.deptId);
    if (action === "remove-department") removeDepartment(target.dataset.deptId);
    if (action === "edit-profile") {
      beginDashboardProfileEdit();
      return;
    }
    if (action === "save-profile") {
      saveDashboardProfile();
      return;
    }
    if (action === "cancel-profile-edit") {
      cancelDashboardProfileEdit();
      return;
    }
    if (action === "use-google-photo") {
      chooseDashboardGooglePhoto();
      return;
    }
    if (action === "remove-profile-photo") {
      removeDashboardProfilePhoto();
      return;
    }
  });

  document.addEventListener(
    "pointerdown",
    (event) => {
      const facultySelect = event.target.closest("select.path-faculty-select");
      if (facultySelect) expandFacultySelectOptions(facultySelect);
    },
    true,
  );
  document.addEventListener("focusin", (event) => {
    if (event.target.matches("select.path-faculty-select"))
      expandFacultySelectOptions(event.target);
  });
  document.addEventListener("focusout", (event) => {
    if (event.target.matches("select.path-faculty-select"))
      window.setTimeout(() => compactFacultySelectOptions(event.target), 0);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeStreamCategoryTooltips();
      const openModals = $all(".modal-backdrop:not([hidden])");
      const activeModal = openModals[openModals.length - 1];
      if (activeModal) {
        event.preventDefault();
        closeModal(activeModal.id);
        return;
      }
    }
    if (
      event.target.matches("select.path-faculty-select") &&
      ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)
    )
      expandFacultySelectOptions(event.target);
  });

  document.addEventListener("change", handleInputChange);
  document.addEventListener("input", handleLiveInput);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab-btn");
    if (!tab) return;
    const modal = tab.closest(".modal-panel") || document;
    $all(".tab-btn", modal).forEach((btn) => btn.classList.remove("active"));
    $all(".tab-panel", modal).forEach((panel) =>
      panel.classList.remove("active"),
    );
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
}

async function handleInputChange(event) {
  const target = event.target;
  const action = target.dataset.action;
  if (
    target.dataset.facultyDraft === editingFacultyId &&
    facultyEditDraftState
  ) {
    facultyEditDraftState.update(target.dataset.field, target.value);
    return;
  }
  if (target.id === "facultyDepartmentFilter") {
    facultyDepartmentFilter = target.value;
    renderFacultyList();
    return;
  }
  if (target.id === "importBackupInput" && target.files?.[0]) {
    try {
      state = await importStateFile(target.files[0]);
      persist("Backup imported", { allowDestructive: true });
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  if (target.id === "dashboardPhotoInput" && target.files?.[0]) {
    selectDashboardPhoto(target.files[0]);
    return;
  }
  if (!action) return;
  if (action === "update-attempt")
    updateAttempt(
      target.dataset.semesterId,
      target.dataset.attemptId,
      target.dataset.field,
      target.value,
    );
}

function handleLiveInput(event) {
  if (
    event.target.dataset.facultyDraft === editingFacultyId &&
    facultyEditDraftState
  ) {
    facultyEditDraftState.update(
      event.target.dataset.field,
      event.target.value,
    );
    return;
  }
  if (event.target.id === "facultySearch") {
    facultySearchQuery = event.target.value;
    renderFacultyList();
  }
}

function handleSubmit(event) {
  if (event.target.id === "facultyForm") {
    event.preventDefault();
    const name = $("#facultyName").value.trim();
    const email = $("#facultyEmail").value.trim();
    const initial = $("#facultyInitial").value.trim().toUpperCase();
    const department = $("#facultyDepartment").value;
    const result = validateFacultyDraft({ name, email, initial, department });
    if (result.error) return showToast(result.error);
    state.faculties.push({ id: uid("fac"), ...result.value });
    persist("Faculty added");
  }
  if (event.target.id === "dashboardProfileForm") {
    event.preventDefault();
    saveDashboardProfile();
  }
}

function updateQuickAddVisibility() {
  const status = $("#quickStatus")?.value || "completed";
  const gradeLabel = $("#quickGrade")?.closest("label");
  const facultyLabel = $("#quickFacultySearch")?.closest("label");
  if (gradeLabel)
    gradeLabel.hidden = status === "current" || status === "planned";
  if (facultyLabel) facultyLabel.hidden = status === "planned";
  if (status === "current" || status === "planned") $("#quickGrade").value = "";
  if (status === "planned") $("#quickFacultySearch").value = "";
}

function installPreviewMutationGuard() {
  if (!appAccessContext?.preview) return;
  const mutationSelector = [
    "#addSemesterBtn",
    "#saveSemesterBtn",
    "#addCourseBtn",
    "#addDepartmentBtn",
    "#resetDataBtn",
    "#importBackupInput",
    "#quickAddForm",
    "#courseForm",
    "#departmentForm",
    "#facultyForm",
    "#dashboardProfileForm",
    "[data-action^='delete-']",
    "[data-action^='remove-']",
    "[data-action^='update-']",
    "[data-action='save-semester-edit']",
    "[data-action='save-faculty-edit']",
  ].join(",");
  const block = (event) => {
    if (!event.target.closest?.(mutationSelector)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showToast("Preview mode is read-only");
  };
  document.addEventListener("click", block, true);
  document.addEventListener("change", block, true);
  document.addEventListener("submit", block, true);
}

function initializeTrackerApp(payload) {
  state = migrateState(payload.state, {
    authenticatedProfile: payload.context?.profile,
  });
  availableCatalogCourses = Array.isArray(payload.availableCatalogCourses)
    ? payload.availableCatalogCourses
    : state.courses;
  appAccessContext = payload.context;
  queueTrackerCloudSync = payload.queueCloudSync || (() => {});
  syncTrackerNow = payload.syncNow || (async () => ({ skipped: true }));
  if (!appAccessContext?.preview) {
    const client = BracuSupabase.getClient();
    dashboardAvatarRuntime = BracuProfile.createAvatarRuntime({ client });
    dashboardProfileService = BracuProfile.createProfileService({
      client,
      getSessionContext: (options) => BracuSupabase.getSessionContext(options),
    });
  }
  bindEvents();
  configureFooter();
  renderAll();
  pageLoadingController?.markReady();
  if (appAccessContext?.preview) {
    BracuPreview.applyLockdown(document);
    installPreviewMutationGuard();
    setSaveState("Read-only preview");
  } else if (payload.syncConflict) {
    setSaveState("Sync conflict · local data preserved");
    showToast("Another device changed this tracker. Reload before syncing.");
  } else {
    setSaveState(
      `Synced${state.settings.lastUpdated ? ` · ${new Date(state.settings.lastUpdated).toLocaleDateString()}` : ""}`,
    );
  }
  updateSiteChrome();
}

document.addEventListener("DOMContentLoaded", () => {
  pageLoadingController = BracuUiStates.mountPageLoading({ source: "tracker" });
  BracuTrackerBoot.start().catch((error) => {
    console.error("Tracker could not start.", error);
    pageLoadingController.markFailed("The tracker could not be loaded.");
    window.location.replace(
      BracuUiStates.buildErrorUrl({ code: 503, source: "tracker" }),
    );
  });
});

window.addEventListener("pagehide", () => {
  clearDashboardSelectedPhoto();
  dashboardAvatarRuntime?.dispose();
});
