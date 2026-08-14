"use server";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export interface AddWingInput {
  name: string;
  code: string;
  totalUnits?: number;
  address?: string;
}

export async function addWingAction(
  input: AddWingInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId } = await getServerContext();

    const { data, error } = await supabase
      .from("wings")
      .insert({
        society_id: societyId,
        name: input.name.trim(),
        code: input.code.toUpperCase().trim(),
        total_units: input.totalUnits ?? null,
        address: input.address?.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`Wing code "${input.code.toUpperCase()}" already exists in this society.`);
      }
      throw new Error(error.message);
    }

    revalidatePath("/admin/wings");
    revalidatePath("/units");
    return { id: data.id };
  });
}
