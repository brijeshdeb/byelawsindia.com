import type { Metadata } from "next";

import { getServerContext } from "@/lib/context";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Society Settings | ByelawsIndia" };

export default async function SettingsPage(){
  const{supabase,societyId}=await getServerContext();
  const[societyResult,settingsResult,officersResult]=await Promise.all([
    supabase.from("societies").select("id,name,registration_number,society_type,address,city,state,pin_code,email,phone,website,pan,gstin,registered_at,logo_url,letterhead_url,is_active").eq("id",societyId).single(),
    supabase.from("society_settings").select("application_number_pattern,contract_number_pattern,rfq_number_pattern,work_order_number_pattern,default_timezone,max_upload_size_bytes,contract_reminder_days,notification_preferences,configuration_completed_at").eq("society_id",societyId).single(),
    supabase.from("society_officers").select("id,officer_type,name,designation,phone,email,is_signatory,effective_from,effective_until").eq("society_id",societyId).order("display_order"),
  ]);
  if(societyResult.error||settingsResult.error)throw new Error("Unable to load society configuration.");
  return <SettingsClient societyId={societyId} society={societyResult.data} settings={settingsResult.data} officers={officersResult.data??[]}/>;
}
