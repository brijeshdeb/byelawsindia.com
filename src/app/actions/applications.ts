"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export type ApplicationType = "MEMBERSHIP" | "NOC_SALE" | "NOC_RENOVATION" | "PARKING" | "OTHER";

export interface CreateApplicationInput {
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  unitId?: string;
  applicationType: ApplicationType;
  notes?: string;
}

export async function createApplicationAction(
  input: CreateApplicationInput
): Promise<ActionResult<{ id: string; applicationNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

    const applicationNumber = await nextSequenceNumber(
      supabase,
      societyId,
      "MEMBER_APPLICATION",
      "APP"
    );

    const { data, error } = await supabase
      .from("member_applications")
      .insert({
        society_id: societyId,
        application_number: applicationNumber,
        applicant_name: input.applicantName.trim(),
        applicant_email: input.applicantEmail?.trim() || null,
        applicant_phone: input.applicantPhone?.trim() || null,
        unit_id: input.unitId || null,
        application_type: input.applicationType,
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
        notes: input.notes?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/applications");
    return { id: data.id, applicationNumber };
  });
}
