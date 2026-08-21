import { NextRequest, NextResponse } from "next/server";
import { getServerContext } from "@/lib/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const{id}=await params; const{supabase,societyId,wingId,userId}=await getServerContext();
  const{data:document,error}=await supabase.from("society_documents").select("id,title,file_name,storage_path,status").eq("id",id).eq("society_id",societyId).single();
  if(error||!document?.storage_path)return NextResponse.json({error:"Document not found or access denied."},{status:404});
  const download=request.nextUrl.searchParams.get("download")==="1";
  const{data:signed,error:signedError}=await supabase.storage.from("society-documents").createSignedUrl(document.storage_path,60,download?{download:document.file_name??"document"}:undefined);
  if(signedError||!signed?.signedUrl)return NextResponse.json({error:"Secure document link could not be created."},{status:500});
  const admin=createAdminClient();
  await admin.from("document_access_logs").insert({society_id:societyId,document_id:document.id,actor_user_id:userId,access_type:download?"DOWNLOAD":"PREVIEW",metadata:{status:document.status}});
  await writeAudit({societyId,wingId,actorUserId:userId,action:"DOCUMENT_ACCESSED",entityType:"society_document",entityId:document.id,metadata:{accessType:download?"DOWNLOAD":"PREVIEW"}});
  return NextResponse.redirect(signed.signedUrl);
}
