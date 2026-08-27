import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { jsonResponse } from "./http-response.mjs";
import { publicErrorMessage } from "../_shared/public-error.mjs";
import { jwtAssuranceLevel } from "../_shared/jwt-assurance.mjs";
import { listAccounts } from "./account-list.mjs";
import { accountListPermission, assertProfileSummaryAllowed } from "./account-policy.mjs";
import { enforceAdminRateLimit, isAdminRateLimitExceeded } from "./admin-rate-limit.mjs";
import { deleteCatalogItem, listCatalog, upsertCatalogItem } from "./catalog-actions.mjs";
import {
  assertAdministratorActor,
  createAdministrator,
  deleteAccount,
  setAccountPermissions,
  setAccountRole,
  setAccountStatus,
  updateAdminIdentity,
  updateUserIdentity,
  writeMutationAudit
} from "./account-actions.mjs";

type Action =
  | "list-accounts"
  | "create-admin"
  | "update-user-identity"
  | "update-admin-identity"
  | "delete-account"
  | "set-account-status"
  | "set-role"
  | "set-user-permissions"
  | "get-profile-summary"
  | "list-catalog"
  | "upsert-catalog-item"
  | "delete-catalog-item";

type MutationAudit = {
  targetId: string | null;
  beforeValues: Record<string, unknown>;
  afterValues: Record<string, unknown>;
};

type ActorContext = {
  id: string;
  role: string;
  permissions: string[];
};

const ACTION_PERMISSIONS: Record<Action, string> = {
  "list-accounts": "users.read",
  "create-admin": "admins.manage",
  "update-user-identity": "users.identity.manage",
  "update-admin-identity": "admins.manage",
  "delete-account": "permissions.manage",
  "set-account-status": "users.status.manage",
  "set-role": "permissions.manage",
  "set-user-permissions": "permissions.manage",
  "get-profile-summary": "profiles.read",
  "list-catalog": "catalog.manage",
  "upsert-catalog-item": "catalog.manage",
  "delete-catalog-item": "catalog.manage"
};

const ALLOWED_ACTIONS = new Set<Action>(Object.keys(ACTION_PERMISSIONS) as Action[]);
const MUTATION_ACTIONS = new Set<Action>([
  "create-admin",
  "update-user-identity",
  "update-admin-identity",
  "delete-account",
  "set-account-status",
  "set-role",
  "set-user-permissions",
  "upsert-catalog-item",
  "delete-catalog-item"
]);
const ATOMIC_AUDIT_ACTIONS = new Set<Action>([
  "upsert-catalog-item",
  "delete-catalog-item"
]);

const PUBLIC_ERROR_MESSAGES = new Set([
  "Account ID is required.",
  "Viewing administrator accounts requires administrator-list access.",
  "Permissions must be an array.",
  "Unknown permission selection.",
  "You cannot grant access that you do not have.",
  "Super Admin accounts cannot be deleted.",
  "You cannot change your own role or permissions.",
  "You cannot delete your own account.",
  "Only a Super Admin can modify administrator accounts.",
  "Permission denied for this account action.",
  "An administrator account is required for this action.",
  "Full name is required.",
  "Enter a valid email address.",
  "Please use an official BRAC University G-Suite email.",
  "Only an administrator can update Student identity.",
  "Only a Super Admin can update administrator identity.",
  "Only a Super Admin can delete an account.",
  "Confirmation email does not match the target account.",
  "The last active Super Admin cannot be suspended or demoted.",
  "Name, email, and a password of at least 10 characters are required.",
  "Administrator role must be Admin or Super Admin.",
  "Only a Super Admin can create a Super Admin.",
  "A valid account and role are required.",
  "Only a Super Admin can grant administrator access.",
  "A valid account role is required.",
  "Student accounts cannot receive administrator permissions.",
  "Catalog management access is required.",
  "Choose a valid catalog item type.",
  "Enter a valid department ID.",
  "Enter a valid course code.",
  "Enter a valid faculty initial.",
  "Enter a valid faculty email address.",
  "Department name is required.",
  "Faculty name is required.",
  "Course title is required.",
  "Department name is too long.",
  "Faculty name is too long.",
  "Course title is too long.",
  "Source note is too long.",
  "Enter a valid department color.",
  "Enter valid course credits.",
  "Enter a valid course category.",
  "Enter a valid roadmap level.",
  "Enter a valid roadmap order.",
  "Hard prerequisites must be a short array of course codes.",
  "Soft prerequisites must be a short array of course codes.",
  "Roadmap slot must be true or false.",
  "A course cannot require itself.",
  "Catalog item is referenced by another catalog record.",
  "The selected department does not exist.",
  "Every course prerequisite must already exist in the global catalog.",
  "This department is referenced by existing global courses.",
  "This department is referenced by existing global catalog items.",
  "The global catalog item was not found.",
  "A valid account and status are required.",
  "Too many administrator changes. Please try again later."
]);

function namedPlatformKey(variable: string, name = "default") {
  try {
    const values = JSON.parse(Deno.env.get(variable) || "{}");
    return typeof values[name] === "string" ? values[name] : "";
  } catch {
    return "";
  }
}

function permissionForAction(action: Action, payload: Record<string, unknown>) {
  if (action === "list-accounts") return accountListPermission(payload);
  return ACTION_PERMISSIONS[action];
}

async function getProfileSummary(admin: SupabaseClient, payload: Record<string, unknown>, actor: ActorContext) {
  const id = String(payload.id || "");
  if (!id) throw new Error("Account ID is required.");
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, full_name, email, student_id, program, starting_term, starting_year, avatar_path, status, onboarding_completed, created_at, updated_at, user_roles(app_roles(name)), user_permissions(granted, app_permissions(name))")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message || "Could not load the account profile.");
  const { data: access, error: accessError } = await admin.rpc("admin_effective_access", { target_user: id });
  if (accessError || !access) throw new Error("Could not load effective account access.");
  assertProfileSummaryAllowed(String(access.role || "student"), actor.permissions);
  return {
    ...profile,
    effective_permissions: access.permissions || []
  };
}

Deno.serve(async request => {
  const requestId = crypto.randomUUID();
  const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:4173")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const origin = request.headers.get("origin") || "";
  if (!configuredOrigins.includes(origin)) return jsonResponse({ data: null, error: "Origin is not allowed.", requestId }, 403, requestId, "null");
  if (request.method === "OPTIONS") return jsonResponse({ data: null, error: null, requestId }, 204, requestId, origin);
  if (request.method !== "POST") return jsonResponse({ data: null, error: "Method not allowed.", requestId }, 405, requestId, origin);

  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!bearerToken) return jsonResponse({ data: null, error: "Authentication required.", requestId }, 401, requestId, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = namedPlatformKey("SUPABASE_PUBLISHABLE_KEYS") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const caller = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: `Bearer ${bearerToken}` } } });
  const { data: userData, error: userError } = await caller.auth.getUser(bearerToken);
  if (userError || !userData.user) return jsonResponse({ data: null, error: "Invalid session.", requestId }, 401, requestId, origin);
  if (jwtAssuranceLevel(bearerToken) !== "aal2") {
    return jsonResponse(
      { data: null, error: "Multi-factor authentication required.", requestId },
      403,
      requestId,
      origin
    );
  }

  let requestBody: { action?: string; payload?: Record<string, unknown> };
  try { requestBody = await request.json(); }
  catch { return jsonResponse({ data: null, error: "Invalid JSON body.", requestId }, 400, requestId, origin); }
  const action = requestBody.action as Action;
  const payload = requestBody.payload && typeof requestBody.payload === "object" ? requestBody.payload : {};
  if (!ALLOWED_ACTIONS.has(action)) return jsonResponse({ data: null, error: "Unsupported action.", requestId }, 400, requestId, origin);

  const { data: callerProfile, error: profileError } = await caller.from("profiles").select("status").eq("id", userData.user.id).single();
  if (profileError || callerProfile.status !== "active") return jsonResponse({ data: null, error: "Account is not active.", requestId }, 403, requestId, origin);
  const requiredPermission = permissionForAction(action, payload);
  const { data: authorized, error: permissionError } = await caller.rpc("authorize", { permission_name: requiredPermission });
  if (permissionError || !authorized) return jsonResponse({ data: null, error: "Permission denied.", requestId }, 403, requestId, origin);

  const secretKey = namedPlatformKey("SUPABASE_SECRET_KEYS") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!secretKey) return jsonResponse({ data: null, error: "Server configuration is incomplete.", requestId }, 500, requestId, origin);
  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const mutationAudit: MutationAudit = {
    targetId: ATOMIC_AUDIT_ACTIONS.has(action)
      ? null
      : payload.id
        ? String(payload.id)
        : null,
    beforeValues: {},
    afterValues: {}
  };

  let data: unknown;
  try {
    const { data: actorAccess, error: actorError } = await admin.rpc("admin_effective_access", {
      target_user: userData.user.id
    });
    if (actorError || !actorAccess) throw new Error("Could not verify administrator access.");
    const actorRole = String(actorAccess.role || "student");
    const actorPermissions = Array.isArray(actorAccess.permissions)
      ? actorAccess.permissions.map(String)
      : [];
    const actor: ActorContext = {
      id: userData.user.id,
      role: actorRole,
      permissions: actorPermissions
    };
    assertAdministratorActor(actor);
    await enforceAdminRateLimit(admin, actor.id, action);

    switch (action) {
      case "list-accounts": data = await listAccounts(admin, payload); break;
      case "get-profile-summary": data = await getProfileSummary(admin, payload, actor); break;
      case "create-admin": data = await createAdministrator({ admin, payload, actor, audit: mutationAudit }); break;
      case "update-user-identity": data = await updateUserIdentity({ admin, payload, actor, audit: mutationAudit }); break;
      case "update-admin-identity": data = await updateAdminIdentity({ admin, payload, actor, audit: mutationAudit }); break;
      case "delete-account": data = await deleteAccount({ admin, payload, actor, audit: mutationAudit }); break;
      case "set-account-status": data = await setAccountStatus({ admin, payload, actor, audit: mutationAudit }); break;
      case "set-role": data = await setAccountRole({ admin, payload, actor, audit: mutationAudit }); break;
      case "set-user-permissions": data = await setAccountPermissions({ admin, payload, actor, audit: mutationAudit }); break;
      case "list-catalog": data = await listCatalog({ admin }); break;
      case "upsert-catalog-item": data = await upsertCatalogItem({ admin, payload, actor, requestId, audit: mutationAudit }); break;
      case "delete-catalog-item": data = await deleteCatalogItem({ admin, payload, actor, requestId, audit: mutationAudit }); break;
    }
  } catch (error) {
    const rateLimited = isAdminRateLimitExceeded(error);
    if (MUTATION_ACTIONS.has(action) && !rateLimited) {
      try {
        await writeMutationAudit(
          admin,
          userData.user.id,
          mutationAudit.targetId,
          action,
          false,
          mutationAudit.beforeValues,
          mutationAudit.afterValues,
          requestId
        );
      } catch {
        return jsonResponse({ data: null, error: "Request failed.", requestId }, 500, requestId, origin);
      }
    }
    if (rateLimited) {
      const retryAfter = error && typeof error === "object" && "retryAfterSeconds" in error
        ? Math.max(1, Number(error.retryAfterSeconds) || 60)
        : 60;
      return jsonResponse(
        { data: null, error: "Too many administrator changes. Please try again later.", requestId },
        429,
        requestId,
        origin,
        { "retry-after": String(retryAfter) }
      );
    }
    const message = publicErrorMessage(error, PUBLIC_ERROR_MESSAGES);
    const status = message === "Request failed."
      ? 500
      : /Permission denied|Only a Super Admin|administrator account is required/i.test(message)
        ? 403
        : 400;
    return jsonResponse({ data: null, error: message, requestId }, status, requestId, origin);
  }

  if (MUTATION_ACTIONS.has(action) && !ATOMIC_AUDIT_ACTIONS.has(action)) {
    try {
      await writeMutationAudit(
        admin,
        userData.user.id,
        mutationAudit.targetId,
        action,
        true,
        mutationAudit.beforeValues,
        mutationAudit.afterValues,
        requestId
      );
    } catch {
      return jsonResponse({ data: null, error: "Request failed.", requestId }, 500, requestId, origin);
    }
  }
  return jsonResponse({ data, error: null, requestId }, 200, requestId, origin);
});
