"use client";
import { useState, useTransition } from "react";
import { RegisterVendorModal } from "@/components/modals/RegisterVendorModal";
import { inviteVendorUserAction, revokeVendorUserAction } from "@/app/actions/vendor-access";

interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  vendor_type: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  is_verified: boolean;
  portal_users: Array<{user_id:string;is_primary:boolean}>;
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  INACTIVE: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
  BLACKLISTED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "); }

export function VendorsClient({ vendors, canManage }: { vendors: Vendor[]; canManage:boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [accessFor,setAccessFor]=useState<Vendor|null>(null); const[message,setMessage]=useState(""); const[pending,startTransition]=useTransition();
  function invite(formData:FormData){if(!accessFor)return;startTransition(async()=>{const result=await inviteVendorUserAction({vendorId:accessFor.id,email:String(formData.get("email")??""),fullName:String(formData.get("fullName")??"")});setMessage(result.success?(result.data.invited?"Vendor invitation sent and portal access assigned.":"Existing login linked to this vendor."):result.error);if(result.success)setAccessFor(null);});}
  function revoke(vendorId:string,userId:string){if(!window.confirm("Revoke this vendor portal login?"))return;startTransition(async()=>{const result=await revokeVendorUserAction({vendorId,userId});setMessage(result.success?"Vendor portal access revoked.":result.error);});}

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Vendors
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              {vendors.length > 0 ? `${vendors.length} approved vendor${vendors.length !== 1 ? "s" : ""} on record` : "Register the first vendor to get started"}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_business</span>
            Register Vendor
          </button>
        </div>

        {message&&<p role="status" className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p>}
        {accessFor&&<form action={invite} className="queue-section mb-5 grid grid-cols-1 gap-4 p-5 md:grid-cols-2"><div className="md:col-span-2"><h2 className="font-semibold text-text-primary">Invite vendor portal login</h2><p className="text-sm text-[#9CA3AF]">{accessFor.name} will receive access only to its own invitations, quotations, work orders and contracts.</p></div><label className="text-sm text-[#9CA3AF]">Contact name<input name="fullName" defaultValue={accessFor.contact_name??""} required className="mt-1 w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary" /></label><label className="text-sm text-[#9CA3AF]">Login email<input name="email" type="email" defaultValue={accessFor.email??""} required className="mt-1 w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary" /></label><div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={()=>setAccessFor(null)} className="rounded border border-[#444] px-4 py-2 text-sm text-[#D1D5DB]">Cancel</button><button disabled={pending} className="rounded bg-[#10B981] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Send invite & enable portal</button></div></form>}

        <div className="queue-section">
          {vendors.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>storefront</span>
              <p className="text-sm">No vendors registered yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Code", "Name", "Type", "Contact", "Phone", "Status", "Verified", "Portal access"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => {
                  const sc = statusColor[v.status] ?? FALLBACK;
                  const portalUser=v.portal_users[0];
                  return (
                    <tr key={v.id} style={{ borderBottom: i < vendors.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{v.vendor_code}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary"><a href={`/vendors/${v.id}`} className="hover:text-[#10B981] hover:underline">{v.name}</a></td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{label(v.vendor_type)}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{v.contact_name ?? "—"}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{v.phone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(v.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: v.is_verified ? "#10B981" : "#6B7280" }}>
                          {v.is_verified ? "verified" : "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2">{portalUser?<><span className="text-xs text-[#10B981]">Enabled</span>{canManage&&<button disabled={pending} onClick={()=>revoke(v.id,portalUser.user_id)} className="text-xs text-[#EF4444] underline">Revoke</button>}</>:canManage?<button disabled={pending} onClick={()=>setAccessFor(v)} className="rounded border border-[#10B981] px-2 py-1 text-xs text-[#10B981]">Invite login</button>:<span className="text-xs text-[#6B7280]">Not enabled</span>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
            <p className="font-body-sm text-body-sm" style={{ color: "#6B7280" }}>
              {`Showing ${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <RegisterVendorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
