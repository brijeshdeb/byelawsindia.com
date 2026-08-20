"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { AppError, PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";

export interface RegisterMemberInput {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  ageAtAdmission?: number;
  entranceFeePaidAt?: string;
  nomineeNameAddress?: string;
  nominationDate?: string;
  unitId?: string;
  memberType: "OWNER" | "TENANT" | "ASSOCIATE" | "COMMITTEE";
  effectiveFrom?: string; // ISO date
  notes?: string;
}

export async function registerMemberAction(
  input: RegisterMemberInput
): Promise<ActionResult<{ id: string; memberNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.MEMBER_CREATE);

    if (input.ageAtAdmission !== undefined && (!Number.isInteger(input.ageAtAdmission) || input.ageAtAdmission < 0 || input.ageAtAdmission > 120)) {
      throw AppError.validation("Age on admission must be a whole number between 0 and 120.");
    }

    const memberNumber = await nextSequenceNumber(
      supabase,
      societyId,
      "MEMBER",
      "MBR"
    );

    const { data, error } = await supabase
      .from("members")
      .insert({
        society_id: societyId,
        unit_id: input.unitId || null,
        member_number: memberNumber,
        full_name: input.fullName.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        occupation: input.occupation?.trim() || null,
        age_at_admission: input.ageAtAdmission ?? null,
        entrance_fee_paid_at: input.entranceFeePaidAt || null,
        nominee_name_address: input.nomineeNameAddress?.trim() || null,
        nomination_date: input.nominationDate || null,
        member_type: input.memberType,
        status: "ACTIVE",
        effective_from: input.effectiveFrom ?? new Date().toISOString().split("T")[0],
        notes: input.notes?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/members");
    return { id: data.id, memberNumber };
  });
}

export interface UpdateMemberStatutoryInput {
  memberId: string;
  address?: string;
  occupation?: string;
  ageAtAdmission?: number;
  entranceFeePaidAt?: string;
  nomineeNameAddress?: string;
  nominationDate?: string;
  effectiveUntil?: string;
  cessationReason?: string;
  remark?: string;
}

export async function updateMemberStatutoryDetailsAction(
  input: UpdateMemberStatutoryInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.MEMBER_UPDATE);

    if (!input.memberId) throw AppError.validation("Member is required.");
    if (input.ageAtAdmission !== undefined && (!Number.isInteger(input.ageAtAdmission) || input.ageAtAdmission < 0 || input.ageAtAdmission > 120)) {
      throw AppError.validation("Age on admission must be a whole number between 0 and 120.");
    }

    const { data, error } = await supabase
      .from("members")
      .update({
        address: input.address?.trim() || null,
        occupation: input.occupation?.trim() || null,
        age_at_admission: input.ageAtAdmission ?? null,
        entrance_fee_paid_at: input.entranceFeePaidAt || null,
        nominee_name_address: input.nomineeNameAddress?.trim() || null,
        nomination_date: input.nominationDate || null,
        effective_until: input.effectiveUntil || null,
        cessation_reason: input.cessationReason?.trim() || null,
        remark: input.remark?.trim() || null,
      })
      .eq("id", input.memberId)
      .eq("society_id", societyId)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/members");
    revalidatePath("/members/statutory-registers");
    return { id: data.id };
  });
}
