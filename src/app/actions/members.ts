"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export interface RegisterMemberInput {
  fullName: string;
  email?: string;
  phone?: string;
  unitId?: string;
  memberType: "OWNER" | "TENANT" | "ASSOCIATE" | "COMMITTEE";
  effectiveFrom?: string; // ISO date
  notes?: string;
}

export async function registerMemberAction(
  input: RegisterMemberInput
): Promise<ActionResult<{ id: string; memberNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

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
