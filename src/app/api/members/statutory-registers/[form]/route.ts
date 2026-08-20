import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/context";
import { writeAuditCritical } from "@/lib/audit";
import {
  buildStatutoryRegister,
  type RegisterFormType,
  type StatutoryMemberRow,
} from "@/lib/statutory-registers";
import { requirePermission, resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ form: string }> }
) {
  try {
    const { form } = await params;
    const formType: RegisterFormType | null = form.toLowerCase() === "i"
      ? "FORM_I"
      : form.toLowerCase() === "j"
        ? "FORM_J"
        : null;

    if (!formType) return NextResponse.json({ error: "Unknown statutory register." }, { status: 404 });

    const { supabase, userId, societyId, wingId } = await getServerContext();
    const context = await resolveUserContext(societyId, wingId);
    requirePermission(context, PERMISSIONS.MEMBER_READ);

    const [{ data: society, error: societyError }, { data: members, error: membersError }] = await Promise.all([
      supabase
        .from("societies")
        .select("name, registration_number")
        .eq("id", societyId)
        .single(),
      supabase
        .from("members")
        .select("member_number, full_name, member_type, status, effective_from, effective_until, address, occupation, age_at_admission, entrance_fee_paid_at, nominee_name_address, nomination_date, cessation_reason, remark, units(unit_number, wings(name))")
        .eq("society_id", societyId)
        .order("member_number", { ascending: true }),
    ]);

    if (societyError || !society) throw new Error("The selected society could not be loaded.");
    if (membersError) throw new Error(membersError.message);

    const rows: StatutoryMemberRow[] = (members ?? []).map((member: any) => ({
      memberNumber: member.member_number,
      flatNumber: member.units?.unit_number ?? "",
      fullName: member.full_name,
      address: member.address ?? "",
      occupation: member.occupation ?? "",
      ageAtAdmission: member.age_at_admission,
      admissionDate: member.effective_from ?? "",
      entranceFeePaidAt: member.entrance_fee_paid_at ?? "",
      nomineeNameAddress: member.nominee_name_address ?? "",
      nominationDate: member.nomination_date ?? "",
      cessationDate: member.effective_until ?? "",
      cessationReason: member.cessation_reason ?? "",
      remark: member.remark ?? "",
      memberClass: titleCase(member.member_type),
      status: member.status === "ACTIVE" ? "Active" : "Inactive",
    }));

    const workbook = await buildStatutoryRegister({
      formType,
      societyName: society.name,
      registrationNumber: society.registration_number,
      rows,
    });

    const snapshotData = rows.map((row) => ({ ...row })) as unknown as Json;
    const { data: snapshot, error: snapshotError } = await supabase
      .from("form_register_snapshots")
      .insert({
        society_id: societyId,
        form_type: formType,
        row_count: rows.length,
        data: snapshotData,
        generated_by: userId,
      })
      .select("id, version")
      .single();

    if (snapshotError || !snapshot) {
      console.error("[statutory-register] snapshot error:", snapshotError?.message);
      return NextResponse.json(
        { error: "The immutable filing snapshot could not be recorded, so no export was issued." },
        { status: 500 }
      );
    }

    try {
      await writeAuditCritical({
        actorUserId: userId,
        action: "STATUTORY_REGISTER_EXPORTED",
        entityType: "form_register_snapshots",
        entityId: snapshot.id,
        societyId,
        newValues: { formType, version: snapshot.version, rowCount: rows.length },
      });
    } catch (auditError) {
      console.error("[statutory-register] AUDIT WRITE FAILED:", auditError);
    }

    const filename = `${safeFilePart(society.name)}-${formType === "FORM_I" ? "form-i" : "form-j"}-v${snapshot.version}.xlsx`;
    const responseBody = workbook.buffer.slice(
      workbook.byteOffset,
      workbook.byteOffset + workbook.byteLength
    ) as ArrayBuffer;
    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[statutory-register] export failed:", error);
    return NextResponse.json({ error: "Unable to generate the statutory register." }, { status: 500 });
  }
}
