"use server";

/**
 * Register New Society — server action.
 *
 * Security:
 *   - is_platform_admin is re-verified from the DB on every call.
 *   - createAdminClient() (service role) bypasses RLS so the platform admin
 *     can insert across tenant boundaries. The service-role key never leaves
 *     the server.
 *   - society_settings is seeded with defaults immediately after insert so
 *     the new society is immediately operable.
 *   - SOCIETY_REGISTERED is written to audit_logs before redirecting.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";
import {
  removeNewlyInvitedUser,
  resolveOrInviteUser,
  validateOperationalEmail,
} from "@/server/services/SocietyAdminService";

export interface FormResult {
  success: boolean;
  error: string | null;
}

export async function registerSociety(
  _prev: FormResult,
  formData: FormData
): Promise<FormResult> {
  // 1. Verify caller is a platform admin — read from DB, never from a cookie.
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  if (!caller.is_platform_admin) {
    return { success: false, error: "Forbidden: platform admin access required." };
  }

  // 2. Extract and validate.
  const name                = (formData.get("name")                as string | null)?.trim() ?? "";
  const registration_number = (formData.get("registration_number") as string | null)?.trim() ?? "";
  const society_type        = (formData.get("society_type")        as string | null)?.trim() || "CHS";
  const address             = (formData.get("address")             as string | null)?.trim() ?? "";
  const city                = (formData.get("city")                as string | null)?.trim() ?? "";
  const state_val           = (formData.get("state")               as string | null)?.trim() ?? "";
  const pin_code            = (formData.get("pin_code")            as string | null)?.trim() ?? "";
  const email               = (formData.get("email")               as string | null)?.trim() ?? "";
  const phone               = (formData.get("phone")               as string | null)?.trim() ?? "";
  const website             = (formData.get("website")             as string | null)?.trim() || null;
  const registered_at       = (formData.get("registered_at")       as string | null)?.trim() ?? "";
  const admin_full_name     = (formData.get("admin_full_name")     as string | null)?.trim() ?? "";
  const admin_email         = (formData.get("admin_email")         as string | null)?.trim().toLowerCase() ?? "";

  if (!name || !registration_number || !address || !city || !state_val || !pin_code || !email || !phone || !registered_at || !admin_full_name || !admin_email) {
    return { success: false, error: "All required fields must be filled in." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!/^\d{6}$/.test(pin_code)) {
    return { success: false, error: "PIN code must be exactly 6 digits." };
  }

  const adminEmailError = validateOperationalEmail(admin_email);
  if (adminEmailError) return { success: false, error: adminEmailError };

  // 3. Resolve an existing account or create the one-time Society Admin invite.
  const admin = createAdminClient();
  let adminUser: { userId: string; invited: boolean };

  try {
    adminUser = await resolveOrInviteUser({ email: admin_email, fullName: admin_full_name });
  } catch (error) {
    console.error("[registerSociety] admin invite error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create the Society Admin login.",
    };
  }

  // 4. Create society + settings + first Society Admin atomically.
  const { data: societyId, error: insertErr } = await admin.rpc(
    "register_society_with_admin",
    {
      p_name: name,
      p_registration_number: registration_number,
      p_society_type: society_type,
      p_address: address,
      p_city: city,
      p_state: state_val,
      p_pin_code: pin_code,
      p_email: email,
      p_phone: phone,
      p_website: website,
      p_registered_at: registered_at,
      p_admin_user_id: adminUser.userId,
      p_created_by: caller.id,
    }
  );

  if (insertErr) {
    if (adminUser.invited) await removeNewlyInvitedUser(adminUser.userId);
    if (insertErr.code === "23505") {
      return {
        success: false,
        error: "A society with this registration number already exists.",
      };
    }
    console.error("[registerSociety] insert error:", insertErr.message);
    return { success: false, error: "Failed to register society. Please try again." };
  }

  // 5. Audit (non-blocking — writeAudit catches internally and never throws).
  await writeAudit({
    actorUserId: caller.id,
    action: "SOCIETY_REGISTERED",
    entityType: "societies",
    entityId: societyId,
    societyId,
    newValues: {
      name,
      registration_number,
      society_type,
      city,
      state: state_val,
      firstSocietyAdminUserId: adminUser.userId,
    },
    metadata: {
      registeredBy: caller.email,
      societyAdminEmail: admin_email,
      invitationSent: adminUser.invited,
    },
  });

  revalidatePath("/platform/console");
  redirect("/platform/console");
}
