(function exposeConfig(root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.BRACU_CONFIG = Object.freeze(config);
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildConfig() {
    return {
      supabaseUrl: "https://eeorkgnbhxenaszdxtti.supabase.co",
      supabasePublishableKey: "sb_publishable_yq-LRKTLvxPY4UOt9WveDg_OzM86QFH",
      authPageUrl: "auth.html",
      appPageUrl: "index.html",
      adminPageUrl: "admin.html",
      errorPageUrl: "error.html",
      turnstileSiteKey: "0x4AAAAAAEX2Osurb6IGHo9a",
    };
  },
);
