import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getServerContext } from "@/lib/context";
import { buildSimplePdf } from "@/lib/reports/simple-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function pdfBlob(bytes: Uint8Array) {
  const copy = Uint8Array.from(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const { id, itemId } = await params;
    const { supabase, societyId, wingId, userId } = await getServerContext();
    const [applicationResult, itemResult, societyResult] = await Promise.all([
      supabase
        .from("member_applications")
        .select(
          "id,application_number,applicant_name,applicant_email,applicant_phone,application_type,units(unit_number,wings(name))",
        )
        .eq("id", id)
        .eq("society_id", societyId)
        .single(),
      supabase
        .from("application_checklist_items")
        .select("id,label,item_code")
        .eq("id", itemId)
        .eq("application_id", id)
        .eq("society_id", societyId)
        .single(),
      supabase
        .from("societies")
        .select("name,registration_number,address,city,state,pin_code")
        .eq("id", societyId)
        .single(),
    ]);
    if (applicationResult.error || itemResult.error || societyResult.error) {
      return NextResponse.json({ error: "Application form was not found." }, { status: 404 });
    }

    const application = applicationResult.data;
    const item = itemResult.data;
    const society = societyResult.data;
    const unit = application.units as unknown as {
      unit_number: string | null;
      wings: { name: string | null } | null;
    } | null;
    const rows = [
      ["Society", society.name],
      ["Registration", society.registration_number],
      ["Society address", `${society.address}, ${society.city}, ${society.state} ${society.pin_code}`],
      ["Application number", application.application_number],
      ["Application type", application.application_type],
      ["Checklist form", item.label],
      ["Applicant name", application.applicant_name],
      ["Email", application.applicant_email ?? ""],
      ["Mobile", application.applicant_phone ?? ""],
      ["Wing", unit?.wings?.name ?? ""],
      ["Flat / unit", unit?.unit_number ?? ""],
      ["Father's / spouse's name", ""],
      ["Date of birth", ""],
      ["PAN / permitted ID", ""],
      ["Correspondence address", ""],
      ["Permanent address", ""],
      ["Ownership / membership details", ""],
      ["Joint / associate member details", ""],
      ["Nominee details and share", ""],
      ["Applicant signature and date", ""],
      ["Society verification remarks", ""],
      ["Authorized signatory and date", ""],
    ];
    const bytes = buildSimplePdf(item.label, ["Field", "Details"], rows);

    await writeAudit({
      societyId,
      wingId,
      actorUserId: userId,
      action: "APPLICATION_FORM_DOWNLOADED",
      entityType: "application_checklist_item",
      entityId: item.id,
      metadata: { applicationId: application.id, itemCode: item.item_code },
    });

    return new NextResponse(pdfBlob(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${application.application_number.replace(/[^a-z0-9-]/gi, "-")}-${item.item_code}.pdf"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Form generation failed." },
      { status: 400 },
    );
  }
}
