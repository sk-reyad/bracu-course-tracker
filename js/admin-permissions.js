(function exposeAdminPermissions(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AdminPermissions = api;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildAdminPermissions() {
    "use strict";

    const CATALOG = Object.freeze([
      {
        key: "view_profiles",
        label: "View profiles",
        description: "View names, emails, and academic details.",
        codes: ["profiles.read", "users.read"],
      },
      {
        key: "edit_user_details",
        label: "Edit user details",
        description: "Change student names and G-Suite emails.",
        codes: ["users.identity.manage"],
      },
      {
        key: "manage_user_status",
        label: "Manage user status",
        description: "Suspend or reactivate students.",
        codes: ["users.status.manage"],
      },
      {
        key: "view_admins",
        label: "View admins",
        description: "View admin accounts and access.",
        codes: ["admins.read", "profiles.read"],
      },
      {
        key: "create_admins",
        label: "Create admins",
        description: "Create new admin accounts.",
        codes: ["admins.manage"],
      },
      {
        key: "manage_permissions",
        label: "Manage permissions",
        description: "Change roles and access.",
        codes: ["permissions.manage"],
      },
      {
        key: "view_support",
        label: "View support",
        description: "View support tickets and replies.",
        codes: ["support.read"],
      },
      {
        key: "manage_support",
        label: "Manage support",
        description: "Update ticket status and send replies.",
        codes: ["support.read", "support.manage"],
      },
      {
        key: "manage_maintenance",
        label: "Maintenance mode",
        description: "Turn website maintenance mode on or off.",
        codes: ["maintenance.manage"],
      },
      {
        key: "manage_catalog",
        label: "Manage global catalog",
        description: "Add and manage shared departments, courses, and faculty.",
        codes: ["catalog.manage"],
      },
    ]);

    function keysForCodes(codes) {
      const set = new Set(codes || []);
      return CATALOG.filter((item) =>
        item.codes.every((code) => set.has(code)),
      ).map((item) => item.key);
    }

    return Object.freeze({ CATALOG, keysForCodes });
  },
);
