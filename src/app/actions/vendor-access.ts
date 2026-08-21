"use server";

import { revalidatePath } from "next/cache";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditCritical } from "@/lib/audit";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { removeNewlyInvitedUser, resolveOrInviteUser, validateOperationalEmail } from "@/server/services/SocietyAdminService";
import { PERMISSIONS } from "@/types";

export async function inviteVendorUserAction(input: {
  vendorId: string;
  email: string;
  fullName: string;
}): Promise<ActionResult<{ userId:string; invited:boolean }>> {
  return wrapAction(async () => {
    const { societyId, wingId, userId } = await getServerContext();
    requirePermission(await resolveUserContext(societyId, wingId), PERMISSIONS.VENDOR_MANAGE);
    const email=input.email.trim().toLowerCase(); const fullName=input.fullName.trim();
    if(!input.vendorId||!email||!fullName) throw new Error("Vendor, contact name and email are required.");
    const emailError=validateOperationalEmail(email); if(emailError) throw new Error(emailError);
    const admin=createAdminClient();
    const [{data:vendor},{data:role,error:roleError}]=await Promise.all([
      admin.from("vendors").select("id,name,status").eq("id",input.vendorId).eq("society_id",societyId).maybeSingle(),
      admin.from("roles").select("id").eq("name","Vendor").eq("is_system_role",true).maybeSingle(),
    ]);
    if(!vendor||vendor.status!=="ACTIVE") throw new Error("Select an active vendor.");
    if(roleError||!role) throw new Error("The Vendor role is not configured.");

    let account:{userId:string;invited:boolean}|null=null; let assignmentId:string|null=null; let assignmentCreated=false;
    try {
      account=await resolveOrInviteUser({email,fullName});
      const {data:otherAssignments,error:assignmentLookupError}=await admin.from("user_access_assignments")
        .select("id,role_id,is_active").eq("user_id",account.userId).eq("society_id",societyId).eq("is_active",true);
      if(assignmentLookupError) throw new Error(assignmentLookupError.message);
      if((otherAssignments??[]).some(row=>row.role_id!==role.id)) throw new Error("This login already has an internal role in the society. Use a separate vendor email for secure isolation.");

      const {data:existingLink,error:linkLookupError}=await admin.from("vendor_users")
        .select("id,vendor_id,is_active").eq("user_id",account.userId).eq("society_id",societyId).maybeSingle();
      if(linkLookupError) throw new Error(linkLookupError.message);
      if(existingLink&&existingLink.vendor_id!==vendor.id) throw new Error("This login is already linked to another vendor in the society.");

      const existingAssignment=(otherAssignments??[]).find(row=>row.role_id===role.id);
      if(existingAssignment){assignmentId=existingAssignment.id;}
      else {
        const {data:assignment,error}=await admin.from("user_access_assignments").insert({user_id:account.userId,society_id:societyId,wing_id:null,role_id:role.id,is_active:true,created_by:userId}).select("id").single();
        if(error) throw new Error(error.message); assignmentId=assignment.id; assignmentCreated=true;
      }

      if(existingLink){
        const {error}=await admin.from("vendor_users").update({is_active:true}).eq("id",existingLink.id);
        if(error) throw new Error(error.message);
      } else {
        const {count}=await admin.from("vendor_users").select("id",{count:"exact",head:true}).eq("vendor_id",vendor.id).eq("is_active",true);
        const {error}=await admin.from("vendor_users").insert({society_id:societyId,vendor_id:vendor.id,user_id:account.userId,is_primary:(count??0)===0,is_active:true,created_by:userId});
        if(error) throw new Error(error.message);
      }
    } catch(error) {
      if(assignmentCreated&&assignmentId) await admin.from("user_access_assignments").delete().eq("id",assignmentId);
      if(account?.invited) await removeNewlyInvitedUser(account.userId);
      throw error;
    }

    await writeAuditCritical({societyId,actorUserId:userId,action:account!.invited?"VENDOR_USER_INVITED":"VENDOR_USER_LINKED",entityType:"vendor_users",entityId:account!.userId,newValues:{vendorId:vendor.id,vendorName:vendor.name,userId:account!.userId,email,role:"Vendor"},metadata:{invitationSent:account!.invited}});
    revalidatePath("/vendors"); revalidatePath("/vendor");
    return {userId:account!.userId,invited:account!.invited};
  });
}

export async function revokeVendorUserAction(input:{vendorId:string;userId:string}):Promise<ActionResult>{
  return wrapAction(async()=>{
    const{societyId,wingId,userId}=await getServerContext(); requirePermission(await resolveUserContext(societyId,wingId),PERMISSIONS.VENDOR_MANAGE);
    if(input.userId===userId) throw new Error("You cannot revoke your own current login.");
    const admin=createAdminClient(); const{data:role,error:roleError}=await admin.from("roles").select("id").eq("name","Vendor").single();
    if(roleError||!role) throw new Error("The Vendor role is not configured.");
    const[{error:linkError},{error:assignmentError}]=await Promise.all([
      admin.from("vendor_users").update({is_active:false}).eq("society_id",societyId).eq("vendor_id",input.vendorId).eq("user_id",input.userId),
      admin.from("user_access_assignments").update({is_active:false,updated_by:userId}).eq("society_id",societyId).eq("user_id",input.userId).eq("role_id",role.id),
    ]);
    if(linkError||assignmentError) throw new Error(linkError?.message||assignmentError?.message||"Vendor access could not be revoked.");
    await writeAuditCritical({societyId,actorUserId:userId,action:"VENDOR_USER_REVOKED",entityType:"vendor_users",entityId:input.userId,oldValues:{vendorId:input.vendorId,userId:input.userId,isActive:true},newValues:{isActive:false}});
    revalidatePath("/vendors");
  });
}
