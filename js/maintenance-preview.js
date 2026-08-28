(function mountMaintenancePreview(root) {
  "use strict";

  const storageKey = "bracuCourseTracker.theme";
  const documentObject = root.document;
  const themeToggle = documentObject.getElementById("maintenanceThemeToggle");
  const retryButton = documentObject.getElementById("maintenanceRetry");

  function preferredTheme() {
    const savedTheme = root.localStorage?.getItem(storageKey);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return root.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    documentObject.documentElement.dataset.theme = nextTheme;
    root.localStorage?.setItem(storageKey, nextTheme);
    themeToggle?.setAttribute(
      "aria-label",
      nextTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
  }

  themeToggle?.addEventListener("click", () => {
    setTheme(
      documentObject.documentElement.dataset.theme === "dark"
        ? "light"
        : "dark",
    );
  });

  retryButton?.addEventListener("click", () =>
    root.location.assign("index.html"),
  );

  setTheme(preferredTheme());
})(typeof globalThis !== "undefined" ? globalThis : window);
