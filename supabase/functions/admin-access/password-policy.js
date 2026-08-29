(function exposePasswordPolicy(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.BracuPasswordPolicy = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPasswordPolicy() {
  "use strict";

  const MIN_LENGTH = 12;
  const REQUIREMENT_MESSAGE =
    "Use at least 12 characters with uppercase, lowercase, number, and symbol.";

  function validateAdminPassword(value) {
    const password = String(value || "");
    const checks = Object.freeze({
      minLength: password.length >= MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9\s]/.test(password),
    });
    return Object.freeze({
      valid: Object.values(checks).every(Boolean),
      checks,
      message: REQUIREMENT_MESSAGE,
    });
  }

  function assertAdminPassword(value) {
    const result = validateAdminPassword(value);
    if (!result.valid) throw new Error(result.message);
    return String(value);
  }

  return Object.freeze({
    MIN_LENGTH,
    REQUIREMENT_MESSAGE,
    validateAdminPassword,
    assertAdminPassword,
  });
});
