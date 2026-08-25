const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const corePath = path.join(__dirname, "..", "js", "support-core.js");

test("support submission normalizes safe guest input", () => {
  const { normalizeTicketInput } = require(corePath);
  assert.deepEqual(normalizeTicketInput({
    name: "  SK Reyad  ",
    email: "  TEST@example.com ",
    message: "  Need help with sign in.  ",
    source: "maintenance"
  }), {
    name: "SK Reyad",
    email: "test@example.com",
    message: "Need help with sign in.",
    source: "maintenance"
  });
});

test("support submission rejects invalid or oversized input", () => {
  const { normalizeTicketInput } = require(corePath);
  assert.throws(() => normalizeTicketInput({ name: "Alex", email: "bad", message: "help", source: "auth" }), /valid email/i);
  assert.throws(() => normalizeTicketInput({ name: "Alex", email: "a@b.com", message: "x".repeat(4001), source: "auth" }), /4000/);
  assert.throws(() => normalizeTicketInput({ name: "Alex", email: "a@b.com", message: "help", source: "unknown" }), /source/i);
});

test("guest reply opens mail while signed-in reply stays in dashboard", () => {
  const { replyDeliveryForTicket, buildGuestMailto } = require(corePath);
  assert.equal(replyDeliveryForTicket({ requester_user_id: null }), "mailto");
  assert.equal(replyDeliveryForTicket({ requester_user_id: "user-1" }), "dashboard");
  const href = buildGuestMailto({ requester_email: "guest@example.com", id: "T-10" }, "We are checking it.");
  assert.match(href, /^mailto:guest%40example\.com\?/);
  assert.match(href, /BRACU%20Course%20Tracker/);
});

test("maintenance routing never blocks admin entry points", () => {
  const { maintenanceDestination } = require(corePath);
  assert.equal(maintenanceDestination({ enabled: true, pathname: "/index.html", search: "" }), "maintenance.html");
  assert.equal(maintenanceDestination({ enabled: true, pathname: "/admin.html", search: "" }), null);
  assert.equal(maintenanceDestination({ enabled: true, pathname: "/auth.html", search: "?mode=admin" }), null);
  assert.equal(maintenanceDestination({ enabled: false, pathname: "/maintenance.html", search: "" }), "index.html");
});

test("support notice stays visible for eight seconds and supports manual dismissal", () => {
  const { createNoticeController } = require(corePath);
  const events = [];
  let expiry = null;
  let scheduledDelay = null;
  let cancelledTimer = null;
  const controller = createNoticeController({
    showNotice(notice) { events.push(["show", notice]); },
    hideNotice() { events.push(["hide"]); },
    schedule(callback, delay) {
      expiry = callback;
      scheduledDelay = delay;
      return "notice-timer";
    },
    cancel(timer) { cancelledTimer = timer; }
  });

  controller.show({ title: "Message sent", message: "We’ll get back to you soon.", kind: "success" });
  assert.equal(scheduledDelay, 8000);
  assert.deepEqual(events, [["show", { title: "Message sent", message: "We’ll get back to you soon.", kind: "success" }]]);

  expiry();
  assert.deepEqual(events.at(-1), ["hide"]);

  controller.show({ title: "Request saved", message: "Your ticket is in our support desk.", kind: "warning" });
  controller.dismiss();
  assert.equal(cancelledTimer, "notice-timer");
  assert.deepEqual(events.at(-1), ["hide"]);
});
