"use server";

import { revalidatePath } from "next/cache";

import { writeAuditCritical } from "@/lib/audit";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import type { OfficerType } from "@/types/database";

type NotificationPreferences = {
  portal:boolean;
  email:boolean;
  sms:boolean;
  whatsapp:boolean;
};

export async function saveSocietyConfigurationAction(input:{
  name:string; address:string; city:string; state:string; pinCode:string;
  email:string; phone:string; website?:string; pan?:string; gstin?:string;
  logoPath?:string; letterheadPath?:string;
  applicationPattern:string; contractPattern:string; rfqPattern:string;
  workOrderPattern:string; timezone:string; maxUploadMb:number;
  contractReminderDays:number[]; notificationPreferences:NotificationPreferences;
}):Promise<ActionResult>{
  return wrapAction(async()=>{
    const{supabase,societyId,userId}=await getServerContext();
    const{error}=await supabase.rpc("update_society_configuration",{
      p_society_id:societyId,
      p_name:input.name,
      p_address:input.address,
      p_city:input.city,
      p_state:input.state,
      p_pin_code:input.pinCode,
      p_email:input.email,
      p_phone:input.phone,
      p_website:input.website??"",
      p_pan:input.pan??"",
      p_gstin:input.gstin??"",
      p_logo_path:input.logoPath??"",
      p_letterhead_path:input.letterheadPath??"",
      p_application_pattern:input.applicationPattern,
      p_contract_pattern:input.contractPattern,
      p_rfq_pattern:input.rfqPattern,
      p_work_order_pattern:input.workOrderPattern,
      p_timezone:input.timezone,
      p_max_upload_size_bytes:Math.round(input.maxUploadMb*1024*1024),
      p_contract_reminder_days:input.contractReminderDays,
      p_notification_preferences:input.notificationPreferences,
      p_actor_user_id:userId,
    });
    if(error){
      if(error.message.includes("invalid_pan"))throw new Error("Enter a valid PAN.");
      if(error.message.includes("invalid_gstin"))throw new Error("Enter a valid GSTIN.");
      if(error.message.includes("invalid_reminder_days"))throw new Error("Reminder days must be between 0 and 365.");
      throw new Error(error.message);
    }
    revalidatePath("/admin/settings");
  });
}

export async function saveSocietyOfficerAction(input:{
  id?:string; officerType:OfficerType; name:string; designation?:string;
  phone?:string; email?:string; isSignatory:boolean; effectiveFrom:string;
}):Promise<ActionResult<{id:string}>>{
  return wrapAction(async()=>{
    const{supabase,societyId,wingId,userId}=await getServerContext();
    requirePermission(await resolveUserContext(societyId,wingId),PERMISSIONS.ADMIN_SETTINGS);
    if(!input.name.trim())throw new Error("Officer name is required.");
    const values={
      society_id:societyId,
      officer_type:input.officerType,
      name:input.name.trim(),
      designation:input.designation?.trim()||null,
      phone:input.phone?.trim()||null,
      email:input.email?.trim().toLowerCase()||null,
      is_signatory:input.isSignatory,
      effective_from:input.effectiveFrom,
    };
    const query=input.id
      ?supabase.from("society_officers").update(values).eq("id",input.id).eq("society_id",societyId)
      :supabase.from("society_officers").insert(values);
    const{data,error}=await query.select("id").single();
    if(error)throw new Error(error.message);
    await writeAuditCritical({
      societyId,wingId,actorUserId:userId,action:"SOCIETY_SETTINGS_UPDATED",
      entityType:"society_officer",entityId:data.id,newValues:values,
    });
    revalidatePath("/admin/settings");
    return{id:data.id};
  });
}

export async function endSocietyOfficerTermAction(input:{id:string}):Promise<ActionResult>{
  return wrapAction(async()=>{
    const{supabase,societyId,wingId,userId}=await getServerContext();
    requirePermission(await resolveUserContext(societyId,wingId),PERMISSIONS.ADMIN_SETTINGS);
    const{error}=await supabase.from("society_officers").update({effective_until:new Date().toISOString().slice(0,10),is_signatory:false}).eq("id",input.id).eq("society_id",societyId);
    if(error)throw new Error(error.message);
    await writeAuditCritical({societyId,wingId,actorUserId:userId,action:"SOCIETY_SETTINGS_UPDATED",entityType:"society_officer",entityId:input.id,newValues:{effectiveUntil:new Date().toISOString().slice(0,10),isSignatory:false}});
    revalidatePath("/admin/settings");
  });
}
