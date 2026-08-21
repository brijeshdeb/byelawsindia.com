"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  endSocietyOfficerTermAction,
  saveSocietyConfigurationAction,
  saveSocietyOfficerAction,
} from "@/app/actions/society-settings";
import { createClient } from "@/lib/supabase/client";
import type { Json, OfficerType } from "@/types/database";

type Society={
  id:string;name:string;registration_number:string;society_type:string;address:string;
  city:string;state:string;pin_code:string;email:string;phone:string;website:string|null;
  pan:string|null;gstin:string|null;registered_at:string;logo_url:string|null;
  letterhead_url:string|null;is_active:boolean;
};
type Settings={
  application_number_pattern:string;contract_number_pattern:string;rfq_number_pattern:string;
  work_order_number_pattern:string;default_timezone:string;max_upload_size_bytes:number;
  contract_reminder_days:number[];notification_preferences:Json;
  configuration_completed_at:string|null;
};
type Officer={
  id:string;officer_type:OfficerType;name:string;designation:string|null;phone:string|null;
  email:string|null;is_signatory:boolean;effective_from:string;effective_until:string|null;
};

const inputClass="w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary";
const OFFICER_TYPES:OfficerType[]=["CHAIRMAN","SECRETARY","TREASURER","COMMITTEE_MEMBER","MANAGING_COMMITTEE"];
const emptyOfficer={officerType:"COMMITTEE_MEMBER" as OfficerType,name:"",designation:"",phone:"",email:"",isSignatory:false,effectiveFrom:new Date().toISOString().slice(0,10)};

function Field({label,children}:{label:string;children:React.ReactNode}){
  return <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</span>{children}</label>;
}

export function SettingsClient({societyId,society,settings,officers}:{societyId:string;society:Society;settings:Settings;officers:Officer[]}){
  const router=useRouter();
  const[pending,startTransition]=useTransition();
  const[message,setMessage]=useState("");
  const[logo,setLogo]=useState<File|null>(null);
  const[letterhead,setLetterhead]=useState<File|null>(null);
  const[officer,setOfficer]=useState(emptyOfficer);
  const[editingId,setEditingId]=useState<string|undefined>();

  const preferences=(settings.notification_preferences&&typeof settings.notification_preferences==="object"&&!Array.isArray(settings.notification_preferences)?settings.notification_preferences:{}) as Record<string,unknown>;

  async function uploadBranding(file:File,kind:"logo"|"letterhead"){
    if(file.size>20*1024*1024)throw new Error(`${kind} must be 20 MB or smaller.`);
    const extension=(file.name.split(".").pop()??"bin").replace(/[^a-z0-9]/gi,"");
    const path=`${societyId}/branding/${kind}/${crypto.randomUUID()}.${extension}`;
    const supabase=createClient();
    const{error}=await supabase.storage.from("society-documents").upload(path,file,{upsert:false});
    if(error)throw new Error(error.message);
    return path;
  }

  function saveConfiguration(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);
    startTransition(async()=>{
      const uploaded:string[]=[];
      try{
        const logoPath=logo?await uploadBranding(logo,"logo"):undefined;if(logoPath)uploaded.push(logoPath);
        const letterheadPath=letterhead?await uploadBranding(letterhead,"letterhead"):undefined;if(letterheadPath)uploaded.push(letterheadPath);
        const reminderDays=String(form.get("contractReminderDays")??"").split(",").map(value=>Number(value.trim())).filter(Number.isFinite);
        const result=await saveSocietyConfigurationAction({
          name:String(form.get("name")??""),address:String(form.get("address")??""),city:String(form.get("city")??""),state:String(form.get("state")??""),pinCode:String(form.get("pinCode")??""),email:String(form.get("email")??""),phone:String(form.get("phone")??""),website:String(form.get("website")??""),pan:String(form.get("pan")??""),gstin:String(form.get("gstin")??""),logoPath,letterheadPath,
          applicationPattern:String(form.get("applicationPattern")??""),contractPattern:String(form.get("contractPattern")??""),rfqPattern:String(form.get("rfqPattern")??""),workOrderPattern:String(form.get("workOrderPattern")??""),timezone:String(form.get("timezone")??"Asia/Kolkata"),maxUploadMb:Number(form.get("maxUploadMb")??20),contractReminderDays:reminderDays,
          notificationPreferences:{portal:form.get("notifyPortal")==="on",email:form.get("notifyEmail")==="on",sms:form.get("notifySms")==="on",whatsapp:form.get("notifyWhatsapp")==="on"},
        });
        if(!result.success){if(uploaded.length)await createClient().storage.from("society-documents").remove(uploaded);throw new Error(result.error);}
        setLogo(null);setLetterhead(null);setMessage("Society configuration saved.");router.refresh();
      }catch(error){setMessage(error instanceof Error?error.message:"Could not save society configuration.");}
    });
  }

  function saveOfficer(){
    startTransition(async()=>{
      const result=await saveSocietyOfficerAction({id:editingId,...officer});
      setMessage(result.success?"Committee officer saved.":result.error);
      if(result.success){setOfficer(emptyOfficer);setEditingId(undefined);router.refresh();}
    });
  }

  function editOfficer(row:Officer){setEditingId(row.id);setOfficer({officerType:row.officer_type,name:row.name,designation:row.designation??"",phone:row.phone??"",email:row.email??"",isSignatory:row.is_signatory,effectiveFrom:row.effective_from});}
  function endTerm(id:string){startTransition(async()=>{const result=await endSocietyOfficerTermAction({id});setMessage(result.success?"Officer term ended.":result.error);if(result.success)router.refresh();});}

  return <div className="page-container"><div className="page-header"><div><h1 className="text-3xl font-bold text-text-primary">Society Settings</h1><p className="mt-1 text-sm text-[#9CA3AF]">Profile, branding, signatories, workflows, documents and notifications</p></div></div>
    {message?<p role="status" className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p>:null}
    <form onSubmit={saveConfiguration} className="space-y-5">
      <section className="queue-section p-5"><h2 className="mb-4 font-semibold text-text-primary">Society profile</h2><div className="grid gap-4 md:grid-cols-2">
        <Field label="Society name"><input className={inputClass} name="name" defaultValue={society.name} required/></Field>
        <Field label="Registration number"><input className={`${inputClass} opacity-70`} value={society.registration_number} readOnly/></Field>
        <Field label="Society type"><input className={`${inputClass} opacity-70`} value={society.society_type} readOnly/></Field>
        <Field label="Registration date"><input className={`${inputClass} opacity-70`} value={society.registered_at} readOnly/></Field>
        <Field label="Address"><input className={inputClass} name="address" defaultValue={society.address} required/></Field>
        <Field label="City"><input className={inputClass} name="city" defaultValue={society.city} required/></Field>
        <Field label="State"><input className={inputClass} name="state" defaultValue={society.state} required/></Field>
        <Field label="PIN code"><input className={inputClass} name="pinCode" defaultValue={society.pin_code} pattern="[0-9]{6}" required/></Field>
        <Field label="Email"><input className={inputClass} name="email" type="email" defaultValue={society.email} required/></Field>
        <Field label="Phone"><input className={inputClass} name="phone" defaultValue={society.phone} required/></Field>
        <Field label="Website"><input className={inputClass} name="website" type="url" defaultValue={society.website??""}/></Field>
        <Field label="PAN"><input className={inputClass} name="pan" defaultValue={society.pan??""}/></Field>
        <Field label="GSTIN"><input className={inputClass} name="gstin" defaultValue={society.gstin??""}/></Field>
      </div></section>
      <section className="queue-section p-5"><h2 className="mb-4 font-semibold text-text-primary">Branding</h2><div className="grid gap-4 md:grid-cols-2">
        <Field label="Society logo"><input className={inputClass} type="file" accept="image/png,image/jpeg" onChange={event=>setLogo(event.target.files?.[0]??null)}/>{society.logo_url?<a className="mt-2 inline-block text-xs text-[#10B981]" href="/api/society/branding/logo" target="_blank">View current logo</a>:null}</Field>
        <Field label="Letterhead"><input className={inputClass} type="file" accept="application/pdf,image/png,image/jpeg,.doc,.docx" onChange={event=>setLetterhead(event.target.files?.[0]??null)}/>{society.letterhead_url?<a className="mt-2 inline-block text-xs text-[#10B981]" href="/api/society/branding/letterhead" target="_blank">View current letterhead</a>:null}</Field>
      </div></section>
      <section className="queue-section p-5"><h2 className="mb-4 font-semibold text-text-primary">Numbering &amp; operational configuration</h2><div className="grid gap-4 md:grid-cols-2">
        <Field label="Application number pattern"><input className={inputClass} name="applicationPattern" defaultValue={settings.application_number_pattern} required/></Field>
        <Field label="Contract number pattern"><input className={inputClass} name="contractPattern" defaultValue={settings.contract_number_pattern} required/></Field>
        <Field label="RFQ number pattern"><input className={inputClass} name="rfqPattern" defaultValue={settings.rfq_number_pattern} required/></Field>
        <Field label="Work order number pattern"><input className={inputClass} name="workOrderPattern" defaultValue={settings.work_order_number_pattern} required/></Field>
        <Field label="Timezone"><input className={inputClass} name="timezone" defaultValue={settings.default_timezone} required/></Field>
        <Field label="Maximum upload size (MB)"><input className={inputClass} name="maxUploadMb" type="number" min={1} max={20} defaultValue={Math.round(settings.max_upload_size_bytes/1024/1024)} required/></Field>
        <Field label="Contract reminder days"><input className={inputClass} name="contractReminderDays" defaultValue={settings.contract_reminder_days.join(", ")} required/></Field>
      </div><div className="mt-5"><p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9CA3AF]">Notification channels</p><div className="flex flex-wrap gap-5 text-sm text-[#D1D5DB]">
        <label><input className="mr-2" type="checkbox" name="notifyPortal" defaultChecked={preferences.portal!==false}/>Portal</label><label><input className="mr-2" type="checkbox" name="notifyEmail" defaultChecked={preferences.email!==false}/>Email</label><label><input className="mr-2" type="checkbox" name="notifySms" defaultChecked={preferences.sms===true}/>SMS (provider required)</label><label><input className="mr-2" type="checkbox" name="notifyWhatsapp" defaultChecked={preferences.whatsapp===true}/>WhatsApp (provider required)</label>
      </div></div></section>
      <div className="flex justify-end"><button disabled={pending} className="rounded bg-[#10B981] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{pending?"Saving...":"Save society configuration"}</button></div>
    </form>
    <section className="queue-section mt-6"><div className="border-b border-[#333] px-5 py-4"><h2 className="font-semibold text-text-primary">Committee &amp; authorized signatories</h2></div>{officers.map(row=><div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#292929] px-5 py-4"><div><p className="text-sm text-text-primary">{row.name} · {row.designation??row.officer_type.replace(/_/g," ")}</p><p className="mt-1 text-xs text-[#6B7280]">{row.email??row.phone??"No contact"}{row.is_signatory?" · Authorized signatory":""}{row.effective_until?` · Term ended ${row.effective_until}`:""}</p></div>{!row.effective_until?<div className="flex gap-2"><button onClick={()=>editOfficer(row)} className="rounded border border-[#444] px-3 py-1.5 text-xs text-[#D1D5DB]">Edit</button><button onClick={()=>endTerm(row.id)} className="rounded border border-[#EF4444] px-3 py-1.5 text-xs text-[#EF4444]">End term</button></div>:null}</div>)}
      <div className="grid gap-3 p-5 md:grid-cols-3"><select className={inputClass} value={officer.officerType} onChange={event=>setOfficer({...officer,officerType:event.target.value as OfficerType})}>{OFFICER_TYPES.map(type=><option key={type} value={type}>{type.replace(/_/g," ")}</option>)}</select><input className={inputClass} placeholder="Name" value={officer.name} onChange={event=>setOfficer({...officer,name:event.target.value})}/><input className={inputClass} placeholder="Designation" value={officer.designation} onChange={event=>setOfficer({...officer,designation:event.target.value})}/><input className={inputClass} placeholder="Email" type="email" value={officer.email} onChange={event=>setOfficer({...officer,email:event.target.value})}/><input className={inputClass} placeholder="Phone" value={officer.phone} onChange={event=>setOfficer({...officer,phone:event.target.value})}/><input className={inputClass} type="date" value={officer.effectiveFrom} onChange={event=>setOfficer({...officer,effectiveFrom:event.target.value})}/><label className="flex items-center text-sm text-[#D1D5DB]"><input className="mr-2" type="checkbox" checked={officer.isSignatory} onChange={event=>setOfficer({...officer,isSignatory:event.target.checked})}/>Authorized signatory</label><button disabled={pending||!officer.name.trim()} onClick={saveOfficer} className="rounded bg-[#10B981] px-4 py-2 text-sm text-white disabled:opacity-50">{editingId?"Update officer":"Add officer"}</button>{editingId?<button onClick={()=>{setEditingId(undefined);setOfficer(emptyOfficer);}} className="rounded border border-[#444] px-4 py-2 text-sm text-[#D1D5DB]">Cancel edit</button>:null}</div>
    </section>
    <p className="mt-4 text-xs text-[#6B7280]">Document requirements and form/letter templates are configurable under Master Data and Templates. The default three-level approval workflow is attached during onboarding.</p>
  </div>;
}
