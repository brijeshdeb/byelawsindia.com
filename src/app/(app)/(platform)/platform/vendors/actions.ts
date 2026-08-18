"use server";

/**
 * Platform Vendors — server actions.
 *
 * Security:
 *   - is_platform_admin re-verified from DB on every call.
 *   - createAdminClient() (service role) bypasses RLS for writes.
 *     The service-role key never reaches the browser.
 *   - vendor_id and society_id are fetched from the DB to confirm
 *     the vendor exists before any mutation — never trusted from FormData.
 */

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";

/**
 * Toggle the is_verified flag on a vendor.
 * Called from a hidden-input form in the vendors table.
 */
export async function verifyVendor(formData: FormData): Promise<void> {
  // 1. Verify the caller is a platform admin.
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    throw new Error("Authentication required.");
  }

  if (!caller.is_platform_admin) {
    throw new Error("Forbidden: platform admin access required.");
  }

  const vendorId = (formData.get("vendorId") as string | null)?.trim() ?? "";
  if (!vendorId) throw new Error("Vendor ID is required.");

  const admin = createAdminClient();

  // 2. Fetch the vendor from DB — do not trust the UI for current state.
  const { data: vendor, error: fetchErr } = await admin
    .from("vendors")
    .select("id, is_verified, society_id, name, vendor_code")
    .eq("id", vendorId)
    .single();

  if (fetchErr || !vendor) {
    throw new Error("Vendor not found.");
  }

  const newVerified = !vendor.is_verified;

  // 3. Persist the toggle.
  const { error: updateErr } = await admin
    .from("vendors")
    .update({ is_verified: newVerified })
    .eq("id", vendorId);

  if (updateErr) {
    console.error("[verifyVendor] update error:", updateErr.message);
    throw new Error("Failed to update vendor. Please try again.");
  }

  // 4. Audit (non-blocking).
  await writeAudit({
    actorUserId: caller.id,
    action: "VENDOR_VERIFIED",
    entityType: "vendors",
    entityId: vendorId,
    societyId: vendor.society_id,
    oldValues: { is_verified: vendor.is_verified },
    newValues: { is_verified: newVerified },
    metadata: {
      vendorCode: vendor.vendor_code,
      vendorName: vendor.name,
      performedBy: caller.email,
    },
  });

  revalidatePath("/platform/vendors");
}
