"use server";
import { createHash } from "node:crypto";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";

export type ApplicationType = "MEMBERSHIP" | "NOC_SALE" | "NOC_RENOVATION" | "PARKING" | "NOMINATION" | "ASSOCIATE_MEMBERSHIP" | "OTHER";

export interface CreateApplicationInput {
  applicantName: string;
  fatherSpouseName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  dateOfBirth?: string;
  pan?: string;
  identityType?: "AADHAAR" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENCE" | "OTHER";
  identityNumber?: string;
  correspondenceAddress?: string;
  permanentAddress?: string;
  ownershipType?: "SOLE" | "JOINT" | "ASSOCIATE" | "TENANT" | "OTHER";
  ownershipDocumentNumber?: string;
  ownershipDate?: string;
  shareCertificateNumber?: string;
  sharesHeld?: number;
  jointMembers?: Array<{
    fullName: string;
    fatherSpouseName?: string;
    relationship?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    pan?: string;
    identityType?: "AADHAAR" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENCE" | "OTHER";
    identityNumber?: string;
    ownershipShare?: number;
  }>;
  unitId?: string;
  applicationType: ApplicationType;
  notes?: string;
}

function protectIdentity(value?: string) {
  const normalized=value?.toUpperCase().replace(/[^A-Z0-9]/g,"")??"";
  if(!normalized)return{};
  if(normalized.length<4||normalized.length>32)throw new Error("Identity number must contain between 4 and 32 letters or digits.");
  return{identityNumberMasked:`****${normalized.slice(-4)}`,identityNumberHash:createHash("sha256").update(normalized).digest("hex")};
}

export async function createApplicationAction(
  input: CreateApplicationInput
): Promise<ActionResult<{ id: string; applicationNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    if(userCtx.isPlatformAdmin)throw new Error("Platform administrators cannot submit society applications.");
    requirePermission(userCtx, PERMISSIONS.APPLICATION_CREATE);

    const identity=protectIdentity(input.identityNumber);
    const jointMembers=(input.jointMembers??[]).map((joint)=>({
      fullName:joint.fullName.trim(),fatherSpouseName:joint.fatherSpouseName?.trim()||undefined,
      relationship:joint.relationship?.trim()||undefined,dateOfBirth:joint.dateOfBirth||undefined,
      email:joint.email?.trim()||undefined,phone:joint.phone?.trim()||undefined,
      pan:joint.pan?.trim().toUpperCase()||undefined,identityType:joint.identityType,
      ...protectIdentity(joint.identityNumber),ownershipShare:joint.ownershipShare,
    }));

    const applicationNumber = await nextSequenceNumber(
      supabase,
      societyId,
      "MEMBER_APPLICATION",
      "APP"
    );

    const { data, error } = await supabase
      .from("member_applications")
      .insert({
        society_id: societyId,
        application_number: applicationNumber,
        applicant_name: input.applicantName.trim(),
        father_spouse_name: input.fatherSpouseName?.trim() || null,
        applicant_email: input.applicantEmail?.trim() || null,
        applicant_phone: input.applicantPhone?.trim() || null,
        date_of_birth: input.dateOfBirth || null,
        pan: input.pan?.trim().toUpperCase() || null,
        identity_type: input.identityType || null,
        identity_number_masked: identity.identityNumberMasked || null,
        identity_number_hash: identity.identityNumberHash || null,
        correspondence_address: input.correspondenceAddress?.trim() || null,
        permanent_address: input.permanentAddress?.trim() || null,
        ownership_type: input.ownershipType || null,
        ownership_document_number: input.ownershipDocumentNumber?.trim() || null,
        ownership_date: input.ownershipDate || null,
        share_certificate_number: input.shareCertificateNumber?.trim() || null,
        shares_held: input.sharesHeld ?? null,
        joint_member_details: jointMembers,
        unit_id: input.unitId || null,
        application_type: input.applicationType,
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
        notes: input.notes?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    const { error: workflowError } = await supabase.rpc("initialize_member_application", {
      p_application_id: data.id,
      p_actor_user_id: userId,
    });
    if (workflowError) {
      await createAdminClient().from("member_applications").delete().eq("id", data.id);
      throw new Error(`Could not start approval workflow: ${workflowError.message}`);
    }

    await writeAudit({ societyId, wingId, actorUserId:userId, action:"APPLICATION_CREATED", entityType:"member_application", entityId:data.id, newValues:{ applicationNumber, applicationType:input.applicationType, status:"SUBMITTED" } });

    revalidatePath("/applications");
    return { id: data.id, applicationNumber };
  });
}

export async function reviewApplicationChecklistAction(input:{ itemId:string; status:"PENDING"|"UPLOADED"|"VERIFIED"|"REJECTED"|"NOT_APPLICABLE"; remarks?:string }):Promise<ActionResult> {
  return wrapAction(async()=>{
    const {supabase,userId,societyId,wingId}=await getServerContext();
    requirePermission(await resolveUserContext(societyId,wingId),PERMISSIONS.APPLICATION_VERIFY);
    const {error}=await supabase.rpc("review_application_checklist_item",{p_item_id:input.itemId,p_status:input.status,p_remarks:input.remarks?.trim()??"",p_actor_user_id:userId});
    if(error)throw new Error(error.message);
    revalidatePath("/applications");
  });
}

export async function decideMemberApplicationAction(input:{ applicationId:string; decision:"APPROVED"|"REJECTED"|"RETURNED"; comments?:string }):Promise<ActionResult<{status:string}>> {
  return wrapAction(async()=>{
    const {supabase,userId,societyId,wingId}=await getServerContext();
    const context=await resolveUserContext(societyId,wingId);
    if(context.isPlatformAdmin)throw new Error("Platform administrators cannot approve society applications.");
    const allowed=[PERMISSIONS.APPLICATION_APPROVE_LEVEL1,PERMISSIONS.APPLICATION_APPROVE_LEVEL2].some((permission)=>context.permissions.has(permission))
      || (context.roleName==="Society Admin" && !context.wingId && context.permissions.has(PERMISSIONS.APPLICATION_APPROVE_FINAL));
    if(!allowed)throw new Error("You do not have an application approval role.");
    const {data,error}=await supabase.rpc("decide_member_application",{p_application_id:input.applicationId,p_decision:input.decision,p_comments:input.comments?.trim()??"",p_actor_user_id:userId});
    if(error){if(error.message.includes("required_checklist_incomplete"))throw new Error("Verify every required checklist item before approving.");throw new Error(error.message);}
    revalidatePath("/applications");revalidatePath(`/applications/${input.applicationId}`);revalidatePath("/members");
    return {status:String(data)};
  });
}

export async function resubmitMemberApplicationAction(input:{ applicationId:string; comments?:string }):Promise<ActionResult> {
  return wrapAction(async()=>{
    const {supabase,userId}=await getServerContext();
    const {error}=await supabase.rpc("resubmit_member_application",{p_application_id:input.applicationId,p_comments:input.comments?.trim()??"",p_actor_user_id:userId});
    if(error)throw new Error(error.message);
    revalidatePath("/applications");revalidatePath(`/applications/${input.applicationId}`);
  });
}

export async function attachApplicationDocumentAction(input:{
  applicationId:string;
  checklistItemId:string;
  storagePath:string;
  fileName:string;
  fileSize:number;
  mimeType:string;
  checksumSha256:string;
}):Promise<ActionResult<{id:string}>>{
  return wrapAction(async()=>{
    const{supabase,userId}=await getServerContext();
    const{data,error}=await supabase.rpc("attach_application_document",{
      p_checklist_item_id:input.checklistItemId,
      p_storage_path:input.storagePath,
      p_file_name:input.fileName,
      p_file_size_bytes:input.fileSize,
      p_mime_type:input.mimeType,
      p_checksum_sha256:input.checksumSha256,
      p_actor_user_id:userId,
    });
    if(error){
      if(error.message.includes("application_document_upload_closed"))throw new Error("Documents cannot be changed after the application is closed.");
      if(error.message.includes("invalid_application_file_type"))throw new Error("Upload a PDF, Word document, PNG, or JPEG file.");
      if(error.message.includes("invalid_application_file_size"))throw new Error("The file must be 20 MB or smaller.");
      throw new Error(error.message);
    }
    revalidatePath("/applications");
    revalidatePath(`/applications/${input.applicationId}`);
    revalidatePath("/documents");
    return{id:String(data)};
  });
}
