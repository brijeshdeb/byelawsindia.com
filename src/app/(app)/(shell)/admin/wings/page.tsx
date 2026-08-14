import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { WingsClient } from "./WingsClient";

export const metadata: Metadata = { title: "Wings" };

export default async function WingsPage() {
  const { supabase, societyId } = await getServerContext();

  const { data: wingsRaw } = await supabase
    .from("wings")
    .select("id, name, code, total_units, is_active, units(id)")
    .eq("society_id", societyId)
    .order("code", { ascending: true });

  const wings = (wingsRaw ?? []).map((w: any) => ({
    id: w.id,
    name: w.name,
    code: w.code,
    total_units: w.total_units,
    is_active: w.is_active,
    unit_count: Array.isArray(w.units) ? w.units.length : 0,
  }));

  return <WingsClient wings={wings} />;
}
