const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  resolveErrorState,
  buildErrorPageModel,
  buildErrorUrl,
  createLoadingController,
  mountPageLoading,
  mountErrorPage
} = require("../js/ui-states.js");

const projectRoot = path.join(__dirname, "..");

test("known HTTP status resolves to approved user-facing error content", () => {
  const model = resolveErrorState(404);

  assert.equal(model.code, 404);
  assert.equal(model.title, "Page not found");
  assert.match(model.message, /moved|exist/i);
  assert.deepEqual(model.actions, ["back", "home"]);
});

test("unknown client and server statuses use safe family fallbacks", () => {
  const clientModel = resolveErrorState(418);
  const serverModel = resolveErrorState(507);
  const invalidModel = resolveErrorState("not-a-code");

  assert.equal(clientModel.code, 418);
  assert.equal(clientModel.title, "Request couldn’t be completed");
  assert.equal(serverModel.code, 507);
  assert.equal(serverModel.title, "Service error");
  assert.equal(invalidModel.code, 500);
});

test("error page model ignores arbitrary messages and unsafe source values", () => {
  const model = buildErrorPageModel(
    "?code=403&message=%3Cimg%20src=x%20onerror=alert(1)%3E&source=https://evil.example",
    { origin: "https://tracker.example" }
  );

  assert.equal(model.code, 403);
  assert.equal(model.title, "Access denied");
  assert.equal(model.source, "tracker");
  assert.doesNotMatch(model.message, /img|onerror|evil/i);
});

test("error URLs contain only normalized status and allow-listed surface", () => {
  assert.equal(
    buildErrorUrl({ code: 503, source: "admin", message: "secret" }),
    "error.html?code=503&source=admin"
  );
  assert.equal(
    buildErrorUrl({ code: "bad", source: "https://evil.example" }),
    "error.html?code=500&source=tracker"
  );
});

test("loading controller clears busy state and cancels its timeout after meaningful render", () => {
  const attributes = new Map();
  const body = {
    dataset: { pageState: "loading" },
    setAttribute(name, value) { attributes.set(name, value); }
  };
  const skeleton = { hidden: false };
  const liveRegion = { textContent: "Loading page" };
  let timeoutCallback;
  let clearedTimer;
  const controller = createLoadingController({
    body,
    skeleton,
    liveRegion,
    setTimer(callback) { timeoutCallback = callback; return 17; },
    clearTimer(timer) { clearedTimer = timer; }
  });

  controller.markReady();

  assert.equal(body.dataset.pageState, "ready");
  assert.equal(attributes.get("aria-busy"), "false");
  assert.equal(skeleton.hidden, true);
  assert.equal(liveRegion.textContent, "");
  assert.equal(clearedTimer, 17);
  assert.equal(typeof timeoutCallback, "function");
});

test("loading controller converts a prolonged boot into a safe timeout state", () => {
  const body = { dataset: { pageState: "loading" }, setAttribute() {} };
  const skeleton = { hidden: false };
  let timeoutCallback;
  let timedOutWith;
  createLoadingController({
    body,
    skeleton,
    liveRegion: { textContent: "Loading page" },
    setTimer(callback) { timeoutCallback = callback; return 1; },
    clearTimer() {},
    onTimeout(model) { timedOutWith = model; }
  });

  timeoutCallback();

  assert.equal(body.dataset.pageState, "failed");
  assert.equal(skeleton.hidden, true);
  assert.equal(timedOutWith.code, 504);
});

test("one dynamic error page provides branded semantic targets and the shared background", () => {
  const html = fs.readFileSync(path.join(projectRoot, "error.html"), "utf8");

  assert.match(html, /<canvas[^>]+id="dotGridBackground"[^>]+aria-hidden="true"/);
  assert.match(html, /id="errorCode"/);
  assert.match(html, /id="errorTitle"[^>]*tabindex="-1"/);
  assert.match(html, /id="errorMessage"/);
  assert.match(html, /id="errorActions"/);
  assert.match(html, /id="errorThemeToggle"[^>]+aria-label="Switch to dark theme"/);
  assert.match(html, /css\/ui-states\.css/);
  assert.match(html, /js\/motion\.js/);
  assert.match(html, /js\/ui-states\.js/);
  assert.equal(fs.existsSync(path.join(projectRoot, "404.html")), false);
  assert.equal(fs.existsSync(path.join(projectRoot, "500.html")), false);
});

test("shared state styling supports themes, responsive actions, focus, and reduced motion", () => {
  const css = fs.readFileSync(path.join(projectRoot, "css", "ui-states.css"), "utf8");

  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\.error-action:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.dot-grid-background[\s\S]*pointer-events:\s*none/);
});

test("error page renderer writes approved copy with text content and creates only approved actions", () => {
  const elements = new Map([
    ["errorCode", { textContent: "" }],
    ["errorTitle", { textContent: "", focus() {} }],
    ["errorMessage", { textContent: "" }],
    ["errorIcon", { setAttribute() {} }],
    ["errorActions", { children: [], append(child) { this.children.push(child); }, replaceChildren() { this.children = []; } }],
    ["errorThemeToggle", { setAttribute() {}, addEventListener() {} }]
  ]);
  const documentObject = {
    title: "",
    documentElement: { dataset: {} },
    body: { dataset: {} },
    getElementById(id) { return elements.get(id); },
    createElement(tagName) {
      return {
        tagName,
        className: "",
        type: "",
        dataset: {},
        children: [],
        textContent: "",
        append(...children) { this.children.push(...children); },
        addEventListener() {}
      };
    }
  };

  const model = mountErrorPage({
    documentObject,
    locationObject: { search: "?code=401&message=private", origin: "https://tracker.example" },
    historyObject: { length: 1, back() {} },
    storage: { getItem() { return "dark"; }, setItem() {} },
    matchMedia: () => ({ matches: false }),
    lucideApi: { createIcons() {} }
  });

  assert.equal(model.code, 401);
  assert.equal(elements.get("errorCode").textContent, "401");
  assert.equal(elements.get("errorTitle").textContent, "Sign in required");
  assert.doesNotMatch(elements.get("errorMessage").textContent, /private/);
  assert.deepEqual(elements.get("errorActions").children.map(button => button.dataset.action), ["login", "home"]);
  assert.equal(documentObject.documentElement.dataset.theme, "dark");
});

test("Auth, Tracker, and Admin expose page-specific skeletons through one lifecycle", () => {
  const pages = [
    ["auth.html", "skeleton-auth"],
    ["index.html", "skeleton-tracker"],
    ["admin.html", "skeleton-admin"]
  ];

  pages.forEach(([filename, variant]) => {
    const html = fs.readFileSync(path.join(projectRoot, filename), "utf8");
    assert.match(html, /<body[^>]+data-page-state="loading"[^>]+aria-busy="true"/);
    assert.match(html, new RegExp(`id="pageSkeleton"[\\s\\S]*${variant}`));
    assert.match(html, /id="pageLoadingStatus"[^>]+aria-live="polite"/);
    assert.match(html, /css\/ui-states\.css/);
    assert.match(html, /js\/ui-states\.js/);
  });
});

test("skeleton foundation matches real layouts without blocking themed backgrounds", () => {
  const css = fs.readFileSync(path.join(projectRoot, "css", "ui-states.css"), "utf8");

  assert.match(css, /@keyframes\s+skeleton-shimmer/);
  assert.match(css, /\.skeleton-auth/);
  assert.match(css, /\.skeleton-tracker/);
  assert.match(css, /\.skeleton-admin/);
  assert.match(css, /\.page-skeleton[\s\S]*pointer-events:\s*none/);
  assert.match(css, /body\[data-page-state="ready"\][\s\S]*\.page-skeleton/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.skeleton-block/);
});

test("shared state stylesheet does not replace existing page body or control styling", () => {
  const css = fs.readFileSync(path.join(projectRoot, "css", "ui-states.css"), "utf8");

  assert.doesNotMatch(css, /(?:^|\n)body\s*\{/);
  assert.doesNotMatch(css, /(?:^|\n)button,\s*a\s*\{/);
  assert.match(css, /\.error-page\s*\{/);
  assert.match(css, /\.error-page\s+button/);
});

test("page loading mount turns timeout into the shared surface-specific error URL", () => {
  const body = { dataset: {}, setAttribute() {} };
  const elements = new Map([
    ["pageSkeleton", { hidden: false }],
    ["pageLoadingStatus", { textContent: "Loading" }]
  ]);
  let timeoutCallback;
  let destination;
  const controller = mountPageLoading({
    source: "admin",
    documentObject: { body, getElementById(id) { return elements.get(id); } },
    locationObject: { replace(value) { destination = value; } },
    eventTarget: null,
    setTimer(callback) { timeoutCallback = callback; return 3; },
    clearTimer() {}
  });

  timeoutCallback();

  assert.equal(destination, "error.html?code=504&source=admin");
  assert.equal(body.dataset.pageState, "failed");
  assert.equal(typeof controller.markReady, "function");
});

test("each page boot marks its own skeleton ready after meaningful rendering", () => {
  const auth = fs.readFileSync(path.join(projectRoot, "js", "auth.js"), "utf8");
  const app = fs.readFileSync(path.join(projectRoot, "js", "app.js"), "utf8");
  const admin = fs.readFileSync(path.join(projectRoot, "js", "admin.js"), "utf8");

  assert.match(auth, /mountPageLoading\(\{\s*source:\s*"auth"/);
  assert.match(auth, /pageLoading\.markReady\(\)/);
  assert.match(app, /mountPageLoading\(\{\s*source:\s*"tracker"/);
  assert.match(app, /renderAll\(\);[\s\S]{0,180}pageLoadingController\?\.markReady\(\)/);
  assert.match(admin, /mountPageLoading\(\{\s*source:\s*"admin"/);
  assert.match(admin, /await loadAccounts\(\);[\s\S]{0,180}pageLoading\.markReady\(\)/);
});

test("fatal Tracker and Admin boot errors use the dynamic page without raw messages", () => {
  const app = fs.readFileSync(path.join(projectRoot, "js", "app.js"), "utf8");
  const admin = fs.readFileSync(path.join(projectRoot, "js", "admin.js"), "utf8");

  assert.match(app, /buildErrorUrl\(\{\s*code:\s*503,\s*source:\s*"tracker"\s*\}\)/);
  assert.match(admin, /buildErrorUrl\(\{\s*code:\s*503,\s*source:\s*"admin"\s*\}\)/);
  assert.doesNotMatch(app, /error\.html\?[^"'`]*message=/);
  assert.doesNotMatch(admin, /error\.html\?[^"'`]*message=/);
});

test("Vercel serves existing files first and unknown document routes through the single 404 template", () => {
  const configuration = JSON.parse(fs.readFileSync(path.join(projectRoot, "vercel.json"), "utf8"));

  assert.deepEqual(configuration.routes[0], { handle: "filesystem" });
  assert.deepEqual(configuration.routes.at(-1), {
    src: "/(.*)",
    status: 404,
    dest: "/error.html?code=404&source=tracker"
  });
});

test("Admin list and profile loading reuse compact skeletons instead of spinners", () => {
  const html = fs.readFileSync(path.join(projectRoot, "admin.html"), "utf8");
  const script = fs.readFileSync(path.join(projectRoot, "js", "admin.js"), "utf8");
  const css = fs.readFileSync(path.join(projectRoot, "css", "ui-states.css"), "utf8");

  assert.match(html, /id="adminLoading"[\s\S]*admin-list-skeleton/);
  assert.doesNotMatch(html, /id="adminLoading"[^>]*>[\s\S]{0,100}admin-spinner/);
  assert.match(script, /skeleton-detail/);
  assert.match(css, /\.admin-list-skeleton/);
  assert.match(css, /\.skeleton-detail/);
});

test("error and skeleton backgrounds define theme-matched Dot Grid colors", () => {
  const css = fs.readFileSync(path.join(projectRoot, "css", "ui-states.css"), "utf8");

  assert.match(css, /\.error-root\s*\{[\s\S]*--dot-grid-base:[^;]+;[\s\S]*--dot-grid-active:[^;]+;/);
  assert.match(css, /\.error-root\[data-theme="dark"\]\s*\{[\s\S]*--dot-grid-base:[^;]+;[\s\S]*--dot-grid-active:[^;]+;/);
  assert.doesNotMatch(css, /:root\s*\{[^}]*--dot-grid-base/);
});

test("Try again returns to the allow-listed source instead of reloading the error page", () => {
  const elements = new Map([
    ["errorCode", { textContent: "" }],
    ["errorTitle", { textContent: "", focus() {} }],
    ["errorMessage", { textContent: "" }],
    ["errorIcon", { setAttribute() {} }],
    ["errorActions", { children: [], append(child) { this.children.push(child); }, replaceChildren() { this.children = []; } }],
    ["errorThemeToggle", { setAttribute() {}, addEventListener() {} }]
  ]);
  const documentObject = {
    title: "",
    documentElement: { dataset: {} },
    body: { dataset: {} },
    getElementById(id) { return elements.get(id); },
    createElement(tagName) {
      return {
        tagName,
        dataset: {},
        children: [],
        append(...children) { this.children.push(...children); },
        addEventListener(type, handler) { this.handler = handler; }
      };
    }
  };
  let assigned = "";
  let reloads = 0;
  mountErrorPage({
    documentObject,
    locationObject: {
      search: "?code=503&source=admin",
      origin: "https://tracker.example",
      assign(value) { assigned = value; },
      reload() { reloads += 1; }
    },
    historyObject: { length: 1, back() {} },
    storage: { getItem() { return "light"; }, setItem() {} },
    matchMedia: () => ({ matches: false }),
    lucideApi: { createIcons() {} }
  });

  elements.get("errorActions").children.find(button => button.dataset.action === "retry").handler();

  assert.equal(assigned, "admin.html");
  assert.equal(reloads, 0);
});
