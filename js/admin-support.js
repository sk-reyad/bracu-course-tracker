(function mountAdminSupport(root) {
  "use strict";
  if (!root.document || !root.BracuSupabase || !root.BracuAccess) return;
  const documentObject = root.document;
  const $ = (selector) => documentObject.querySelector(selector);
  const labels = {
    active: "Active",
    working_on_it: "Working on it",
    solved: "Solved",
    cancelled: "Cancelled",
  };
  let context = null;
  let busy = false;
  let nextPage = null;

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  }
  function has(permission) {
    return (
      context?.role === "super_admin" ||
      (context?.permissions || []).includes(permission)
    );
  }
  async function invoke(action, payload = {}) {
    const { data, error } =
      await root.BracuSupabase.getClient().functions.invoke("support-desk", {
        body: { action, payload },
      });
    if (error || data?.error)
      throw new Error(data?.error || error?.message || "Request failed.");
    return data?.data;
  }
  function toast(message) {
    const node = $("#adminToast");
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      node.hidden = true;
    }, 2600);
  }
  function ticketMarkup(ticket) {
    const replies = Array.isArray(ticket.support_replies)
      ? ticket.support_replies
      : [];
    const canManage = has("support.manage");
    const options = Object.entries(labels)
      .map(
        ([value, label]) =>
          `<option value="${value}" ${ticket.status === value ? "selected" : ""}>${label}</option>`,
      )
      .join("");
    return `<article class="admin-ticket" data-ticket-id="${escapeHtml(ticket.id)}" data-ticket-guest="${ticket.requester_user_id ? "false" : "true"}">
      <div class="admin-ticket-head"><div class="admin-ticket-person"><strong>${escapeHtml(ticket.requester_name)}</strong><a href="mailto:${encodeURIComponent(ticket.requester_email)}">${escapeHtml(ticket.requester_email)}</a><span class="admin-ticket-meta">${escapeHtml(ticket.source)} · ${escapeHtml(new Date(ticket.created_at).toLocaleString())}</span><span class="ticket-notification ${ticket.notification_status === "sent" ? "sent" : "delayed"}">${ticket.notification_status === "sent" ? "Owner email sent" : `Owner email delayed${canManage ? " · " : ""}`}${ticket.notification_status !== "sent" && canManage ? '<button class="ticket-notification-retry" type="button">Retry</button>' : ""}</span></div><select class="ticket-status-select" aria-label="Ticket status" ${canManage ? "" : "disabled"}>${options}</select></div>
      <p class="admin-ticket-message">${escapeHtml(ticket.message)}</p>
      ${replies.length ? `<div class="admin-ticket-replies">${replies.map((reply) => `<div class="admin-ticket-reply"><strong>Reply</strong><br>${escapeHtml(reply.body)}</div>`).join("")}</div>` : ""}
      ${canManage ? `<div class="admin-ticket-actions"><label>Custom reply<textarea maxlength="4000" placeholder="Write a clear update for the user."></textarea></label><button class="admin-primary ticket-reply-button" type="button">${ticket.requester_user_id ? "Add reply" : "Open email"}</button><p class="ticket-delivery-note">${ticket.requester_user_id ? "The reply will appear in the user’s dashboard." : "The reply is saved, then your mail app opens for manual delivery."}</p></div>` : ""}
    </article>`;
  }
  async function loadTickets(append = false) {
    if (!has("support.read")) {
      $("#supportTicketList").innerHTML =
        '<div class="admin-state admin-error"><p>You do not have access to support tickets.</p></div>';
      return;
    }
    const list = $("#supportTicketList");
    const moreButton = $("#loadMoreSupportTickets");
    const page = append && nextPage !== null ? nextPage : 0;
    if (!append)
      list.innerHTML = '<div class="admin-state"><p>Loading tickets…</p></div>';
    moreButton.disabled = true;
    try {
      const result = await invoke("list-tickets", {
        status: $("#supportStatusFilter").value,
        page,
      });
      const tickets = result?.tickets || [];
      const markup = tickets.map(ticketMarkup).join("");
      if (append) list.insertAdjacentHTML("beforeend", markup);
      else
        list.innerHTML = tickets.length
          ? markup
          : '<div class="admin-state"><i data-lucide="inbox"></i><h3>No tickets found</h3><p>New support requests will appear here.</p></div>';
      nextPage = result?.nextPage ?? null;
      moreButton.hidden = nextPage === null;
      root.lucide?.createIcons?.();
    } catch (_error) {
      if (!append)
        list.innerHTML =
          '<div class="admin-state admin-error"><h3>Couldn’t load tickets</h3><p>Please try again.</p></div>';
      toast("Couldn’t load tickets.");
    } finally {
      moreButton.disabled = false;
    }
  }
  async function loadMaintenance() {
    if (!has("maintenance.manage")) return;
    $("#maintenanceControl").hidden = false;
    try {
      const data = await invoke("get-maintenance");
      $("#maintenanceStateToggle").checked = data.maintenance_enabled === true;
      $("#maintenanceStateLabel").textContent = data.maintenance_enabled
        ? "On"
        : "Off";
    } catch (_error) {
      toast("Couldn’t load maintenance state.");
    }
  }
  function showView(view) {
    const support = view === "support";
    $("#accountsAdminView").hidden = support;
    $("#supportAdminView").hidden = !support;
    documentObject.querySelectorAll("[data-admin-view]").forEach((button) => {
      const active = button.dataset.adminView === view;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (support) {
      loadTickets();
      loadMaintenance();
    }
  }
  async function boot() {
    context = await root.BracuAccess.requireAdminAccess();
    if (!context) return;
    documentObject
      .querySelectorAll("[data-admin-view]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          showView(button.dataset.adminView),
        ),
      );
    $("#supportStatusFilter").addEventListener("change", () =>
      loadTickets(false),
    );
    $("#loadMoreSupportTickets").addEventListener("click", () =>
      loadTickets(true),
    );
    $("#supportTicketList").addEventListener("change", async (event) => {
      const select = event.target.closest(".ticket-status-select");
      if (!select || busy) return;
      const ticket = select.closest("[data-ticket-id]");
      busy = true;
      select.disabled = true;
      try {
        await invoke("update-status", {
          id: ticket.dataset.ticketId,
          status: select.value,
        });
        toast("Ticket status updated.");
      } catch (_error) {
        toast("Couldn’t update ticket status.");
        await loadTickets();
      } finally {
        busy = false;
        select.disabled = !has("support.manage");
      }
    });
    $("#supportTicketList").addEventListener("click", async (event) => {
      const retry = event.target.closest(".ticket-notification-retry");
      if (retry && !busy) {
        const ticket = retry.closest("[data-ticket-id]");
        busy = true;
        retry.disabled = true;
        try {
          await invoke("resend-notification", { id: ticket.dataset.ticketId });
          toast("Owner email sent.");
          await loadTickets(false);
        } catch (_error) {
          toast("Owner email is still delayed.");
        } finally {
          busy = false;
          retry.disabled = false;
        }
        return;
      }
      const button = event.target.closest(".ticket-reply-button");
      if (!button || busy) return;
      const ticket = button.closest("[data-ticket-id]");
      const textarea = ticket.querySelector("textarea");
      const body = textarea.value.trim();
      if (!body) {
        textarea.focus();
        return;
      }
      busy = true;
      button.disabled = true;
      try {
        const reply = await invoke("add-reply", {
          ticketId: ticket.dataset.ticketId,
          body,
        });
        textarea.value = "";
        toast(
          ticket.dataset.ticketGuest === "true"
            ? "Reply saved. Opening your mail app…"
            : "Reply added.",
        );
        if (reply.mailto) root.location.href = reply.mailto;
        await loadTickets();
      } catch (_error) {
        toast("Couldn’t save the reply.");
      } finally {
        busy = false;
        button.disabled = false;
      }
    });
    $("#maintenanceStateToggle").addEventListener("change", async (event) => {
      if (busy) return;
      const enabled = event.target.checked;
      busy = true;
      event.target.disabled = true;
      try {
        await invoke("set-maintenance", { enabled });
        $("#maintenanceStateLabel").textContent = enabled ? "On" : "Off";
        toast(`Maintenance mode ${enabled ? "enabled" : "disabled"}.`);
      } catch (_error) {
        event.target.checked = !enabled;
        toast("Couldn’t update maintenance mode.");
      } finally {
        busy = false;
        event.target.disabled = false;
      }
    });
  }
  if (documentObject.readyState === "loading")
    documentObject.addEventListener(
      "DOMContentLoaded",
      () => boot().catch(() => {}),
      { once: true },
    );
  else boot().catch(() => {});
})(typeof globalThis !== "undefined" ? globalThis : window);
