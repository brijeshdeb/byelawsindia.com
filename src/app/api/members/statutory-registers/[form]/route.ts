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
import { buildSimplePdf } from "@/lib/reports/simple-pdf";
import ExcelJS from "exceljs";

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
  request: NextRequest,
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

    const baseName = `${safeFilePart(society.name)}-${formType === "FORM_I" ? "form-i" : "form-j"}-v${snapshot.version}`;
    const format=(request.nextUrl.searchParams.get("format")??"xlsx").toLowerCase();
    const headers=formType==="FORM_I"?["Sr.No","Flat No","Admission","Entrance Fee","Full Name","Address","Occupation","Age","Nominee","Nomination","Cessation","Reason","Remark"]:["Sr.No","Flat No","Full Name","Address","Class","Status"];
    const outputRows=rows.map((row,index)=>formType==="FORM_I"?[index+1,row.flatNumber,row.admissionDate,row.entranceFeePaidAt,row.fullName,row.address,row.occupation,row.ageAtAdmission,row.nomineeNameAddress,row.nominationDate,row.cessationDate,row.cessationReason,row.remark]:[index+1,row.flatNumber,row.fullName,row.address,row.memberClass,row.status]);
    if(format==="pdf"){
      const bytes=buildSimplePdf(formType==="FORM_I"?"Form I Membership Register":"Form J List of Members",headers,outputRows);
      return new NextResponse(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${baseName}.pdf"`,"Cache-Control":"private, no-store"}});
    }
    if(format==="html"){
      const escape=(value:unknown)=>String(value??"").replace(/[&<>"']/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]??character);
      const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escape(formType)}</title><style>body{font-family:Arial,sans-serif;margin:24px}h1{font-size:20px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #333;padding:6px;text-align:left;vertical-align:top}th{background:#dce8c4}@media print{body{margin:0}@page{size:landscape}}</style></head><body><h1>${escape(formType==="FORM_I"?"Form I Membership Register":"Form J List of Members")} — ${escape(society.name)}</h1><p>Registration: ${escape(society.registration_number)} · Snapshot ${snapshot.version}</p><table><thead><tr>${headers.map((header)=>`<th>${escape(header)}</th>`).join("")}</tr></thead><tbody>${outputRows.map((row)=>`<tr>${row.map((value)=>`<td>${escape(value)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.addEventListener('load',()=>window.print())</script></body></html>`;
      return new NextResponse(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store"}});
    }
    if(format!=="xlsx")return NextResponse.json({error:"Unsupported format."},{status:400});
    const filename = `${baseName}.xlsx`;
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

function normalized(value:string){return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g,"");}
function cellText(cell:ExcelJS.Cell){return cell.text.trim();}
function cellDate(cell:ExcelJS.Cell){
  if(cell.value instanceof Date)return cell.value.toISOString().slice(0,10);
  const text=cell.text.trim();if(!text)return"";
  const parsed=new Date(text);return Number.isNaN(parsed.getTime())?"":parsed.toISOString().slice(0,10);
}

export async function POST(request:NextRequest,{params}:{params:Promise<{form:string}>}){
  try{
    const{form}=await params;
    const formType:RegisterFormType|null=form.toLowerCase()==="i"?"FORM_I":form.toLowerCase()==="j"?"FORM_J":null;
    if(!formType)return NextResponse.json({error:"Unknown statutory register."},{status:404});
    const{supabase,societyId,wingId,userId}=await getServerContext();
    const context=await resolveUserContext(societyId,wingId);
    if(context.isPlatformAdmin)return NextResponse.json({error:"Platform administrators cannot import society member records."},{status:403});
    requirePermission(context,PERMISSIONS.MEMBER_UPDATE);
    const formData=await request.formData();
    const file=formData.get("file");
    if(!(file instanceof File)||file.size===0)return NextResponse.json({error:"Select an Excel workbook."},{status:400});
    if(file.size>10*1024*1024)return NextResponse.json({error:"Workbook must be 10 MB or smaller."},{status:400});
    if(!/\.xlsx$/i.test(file.name))return NextResponse.json({error:"Upload an .xlsx workbook exported from this register."},{status:400});
    const workbook=new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
    const sheet=workbook.worksheets[0];
    if(!sheet)return NextResponse.json({error:"The workbook has no worksheet."},{status:400});
    const expectedHeader=formType==="FORM_I"?"Full Name":"Full Name of Member";
    if(!cellText(sheet.getCell(2,formType==="FORM_I"?5:3)).toLowerCase().includes(expectedHeader.toLowerCase()))return NextResponse.json({error:`This does not appear to be a ${formType==="FORM_I"?"Form I":"Form J"} export.`},{status:422});

    const{data:members,error:memberError}=await supabase.from("members").select("id,full_name,units(unit_number)").eq("society_id",societyId);
    if(memberError)throw memberError;
    const memberMap=new Map<string,string|null>();
    for(const member of members??[]){const unit=member.units as unknown as {unit_number:string}|null;const key=`${normalized(member.full_name)}|${normalized(unit?.unit_number??"")}`;memberMap.set(key,memberMap.has(key)?null:member.id);}
    const rows:Array<Record<string,unknown>>=[];const errors:Array<{row:number;reason:string}>=[];
    for(let rowNumber=3;rowNumber<=sheet.rowCount;rowNumber++){
      const row=sheet.getRow(rowNumber);const name=cellText(row.getCell(formType==="FORM_I"?5:3));const flat=cellText(row.getCell(2));
      if(!name&&!flat)continue;
      const memberId=memberMap.get(`${normalized(name)}|${normalized(flat)}`);
      if(memberId===undefined){errors.push({row:rowNumber,reason:`No exact member match for ${name} / ${flat}.`});continue;}
      if(memberId===null){errors.push({row:rowNumber,reason:`More than one member matches ${name} / ${flat}.`});continue;}
      if(formType==="FORM_I")rows.push({memberId,address:cellText(row.getCell(6)),occupation:cellText(row.getCell(7)),ageAtAdmission:cellText(row.getCell(8)),admissionDate:cellDate(row.getCell(3)),entranceFeePaidAt:cellDate(row.getCell(4)),nomineeNameAddress:cellText(row.getCell(9)),nominationDate:cellDate(row.getCell(10)),cessationDate:cellDate(row.getCell(11)),cessationReason:cellText(row.getCell(12)),remark:cellText(row.getCell(13))});
      else rows.push({memberId,address:cellText(row.getCell(4)),memberClass:cellText(row.getCell(5)),status:cellText(row.getCell(6))});
    }
    if(errors.length)return NextResponse.json({error:"Import validation failed. No records were changed.",errors},{status:422});
    if(!rows.length)return NextResponse.json({error:"No populated member rows were found."},{status:422});
    const{data,error}=await supabase.rpc("import_statutory_register" as never,{p_society_id:societyId,p_form_type:formType,p_rows:rows,p_actor_user_id:userId} as never);
    if(error)throw error;
    return NextResponse.json({updated:Number(data),formType});
  }catch(error){console.error("[statutory-register] import failed",error);return NextResponse.json({error:"Unable to import the statutory register. No records were changed."},{status:500});}
}
