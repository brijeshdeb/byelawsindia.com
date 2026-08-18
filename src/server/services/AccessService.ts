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
 *
 * NOTE ON JOIN TYPES: Supabase's TypeScript type inference for embedded
 * relations requires a populated `Relationships` array in the table type.
 * Since our database.ts uses `Relationships: []` (no static FK metadata),
 * the inferred types for join results are not correct. We use explicit
 * intermediate types and casts at each join query so call-sites remain
 * fully type-safe. The SQL queries themselves are correct — only TS
 * inference needs the nudge.
 */
import { createClient } from "@/lib/supabase/server";
import { AppError, type UserContext, type AccessOption } from "@/types";

// Session storage key for the selected context
export const CONTEXT_COOKIE = "chs_selected_context";

// ── Intermediate types for join query results ─────────────────────────────────
// These match the actual shape returned by PostgREST for embedded relations.
// Supabase returns a single object (not an array) when the FK is singular.

type AccessOptionRow = {
  id: string;
  society_id: string;
  wing_id: string | null;
  role_id: string;
  societies: { name: string; logo_url: string | null } | null;
  wings: { name: string; code: string } | null;
  roles: { name: string } | null;
};

type AssignmentRow = {
  id: string;
  role_id: string;
  wing_id: string | null;
  roles: {
    id: string;
    name: string;
    role_permissions: Array<{
      permissions: { code: string } | null;
    }>;
  } | null;
  societies: { name: string; environment_type: string } | null;
  wings: { name: string; code: string } | null;
};

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

  // Fetch all active assignments with joined society, wing, and role data.
  // The cast to AccessOptionRow[] is required because embedded relation types
  // can't be inferred from Relationships: [] in database.ts.
  const queryResult = await supabase
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

  if (queryResult.error || !queryResult.data) return [];

  const assignments = queryResult.data as unknown as AccessOptionRow[];

  return assignments.map((a) => ({
    assignmentId: a.id,
    societyId: a.society_id,
    societyName: a.societies?.name ?? "Unknown Society",
    societyLogoUrl: a.societies?.logo_url ?? null,
    wingId: a.wing_id,
    wingName: a.wings?.name ?? null,
    wingCode: a.wings?.code ?? null,
    roleId: a.role_id,
    roleName: a.roles?.name ?? "Unknown Role",
  }) satisfies AccessOption);
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
      .select("id, name, environment_type")
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
      environmentType: (society.environment_type as "CUSTOMER" | "DEMO" | "TEST") ?? "CUSTOMER",
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
      societies ( name, environment_type ),
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

  const assignmentResult = await assignmentQuery.limit(1).single();

  if (!assignmentResult.data) {
    throw AppError.forbidden(
      "You don't have access to this society or wing. " +
        "Contact your society administrator."
    );
  }

  // Cast to the expected shape — Relationships: [] prevents type inference.
  const assignment = assignmentResult.data as unknown as AssignmentRow;

  const role = assignment.roles;
  const society = assignment.societies;
  const wing = assignment.wings;

  if (!role) throw AppError.forbidden("Role configuration error.");

  // Build the flat permission set
  const permissions = new Set<string>();
  if (role.role_permissions && Array.isArray(role.role_permissions)) {
    for (const rp of role.role_permissions) {
      if (rp.permissions?.code) permissions.add(rp.permissions.code);
    }
  }

  // Determine effective wing (if assignment is wing-scoped, use it; else use requested)
  const effectiveWingId = assignment.wing_id ?? wingId;

  let wingName: string | null = null;
  let wingCode: string | null = null;

  if (effectiveWingId) {
    if (wing && assignment.wing_id) {
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
    environmentType: (society?.environment_type as "CUSTOMER" | "DEMO" | "TEST") ?? "CUSTOMER",
    profile,
  };
}

/**
 * Returns true if the current context belongs to a DEMO-classified society.
 *
 * Usage:
 *   if (isDemoSociety(ctx)) return { success: true, data: { id: "demo" } };
 *
 * Or throw when an external call must not happen:
 *   guardDemoSociety(ctx, "Payment gateway");
 */
export function isDemoSociety(context: UserContext): boolean {
  return context.environmentType === "DEMO";
}

/**
 * Throws a clear AppError if the context is a DEMO society.
 *
 * Call this immediately before any code that contacts an external service
 * (Resend, payment gateway, webhook, SMS, etc.). The caller must not proceed.
 *
 * @param context   The resolved UserContext for the current request.
 * @param operation Human-readable name of the blocked operation (for the error message).
 *
 * Example:
 *   guardDemoSociety(ctx, "Email notification via Resend");
 */
export function guardDemoSociety(context: UserContext, operation: string): void {
  if (isDemoSociety(context)) {
    throw AppError.validation(
      `[DEMO] "${operation}" is blocked in DEMO environments. ` +
        "No external systems are triggered in demonstration mode."
    );
  }
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
