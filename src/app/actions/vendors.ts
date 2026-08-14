"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export type VendorType = "CIVIL" | "ELECTRICAL" | "PLUMBING" | "SECURITY" | "HOUSEKEEPING" | "IT" | "LANDSCAPING" | "OTHER";

export interface RegisterVendorInput {
  name: string;
  vendorType: VendorType;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  notes?: string;
}

export async function registerVendorAction(
  input: RegisterVendorInput
): Promise<ActionResult<{ id: string; vendorCode: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

    const vendorCode = await nextSequenceNumber(
      supabase,
      societyId,
      "VENDOR",
      "VND"
    );

    const { data, error } = await supabase
      .from("vendors")
      .insert({
        society_id: societyId,
        vendor_code: vendorCode,
        name: input.name.trim(),
        vendor_type: input.vendorType,
        contact_name: input.contactName?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        gstin: input.gstin?.trim() || null,
        pan: input.pan?.trim() || null,
        status: "ACTIVE",
        is_verified: false,
        notes: input.notes?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/vendors");
    return { id: data.id, vendorCode };
  });
}
