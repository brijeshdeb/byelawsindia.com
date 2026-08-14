import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { ApplicationsClient } from "./ApplicationsClient";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: appsRaw }, { data: unitsRaw }] = await Promise.all([
    supabase
      .from("member_applications")
      .select("id, application_number, applicant_name, applicant_email, application_type, status, submitted_at, units(unit_number, wings(name))")
      .eq("society_id", societyId)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("units")
      .select("id, unit_number, wings(name)")
      .eq("society_id", societyId)
      .order("unit_number"),
  ]);

  const applications = (appsRaw ?? []).map((a: any) => ({
    id: a.id,
    application_number: a.application_number,
    applicant_name: a.applicant_name,
    applicant_email: a.applicant_email,
    application_type: a.application_type,
    status: a.status,
    submitted_at: a.submitted_at,
    unit_number: a.units?.unit_number ?? null,
    wing_name: a.units?.wings?.name ?? null,
  }));

  const units = (unitsRaw ?? []).map((u: any) => ({
    id: u.id,
    unit_number: u.unit_number,
    wing_name: u.wings?.name ?? "",
  }));

  return <ApplicationsClient applications={applications} units={units} />;
}
