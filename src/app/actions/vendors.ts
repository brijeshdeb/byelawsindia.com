"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";
import { writeAuditCritical } from "@/lib/audit";

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
  serviceAreas?: string[];
  branchAvailability?: string;
  isPreferred?: boolean;
  notes?: string;
}

export async function registerVendorAction(
  input: RegisterVendorInput
): Promise<ActionResult<{ id: string; vendorCode: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.VENDOR_CREATE);

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
        service_areas: Array.from(new Set((input.serviceAreas??[]).map(value=>value.trim()).filter(Boolean))),
        branch_availability: input.branchAvailability?.trim() || null,
        is_preferred: input.isPreferred??false,
        status: "ACTIVE",
        is_verified: false,
        notes: input.notes?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await writeAuditCritical({societyId,wingId,actorUserId:userId,action:"VENDOR_CREATED",entityType:"vendor",entityId:data.id,newValues:{vendorCode,name:input.name.trim(),vendorType:input.vendorType,isPreferred:input.isPreferred??false,serviceAreas:input.serviceAreas??[]}});

    revalidatePath("/vendors");
    return { id: data.id, vendorCode };
  });
}
