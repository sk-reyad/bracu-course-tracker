(function exposeUiStates(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BracuUiStates = api;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildUiStates() {
    "use strict";

    const ALLOWED_SOURCES = Object.freeze(["tracker", "auth", "admin"]);
    const ACTIONS = Object.freeze({
      back: Object.freeze({ id: "back", label: "Go back", icon: "arrow-left" }),
      home: Object.freeze({ id: "home", label: "Go home", icon: "house" }),
      login: Object.freeze({ id: "login", label: "Log in", icon: "log-in" }),
      retry: Object.freeze({
        id: "retry",
        label: "Try again",
        icon: "refresh-cw",
      }),
    });

    function state(code, title, message, icon, actions) {
      return Object.freeze({
        code,
        title,
        message,
        icon,
        actions: Object.freeze(actions),
      });
    }

    const ERROR_STATES = Object.freeze({
      400: state(
        400,
        "Invalid request",
        "We couldn’t process that request. Check the details and try again.",
        "file-warning",
        ["back"],
      ),
      401: state(
        401,
        "Sign in required",
        "Your session is missing or has expired. Sign in to continue.",
        "log-in",
        ["login", "home"],
      ),
      403: state(
        403,
        "Access denied",
        "Your account doesn’t have permission to open this page.",
        "shield-x",
        ["back", "home"],
      ),
      404: state(
        404,
        "Page not found",
        "The page you’re looking for doesn’t exist or may have moved.",
        "file-question",
        ["back", "home"],
      ),
      408: state(
        408,
        "Request timed out",
        "The request took too long. Check your connection and try again.",
        "clock-alert",
        ["retry", "home"],
      ),
      409: state(
        409,
        "Update conflict",
        "This information changed elsewhere. Reload it before trying again.",
        "git-compare-arrows",
        ["retry", "back"],
      ),
      410: state(
        410,
        "Page no longer available",
        "This page was removed and is no longer available.",
        "file-x",
        ["home"],
      ),
      413: state(
        413,
        "File is too large",
        "Choose a smaller file and try again.",
        "file-warning",
        ["back"],
      ),
      415: state(
        415,
        "File type not supported",
        "Choose one of the supported file formats and try again.",
        "file-x-2",
        ["back"],
      ),
      422: state(
        422,
        "Details need attention",
        "Some information couldn’t be accepted. Review it and try again.",
        "list-checks",
        ["back"],
      ),
      429: state(
        429,
        "Too many requests",
        "Please wait a moment before trying again.",
        "timer-reset",
        ["retry", "home"],
      ),
      500: state(
        500,
        "Something went wrong",
        "An unexpected error occurred. Your saved data has not been changed.",
        "triangle-alert",
        ["retry", "home"],
      ),
      502: state(
        502,
        "Service connection failed",
        "A connected service returned an invalid response. Try again shortly.",
        "unplug",
        ["retry", "home"],
      ),
      503: state(
        503,
        "Service temporarily unavailable",
        "The service is busy or under maintenance. Try again shortly.",
        "server-off",
        ["retry", "home"],
      ),
      504: state(
        504,
        "Service took too long",
        "The service didn’t respond in time. Check your connection and try again.",
        "clock-alert",
        ["retry", "home"],
      ),
    });

    const FAMILY_STATES = Object.freeze({
      client: Object.freeze({
        title: "Request couldn’t be completed",
        message:
          "The request could not be completed. Go back and try a different action.",
        icon: "circle-alert",
        actions: Object.freeze(["back", "home"]),
      }),
      server: Object.freeze({
        title: "Service error",
        message:
          "The service encountered an unexpected problem. Try again shortly.",
        icon: "server-crash",
        actions: Object.freeze(["retry", "home"]),
      }),
    });

    function normalizeStatus(code) {
      const parsed = Number(code);
      return Number.isInteger(parsed) && parsed >= 400 && parsed <= 599
        ? parsed
        : 500;
    }

    function normalizeSource(source) {
      return ALLOWED_SOURCES.includes(source) ? source : "tracker";
    }

    function resolveErrorState(code) {
      const status = normalizeStatus(code);
      if (ERROR_STATES[status]) return ERROR_STATES[status];
      const fallback =
        status < 500 ? FAMILY_STATES.client : FAMILY_STATES.server;
      return state(
        status,
        fallback.title,
        fallback.message,
        fallback.icon,
        fallback.actions,
      );
    }

    function buildErrorPageModel(search = "", environment = {}) {
      const params = new URLSearchParams(String(search).replace(/^#/, "?"));
      const errorState = resolveErrorState(params.get("code"));
      const source = normalizeSource(params.get("source"));
      return Object.freeze({
        ...errorState,
        source,
        origin: String(environment.origin || ""),
      });
    }

    function buildErrorUrl({ code, source } = {}) {
      const status = normalizeStatus(code);
      const safeSource = normalizeSource(source);
      return `error.html?code=${status}&source=${safeSource}`;
    }

    function createLoadingController({
      body,
      skeleton,
      liveRegion,
      timeoutMs = 15000,
      setTimer = (callback, delay) => setTimeout(callback, delay),
      clearTimer = (timer) => clearTimeout(timer),
      onTimeout = () => {},
      eventTarget,
    } = {}) {
      let settled = false;
      let timer = null;

      function updateState(nextState, message = "") {
        if (body) {
          if (body.dataset) body.dataset.pageState = nextState;
          body.setAttribute?.(
            "aria-busy",
            nextState === "loading" ? "true" : "false",
          );
        }
        if (skeleton) skeleton.hidden = nextState !== "loading";
        if (liveRegion) liveRegion.textContent = message;
      }

      function settle(nextState, message) {
        if (settled) return false;
        settled = true;
        if (timer !== null) clearTimer(timer);
        updateState(nextState, message);
        eventTarget?.dispatchEvent?.(
          typeof CustomEvent === "function"
            ? new CustomEvent(`bracu:page-${nextState}`)
            : { type: `bracu:page-${nextState}` },
        );
        return true;
      }

      function markReady() {
        return settle("ready", "");
      }

      function markFailed(message = "The page could not be loaded.") {
        return settle("failed", message);
      }

      timer = setTimer(() => {
        if (!settle("failed", "Loading timed out.")) return;
        onTimeout(resolveErrorState(504));
      }, timeoutMs);

      updateState("loading", liveRegion?.textContent || "Loading page");
      return Object.freeze({ markReady, markFailed });
    }

    function mountPageLoading({
      source = "tracker",
      documentObject = document,
      locationObject = location,
      eventTarget = documentObject,
      timeoutMs = 15000,
      setTimer,
      clearTimer,
    } = {}) {
      const safeSource = normalizeSource(source);
      return createLoadingController({
        body: documentObject.body,
        skeleton: documentObject.getElementById("pageSkeleton"),
        liveRegion: documentObject.getElementById("pageLoadingStatus"),
        eventTarget,
        timeoutMs,
        ...(setTimer ? { setTimer } : {}),
        ...(clearTimer ? { clearTimer } : {}),
        onTimeout() {
          locationObject.replace?.(
            buildErrorUrl({ code: 504, source: safeSource }),
          );
        },
      });
    }

    function mountErrorPage({
      documentObject = document,
      locationObject = location,
      historyObject = history,
      storage = localStorage,
      matchMedia = (query) => window.matchMedia(query),
      lucideApi = typeof lucide !== "undefined" ? lucide : null,
    } = {}) {
      const model = buildErrorPageModel(locationObject.search, {
        origin: locationObject.origin,
      });
      const codeTarget = documentObject.getElementById("errorCode");
      const titleTarget = documentObject.getElementById("errorTitle");
      const messageTarget = documentObject.getElementById("errorMessage");
      const iconTarget = documentObject.getElementById("errorIcon");
      const actionsTarget = documentObject.getElementById("errorActions");
      const themeToggle = documentObject.getElementById("errorThemeToggle");
      const themeKey = "bracuCourseTracker.theme";

      codeTarget.textContent = String(model.code);
      titleTarget.textContent = model.title;
      messageTarget.textContent = model.message;
      iconTarget.setAttribute?.("data-lucide", model.icon);
      documentObject.title = `${model.code} — ${model.title} | BRACU Course Tracker`;
      if (documentObject.body?.dataset)
        documentObject.body.dataset.errorSource = model.source;

      function setTheme(theme) {
        const nextTheme = theme === "dark" ? "dark" : "light";
        documentObject.documentElement.dataset.theme = nextTheme;
        storage?.setItem?.(themeKey, nextTheme);
        themeToggle?.setAttribute?.(
          "aria-label",
          nextTheme === "dark"
            ? "Switch to light theme"
            : "Switch to dark theme",
        );
        const themeIcon = themeToggle?.querySelector?.("[data-lucide]");
        themeIcon?.setAttribute?.(
          "data-lucide",
          nextTheme === "dark" ? "sun" : "moon",
        );
        lucideApi?.createIcons?.();
      }

      const storedTheme = storage?.getItem?.(themeKey);
      setTheme(
        storedTheme ||
          (matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"),
      );
      themeToggle?.addEventListener?.("click", () => {
        setTheme(
          documentObject.documentElement.dataset.theme === "dark"
            ? "light"
            : "dark",
        );
      });

      function runAction(action) {
        const sourceDestination =
          model.source === "admin"
            ? "admin.html"
            : model.source === "auth"
              ? "auth.html"
              : "index.html";
        if (action === "retry")
          return locationObject.assign?.(sourceDestination);
        if (action === "back" && historyObject.length > 1)
          return historyObject.back?.();
        const destination = action === "login" ? "auth.html" : "index.html";
        return locationObject.assign?.(destination);
      }

      actionsTarget.replaceChildren?.();
      model.actions.forEach((actionId, index) => {
        const action = ACTIONS[actionId];
        if (!action) return;
        const button = documentObject.createElement("button");
        button.type = "button";
        button.className = `error-action${index === 0 ? " error-action-primary" : ""}`;
        button.dataset.action = action.id;
        const icon = documentObject.createElement("i");
        icon.setAttribute?.("data-lucide", action.icon);
        icon.setAttribute?.("aria-hidden", "true");
        const label = documentObject.createElement("span");
        label.textContent = action.label;
        button.append(icon, label);
        button.addEventListener("click", () => runAction(action.id));
        actionsTarget.append(button);
      });

      lucideApi?.createIcons?.();
      titleTarget.focus?.({ preventScroll: true });
      return model;
    }

    return Object.freeze({
      ACTIONS,
      ERROR_STATES,
      resolveErrorState,
      buildErrorPageModel,
      buildErrorUrl,
      createLoadingController,
      mountPageLoading,
      mountErrorPage,
      normalizeStatus,
      normalizeSource,
    });
  },
);

if (typeof document !== "undefined") {
  const startErrorPage = () => {
    if (document.body?.classList?.contains("error-page"))
      globalThis.BracuUiStates?.mountErrorPage?.();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", startErrorPage, {
      once: true,
    });
  else startErrorPage();
}
