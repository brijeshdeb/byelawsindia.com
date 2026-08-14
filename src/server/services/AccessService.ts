/**
 * AccessService — server-side only.
 *
 * The central authority for resolving and enforcing authorization.
 *
 * This service answers: "Who is this user, and for the requested context
 * (society + wing), what are they allowed to do?"
 *
 * It is the primary tool for answering the platform's core principle:
 *   "The system must know not only who the user is, but what they are
 *    allowed to do, for which society, for which wing, to which record,
 *    at which point in a workflow."
 *
 * Usage: import only in Server Components, Route Handlers, Server Actions.
 */
import { createClient } from "@/lib/supabase/server";
import { AppError, type UserContext, type AccessOption } from "@/types";

// Session storage key for the selected context
export const CONTEXT_COOKIE = "chs_selected_context";

/**
 * Resolves all available access contexts for the current authenticated user.
 * Used to populate the context selector on login.
 *
 * Returns an empty array if the user is not authenticated or has no
 * active assignments.
 */
export async function getAccessOptions(): Promise<AccessOption[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check if platform admin first — they get a synthetic "platform" context
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  // Fetch all active assignments with joined society, wing, and role data
  const { data: assignments, error } = await supabase
    .from("user_access_assignments")
    .select(
      `
      id,
      society_id,
      wing_id,
      role_id,
      societies ( name, logo_url ),
      wings ( name, code ),
      roles ( name )
    `
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .or("valid_from.is.null,valid_from.lte.now()")
    .or("valid_until.is.null,valid_until.gt.now()");

  if (error || !assignments) return [];

  return assignments.map((a) => {
    const society = Array.isArray(a.societies) ? a.societies[0] : a.societies;
    const wing = Array.isArray(a.wings) ? a.wings[0] : a.wings;
    const role = Array.isArray(a.roles) ? a.roles[0] : a.roles;

    return {
      assignmentId: a.id,
      societyId: a.society_id,
      societyName: society?.name ?? "Unknown Society",
      societyLogoUrl: society?.logo_url ?? null,
      wingId: a.wing_id,
      wingName: wing?.name ?? null,
      wingCode: wing?.code ?? null,
      roleId: a.role_id,
      roleName: role?.name ?? "Unknown Role",
    } satisfies AccessOption;
  });
}

/**
 * Resolves the full UserContext for the given (userId, societyId, wingId) triple.
 *
 * This is called after the user has selected their context. It:
 * 1. Verifies the user actually has an active assignment for this context.
 * 2. Loads all permission codes for their role.
 * 3. Returns a complete UserContext object.
 *
 * Throws FORBIDDEN if the assignment does not exist or is inactive.
 * The caller must not trust societyId/wingId from the browser — they
 * are validated here against the database.
 */
export async function resolveUserContext(
  societyId: string,
  wingId: string | null
): Promise<UserContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw AppError.unauthorized();

  // Load profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    throw AppError.forbidden("Your account is inactive.");
  }

  // Platform admins get unrestricted context
  if (profile.is_platform_admin) {
    const { data: society } = await supabase
      .from("societies")
      .select("id, name")
      .eq("id", societyId)
      .single();

    if (!society) throw AppError.notFound("Society", societyId);

    return {
      userId: user.id,
      societyId: society.id,
      societyName: society.name,
      wingId: null,
      wingName: null,
      wingCode: null,
      roleId: "platform-admin",
      roleName: "Platform Administrator",
      permissions: new Set(["*"]), // All permissions
      isPlatformAdmin: true,
      profile,
    };
  }

  // Validate that the user has an active assignment for this exact context.
  // We match on:
  //   society_id = requested society
  //   wing_id = requested wing OR wing_id IS NULL (society-wide covers any wing)
  const assignmentQuery = supabase
    .from("user_access_assignments")
    .select(
      `
      id,
      role_id,
      wing_id,
      roles (
        id,
        name,
        role_permissions (
          permissions ( code )
        )
      ),
      societies ( name ),
      wings ( name, code )
    `
    )
    .eq("user_id", user.id)
    .eq("society_id", societyId)
    .eq("is_active", true)
    .or("valid_from.is.null,valid_from.lte.now()")
    .or("valid_until.is.null,valid_until.gt.now()");

  // Wing-scoped request: match exact wing OR society-wide (null wing)
  // Society-wide request: match only society-wide (null wing)
  if (wingId) {
    assignmentQuery.or(`wing_id.eq.${wingId},wing_id.is.null`);
  } else {
    assignmentQuery.is("wing_id", null);
  }

  const { data: assignments } = await assignmentQuery.limit(1).single();

  if (!assignments) {
    throw AppError.forbidden(
      "You don't have access to this society or wing. " +
        "Contact your society administrator."
    );
  }

  const role = Array.isArray(assignments.roles)
    ? assignments.roles[0]
    : assignments.roles;
  const society = Array.isArray(assignments.societies)
    ? assignments.societies[0]
    : assignments.societies;
  const wing = Array.isArray(assignments.wings)
    ? assignments.wings[0]
    : assignments.wings;

  if (!role) throw AppError.forbidden("Role configuration error.");

  // Build the flat permission set
  const permissions = new Set<string>();
  if (role.role_permissions && Array.isArray(role.role_permissions)) {
    for (const rp of role.role_permissions) {
      const perm = Array.isArray(rp.permissions) ? rp.permissions[0] : rp.permissions;
      if (perm?.code) permissions.add(perm.code);
    }
  }

  // Determine effective wing (if assignment is wing-scoped, use it; else use requested)
  const effectiveWingId = assignments.wing_id ?? wingId;

  let wingName: string | null = null;
  let wingCode: string | null = null;

  if (effectiveWingId) {
    if (wing && assignments.wing_id) {
      wingName = wing.name;
      wingCode = wing.code;
    } else {
      // Wing was requested but assignment is society-wide; load wing name
      const { data: wingData } = await supabase
        .from("wings")
        .select("name, code")
        .eq("id", effectiveWingId)
        .single();
      wingName = wingData?.name ?? null;
      wingCode = wingData?.code ?? null;
    }
  }

  return {
    userId: user.id,
    societyId,
    societyName: society?.name ?? "Unknown Society",
    wingId: effectiveWingId,
    wingName,
    wingCode,
    roleId: role.id,
    roleName: role.name,
    permissions,
    isPlatformAdmin: false,
    profile,
  };
}

/**
 * Server-side permission enforcement.
 *
 * Call this at the start of any Route Handler or Server Action that
 * performs a sensitive operation. Throws FORBIDDEN if the check fails.
 *
 * This is the definitive authorization check — not the RLS policies
 * (which are a second layer of defense), and not the frontend
 * PermissionGate (which is UI-only).
 *
 * Example:
 *   const ctx = await resolveUserContext(societyId, wingId);
 *   await requirePermission(ctx, PERMISSIONS.CONTRACT_APPROVE);
 */
export function requirePermission(
  context: UserContext,
  permission: string,
  targetWingId?: string | null
): void {
  if (context.isPlatformAdmin) return;

  // Wing-scope check: if the user is wing-scoped and a target wing is specified,
  // they must be in the same wing OR the operation must be society-wide (null target).
  if (context.wingId && targetWingId && context.wingId !== targetWingId) {
    throw AppError.forbidden(
      `You are assigned to Wing ${context.wingCode ?? context.wingId} ` +
        `and cannot perform this action on a different wing.`
    );
  }

  if (!context.permissions.has(permission)) {
    throw AppError.forbidden(
      `Permission '${permission}' is required for this action.`
    );
  }
}

/**
 * Require that ANY of the given permissions is held.
 */
export function requireAnyPermission(
  context: UserContext,
  permissions: string[]
): void {
  if (context.isPlatformAdmin) return;
  const hasAny = permissions.some((p) => context.permissions.has(p));
  if (!hasAny) {
    throw AppError.forbidden("You don't have permission to perform this action.");
  }
}
