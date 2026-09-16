function getRoadmapAttempts(state) {
  const attempts = [];
  state.semesters.forEach((semester, semesterIndex) => {
    (semester.courses || []).forEach((attempt, attemptIndex) => {
      const course = courseByCode(state, attempt.code);
      if (!course) return;
      attempts.push({
        ...attempt,
        course,
        semesterIndex,
        semesterNumber: semester.number || semesterIndex + 1,
        attemptIndex,
      });
    });
  });
  return attempts.sort(
    (a, b) =>
      a.semesterNumber - b.semesterNumber ||
      a.semesterIndex - b.semesterIndex ||
      a.attemptIndex - b.attemptIndex,
  );
}

function hasEng091InFirstSemester(state) {
  return state.semesters.some(
    (semester, index) =>
      Number(semester.number || index + 1) === 1 &&
      (semester.courses || []).some((attempt) => attempt.code === "ENG091"),
  );
}

function isValidSlotAttempt(state, attempt) {
  if (!["completed", "current", "planned"].includes(attempt.status))
    return false;
  if (attempt.status === "completed" && !isAttemptCounted(state, attempt))
    return false;
  return true;
}

function getSlotCandidateCodes(state, type) {
  const fixedRoadmapCodes = new Set(
    state.courses
      .filter((course) => course.roadmapLevel && !course.isRoadmapSlot)
      .map((course) => course.code),
  );
  const used = new Set();
  const candidates = [];
  getRoadmapAttempts(state).forEach((attempt) => {
    if (!isValidSlotAttempt(state, attempt)) return;
    const course = attempt.course;
    if (used.has(course.code)) return;
    if (fixedRoadmapCodes.has(course.code)) return;
    if (course.code === "ENG091") return;
    if (type === "elective" && course.category === "program-elective") {
      used.add(course.code);
      candidates.push(course.code);
    }
    if (
      type === "cod" &&
      ["gened", "custom", "non-credit"].includes(course.category) &&
      course.department !== "CSE"
    ) {
      used.add(course.code);
      candidates.push(course.code);
    }
  });
  return candidates;
}

function getDisplayRoadmapCourses(state) {
  const courses = state.courses.map((course) => ({ ...course }));
  const eng091Mode = hasEng091InFirstSemester(state);

  if (eng091Mode) {
    const eng091 = courses.find((course) => course.code === "ENG091");
    if (eng091) {
      eng091.roadmapLevel = 1;
      eng091.roadmapOrder = 3;
    }
    const eng101 = courses.find((course) => course.code === "ENG101");
    if (eng101) {
      eng101.roadmapLevel = 2;
      eng101.roadmapOrder = 3;
    }
    const sta201 = courses.find((course) => course.code === "STA201");
    if (sta201) {
      sta201.roadmapLevel = 4;
      sta201.roadmapOrder = 4;
    }
  }

  const degreePlan = typeof BracuDegreePlan !== "undefined" ? BracuDegreePlan.calculate(state) : null;
  const electiveSlots = new Map((degreePlan?.programElective.rows || [])
    .filter((row) => row.allocated).map((row) => [row.slot, row.code]));
  const fixedRoadmapCodes = new Set(courses.filter((course) => course.roadmapLevel && !course.isRoadmapSlot).map((course) => course.code));
  const electiveCandidates = getSlotCandidateCodes(state, "elective");
  const codCandidates = degreePlan
    ? [...degreePlan.streams.flatMap((stream) => stream.rows), ...degreePlan.gened.rows]
      .filter((row) => row.allocated && ["completed", "current", "selected"].includes(row.status) && !fixedRoadmapCodes.has(row.code))
      .sort((a, b) => a.order - b.order).map((row) => row.code)
    : getSlotCandidateCodes(state, "cod");
  let electiveIndex = 0;
  let codIndex = 0;

  return courses
    .filter((course) => course.roadmapLevel)
    .map((course) => {
      const alternativeReplacement =
        typeof BracuCatalog !== "undefined"
          ? BracuCatalog.resolveAlternativeReplacement(state, course.code)
          : null;
      if (alternativeReplacement) {
        return { ...course, alternativeReplacement };
      }
      if (course.category === "elective-slot") {
        const replacementCode = degreePlan ? electiveSlots.get(course.code) : electiveCandidates[electiveIndex++];
        if (replacementCode) {
          const actual = state.courses.find(
            (item) => item.code === replacementCode,
          );
          return {
            ...actual,
            roadmapLevel: course.roadmapLevel,
            roadmapOrder: course.roadmapOrder,
            isRoadmapSlot: false,
            replacedSlotCode: course.code,
            replacedSlotTitle: course.title,
          };
        }
      }
      if (course.category === "cod-slot") {
        const replacementCode = codCandidates[codIndex++];
        if (replacementCode) {
          const actual = state.courses.find(
            (item) => item.code === replacementCode,
          );
          return {
            ...actual,
            roadmapLevel: course.roadmapLevel,
            roadmapOrder: course.roadmapOrder,
            isRoadmapSlot: false,
            replacedSlotCode: course.code,
            replacedSlotTitle: course.title,
          };
        }
      }
      return course;
    });
}

function renderRoadmap(state) {
  const grid = document.getElementById("roadmapGrid");
  const roadmapCourses = getDisplayRoadmapCourses(state);
  const levels = [
    ...new Set(roadmapCourses.map((course) => Number(course.roadmapLevel))),
  ].sort((a, b) => a - b);

  grid.innerHTML = levels
    .map((level) => {
      const courses = roadmapCourses
        .filter((course) => Number(course.roadmapLevel) === level)
        .sort(
          (a, b) =>
            Number(a.roadmapOrder || 99) - Number(b.roadmapOrder || 99) ||
            a.code.localeCompare(b.code, undefined, { numeric: true }),
        );
      return `
      <div class="roadmap-row" data-level="${level}">
        <div class="level-label"><span><strong>Semester ${level}</strong></span></div>
        <div class="level-courses">
          ${courses.map((course) => renderCourseCard(state, course)).join("")}
        </div>
      </div>
    `;
    })
    .join("");

  window.requestAnimationFrame(() => drawRoadmapLines(state));
}

function renderPrereqBadge(state, type, prerequisites = []) {
  if (!prerequisites.length)
    return `<span class="badge prereq-badge prereq-none">${type}: None</span>`;
  const completed = completedCourseCodes(state);
  const done = prerequisites.every((code) => completed.has(code));
  return `<span class="badge prereq-badge ${done ? "prereq-complete" : "prereq-missing"}">${escapeHtml(type)}: ${escapeHtml(prerequisites.join(", "))}</span>`;
}

function renderCourseCard(state, course) {
  const alternativeReplacement = course.alternativeReplacement;
  const status = alternativeReplacement?.status || getCourseStatus(state, course.code);
  const prereq = checkPrerequisites(state, course);
  const latestAttempt = getLatestAttempt(state, course.code);
  const department = state.departments.find(
    (dept) => dept.id === course.department,
  );
  const lockedClass =
    !prereq.eligible && status === "not-started" ? "locked" : "";
  const slotClass = course.isRoadmapSlot ? "roadmap-slot-card" : "";
  const replacedClass = course.replacedSlotCode ? "replaced-slot-card" : "";
  const alternativeClass = alternativeReplacement
    ? "alternative-replacement-card"
    : "";
  const attemptMeta = alternativeReplacement
    ? renderAlternativeAttemptMeta(alternativeReplacement)
    : latestAttempt
    ? renderAttemptMeta(state, latestAttempt, course)
    : renderEmptyAttemptMeta(course, status);
  const displayCode = alternativeReplacement
    ? alternativeReplacement.codes.map(formatCode).join(" + ")
    : formatCode(course.code);
  const displayTitle = alternativeReplacement
    ? alternativeReplacement.codes
        .map((code) => courseByCode(state, code)?.title || code)
        .join(" + ")
    : course.title;
  const replacementNote = alternativeReplacement
    ? `Alternative to ${formatCode(course.code)}`
    : course.replacedSlotTitle || "";

  return `
    <article class="course-card ${lockedClass} ${slotClass} ${replacedClass} ${alternativeClass}" id="card-${escapeHtml(course.code)}" data-course-code="${escapeHtml(course.code)}" data-status="${status}">
      <div class="code-row"><div class="code">${escapeHtml(displayCode)}</div>${replacementNote ? `<span class="slot-note">${escapeHtml(replacementNote)}</span>` : ""}</div>
      <div class="title" title="${escapeHtml(displayTitle)}">${escapeHtml(displayTitle)}</div>
      <div class="card-meta card-meta-category">
        ${renderCategoryBadge(state, course.category)}
        <span class="badge dept-badge">${escapeHtml(typeof BracuCatalog !== "undefined" ? BracuCatalog.departmentDisplayId(department?.id || course.department) : department?.id || course.department)}</span>
        <span class="badge credit-badge">${escapeHtml(course.credits)} credits</span>
      </div>
      <div class="card-meta card-meta-prereq">
        ${renderPrereqBadge(state, "HP", course.hardPrerequisites)}
        ${renderPrereqBadge(state, "SP", course.softPrerequisites)}
      </div>
      <div class="status-strip">${attemptMeta}</div>
    </article>
  `;
}

function metaPill(className, label, value) {
  return `<span class="status-pill ${className}"><small>${label}</small><strong>${escapeHtml(String(value))}</strong></span>`;
}

function renderAlternativeAttemptMeta(alternativeReplacement) {
  const progress = `${alternativeReplacement.completedCount} of ${alternativeReplacement.codes.length}`;
  return [
    metaPill("grade-pill", "COMPLETED", progress),
    metaPill("gp-pill", "STATUS", statusLabel(alternativeReplacement.status)),
    metaPill("faculty-pill", "DETAILS", "My Path"),
  ].join("");
}

function renderFacultyTooltipPill(state, faculty) {
  if (!faculty) return metaPill("faculty-pill", "FACULTY", "—");

  const emailText = faculty.email || "Email not added";
  const initialText = faculty.initial || "—";
  const copyButton = faculty.email
    ? `
          <button type="button" class="faculty-email-copy-btn" data-copy-faculty-email="${escapeHtml(faculty.email)}" data-faculty-initial="${escapeHtml(initialText)}" aria-label="Copy ${escapeHtml(initialText)} email address">
            <i data-lucide="copy"></i>
            <span class="faculty-copy-check" aria-hidden="true">✓</span>
          </button>`
    : "";

  return `
    <span class="status-pill faculty-pill has-faculty-tooltip" tabindex="0" aria-label="Faculty details for ${escapeHtml(initialText)}">
      <small>FACULTY</small>
      <strong>${escapeHtml(initialText)}</strong>
      <span class="faculty-tooltip" role="tooltip">
        <b>${escapeHtml(faculty.name || "Faculty name not added")}</b>
        <span class="faculty-tooltip-email-row">
          <span class="faculty-tooltip-email">${escapeHtml(emailText)}</span>
          ${copyButton}
        </span>
      </span>
    </span>
  `;
}

function renderEmptyAttemptMeta(course, status) {
  const gradeText = course.isRoadmapSlot ? "Slot" : "—";
  return [
    metaPill("grade-pill", "GRADE", gradeText),
    metaPill("gp-pill", "GP", "—"),
    metaPill("faculty-pill", "FACULTY", "—"),
  ].join("");
}

function renderAttemptMeta(state, attempt, course) {
  const faculty = state.faculties.find((item) => item.id === attempt.facultyId);
  const counted = isAttemptCounted(state, attempt);
  const point = counted ? attemptGradePoint(state, attempt) : null;
  const grade = counted
    ? attempt.grade || "—"
    : attempt.status === "completed"
      ? "Omitted"
      : attempt.grade || "—";
  const pointText =
    point !== null && point !== undefined ? Number(point).toFixed(1) : "—";
  return [
    metaPill("grade-pill", "GRADE", grade),
    metaPill("gp-pill", "GP", pointText),
    renderFacultyTooltipPill(state, faculty),
  ].join("");
}

function buildVisiblePrerequisiteLinks(state) {
  const roadmapCourses = getDisplayRoadmapCourses(state);
  const visibleCodes = new Set(roadmapCourses.map((course) => course.code));
  const links = [];
  roadmapCourses.forEach((course) => {
    (course.hardPrerequisites || []).forEach((from) =>
      links.push({ from, to: course.code, type: "hard" }),
    );
    (course.softPrerequisites || []).forEach((from) =>
      links.push({ from, to: course.code, type: "soft" }),
    );
  });
  return links.filter(
    (link) => visibleCodes.has(link.from) && visibleCodes.has(link.to),
  );
}

const CONNECTOR_COLOR_MAP = {
  CSE110: { light: "#E11D48", dark: "#FB7185" },
  MAT110: { light: "#2563EB", dark: "#60A5FA" },
  ENG091: { light: "#16A34A", dark: "#4ADE80" },
  PHY111: { light: "#CA8A04", dark: "#FACC15" },
  CSE111: { light: "#7C3AED", dark: "#A78BFA" },
  CSE230: { light: "#EA580C", dark: "#FDBA74" },
  ENG101: { light: "#0891B2", dark: "#22D3EE" },
  PHY112: { light: "#DC2626", dark: "#F87171" },
  BNG103: { light: "#0F766E", dark: "#2DD4BF" },
  EMB101: { light: "#9333EA", dark: "#C084FC" },
  ENG102: { light: "#65A30D", dark: "#A3E635" },
  HUM103: { light: "#BE123C", dark: "#FDA4AF" },
  CSE220: { light: "#1D4ED8", dark: "#93C5FD" },
  MAT120: { light: "#B45309", dark: "#FBBF24" },
  STA201: { light: "#047857", dark: "#34D399" },
  CSE221: { light: "#C2410C", dark: "#FB923C" },
  MAT216: { light: "#6D28D9", dark: "#DDD6FE" },
  CSE260: { light: "#0E7490", dark: "#67E8F9" },
  CSE321: { light: "#B91C1C", dark: "#FCA5A5" },
  CSE330: { light: "#4338CA", dark: "#818CF8" },
  CSE340: { light: "#15803D", dark: "#86EFAC" },
  CSE370: { light: "#A21CAF", dark: "#F0ABFC" },
  CSE420: { light: "#0369A1", dark: "#7DD3FC" },
  CSE421: { light: "#9A3412", dark: "#FED7AA" },
  CSE422: { light: "#4D7C0F", dark: "#BEF264" },
  CSE423: { light: "#A16207", dark: "#FDE68A" },
  CSE470: { light: "#BE185D", dark: "#F9A8D4" },
  CSE400: { light: "#1E40AF", dark: "#BFDBFE" },
  "ELECTIVE-1": { light: "#4F46E5", dark: "#A5B4FC" },
  "ELECTIVE-2": { light: "#DB2777", dark: "#F472B6" },
  "ELECTIVE-3": { light: "#059669", dark: "#6EE7B7" },
  "ELECTIVE-4": { light: "#D97706", dark: "#FCD34D" },
  "ELECTIVE-5": { light: "#7E22CE", dark: "#E9D5FF" },
  "ELECTIVE-6": { light: "#475569", dark: "#CBD5E1" },
  "COD-1": { light: "#0D9488", dark: "#5EEAD4" },
  "COD-2": { light: "#C026D3", dark: "#F5D0FE" },
  "COD-3": { light: "#0284C7", dark: "#BAE6FD" },
  "COD-4": { light: "#DC2626", dark: "#FCA5A5" },
  "COD-5": { light: "#65A30D", dark: "#D9F99D" },
  "COD-6": { light: "#92400E", dark: "#FDBA74" },
  CSE331: { light: "#0F4C81", dark: "#38BDF8" },
  MAT215: { light: "#854D0E", dark: "#FDE047" },
  "CSE-ELECTIVE": { light: "#334155", dark: "#E2E8F0" },
  BIO101: { light: "#166534", dark: "#BBF7D0" },
  CHE101: { light: "#B45309", dark: "#FED7AA" },
  DEV101: { light: "#64748B", dark: "#F1F5F9" },
  ENG103: { light: "#6B21A8", dark: "#D8B4FE" },
  ENV103: { light: "#047857", dark: "#A7F3D0" },
  CSE250: { light: "#D946EF", dark: "#F0ABFC" },
  CSE251: { light: "#0E7490", dark: "#A5F3FC" },
  CSE310: { light: "#F97316", dark: "#FDBA74" },
  CSE320: { light: "#2563EB", dark: "#BFDBFE" },
  CSE341: { light: "#16A34A", dark: "#86EFAC" },
  CSE342: { light: "#BE123C", dark: "#FDA4AF" },
  CSE350: { light: "#7C2D12", dark: "#FED7AA" },
  CSE360: { light: "#0369A1", dark: "#BAE6FD" },
  CSE390: { light: "#9333EA", dark: "#E9D5FF" },
  CSE391: { light: "#0891B2", dark: "#67E8F9" },
  CSE392: { light: "#4D7C0F", dark: "#D9F99D" },
  CSE410: { light: "#B91C1C", dark: "#FECACA" },
  CSE419: { light: "#4F46E5", dark: "#C7D2FE" },
  CSE424: { light: "#A21CAF", dark: "#F5D0FE" },
  CSE425: { light: "#DB2777", dark: "#FBCFE8" },
  CSE426: { light: "#0F766E", dark: "#99F6E4" },
  CSE427: { light: "#EA580C", dark: "#FED7AA" },
  CSE428: { light: "#1D4ED8", dark: "#DBEAFE" },
  CSE429: { light: "#7E22CE", dark: "#F3E8FF" },
  CSE430: { light: "#15803D", dark: "#BBF7D0" },
  CSE431: { light: "#B45309", dark: "#FDE68A" },
  CSE432: { light: "#0F172A", dark: "#CBD5E1" },
  CSE460: { light: "#C2410C", dark: "#FFEDD5" },
  CSE461: { light: "#4338CA", dark: "#A5B4FC" },
  CSE462: { light: "#047857", dark: "#6EE7B7" },
  CSE471: { light: "#BE185D", dark: "#F9A8D4" },
  CSE472: { light: "#0284C7", dark: "#7DD3FC" },
  CSE473: { light: "#65A30D", dark: "#BEF264" },
  CSE474: { light: "#9A3412", dark: "#FDBA74" },
  CSE490: { light: "#475569", dark: "#E2E8F0" },
  CSE491: { light: "#6D28D9", dark: "#DDD6FE" },
};

const FALLBACK_CONNECTOR_COLORS = {
  light: [
    "#E11D48",
    "#2563EB",
    "#16A34A",
    "#CA8A04",
    "#7C3AED",
    "#EA580C",
    "#0891B2",
    "#65A30D",
    "#DC2626",
    "#4F46E5",
    "#0F766E",
    "#A16207",
    "#DB2777",
    "#0284C7",
    "#059669",
    "#9333EA",
  ],
  dark: [
    "#FB7185",
    "#60A5FA",
    "#4ADE80",
    "#FACC15",
    "#A78BFA",
    "#FDBA74",
    "#22D3EE",
    "#A3E635",
    "#F87171",
    "#A5B4FC",
    "#2DD4BF",
    "#FDE68A",
    "#F472B6",
    "#7DD3FC",
    "#6EE7B7",
    "#C084FC",
  ],
};

function hashRoadmapKey(value) {
  return String(value || "")
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0);
}

function getCurrentThemeMode() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getConnectorColor(code) {
  const theme = getCurrentThemeMode();
  const mapped = CONNECTOR_COLOR_MAP[code];
  if (mapped?.[theme]) return mapped[theme];

  const fallbackColors =
    FALLBACK_CONNECTOR_COLORS[theme] || FALLBACK_CONNECTOR_COLORS.light;
  return fallbackColors[hashRoadmapKey(code) % fallbackColors.length];
}
function getConnectorMarkerId(link, isCompleted) {
  const theme = getCurrentThemeMode();
  const safeCode = String(link.from || "source").replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
  const safeType = String(link.type || "hard").replace(/[^a-zA-Z0-9_-]/g, "-");
  return `arrow-${theme}-${safeCode}-${safeType}-${isCompleted ? "done" : "pending"}`;
}

function createConnectorMarker(defs, markerId, color) {
  if (document.getElementById(markerId)) return markerId;

  const marker = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker",
  );
  marker.setAttribute("id", markerId);

  /* Uploaded arrowhead-right SVG path.
     The viewBox is cropped around the icon shape so the arrow stays clear but smaller. */
  marker.setAttribute("viewBox", "14 8 22 32");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("refX", "31.6");
  marker.setAttribute("refY", "24");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrow.setAttribute(
    "d",
    "M27.2,24,16.6,34.6a1.9,1.9,0,0,0,.2,3,2.1,2.1,0,0,0,2.7-.2l11.9-12a1.9,1.9,0,0,0,0-2.8l-11.9-12a2.1,2.1,0,0,0-2.7-.2,1.9,1.9,0,0,0-.2,3Z",
  );
  arrow.style.setProperty("fill", color, "important");
  arrow.style.setProperty("stroke", "none", "important");

  marker.appendChild(arrow);
  defs.appendChild(marker);

  return markerId;
}

function applyConnectorStyle(path, link, isCompleted, markerId) {
  const color = getConnectorColor(link.from);
  const width =
    link.type === "soft"
      ? isCompleted
        ? "2"
        : "1.55"
      : isCompleted
        ? "2.45"
        : "1.75";
  const dash = link.type === "soft" ? "7 7" : "none";

  path.setAttribute(
    "class",
    `connector-line ${link.type} ${isCompleted ? "completed" : "pending"}`,
  );
  path.setAttribute("marker-end", `url(#${markerId})`);

  /* Use inline !important styles because older connector CSS also sets stroke/opacity
     by class. Without this, every path can visually fall back to the same color. */
  path.style.setProperty("stroke", color, "important");
  path.style.setProperty("opacity", isCompleted ? "1" : "0.5", "important");
  path.style.setProperty("stroke-width", width, "important");
  path.style.setProperty("stroke-dasharray", dash, "important");
  path.style.setProperty("fill", "none", "important");
  path.style.setProperty("stroke-linecap", "round", "important");
  path.style.setProperty("stroke-linejoin", "round", "important");
}

function getCurvedConnectorPath(startX, startY, endX, endY, index) {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  /* Same-column / almost same-column prerequisites should be clean vertical lines.
     This removes the small strange bend that appeared between direct prerequisite cards. */
  if (absX < 10) {
    return `M ${startX} ${startY} V ${endY}`;
  }

  const direction = deltaY >= 0 ? 1 : -1;
  const rowLaneOffset = ((index % 5) - 2) * 6;
  const curveDepth = Math.max(34, Math.min(92, absY * 0.38)) + rowLaneOffset;

  const controlOneX = startX;
  const controlOneY = startY + direction * curveDepth;
  const controlTwoX = endX;
  const controlTwoY = endY - direction * curveDepth;

  return `M ${startX} ${startY} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${endX} ${endY}`;
}

function drawRoadmapLines(state) {
  const wrapper = document.getElementById("roadmapWrapper");
  const svg = document.getElementById("roadmapSvg");
  if (!wrapper || !svg) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const width = wrapper.scrollWidth;
  const height = wrapper.scrollHeight;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.style.minWidth = `${width}px`;
  svg.style.minHeight = `${height}px`;
  svg.style.overflow = "visible";
  svg.innerHTML = "";

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.appendChild(defs);

  const completed = completedCourseCodes(state);
  const links = buildVisiblePrerequisiteLinks(state);

  links.forEach((link, index) => {
    const fromCard = document.getElementById(`card-${link.from}`);
    const toCard = document.getElementById(`card-${link.to}`);
    if (!fromCard || !toCard) return;

    const from = fromCard.getBoundingClientRect();
    const to = toCard.getBoundingClientRect();

    const startX =
      from.left - wrapperRect.left + wrapper.scrollLeft + from.width / 2;
    const startY = from.bottom - wrapperRect.top + wrapper.scrollTop + 1;
    const endX = to.left - wrapperRect.left + wrapper.scrollLeft + to.width / 2;
    const endY = to.top - wrapperRect.top + wrapper.scrollTop - 8;
    const isCompleted = completed.has(link.from);
    const markerId = createConnectorMarker(
      defs,
      getConnectorMarkerId(link, isCompleted),
      getConnectorColor(link.from),
    );

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      getCurvedConnectorPath(startX, startY, endX, endY, index),
    );
    applyConnectorStyle(path, link, isCompleted, markerId);
    svg.appendChild(path);
  });
}

function formatCode(code) {
  if (code.includes("-")) return code;
  return code.replace(/^([A-Z]+)(\d+)/, "$1$2");
}

function statusLabel(status) {
  const labels = {
    completed: "Completed",
    current: "Current",
    planned: "Planned",
    omitted: "Omitted",
    "not-started": "Not started",
  };
  return labels[status] || status;
}

function categoryLabel(state, categoryId) {
  return (
    state.categories?.find((item) => item.id === categoryId)?.label ||
    DEFAULT_DATA.categories.find((item) => item.id === categoryId)?.label ||
    (typeof BracuCatalog !== "undefined"
      ? BracuCatalog.categoryDisplayLabel(categoryId)
      : categoryId)
  );
}

function renderCategoryBadge(state, categoryId) {
  if (typeof BracuCatalog === "undefined") {
    return `<span class="badge category-badge">${escapeHtml(categoryLabel(state, categoryId))}</span>`;
  }
  const fieldId = BracuCatalog.curriculumFieldForCategory(categoryId);
  const field = BracuCatalog.curriculumFieldOptions().find(
    (item) => item.id === fieldId,
  );
  if (!fieldId.startsWith("stream-") || !field) {
    return `<span class="badge category-badge">${escapeHtml(categoryLabel(state, categoryId))}</span>`;
  }
  const compactLabel = `Stream-${fieldId.split("-")[1]}`;
  return `<span class="badge category-badge stream-category">
    <button class="stream-category-trigger" type="button" aria-expanded="false" data-curriculum-field="${escapeHtml(fieldId)}">${escapeHtml(compactLabel)}</button>
    <span class="stream-category-tooltip" role="tooltip">
      <strong>${escapeHtml(field.label)}</strong>
      <button class="stream-see-more" type="button" data-stream-see-more data-curriculum-field="${escapeHtml(fieldId)}">See more</button>
    </span>
  </span>`;
}
