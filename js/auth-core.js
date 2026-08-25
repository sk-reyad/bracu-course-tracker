(function exposeAuthCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AuthCore = api;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildAuthCore() {
    "use strict";

    const BRACU_SUFFIX = "@g.bracu.ac.bd";
    const PROGRAMS = Object.freeze([
      "BSc in Computer Science & Engineering (CSE)",
      "BSc in Computer Science (CS)",
    ]);
    const TERMS = Object.freeze(["Spring", "Summer", "Fall"]);

    function clean(value) {
      return String(value == null ? "" : value).trim();
    }

    function isBracuGsuiteEmail(value) {
      const email = clean(value).toLowerCase();
      if (!email || /\s/.test(email)) return false;
      const at = email.lastIndexOf("@");
      return at > 0 && email.slice(at) === BRACU_SUFFIX;
    }

    function resolvePostAuthRoute({ role, status, onboardingCompleted } = {}) {
      if (status !== "active" && status !== "pending")
        return "auth.html?error=suspended";
      if (role === "admin" || role === "super_admin") {
        return status === "active" ? "admin.html" : "auth.html?error=pending";
      }
      return onboardingCompleted ? "index.html" : "auth.html?step=onboarding";
    }

    function normalizeProfileInput(input = {}) {
      const year = Number.parseInt(input.startingYear, 10);
      return {
        studentId: clean(input.studentId),
        program: clean(input.program),
        startingTerm: clean(input.startingTerm),
        startingYear: Number.isFinite(year) ? year : 0,
        avatarPath: clean(input.avatarPath),
      };
    }

    return Object.freeze({
      BRACU_SUFFIX,
      PROGRAMS,
      TERMS,
      isBracuGsuiteEmail,
      resolvePostAuthRoute,
      normalizeProfileInput,
    });
  },
);
