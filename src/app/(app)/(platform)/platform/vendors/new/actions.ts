"use server";

/**
 * Add Vendor — server action.
 *
 * Security:
 *   - is_platform_admin re-verified from DB on every call.
 *   - createAdminClient() (service role) bypasses RLS for the insert.
 *     The service-role key never leaves the server.
 *   - society_id is verified to exist before insert so orphan vendor rows
 *     cannot be created.
 *   - vendor_code is system-generated (not user-supplied) to prevent
 *     enumeration and to guarantee per-society uniqueness without client trust.
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

const VALID_VENDOR_TYPES = [
  "CIVIL",
  "ELECTRICAL",
  "PLUMBING",
  "SECURITY",
  "HOUSEKEEPING",
  "IT",
  "LANDSCAPING",
  "OTHER",
] as const;

/** Generates VND-YYMM-XXXX (e.g. VND-2608-A3B7). */
function generateVendorCode(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const rand = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `VND-${year}${month}-${rand}`;
}

export async function addVendor(
  _prev: FormResult,
  formData: FormData
): Promise<FormResult> {
  // 1. Verify caller.
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  if (!caller.is_platform_admin) {
    return { success: false, error: "Forbidden: platform admin access required." };
  }

  // 2. Extract fields.
  const society_id   = (formData.get("society_id")   as string | null)?.trim() ?? "";
  const name         = (formData.get("name")          as string | null)?.trim() ?? "";
  const vendor_type  = (formData.get("vendor_type")   as string | null)?.trim() || "OTHER";
  const contact_name = (formData.get("contact_name")  as string | null)?.trim() || null;
  const email        = (formData.get("email")         as string | null)?.trim() || null;
  const phone        = (formData.get("phone")         as string | null)?.trim() || null;
  const address      = (formData.get("address")       as string | null)?.trim() || null;
  const gstin        = (formData.get("gstin")         as string | null)?.trim().toUpperCase() || null;
  const pan          = (formData.get("pan")           as string | null)?.trim().toUpperCase() || null;

  // 3. Validate.
  if (!society_id) {
    return { success: false, error: "Please select a society." };
  }

  if (!name) {
    return { success: false, error: "Vendor name is required." };
  }

  if (!VALID_VENDOR_TYPES.includes(vendor_type as (typeof VALID_VENDOR_TYPES)[number])) {
    return { success: false, error: "Invalid vendor type selected." };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    return { success: false, error: "GSTIN format is invalid (expected 15-character GST number)." };
  }

  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return { success: false, error: "PAN format is invalid (expected 10-character PAN)." };
  }

  const admin = createAdminClient();

  // 4. Verify society exists (security: don't trust the dropdown value blindly).
  const { data: society, error: societyErr } = await admin
    .from("societies")
    .select("id, name")
    .eq("id", society_id)
    .single();

  if (societyErr || !society) {
    return { success: false, error: "Selected society not found." };
  }

  // 5. Generate a unique vendor code (retries on the rare collision).
  let vendor_code = generateVendorCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { count } = await admin
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("vendor_code", vendor_code)
      .eq("society_id", society_id);

    if ((count ?? 0) === 0) break;
    vendor_code = generateVendorCode();
  }

  // 6. Insert vendor.
  const { data: vendor, error: insertErr } = await admin
    .from("vendors")
    .insert({
      society_id,
      vendor_code,
      name,
      vendor_type,
      contact_name,
      email,
      phone,
      address,
      gstin,
      pan,
      status: "ACTIVE",
      is_verified: false,
      created_by: caller.id,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[addVendor] insert error:", insertErr.message);
    return { success: false, error: "Failed to add vendor. Please try again." };
  }

  // 7. Audit (non-blocking).
  await writeAudit({
    actorUserId: caller.id,
    action: "VENDOR_CREATED",
    entityType: "vendors",
    entityId: vendor.id,
    societyId: society_id,
    newValues: { vendor_code, name, vendor_type, society: society.name },
    metadata: { addedBy: caller.email },
  });

  revalidatePath("/platform/console");
  redirect("/platform/console");
}
