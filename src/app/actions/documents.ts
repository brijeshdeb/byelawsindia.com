"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";
import { writeAuditCritical } from "@/lib/audit";

export type DocumentCategory =
  | "MINUTES"
  | "NOTICE"
  | "CIRCULAR"
  | "COMPLIANCE"
  | "FINANCIAL"
  | "LEGAL"
  | "OTHER";

export interface UploadDocumentInput {
  title: string;
  category: DocumentCategory;
  description?: string;
  // fileStoragePath is the path already uploaded to Supabase Storage.
  // Upload is handled client-side via supabase-js, then the path is passed here.
  fileStoragePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresOn?: string;
  classification?: "INTERNAL" | "MEMBERS" | "CONFIDENTIAL";
  replacesDocumentId?: string;
  checksumSha256?: string;
}

export async function uploadDocumentAction(
  input: UploadDocumentInput
): Promise<ActionResult<{ id: string; documentNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.DOCUMENT_UPLOAD);

    // Validate the storage path belongs to this society (path must start with societyId).
    if (!input.fileStoragePath.startsWith(`${societyId}/`)) {
      throw new Error("Invalid file storage path.");
    }

    let documentNumber:string; let version=1; let replaced:{id:string;document_number:string;version:number}|null=null;
    if(input.replacesDocumentId){
      const{data,error}=await supabase.from("society_documents").select("id,document_number,version").eq("id",input.replacesDocumentId).eq("society_id",societyId).single();
      if(error||!data)throw new Error("The document to replace was not found."); replaced=data; documentNumber=data.document_number; version=data.version+1;
    } else documentNumber = await nextSequenceNumber(supabase, societyId, "DOCUMENT", "DOC");

    const { data, error } = await supabase
      .from("society_documents")
      .insert({
        society_id: societyId,
        title: input.title.trim(),
        category: input.category,
        description: input.description?.trim() || null,
        file_name: input.fileName,
        storage_path: input.fileStoragePath,
        file_size_bytes: input.fileSize,
        mime_type: input.mimeType,
        metadata: { document_number: documentNumber },
        uploaded_by: userId,
        document_number: documentNumber,
        version,
        status:"UPLOADED",
        expires_on:input.expiresOn||null,
        wing_id:wingId,
        replaces_document_id:replaced?.id??null,
        classification:input.classification??"INTERNAL",
        checksum_sha256:input.checksumSha256??null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    if(replaced){
      const{error:replaceError}=await supabase.from("society_documents").update({status:"REPLACED",is_verified:false}).eq("id",replaced.id).eq("society_id",societyId);
      if(replaceError){await supabase.from("society_documents").delete().eq("id",data.id);throw new Error(replaceError.message);}
    }

    await writeAuditCritical({societyId,wingId,actorUserId:userId,action:replaced?"DOCUMENT_REPLACED":"DOCUMENT_UPLOADED",entityType:"society_document",entityId:data.id,newValues:{documentNumber,version,title:input.title,classification:input.classification??"INTERNAL",expiresOn:input.expiresOn??null,replacesDocumentId:replaced?.id??null}});

    revalidatePath("/documents");
    return { id: data.id, documentNumber };
  });
}

export async function reviewDocumentAction(input:{documentId:string;decision:"VERIFIED"|"REJECTED"|"ARCHIVED";reason?:string}):Promise<ActionResult>{
  return wrapAction(async()=>{
    const{supabase,userId,societyId,wingId}=await getServerContext();
    const context=await resolveUserContext(societyId,wingId);
    if(context.isPlatformAdmin||context.roleName!=="Society Admin"||context.wingId)throw new Error("A society-wide Society Admin must review society documents.");
    requirePermission(context,PERMISSIONS.DOCUMENT_VERIFY);
    if(input.decision==="REJECTED"&&!input.reason?.trim())throw new Error("A rejection reason is required.");
    const{error}=await supabase.from("society_documents").update({status:input.decision,is_verified:input.decision==="VERIFIED",verified_by:input.decision==="VERIFIED"?userId:null,verified_at:input.decision==="VERIFIED"?new Date().toISOString():null,rejection_reason:input.decision==="REJECTED"?input.reason?.trim()??null:null}).eq("id",input.documentId).eq("society_id",societyId);
    if(error)throw new Error(error.message);
    await writeAuditCritical({societyId,wingId,actorUserId:userId,action:input.decision==="VERIFIED"?"DOCUMENT_VERIFIED":input.decision==="REJECTED"?"DOCUMENT_REJECTED":"DOCUMENT_ARCHIVED",entityType:"society_document",entityId:input.documentId,newValues:{status:input.decision,reason:input.reason??null}});
    revalidatePath("/documents");
  });
}
