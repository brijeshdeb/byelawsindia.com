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

  if (!name || !registration_number || !address || !city || !state_val || !pin_code || !email || !phone || !registered_at) {
    return { success: false, error: "All required fields must be filled in." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!/^\d{6}$/.test(pin_code)) {
    return { success: false, error: "PIN code must be exactly 6 digits." };
  }

  // 3. Insert society.
  const admin = createAdminClient();

  const { data: society, error: insertErr } = await admin
    .from("societies")
    .insert({
      name,
      registration_number,
      society_type,
      address,
      city,
      state: state_val,
      pin_code,
      email,
      phone,
      website,
      registered_at,
      is_active: true,
      created_by: caller.id,
    })
    .select("id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return {
        success: false,
        error: "A society with this registration number already exists.",
      };
    }
    console.error("[registerSociety] insert error:", insertErr.message);
    return { success: false, error: "Failed to register society. Please try again." };
  }

  // 4. Seed default society_settings so the society is immediately operable.
  const { error: settingsErr } = await admin
    .from("society_settings")
    .insert({ society_id: society.id });

  if (settingsErr) {
    // Non-fatal — settings have DB-level defaults.
    console.error("[registerSociety] society_settings seed failed:", settingsErr.message);
  }

  // 5. Audit (non-blocking — writeAudit catches internally and never throws).
  await writeAudit({
    actorUserId: caller.id,
    action: "SOCIETY_REGISTERED",
    entityType: "societies",
    entityId: society.id,
    societyId: society.id,
    newValues: { name, registration_number, society_type, city, state: state_val },
    metadata: { registeredBy: caller.email },
  });

  revalidatePath("/platform/console");
  redirect("/platform/console");
}
