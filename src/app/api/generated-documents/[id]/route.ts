import { NextRequest,NextResponse } from "next/server";
import { getServerContext } from "@/lib/context";
import { writeAudit } from "@/lib/audit";
import { buildSimplePdf } from "@/lib/reports/simple-pdf";
import { resolveUserContext,requireAnyPermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]??character);
const safeName=(value:string)=>value.replace(/[^a-z0-9_-]+/gi,"-").replace(/^-|-$/g,"").slice(0,80)||"document";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const{id}=await params;
  const{supabase,societyId,wingId,userId}=await getServerContext();
  const context=await resolveUserContext(societyId,wingId);
  requireAnyPermission(context,[PERMISSIONS.DOCUMENT_READ,PERMISSIONS.SERVICE_REQUEST_PROCESS,PERMISSIONS.SERVICE_REQUEST_APPROVE,PERMISSIONS.ADMIN_TEMPLATES]);
  const{data,error}=await supabase.from("generated_documents").select("id,document_number,title,subject_rendered,body_rendered,output_format,generated_at").eq("id",id).eq("society_id",societyId).single();
  if(error||!data)return NextResponse.json({error:"Generated document not found"},{status:404});
  const format=(request.nextUrl.searchParams.get("format")??"pdf").toLowerCase();
  if(!["pdf","html","doc"].includes(format))return NextResponse.json({error:"Unsupported format"},{status:400});
  await writeAudit({societyId,wingId,actorUserId:userId,action:"GENERATED_DOCUMENT_EXPORTED",entityType:"generated_document",entityId:id,newValues:{format}});
  const baseName=`${safeName(data.document_number)}-${safeName(data.title)}`;
  if(format==="pdf"){
    const rows=String(data.body_rendered).split(/\r?\n/).map((line)=>[line]);
    const bytes=buildSimplePdf(data.subject_rendered||data.title,[data.document_number],rows);
    return new NextResponse(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${baseName}.pdf"`,"Cache-Control":"private, no-store"}});
  }
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.title)}</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#111}header{border-bottom:1px solid #aaa;margin-bottom:30px;padding-bottom:12px}.number{color:#555;font-size:12px;white-space:pre-wrap}.body{white-space:pre-wrap;line-height:1.65}@media print{body{margin:0}}</style></head><body><header><div class="number">${escapeHtml(data.document_number)}</div><h1>${escapeHtml(data.subject_rendered||data.title)}</h1></header><div class="body">${escapeHtml(data.body_rendered)}</div></body></html>`;
  return new NextResponse(html,{headers:{"Content-Type":format==="doc"?"application/msword; charset=utf-8":"text/html; charset=utf-8","Content-Disposition":format==="doc"?`attachment; filename="${baseName}.doc"`:`inline; filename="${baseName}.html"`,"Cache-Control":"private, no-store"}});
}
