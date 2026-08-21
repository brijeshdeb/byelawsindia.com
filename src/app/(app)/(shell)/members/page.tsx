import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { MembersClient } from "./MembersClient";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: members }, { data: unitsRaw }] = await Promise.all([
    supabase
      .from("members")
      .select("id, member_number, full_name, father_spouse_name, email, phone, date_of_birth, pan, identity_type, identity_number_masked, correspondence_address, permanent_address, ownership_type, ownership_document_number, ownership_date, share_certificate_number, shares_held, member_type, status, effective_from, effective_until, address, occupation, age_at_admission, entrance_fee_paid_at, nominee_name_address, nomination_date, cessation_reason, remark, unit_id, units(unit_number, wings(name)), joint_members(id,full_name,ownership_share,status)")
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
    father_spouse_name: m.father_spouse_name,
    email: m.email,
    phone: m.phone,
    date_of_birth: m.date_of_birth,
    pan: m.pan,
    identity_type: m.identity_type,
    identity_number_masked: m.identity_number_masked,
    correspondence_address: m.correspondence_address,
    permanent_address: m.permanent_address,
    ownership_type: m.ownership_type,
    ownership_document_number: m.ownership_document_number,
    ownership_date: m.ownership_date,
    share_certificate_number: m.share_certificate_number,
    shares_held: m.shares_held,
    joint_member_count: (m.joint_members ?? []).filter((joint: any) => joint.status === "ACTIVE").length,
    member_type: m.member_type,
    status: m.status,
    effective_from: m.effective_from,
    effective_until: m.effective_until,
    address: m.address,
    occupation: m.occupation,
    age_at_admission: m.age_at_admission,
    entrance_fee_paid_at: m.entrance_fee_paid_at,
    nominee_name_address: m.nominee_name_address,
    nomination_date: m.nomination_date,
    cessation_reason: m.cessation_reason,
    remark: m.remark,
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
