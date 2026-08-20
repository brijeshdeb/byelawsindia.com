"use server";

/**
 * Platform member management actions.
 *
 * All actions require the caller to be a confirmed platform admin
 * (read from the database, not a cookie or client value).
 *
 * createAdminClient() is used throughout to bypass RLS for cross-tenant
 * assignment writes. This module must never be imported from client code.
 */

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit, writeAuditCritical } from "@/lib/audit";
import {
  assignSocietyAdmin,
  removeNewlyInvitedUser,
  resolveOrInviteUser,
  validateOperationalEmail,
} from "@/server/services/SocietyAdminService";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionResult {
  success: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// assignUserAccess
// ---------------------------------------------------------------------------

/**
 * Assign (or reactivate) a user's access to a society with a given role.
 *
 * Called via useActionState in PlatformMembersClient.
 *
 * FormData keys:
 *   userId    – target profile id
 *   societyId – society id
 *   roleId    – role id
 */
export async function assignUserAccess(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  // 1. Verify caller is a platform admin — server-side, from DB.
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  if (!caller.is_platform_admin) {
    return { success: false, error: "Forbidden: platform admin access required." };
  }

  // 2. Extract and validate inputs.
  const userId = (formData.get("userId") as string | null)?.trim();
  const societyId = (formData.get("societyId") as string | null)?.trim();
  const roleId = (formData.get("roleId") as string | null)?.trim();

  if (!userId || !societyId || !roleId) {
    return { success: false, error: "User, society, and role are all required." };
  }

  const admin = createAdminClient();

  // 3. Check if an assignment already exists for this (user, society, role) triplet.
  const { data: existing, error: lookupError } = await admin
    .from("user_access_assignments")
    .select("id, is_active")
    .eq("user_id", userId)
    .eq("society_id", societyId)
    .eq("role_id", roleId)
    .maybeSingle();

  if (lookupError) {
    console.error("[assignUserAccess] lookup error:", lookupError.message);
    return { success: false, error: "Database error during lookup." };
  }

  if (existing) {
    if (existing.is_active) {
      return {
        success: false,
        error: "User already has this role in the selected society.",
      };
    }

    // Reactivate a previously revoked assignment.
    const { error: reactivateError } = await admin
      .from("user_access_assignments")
      .update({ is_active: true, updated_by: caller.id })
      .eq("id", existing.id);

    if (reactivateError) {
      console.error("[assignUserAccess] reactivate error:", reactivateError.message);
      return { success: false, error: "Failed to reactivate assignment." };
    }

    await writeAuditCritical({
      actorUserId: caller.id,
      action: "ACCESS_ASSIGNED",
      entityType: "user_access_assignments",
      entityId: existing.id,
      societyId,
      newValues: { userId, societyId, roleId, reactivated: true },
      metadata: { assignedBy: caller.email },
    });

    revalidatePath("/platform/members");
    return { success: true, error: null };
  }

  // 4. Insert new assignment.
  const { error: insertError } = await admin.from("user_access_assignments").insert({
    user_id: userId,
    society_id: societyId,
    role_id: roleId,
    is_active: true,
    created_by: caller.id,
  });

  if (insertError) {
    console.error("[assignUserAccess] insert error:", insertError.message);
    return { success: false, error: "Failed to create assignment." };
  }

  // 5. Audit (critical — access change is a security event).
  try {
    await writeAuditCritical({
      actorUserId: caller.id,
      action: "ACCESS_ASSIGNED",
      entityType: "user_access_assignments",
      entityId: userId,
      societyId,
      newValues: { userId, societyId, roleId },
      metadata: { assignedBy: caller.email },
    });
  } catch (auditErr) {
    // Audit failed after assignment committed. Log loudly but don't surface to user.
    console.error("[assignUserAccess] AUDIT WRITE FAILED after insert:", auditErr);
  }

  revalidatePath("/platform/members");
  return { success: true, error: null };
}

// ---------------------------------------------------------------------------
// revokeUserAccess
// ---------------------------------------------------------------------------

/**
 * Deactivate a specific access assignment by its ID.
 *
 * FormData keys:
 *   assignmentId – the id of the user_access_assignments row to revoke
 *   userId       – target user (for audit trail)
 *   societyId    – society (for audit trail)
 */
export async function revokeUserAccess(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  if (!caller.is_platform_admin) {
    return { success: false, error: "Forbidden: platform admin access required." };
  }

  const assignmentId = (formData.get("assignmentId") as string | null)?.trim();
  const userId = (formData.get("userId") as string | null)?.trim();
  const societyId = (formData.get("societyId") as string | null)?.trim();

  if (!assignmentId || !userId) {
    return { success: false, error: "Assignment ID is required." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("user_access_assignments")
    .update({ is_active: false, updated_by: caller.id })
    .eq("id", assignmentId);

  if (error) {
    console.error("[revokeUserAccess] error:", error.message);
    return { success: false, error: "Failed to revoke assignment." };
  }

  await writeAudit({
    actorUserId: caller.id,
    action: "ACCESS_REVOKED",
    entityType: "user_access_assignments",
    entityId: assignmentId,
    societyId: societyId ?? null,
    oldValues: { assignmentId, userId },
    metadata: { revokedBy: caller.email },
  });

  revalidatePath("/platform/members");
  return { success: true, error: null };
}

// ---------------------------------------------------------------------------
// inviteUser
// ---------------------------------------------------------------------------

/**
 * Invite a new user to the platform by email.
 *
 * Uses Supabase's admin invite flow — sends a one-time sign-up link. Once
 * the user clicks the link and sets their password, their profile row is
 * created (via the auth trigger) and they appear in the user list for
 * access assignment.
 *
 * FormData keys:
 *   email     - email address to invite
 *   full_name - optional display name pre-filled in their profile
 */
export async function inviteUser(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  if (!caller.is_platform_admin) {
    return { success: false, error: "Forbidden: platform admin access required." };
  }

  const email     = (formData.get("email")     as string | null)?.trim().toLowerCase() ?? "";
  const full_name = (formData.get("full_name") as string | null)?.trim() || null;

  if (!email) {
    return { success: false, error: "Email address is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already been registered") ||
      msg.includes("already exists")
    ) {
      return { success: false, error: "A user with this email address already exists." };
    }
    console.error("[inviteUser] error:", error.message);
    return { success: false, error: "Failed to send invite. Please try again." };
  }

  // Audit is critical — an invite is a security event.
  try {
    await writeAuditCritical({
      actorUserId: caller.id,
      action: "USER_INVITED",
      entityType: "profiles",
      entityId: null,
      metadata: { invitedEmail: email, fullName: full_name, invitedBy: caller.email },
    });
  } catch (auditErr) {
    // Invite already sent — log the audit failure but don't surface an error to the user.
    console.error("[inviteUser] AUDIT WRITE FAILED after invite:", auditErr);
  }

  revalidatePath("/platform/members");
  return { success: true, error: null };
}

// ---------------------------------------------------------------------------
// inviteSocietyAdmin
// ---------------------------------------------------------------------------

/**
 * Create or link a login and immediately grant the society-wide Society Admin
 * role. This is the safe one-step path for adding administrators after initial
 * society registration.
 */
export async function inviteSocietyAdmin(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  if (!caller.is_platform_admin) {
    return { success: false, error: "Forbidden: platform admin access required." };
  }

  const societyId = (formData.get("societyId") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";

  if (!societyId || !email || !fullName) {
    return { success: false, error: "Society, full name, and login email are required." };
  }

  const emailError = validateOperationalEmail(email);
  if (emailError) return { success: false, error: emailError };

  const admin = createAdminClient();
  const { data: society, error: societyError } = await admin
    .from("societies")
    .select("id, name")
    .eq("id", societyId)
    .eq("is_active", true)
    .maybeSingle();

  if (societyError || !society) {
    return { success: false, error: "Select an active society." };
  }

  let account: { userId: string; invited: boolean } | null = null;
  let assignmentId: string;
  try {
    account = await resolveOrInviteUser({ email, fullName });
    assignmentId = await assignSocietyAdmin({
      userId: account.userId,
      societyId,
      actorUserId: caller.id,
    });
  } catch (error) {
    if (account?.invited) await removeNewlyInvitedUser(account.userId);
    console.error("[inviteSocietyAdmin] error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add the Society Admin login.",
    };
  }

  try {
    await writeAuditCritical({
      actorUserId: caller.id,
      action: account.invited ? "SOCIETY_ADMIN_INVITED" : "SOCIETY_ADMIN_ASSIGNED",
      entityType: "user_access_assignments",
      entityId: assignmentId,
      societyId,
      newValues: { userId: account.userId, role: "Society Admin" },
      metadata: {
        invitedEmail: email,
        fullName,
        societyName: society.name,
        invitedBy: caller.email,
        invitationSent: account.invited,
      },
    });
  } catch (auditError) {
    console.error("[inviteSocietyAdmin] AUDIT WRITE FAILED after assignment:", auditError);
  }

  revalidatePath("/platform/members");
  return { success: true, error: null };
}
