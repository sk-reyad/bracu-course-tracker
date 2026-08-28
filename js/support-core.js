(function exposeSupportCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BracuSupportCore = api;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildSupportCore() {
    "use strict";

    const SOURCES = new Set(["maintenance", "auth", "dashboard"]);
    const STATUSES = Object.freeze([
      "active",
      "working_on_it",
      "solved",
      "cancelled",
    ]);

    function normalizeTicketInput(input = {}) {
      const name = String(input.name || "")
        .trim()
        .replace(/\s+/g, " ");
      const email = String(input.email || "")
        .trim()
        .toLowerCase();
      const message = String(input.message || "").trim();
      const source = String(input.source || "").trim();
      if (name.length < 2 || name.length > 100)
        throw new Error("Enter a name between 2 and 100 characters.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        throw new Error("Enter a valid email address.");
      if (message.length < 4) throw new Error("Tell us how we can help.");
      if (message.length > 4000)
        throw new Error("Message must be 4000 characters or less.");
      if (!SOURCES.has(source))
        throw new Error("Invalid support request source.");
      return { name, email, message, source };
    }

    function replyDeliveryForTicket(ticket = {}) {
      return ticket.requester_user_id ? "dashboard" : "mailto";
    }

    function buildGuestMailto(ticket = {}, reply = "") {
      const email = String(ticket.requester_email || "").trim();
      const ticketId = String(ticket.id || "").trim();
      const subject = `BRACU Course Tracker support${ticketId ? ` · ${ticketId}` : ""}`;
      return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(String(reply || "").trim())}`;
    }

    function maintenanceDestination({
      enabled,
      pathname = "",
      search = "",
    } = {}) {
      const page = String(pathname).split("/").pop() || "index.html";
      const adminEntry =
        page === "admin.html" ||
        (page === "auth.html" &&
          new URLSearchParams(search).get("mode") === "admin");
      const publicDocument = page === "privacy.html" || page === "terms.html";
      if (
        enabled &&
        !adminEntry &&
        !publicDocument &&
        page !== "maintenance.html"
      )
        return "maintenance.html";
      return null;
    }

    function createNoticeController({
      showNotice,
      hideNotice,
      schedule = setTimeout,
      cancel = clearTimeout,
      duration = 8000,
    } = {}) {
      let timer = null;

      function dismiss() {
        if (timer !== null) cancel(timer);
        timer = null;
        hideNotice();
      }

      function show(notice) {
        if (timer !== null) cancel(timer);
        showNotice(notice);
        timer = schedule(() => {
          timer = null;
          hideNotice();
        }, duration);
      }

      return Object.freeze({ show, dismiss });
    }

    return Object.freeze({
      SOURCES,
      STATUSES,
      normalizeTicketInput,
      replyDeliveryForTicket,
      buildGuestMailto,
      maintenanceDestination,
      createNoticeController,
    });
  },
);
