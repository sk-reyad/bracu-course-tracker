import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { publicErrorMessage } from "../_shared/public-error.mjs";

type Action = "submit-ticket" | "list-my-tickets" | "list-tickets" | "update-status" | "add-reply" | "update-reply" | "resend-notification" | "get-maintenance" | "set-maintenance";
const PUBLIC_ACTIONS = new Set<Action>(["submit-ticket", "get-maintenance"]);
const ADMIN_PERMISSIONS: Partial<Record<Action, string>> = {
  "list-tickets": "support.read",
  "update-status": "support.manage",
  "add-reply": "support.manage",
  "update-reply": "support.manage",
  "resend-notification": "support.manage",
  "set-maintenance": "maintenance.manage"
};
const STATUSES = new Set(["active", "working_on_it", "solved", "cancelled"]);
const SOURCES = new Set(["maintenance", "auth", "dashboard"]);
const PUBLIC_ERROR_MESSAGES = new Set([
  "Enter a valid name.",
  "Enter a valid email address.",
  "Message must be between 4 and 4000 characters.",
  "Invalid support request source.",
  "Request rejected.",
  "Authentication required.",
  "Account is not active.",
  "Permission denied.",
  "Security verification is not configured.",
  "Could not verify the request limit.",
  "Could not verify your account profile.",
  "Account profile is incomplete.",
  "Invalid ticket status.",
  "Ticket ID is required.",
  "Owner email could not be sent. Try again later.",
  "Reply must be between 1 and 4000 characters."
]);

function envKey(variable: string, fallback = "") {
  try {
    const values = JSON.parse(Deno.env.get(variable) || "{}");
    const first = Object.values(values).find(value => typeof value === "string");
    return typeof first === "string" ? first : fallback;
  } catch { return fallback; }
}

function response(origin: string, body: Record<string, unknown>, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
      "access-control-allow-methods": "POST, OPTIONS",
      "vary": "Origin"
    }
  });
}

function text(value: unknown, max: number) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max + 1);
}

function normalizeTicket(payload: Record<string, unknown>) {
  const name = text(payload.name, 100);
  const email = text(payload.email, 254).toLowerCase();
  const message = String(payload.message || "").trim().slice(0, 4001);
  const source = text(payload.source, 24);
  if (name.length < 2 || name.length > 100) throw new Error("Enter a valid name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address.");
  if (message.length < 4 || message.length > 4000) throw new Error("Message must be between 4 and 4000 characters.");
  if (!SOURCES.has(source)) throw new Error("Invalid support request source.");
  if (text(payload.botcheck, 20)) throw new Error("Request rejected.");
  return { name, email, message, source };
}

async function optionalUser(caller: SupabaseClient, authorization: string): Promise<User | null> {
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  const { data, error } = await caller.auth.getUser(token);
  return error ? null : data.user;
}

async function requireUser(caller: SupabaseClient, authorization: string) {
  const user = await optionalUser(caller, authorization);
  if (!user) throw new Error("Authentication required.");
  const { data: profile, error } = await caller.from("profiles").select("status").eq("id", user.id).single();
  if (error || profile?.status !== "active") throw new Error("Account is not active.");
  return user;
}

async function requirePermission(caller: SupabaseClient, permission: string) {
  const { data, error } = await caller.rpc("authorize", { permission_name: permission });
  if (error || !data) throw new Error("Permission denied.");
}

async function verifyTurnstile(token: string, remoteIp: string, expectedHostname: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY") || "";
  if (!secret) throw new Error("Security verification is not configured.");
  if (!token) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(8000)
  });
  if (!result.ok) return false;
  const verification = await result.json();
  return verification?.success === true
    && verification?.action === "support_ticket"
    && verification?.hostname === expectedHostname;
}

async function hashRateKey(value: string) {
  const salt = Deno.env.get("SUPPORT_RATE_LIMIT_SALT") || Deno.env.get("TURNSTILE_SECRET_KEY") || "support";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${value}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(admin: SupabaseClient, key: string, maxRequests: number) {
  const { data, error } = await admin.rpc("consume_support_rate_limit", {
    rate_key: await hashRateKey(key),
    window_seconds: 60,
    max_requests: maxRequests
  });
  if (error) throw new Error("Could not verify the request limit.");
  return data === true;
}

async function notifyOwner(ticket: Record<string, unknown>) {
  const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY");
  if (!accessKey) return false;
  const form = new FormData();
  form.set("access_key", accessKey);
  form.set("subject", `BRACU Course Tracker support · ${ticket.id}`);
  form.set("from_name", "BRACU Course Tracker Support");
  form.set("name", String(ticket.requester_name));
  form.set("email", String(ticket.requester_email));
  form.set("message", String(ticket.message));
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(8000)
      });
      if (result.ok) return true;
    } catch (_error) { /* the durable ticket remains available for admin follow-up */ }
  }
  return false;
}

Deno.serve(async request => {
  const origins = (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:4173").split(",").map(value => value.trim()).filter(Boolean);
  const origin = request.headers.get("origin") || origins[0] || "";
  if (!origins.includes(origin)) return response("null", { data: null, error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return response(origin, {}, 204);
  if (request.method !== "POST") return response(origin, { data: null, error: "Method not allowed." }, 405);

  let body: { action?: Action; payload?: Record<string, unknown> };
  try { body = await request.json(); }
  catch { return response(origin, { data: null, error: "Invalid request." }, 400); }
  const action = body.action as Action;
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const allActions = new Set<Action>([...PUBLIC_ACTIONS, "list-my-tickets", "list-tickets", "update-status", "add-reply", "update-reply", "resend-notification", "set-maintenance"]);
  if (!allActions.has(action)) return response(origin, { data: null, error: "Unsupported action." }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = envKey("SUPABASE_PUBLISHABLE_KEYS", Deno.env.get("SUPABASE_ANON_KEY") || "");
  const secretKey = envKey("SUPABASE_SECRET_KEYS", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
  if (!supabaseUrl || !publishableKey || !secretKey) return response(origin, { data: null, error: "Server configuration is incomplete." }, 500);
  const authorization = request.headers.get("authorization") || "";
  const caller = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (action === "get-maintenance") {
      const { data, error } = await admin.from("site_settings").select("maintenance_enabled, maintenance_message, updated_at").eq("id", "global").single();
      if (error) throw error;
      return response(origin, { data, error: null });
    }

    if (action === "submit-ticket") {
      const input = normalizeTicket(payload);
      const user = await optionalUser(caller, authorization);
      const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
      const clientIp = request.headers.get("cf-connecting-ip") || forwardedFor || "unknown";
      let identity = { name: input.name, email: input.email };
      if (user) {
        const { data: profile, error: profileError } = await admin.from("profiles").select("full_name, email").eq("id", user.id).single();
        if (profileError || !profile) throw new Error("Could not verify your account profile.");
        identity = { name: text(profile.full_name, 100), email: text(profile.email, 254).toLowerCase() };
        if (identity.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) throw new Error("Account profile is incomplete.");
      } else {
        const verified = await verifyTurnstile(text(payload.turnstileToken, 2048), clientIp, new URL(origin).hostname);
        if (!verified) return response(origin, { data: null, error: "Complete the security verification." }, 403);
      }
      const identityAllowed = await consumeRateLimit(admin, user ? `user:${user.id}` : `email:${identity.email}`, 3);
      const networkAllowed = await consumeRateLimit(admin, `ip:${clientIp}`, 10);
      if (!identityAllowed || !networkAllowed) return response(origin, { data: null, error: "Please wait before sending another message." }, 429);
      const { data: ticket, error } = await admin.from("support_tickets").insert({
        requester_user_id: user?.id || null,
        requester_name: identity.name,
        requester_email: identity.email,
        message: input.message,
        source: input.source
      }).select("id, requester_user_id, requester_name, requester_email, message, source, status, created_at").single();
      if (error) throw error;
      let notified = false;
      try { notified = await notifyOwner(ticket); } catch { notified = false; }
      await admin.from("support_tickets").update({ notification_status: notified ? "sent" : "failed" }).eq("id", ticket.id);
      return response(origin, { data: { ...ticket, notification_status: notified ? "sent" : "failed" }, error: null }, 201);
    }

    const user = await requireUser(caller, authorization);
    const permission = ADMIN_PERMISSIONS[action];
    if (permission) await requirePermission(caller, permission);

    if (action === "list-my-tickets") {
      const { data, error } = await admin.from("support_tickets").select("id, message, source, status, created_at, updated_at, support_replies(id, body, delivery_method, created_at, updated_at)").eq("requester_user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return response(origin, { data, error: null });
    }

    if (action === "list-tickets") {
      const page = Math.max(0, Math.min(100000, Number.parseInt(String(payload.page || "0"), 10) || 0));
      const pageSize = 25;
      const from = page * pageSize;
      const to = from + pageSize;
      let query = admin.from("support_tickets").select("id, requester_user_id, requester_name, requester_email, message, source, status, notification_status, created_at, updated_at, support_replies(id, body, delivery_method, created_at, updated_at)").order("created_at", { ascending: false }).range(from, to);
      if (payload.status && STATUSES.has(String(payload.status))) query = query.eq("status", String(payload.status));
      const { data, error } = await query;
      if (error) throw error;
      const tickets = data || [];
      return response(origin, { data: { tickets: tickets.slice(0, pageSize), nextPage: tickets.length > pageSize ? page + 1 : null }, error: null });
    }

    if (action === "update-status") {
      const id = text(payload.id, 80);
      const status = text(payload.status, 30);
      if (!id || !STATUSES.has(status)) throw new Error("Invalid ticket status.");
      const { data, error } = await admin.from("support_tickets").update({ status }).eq("id", id).select("id, status, updated_at").single();
      if (error) throw error;
      return response(origin, { data, error: null });
    }

    if (action === "resend-notification") {
      const id = text(payload.id, 80);
      if (!id) throw new Error("Ticket ID is required.");
      const { data: ticket, error: ticketError } = await admin.from("support_tickets").select("id, requester_name, requester_email, message").eq("id", id).single();
      if (ticketError) throw ticketError;
      const notified = await notifyOwner(ticket);
      const { error: updateError } = await admin.from("support_tickets").update({ notification_status: notified ? "sent" : "failed" }).eq("id", id);
      if (updateError) throw updateError;
      if (!notified) throw new Error("Owner email could not be sent. Try again later.");
      return response(origin, { data: { id, notification_status: "sent" }, error: null });
    }

    if (action === "add-reply") {
      const ticketId = text(payload.ticketId, 80);
      const replyBody = String(payload.body || "").trim();
      if (!ticketId || !replyBody || replyBody.length > 4000) throw new Error("Reply must be between 1 and 4000 characters.");
      const { data: ticket, error: ticketError } = await admin.from("support_tickets").select("id, requester_user_id, requester_email").eq("id", ticketId).single();
      if (ticketError) throw ticketError;
      const deliveryMethod = ticket.requester_user_id ? "dashboard" : "mailto";
      const { data, error } = await admin.from("support_replies").insert({ ticket_id: ticketId, author_id: user.id, body: replyBody, delivery_method: deliveryMethod }).select("id, body, delivery_method, created_at").single();
      if (error) throw error;
      const subject = `BRACU Course Tracker support · ${ticketId}`;
      const mailto = deliveryMethod === "mailto" ? `mailto:${encodeURIComponent(ticket.requester_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(replyBody)}` : null;
      return response(origin, { data: { ...data, mailto }, error: null }, 201);
    }

    if (action === "update-reply") {
      const id = text(payload.id, 80);
      const replyBody = String(payload.body || "").trim();
      if (!id || !replyBody || replyBody.length > 4000) throw new Error("Reply must be between 1 and 4000 characters.");
      const { data, error } = await admin.from("support_replies").update({ body: replyBody }).eq("id", id).select("id, body, updated_at").single();
      if (error) throw error;
      return response(origin, { data, error: null });
    }

    if (action === "set-maintenance") {
      const enabled = payload.enabled === true;
      const message = String(payload.message || "").trim().slice(0, 500) || "BRACU Course Tracker is temporarily unavailable while we complete an update. Please check back shortly.";
      const { data, error } = await admin.from("site_settings").update({ maintenance_enabled: enabled, maintenance_message: message, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", "global").select("maintenance_enabled, maintenance_message, updated_at").single();
      if (error) throw error;
      return response(origin, { data, error: null });
    }
  } catch (error) {
    const message = publicErrorMessage(error, PUBLIC_ERROR_MESSAGES);
    const status = message === "Request failed."
      ? 500
      : /Authentication required|Invalid session/i.test(message)
        ? 401
        : /Permission denied|not active/i.test(message)
          ? 403
          : 400;
    return response(origin, { data: null, error: message }, status);
  }

  return response(origin, { data: null, error: "Unsupported action." }, 400);
});
