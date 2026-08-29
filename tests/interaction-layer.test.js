const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const styles = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
const appScript = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const pageHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const interactionLayer = styles.slice(styles.indexOf("/* Approved modern interaction layer */"));
const stylesBeforeInteractionLayer = styles.slice(0, styles.indexOf("/* Approved modern interaction layer */"));

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return styles.match(new RegExp(`${escaped}\\s*{([^}]*)}`, "s"))?.[1] || "";
}

function atRuleBody(atRule) {
  const start = styles.indexOf(atRule);
  const openingBrace = styles.indexOf("{", start);
  let depth = 0;

  for (let index = openingBrace; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") depth -= 1;
    if (depth === 0) return styles.slice(openingBrace + 1, index);
  }

  return "";
}

function functionBody(name) {
  const start = appScript.indexOf(`function ${name}(`);
  const openingBrace = appScript.indexOf("{", start);
  let depth = 0;

  for (let index = openingBrace; index < appScript.length; index += 1) {
    if (appScript[index] === "{") depth += 1;
    if (appScript[index] === "}") depth -= 1;
    if (depth === 0) return appScript.slice(openingBrace + 1, index);
  }

  return "";
}

test("buttons use the approved 260ms horizontal shutter without inner glow", () => {
  const buttonBase = styles.match(/\.icon-button,\s*\.primary-btn,\s*\.secondary-btn,\s*\.ghost-btn,\s*\.danger-btn,\s*\.tab-btn\s*{([^}]*)}/s)?.[1] || "";
  const shutterLayer = styles.match(/\.icon-button::before,[\s\S]*?\.tab-btn::before\s*{([^}]*)}/s)?.[1] || "";

  assert.match(buttonBase, /--hover-fill:/);
  assert.match(buttonBase, /--hover-text:/);
  assert.match(buttonBase, /isolation:\s*isolate/);
  assert.match(buttonBase, /overflow:\s*hidden/);
  assert.match(shutterLayer, /transform:\s*scaleX\(0\)/);
  assert.match(shutterLayer, /transition:\s*transform 260ms var\(--ease-out\)/);
  assert.doesNotMatch(shutterLayer, /opacity\s*:|opacity\s+\d/);
  const finePointerLayer = atRuleBody("@media (hover: hover) and (pointer: fine)");
  const hoverShutterLayer = finePointerLayer.match(/\.icon-button:not\(:disabled\):hover::before,[\s\S]*?\.tab-btn:not\(:disabled\):hover::before\s*{([^}]*)}/s)?.[1] || "";

  assert.doesNotMatch(hoverShutterLayer, /opacity\s*:|transition-delay\s*:/);

  for (const variant of ["icon-button", "primary-btn", "secondary-btn", "ghost-btn", "danger-btn", "tab-btn"]) {
    assert.match(finePointerLayer, new RegExp(`\\.${variant}:not\\(:disabled\\):hover::before(?:\\s*,[^{}]*)*\\s*{[^}]*transform:\\s*scaleX\\(1\\)`, "s"));
    assert.doesNotMatch(finePointerLayer, new RegExp(`\\.${variant}:not\\(:disabled\\):hover(?:\\s*,[^{}]*)*\\s*{[^}]*box-shadow\\s*:`, "s"));
  }

  assert.doesNotMatch(interactionLayer, /transform:\s*scale\(1\.02\)/);
});

test("shutter variants keep semantic colors and accessible interaction gates", () => {
  assert.match(styles, /--on-primary:\s*#fff/);
  assert.match(ruleBody('[data-theme="dark"]'), /--on-primary:\s*#071222/);
  assert.match(ruleBody(".primary-btn"), /--hover-fill:\s*var\(--primary-strong\)/);
  assert.match(ruleBody(".primary-btn"), /--hover-text:\s*var\(--on-primary\)/);
  assert.match(ruleBody(".primary-btn"), /color:\s*var\(--on-primary\)/);
  assert.match(ruleBody(".secondary-btn"), /--hover-fill:\s*var\(--primary\)/);
  assert.match(ruleBody(".ghost-btn"), /--hover-fill:\s*var\(--ash-soft\)/);
  assert.match(ruleBody(".danger-btn"), /--hover-fill:\s*var\(--red\)/);
  const finePointerLayer = atRuleBody("@media (hover: hover) and (pointer: fine)");
  const reducedMotionLayer = atRuleBody("@media (prefers-reduced-motion: reduce)");

  for (const variant of ["icon-button", "primary-btn", "secondary-btn", "ghost-btn", "danger-btn", "tab-btn"]) {
    assert.match(finePointerLayer, new RegExp(`\\.${variant}:not\\(:disabled\\):hover::before(?:\\s*,[^{}]*)*\\s*{[^}]*transform:\\s*scaleX\\(1\\)`, "s"));
    assert.match(reducedMotionLayer, new RegExp(`\\.${variant}::before(?:\\s*,[^{}]*)*\\s*{[^}]*transition-duration:\\s*1ms !important`, "s"));
    assert.match(reducedMotionLayer, new RegExp(`\\.${variant}(?::not\\(:disabled\\))?:active(?:\\s*,[^{}]*)*\\s*{[^}]*transform:\\s*none !important`, "s"));
  }
});

test("cancel and destructive actions render the approved Lucide icons", () => {
  assert.match(pageHtml, /id="cancelSemesterBtn"[^>]*>\s*<i data-lucide="x"><\/i>\s*Cancel\s*<\/button>/);

  for (const action of ["cancel-semester-edit", "cancel-profile-edit"]) {
    assert.match(appScript, new RegExp(`data-action="${action}"[^>]*>\\s*<i data-lucide="x"><\\/i>\\s*Cancel`));
  }
  assert.match(appScript, /data-close-modal="courseModal"[^>]*>\s*<i data-lucide="x"><\/i>\s*Cancel/);
  assert.match(appScript, /data-close-modal="departmentModal"[^>]*>\s*<i data-lucide="x"><\/i>\s*Cancel/);

  for (const action of ["delete-semester", "delete-attempt", "remove-course", "delete-faculty", "remove-department"]) {
    assert.match(appScript, new RegExp(`data-action="${action}"[^>]*><i data-lucide="trash-2"><\\/i>`));
  }
  assert.match(appScript, /action === "delete-faculty"[\s\S]*confirm\([\s\S]*Faculty[\s\S]*course attempts/i);
});

test("Admin Catalog tabs support keyboard navigation and panel relationships", () => {
  const adminHtml = read("admin.html");
  const catalogScript = read("js/admin-catalog.js");
  assert.match(adminHtml, /role="tab"[^>]*aria-controls="catalogContent"/);
  assert.match(adminHtml, /id="catalogContent"[^>]*role="tabpanel"[^>]*aria-labelledby="catalogTabDepartment"/);
  assert.match(catalogScript, /setAttribute\("aria-labelledby",\s*activeTab\.id\)/);
  assert.match(catalogScript, /ArrowLeft|ArrowRight/);
  assert.match(catalogScript, /Home|End/);
  assert.match(catalogScript, /tabIndex/);
});

test("dashboard profile controls remain responsive and touch accessible", () => {
  assert.match(styles, /\.profile-panel-head[\s\S]*display:\s*flex/);
  assert.match(styles, /\.dashboard-photo-control[\s\S]*grid-template-areas/);
  assert.match(styles, /\.dashboard-photo-actions[\s\S]*min-height:\s*44px/);
  assert.match(ruleBody(".profile-detail-card"), /min-height:\s*72px/);
  assert.match(ruleBody(".profile-detail-card"), /padding:\s*10px 14px/);
  assert.match(ruleBody(".profile-detail-card"), /align-content:\s*center/);
  assert.match(ruleBody(".profile-detail-card"), /gap:\s*4px/);
  const mobile = atRuleBody("@media (max-width: 780px)");
  assert.match(mobile, /\.dashboard-profile-fields[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobile, /\.dashboard-photo-control[\s\S]*grid-template-areas/);
});

test("stream detail triggers are keyboard-visible and responsive", () => {
  assert.match(ruleBody(".stream-category"), /position:\s*relative/);
  assert.match(ruleBody(".stream-category-trigger"), /cursor:\s*pointer/);
  assert.match(styles, /\.stream-category-trigger\.tooltip-open\s*\+\s*\.stream-category-tooltip[\s\S]*visibility:\s*visible/);
  assert.match(styles, /\.stream-see-more[\s\S]*min-height:\s*32px/);
  const mobile = atRuleBody("@media (max-width: 780px)");
  assert.match(mobile, /\.stream-category-tooltip[\s\S]*max-width/);
});

test("dashboard profile omits the redundant Google account management note", () => {
  assert.doesNotMatch(functionBody("renderDashboardProfileView"), /Managed by your Google account/);
  assert.doesNotMatch(functionBody("renderDashboardProfileEditor"), /Managed by your Google account/);
});

test("faculty and grade settings use controlled responsive layouts", () => {
  assert.match(ruleBody(".faculty-row"), /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(ruleBody(".faculty-row-editing"), /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(ruleBody(".grade-scale-table"), /width:\s*100%/);
  assert.match(ruleBody(".grade-scale-table th"), /text-align:\s*left/);
  assert.match(ruleBody(".grade-scale-table-wrap"), /overflow-x:\s*auto/);
  const mobile = atRuleBody("@media (max-width: 780px)");
  assert.match(mobile, /\.faculty-row-editing[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobile, /\.faculty-row\s*\{[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobile, /\.faculty-row\s*>\s*\.secondary-btn[\s\S]*width:\s*100%/);
});

test("PDF report keeps attempt tags inside the course-code columns", () => {
  const gradeColumnWidths = [
    [".report-grade-table .report-col-code", 18],
    [".report-grade-table .report-col-course", 23],
    [".report-grade-table .report-col-credit", 9],
    [".report-grade-table .report-col-status", 13],
    [".report-grade-table .report-col-grade", 8],
    [".report-grade-table .report-col-gp", 7],
    [".report-grade-table .report-col-faculty", 22]
  ];
  const plannedColumnWidths = [
    [".report-planned-table .report-planned-code", 19],
    [".report-planned-table .report-planned-course", 65],
    [".report-planned-table .report-planned-credit", 16]
  ];

  for (const [selector, width] of [...gradeColumnWidths, ...plannedColumnWidths]) {
    assert.match(ruleBody(selector), new RegExp(`width:\\s*${width}%`), selector);
  }
  assert.equal(gradeColumnWidths.reduce((total, [, width]) => total + width, 0), 100);
  assert.equal(plannedColumnWidths.reduce((total, [, width]) => total + width, 0), 100);
});

test("dynamic Lucide renderers refresh icons after replacing placeholder markup", () => {
  for (const renderer of ["renderCourseList", "renderDashboardModal"]) {
    const body = functionBody(renderer);
    const markupReplacement = body.indexOf("innerHTML");
    const iconRefresh = body.lastIndexOf("refreshIcons();");

    assert.ok(markupReplacement >= 0, `${renderer} replaces dynamic markup`);
    assert.ok(iconRefresh > markupReplacement, `${renderer} refreshes Lucide after dynamic markup`);
  }
});

test("card spotlight color follows every academic status", () => {
  assert.match(ruleBody(".course-card"), /--spotlight-color:\s*var\(--primary\)/);
  assert.match(ruleBody(".path-course-card"), /--spotlight-color:\s*var\(--primary\)/);
  assert.match(ruleBody(".list-course-card"), /--spotlight-color:\s*var\(--primary\)/);

  const statusMappings = [
    [".course-card[data-status=\"completed\"]", "green"],
    [".course-card[data-status=\"current\"]", "blue"],
    [".course-card[data-status=\"planned\"]", "yellow"],
    [".course-card[data-status=\"omitted\"]", "ash"],
    [".path-course-card[data-status=\"completed\"]", "green"],
    [".path-course-card[data-status=\"current\"]", "blue"],
    [".path-course-card[data-status=\"planned\"]", "yellow"],
    [".path-course-card[data-status=\"omitted\"]", "ash"],
    [".path-course-card[data-status=\"not-taken\"]", "ash"],
    [".list-course-card[data-status=\"completed\"]", "green"],
    [".list-course-card[data-status=\"current\"]", "blue"],
    [".list-course-card[data-status=\"planned\"]", "yellow"],
    [".list-course-card[data-status=\"omitted\"]", "ash"]
  ];

  for (const [selector, color] of statusMappings) {
    assert.match(ruleBody(selector), new RegExp(`--spotlight-color:\\s*var\\(--${color}\\)`), selector);
  }

  const spotlightRule = styles.match(/\.course-card::before,[\s\S]*?\.list-course-card::before\s*{([^}]*)}/)?.[1] || "";
  assert.match(spotlightRule, /radial-gradient\([^;]*var\(--spotlight-color\)/s);
  assert.doesNotMatch(spotlightRule, /var\(--primary\) 16%/);
  assert.match(interactionLayer, /border-color:\s*color-mix\(in srgb, var\(--spotlight-color\) 48%, var\(--border\)\)/);
  assert.match(appScript, /<article class="list-course-card" data-status="\$\{status\}">/);
});

test("modern control hover is fine-pointer-only and ignores disabled buttons", () => {
  assert.match(ruleBody(".nav-links a"), /border:\s*1px solid transparent/);
  assert.doesNotMatch(stylesBeforeInteractionLayer, /\.nav-links a:hover\s*{/);
  assert.doesNotMatch(stylesBeforeInteractionLayer, /\.header-actions \.icon-button:hover\s*{/);
  assert.doesNotMatch(stylesBeforeInteractionLayer, /\.primary-btn:hover\s*{/);
  assert.doesNotMatch(stylesBeforeInteractionLayer, /\.danger-btn:hover\s*{/);
  assert.match(interactionLayer, /\.primary-btn:not\(:disabled\):hover/);
  assert.match(interactionLayer, /\.danger-btn:not\(:disabled\):hover/);
});

test("modal lifecycle hosts the single dot grid below translucent modal content", () => {
  assert.match(ruleBody(".modal-backdrop"), /isolation:\s*isolate/);
  assert.match(styles, /\.modal-backdrop\s*>\s*\.dot-grid-background\s*{[^}]*z-index:\s*0/s);

  const modalPanelRule = styles.match(/\.modal-panel,\s*\.wide-modal\s*{([^}]*)}/s)?.[1] || "";
  assert.match(modalPanelRule, /position:\s*relative/);
  assert.match(modalPanelRule, /z-index:\s*1/);
  assert.match(modalPanelRule, /background:\s*color-mix\(in srgb, var\(--surface\)/);

  assert.match(appScript, /function openModal\([^)]*\)[\s\S]*?mountDotGridInModal/);
  assert.match(appScript, /function closeModal\([^)]*\)[\s\S]*?restoreDotGridHost/);
});

test("course catalog modal closes with Escape and restores the opening control focus", () => {
  assert.match(appScript, /let modalReturnFocus = null/);
  assert.match(appScript, /modalReturnFocus = document\.activeElement/);
  assert.match(appScript, /event\.key === "Escape"[\s\S]*?closeModal/);
  assert.match(appScript, /modalReturnFocus\?\.isConnected[\s\S]*?modalReturnFocus\.focus/);
});
