(function guardMaintenanceMode(root) {
  "use strict";
  if (!root.document || !root.BracuSupabase || !root.BracuSupportCore) return;
  async function check() {
    try {
      const { data, error } = await root.BracuSupabase.getClient()
        .from("site_settings")
        .select("maintenance_enabled, maintenance_message")
        .eq("id", "global")
        .maybeSingle();
      if (error || !data) return;
      const destination = root.BracuSupportCore.maintenanceDestination({
        enabled: data.maintenance_enabled === true,
        pathname: root.location.pathname,
        search: root.location.search,
      });
      if (destination) {
        root.location.replace(destination);
        return;
      }
      const description = root.document.getElementById(
        "maintenanceDescription",
      );
      if (description && data.maintenance_message)
        description.textContent = data.maintenance_message;
    } catch (_error) {
      /* A settings outage must not block the website or Admin login. */
    }
  }
  check();
})(typeof globalThis !== "undefined" ? globalThis : window);
