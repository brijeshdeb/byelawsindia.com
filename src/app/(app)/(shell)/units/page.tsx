import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { UnitsClient } from "./UnitsClient";

export const metadata: Metadata = { title: "Units" };

export default async function UnitsPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: unitsRaw }, { data: wingsRaw }] = await Promise.all([
    supabase
      .from("units")
      .select("id, unit_number, floor, unit_type, carpet_area_sqft, status, wing_id, wings(name)")
      .eq("society_id", societyId)
      .order("unit_number", { ascending: true }),
    supabase
      .from("wings")
      .select("id, name, code")
      .eq("society_id", societyId)
      .eq("is_active", true)
      .order("code", { ascending: true }),
  ]);

  const units = (unitsRaw ?? []).map((u: any) => ({
    id: u.id,
    unit_number: u.unit_number,
    floor: u.floor,
    unit_type: u.unit_type,
    carpet_area_sqft: u.carpet_area_sqft,
    status: u.status,
    wing_id: u.wing_id,
    wing_name: u.wings?.name ?? "",
  }));

  const wings = (wingsRaw ?? []).map((w: any) => ({
    id: w.id,
    name: w.name,
    code: w.code,
  }));

  const summary = {
    total: units.length,
    occupied: units.filter((u) => u.status === "OCCUPIED").length,
    vacant: units.filter((u) => u.status === "VACANT").length,
    tenanted: units.filter((u) => u.status === "TENANTED").length,
  };

  return <UnitsClient units={units} wings={wings} summary={summary} />;
}
