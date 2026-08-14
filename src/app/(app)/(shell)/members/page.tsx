import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { MembersClient } from "./MembersClient";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: members }, { data: unitsRaw }] = await Promise.all([
    supabase
      .from("members")
      .select("id, member_number, full_name, email, phone, member_type, status, effective_from, unit_id, units(unit_number, wings(name))")
      .eq("society_id", societyId)
      .order("member_number", { ascending: true }),
    supabase
      .from("units")
      .select("id, unit_number, wings(name)")
      .eq("society_id", societyId)
      .order("unit_number", { ascending: true }),
  ]);

  const membersMapped = (members ?? []).map((m: any) => ({
    id: m.id,
    member_number: m.member_number,
    full_name: m.full_name,
    email: m.email,
    phone: m.phone,
    member_type: m.member_type,
    status: m.status,
    effective_from: m.effective_from,
    unit_number: m.units?.unit_number ?? null,
    wing_name: m.units?.wings?.name ?? null,
  }));

  const units = (unitsRaw ?? []).map((u: any) => ({
    id: u.id,
    unit_number: u.unit_number,
    wing_name: u.wings?.name ?? "",
  }));

  return <MembersClient members={membersMapped} units={units} />;
}
