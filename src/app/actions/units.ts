"use server";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export interface AddUnitInput {
  wingId: string;
  unitNumber: string;
  floor?: number;
  unitType: "RESIDENTIAL" | "COMMERCIAL" | "PARKING" | "OTHER";
  carpetAreaSqft?: number;
  builtUpAreaSqft?: number;
}

export async function addUnitAction(
  input: AddUnitInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId } = await getServerContext();

    const { data, error } = await supabase
      .from("units")
      .insert({
        society_id: societyId,
        wing_id: input.wingId,
        unit_number: input.unitNumber.trim(),
        floor: input.floor ?? null,
        unit_type: input.unitType,
        carpet_area_sqft: input.carpetAreaSqft ?? null,
        built_up_area_sqft: input.builtUpAreaSqft ?? null,
        status: "VACANT",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`Unit "${input.unitNumber}" already exists in this wing.`);
      }
      throw new Error(error.message);
    }

    revalidatePath("/units");
    return { id: data.id };
  });
}
