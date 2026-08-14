/**
 * Authentication utilities — server-side.
 *
 * Thin wrappers around Supabase Auth for common operations.
 * All auth operations are logged via the audit service.
 */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";
import { AppError } from "@/types";

/**
 * Returns the currently authenticated user's profile, or null.
 * Uses getUser() (not getSession()) to verify the token server-side.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Requires an authenticated user. Throws UNAUTHORIZED if not found.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw AppError.unauthorized();
  if (!user.is_active) throw AppError.forbidden("Your account is inactive.");
  return user;
}

/**
 * Disables a user account (platform admin only).
 * Uses the admin client so this works regardless of the user's own RLS context.
 */
export async function disableUserAccount(
  actorUserId: string,
  targetUserId: string,
  reason: string
): Promise<void> {
  const admin = createAdminClient();

  // Disable in Supabase Auth
  const { error: authError } = await admin.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: "876600h" } // ~100 years = effectively permanent
  );
  if (authError) throw new Error(`Auth disable failed: ${authError.message}`);

  // Disable in profiles table
  const { error: profileError } = await admin
    .from("profiles")
    .update({ is_active: false, updated_by: actorUserId })
    .eq("id", targetUserId);

  if (profileError) throw new Error(`Profile disable failed: ${profileError.message}`);

  // Deactivate all access assignments
  await admin
    .from("user_access_assignments")
    .update({ is_active: false, updated_by: actorUserId })
    .eq("user_id", targetUserId);

  await writeAudit({
    actorUserId,
    action: "USER_DEACTIVATED",
    entityType: "profile",
    entityId: targetUserId,
    metadata: { reason },
  });
}

/**
 * Extracts the client IP address from a request.
 * Handles common proxy headers.
 */
export function getClientIp(request: Request): string | null {
  // Vercel
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] ?? null;
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp;
}
