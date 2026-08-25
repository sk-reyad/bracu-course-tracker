(function mountSupportWidget(root) {
  "use strict";
  if (!root.document || !root.BracuSupportCore || !root.BracuSupabase) return;
  const documentObject = root.document;
  const source = documentObject.body.classList.contains("maintenance-page")
    ? "maintenance"
    : documentObject.body.classList.contains("auth-page")
      ? "auth"
      : "dashboard";
  const labels = {
    active: "Active",
    working_on_it: "Working on it",
    solved: "Solved",
    cancelled: "Cancelled",
  };
  let identity = null;
  let turnstileToken = "";
  let turnstileWidgetId = null;

  const wrapper = documentObject.createElement("div");
  wrapper.innerHTML = `<dialog id="supportDialog" class="support-dialog" aria-labelledby="supportDialogTitle"><form id="supportForm">
    <div class="support-dialog-head"><div><span class="support-dialog-kicker">Support channel</span><h2 id="supportDialogTitle">How can we help?</h2></div><button class="support-dialog-close" type="button" data-close-support aria-label="Close support form"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <p class="support-intro">Send the team a message. We’ll keep your request connected to your account when you’re signed in.</p>
    <label>Name<input name="name" autocomplete="name" maxlength="100" required /></label>
    <label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required /></label>
    <label>Message<textarea name="message" maxlength="4000" required placeholder="Tell us what happened or what you need help with."></textarea></label>
    <label class="support-honeypot" aria-hidden="true">Leave this empty<input name="botcheck" tabindex="-1" autocomplete="off" /></label>
    <div id="supportTurnstile" class="support-turnstile" aria-label="Security verification"></div>
    <p class="support-privacy-note">We use these details only to handle your request. <a href="privacy.html">Privacy Policy</a></p>
    <p id="supportFormMessage" class="support-message" role="status" aria-live="polite" hidden></p>
    <button class="support-submit" type="submit"><span>Send message</span><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg></button>
  </form></dialog>
  <aside id="supportNotice" class="support-notice" role="status" aria-live="polite" aria-atomic="true" hidden>
    <span class="support-notice-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span>
    <span class="support-notice-copy"><strong id="supportNoticeTitle"></strong><span id="supportNoticeMessage"></span></span>
    <button class="support-notice-close" type="button" data-close-support-notice aria-label="Dismiss notification"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    <span class="support-notice-timer" aria-hidden="true"></span>
  </aside>`;
  const dialog = wrapper.querySelector("#supportDialog");
  const notice = wrapper.querySelector("#supportNotice");
  documentObject.body.append(dialog, notice);
  const form = dialog.querySelector("form");
  const formMessage = dialog.querySelector("#supportFormMessage");
  const challenge = dialog.querySelector("#supportTurnstile");
  const noticeTitle = notice.querySelector("#supportNoticeTitle");
  const noticeMessage = notice.querySelector("#supportNoticeMessage");
  const noticeController = root.BracuSupportCore.createNoticeController({
    showNotice({ title, message, kind }) {
      noticeTitle.textContent = title;
      noticeMessage.textContent = message;
      notice.dataset.kind = kind;
      notice.hidden = false;
      notice.classList.remove("is-visible");
      void notice.offsetWidth;
      notice.classList.add("is-visible");
    },
    hideNotice() {
      notice.classList.remove("is-visible");
      notice.hidden = true;
    },
  });

  function waitForTurnstile() {
    if (root.turnstile) return Promise.resolve(root.turnstile);
    if (
      !documentObject.querySelector(
        "script[data-support-turnstile],script[src*='challenges.cloudflare.com/turnstile']",
      )
    ) {
      const script = documentObject.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.supportTurnstile = "true";
      documentObject.head.append(script);
    }
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const poll = root.setInterval(() => {
        if (root.turnstile) {
          root.clearInterval(poll);
          resolve(root.turnstile);
        } else if (Date.now() - started > 7000) {
          root.clearInterval(poll);
          reject(new Error("Security verification could not load."));
        }
      }, 50);
    });
  }

  async function prepareChallenge() {
    turnstileToken = "";
    challenge.hidden = Boolean(identity);
    if (identity) return;
    const turnstile = await waitForTurnstile();
    if (turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
      return;
    }
    turnstileWidgetId = turnstile.render(challenge, {
      sitekey: root.BRACU_CONFIG.turnstileSiteKey,
      theme:
        documentObject.documentElement.dataset.theme === "dark"
          ? "dark"
          : "light",
      size: "flexible",
      action: "support_ticket",
      callback(token) {
        turnstileToken = token;
        formMessage.hidden = true;
      },
      "expired-callback"() {
        turnstileToken = "";
      },
      "error-callback"() {
        turnstileToken = "";
      },
    });
  }

  async function getIdentity() {
    try {
      const client = root.BracuSupabase.getClient();
      const { data } = await client.auth.getSession();
      const user = data?.session?.user;
      if (!user) return null;
      return {
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email || "",
      };
    } catch (_error) {
      return null;
    }
  }

  async function openDialog() {
    identity = await getIdentity();
    if (identity) {
      form.elements.name.value = identity.name;
      form.elements.email.value = identity.email;
      form.elements.name.readOnly = true;
      form.elements.email.readOnly = true;
    } else {
      form.elements.name.readOnly = false;
      form.elements.email.readOnly = false;
    }
    formMessage.hidden = true;
    dialog.showModal();
    try {
      await prepareChallenge();
    } catch (error) {
      formMessage.textContent = error.message;
      formMessage.dataset.kind = "error";
      formMessage.hidden = false;
    }
    (identity ? form.elements.message : form.elements.name).focus();
  }

  documentObject.addEventListener("click", (event) => {
    if (event.target.closest("[data-open-support]")) {
      event.preventDefault();
      openDialog();
    }
    if (event.target.closest("[data-close-support]")) dialog.close();
    if (event.target.closest("[data-close-support-notice]"))
      noticeController.dismiss();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    const values = Object.fromEntries(new FormData(form));
    let payload;
    try {
      payload = {
        ...root.BracuSupportCore.normalizeTicketInput({ ...values, source }),
        botcheck: values.botcheck || "",
      };
    } catch (error) {
      formMessage.textContent = error.message;
      formMessage.dataset.kind = "error";
      formMessage.hidden = false;
      return;
    }
    if (!identity && !turnstileToken) {
      formMessage.textContent = "Complete the security verification.";
      formMessage.dataset.kind = "error";
      formMessage.hidden = false;
      return;
    }
    payload.turnstileToken = turnstileToken;
    button.disabled = true;
    formMessage.textContent = "Sending your message…";
    formMessage.dataset.kind = "";
    formMessage.hidden = false;
    try {
      const { data, error } =
        await root.BracuSupabase.getClient().functions.invoke("support-desk", {
          body: { action: "submit-ticket", payload },
        });
      if (error || data?.error)
        throw new Error(
          data?.error || error?.message || "Could not send your message.",
        );
      const emailSent = data.data.notification_status === "sent";
      form.elements.message.value = "";
      formMessage.hidden = true;
      dialog.close();
      noticeController.show(
        emailSent
          ? {
              title: "Message sent",
              message: "We’ll get back to you soon.",
              kind: "success",
            }
          : {
              title: "Request saved",
              message:
                "Your ticket is safe; the email notification is delayed.",
              kind: "warning",
            },
      );
      await loadMyTickets();
    } catch (_error) {
      formMessage.textContent = "Couldn’t send the message. Please try again.";
      formMessage.dataset.kind = "error";
    } finally {
      button.disabled = false;
      if (!identity && root.turnstile && turnstileWidgetId !== null) {
        root.turnstile.reset(turnstileWidgetId);
        turnstileToken = "";
      }
    }
  });

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
  async function loadMyTickets() {
    const panel = documentObject.getElementById("supportTicketList");
    if (!panel) return;
    const current = await getIdentity();
    if (!current) {
      panel.innerHTML =
        '<p class="support-message">Sign in to see your support requests.</p>';
      return;
    }
    panel.innerHTML =
      '<p class="support-message">Loading support requests…</p>';
    try {
      const { data, error } =
        await root.BracuSupabase.getClient().functions.invoke("support-desk", {
          body: { action: "list-my-tickets", payload: {} },
        });
      if (error || data?.error) throw new Error();
      const tickets = data?.data || [];
      panel.innerHTML = tickets.length
        ? tickets
            .map((ticket) => {
              const replies = Array.isArray(ticket.support_replies)
                ? ticket.support_replies
                : [];
              return `<article class="support-ticket"><div class="support-ticket-top"><span class="support-status">${escapeHtml(labels[ticket.status] || ticket.status)}</span><time>${escapeHtml(new Date(ticket.created_at).toLocaleString())}</time></div><p>${escapeHtml(ticket.message)}</p>${replies.map((reply) => `<div class="support-ticket-reply"><strong>Support reply</strong><br>${escapeHtml(reply.body)}</div>`).join("")}</article>`;
            })
            .join("")
        : '<p class="support-message">No support requests yet.</p>';
    } catch (_error) {
      panel.innerHTML =
        '<p class="support-message" data-kind="error">Couldn’t load support requests.</p>';
    }
  }

  loadMyTickets();
})(typeof globalThis !== "undefined" ? globalThis : window);
