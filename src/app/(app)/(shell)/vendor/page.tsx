import {getServerContext} from "@/lib/context";
import {VendorDocumentsPanel} from "@/components/vendor/VendorDocumentsPanel";
import {VendorPortalClient} from "./VendorPortalClient";

export default async function VendorPortalPage(){
  const{supabase,societyId,userId}=await getServerContext();
  const{data:link}=await supabase.from("vendor_users").select("vendor_id,vendors(name,vendor_code,status,is_verified)").eq("society_id",societyId).eq("user_id",userId).eq("is_active",true).maybeSingle();
  if(!link)return <div className="page-container"><div className="queue-section p-10 text-center text-[#9CA3AF]">Your login is not linked to an active vendor profile.</div></div>;
  const vendorId=link.vendor_id;
  const[{data:invitations},{data:quotations},{data:contracts},{data:workOrders},{data:renewals},{data:performance},{data:documents}]=await Promise.all([
    supabase.from("rfq_invitations").select("id,status,invited_at,responded_at,decline_reason,rfqs(id,rfq_number,title,description,category,submission_deadline,estimated_budget,status)").eq("society_id",societyId).eq("vendor_id",vendorId).order("invited_at",{ascending:false}),
    supabase.from("quotations").select("id,rfq_id,quotation_number,status,total_amount,submitted_at,quotation_items(id,line_number,description,quantity,unit,unit_rate,tax_rate)").eq("society_id",societyId).eq("vendor_id",vendorId).order("created_at",{ascending:false}),
    supabase.from("contracts").select("id,contract_number,title,value,status,start_date,end_date").eq("society_id",societyId).eq("vendor_id",vendorId).order("created_at",{ascending:false}),
    supabase.from("procurement_work_orders").select("id,work_order_number,title,amount,status,start_date,completion_date").eq("society_id",societyId).eq("vendor_id",vendorId).order("created_at",{ascending:false}),
    supabase.from("contract_renewals").select("id,renewal_number,status,current_end_date,proposed_start_date,proposed_end_date,proposed_value,response_due_at,society_comments,vendor_comments,contracts(title)").eq("society_id",societyId).eq("vendor_id",vendorId).order("created_at",{ascending:false}),
    supabase.from("vendor_performance_reviews").select("id,overall_score,comments,reviewed_at").eq("society_id",societyId).eq("vendor_id",vendorId).order("reviewed_at",{ascending:false}),
    supabase.from("vendor_documents").select("id,document_type,title,document_number,issued_on,expires_on,file_name,file_size_bytes,status,version,rejection_reason,created_at").eq("society_id",societyId).eq("vendor_id",vendorId).order("created_at",{ascending:false}),
  ]);
  return <><VendorPortalClient vendor={(link as any).vendors} invitations={(invitations??[]) as any} quotations={quotations??[]} contracts={contracts??[]} workOrders={workOrders??[]} renewals={(renewals??[]) as any} performance={performance??[]}/><div className="page-container pt-0"><VendorDocumentsPanel societyId={societyId} vendorId={vendorId} documents={documents??[]} canUpload canReview={false}/></div></>;
}
