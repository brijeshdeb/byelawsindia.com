"use client";
import { useState } from "react";
import { RegisterVendorModal } from "@/components/modals/RegisterVendorModal";

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
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  INACTIVE: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
  BLACKLISTED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

const DEMO_VENDORS: Vendor[] = [
  { id: "demo-v1", vendor_code: "VND-2024-001", name: "Shree Electricals",       vendor_type: "ELECTRICAL",  contact_name: "Rakesh Shah",     email: "rakesh@shreeelec.com",    phone: "9810022200", status: "ACTIVE",   is_verified: true  },
  { id: "demo-v2", vendor_code: "VND-2024-002", name: "AquaPure Services",       vendor_type: "PLUMBING",    contact_name: "Sunil Patil",     email: "sunil@aquapure.com",      phone: "9811033311", status: "ACTIVE",   is_verified: true  },
  { id: "demo-v3", vendor_code: "VND-2024-003", name: "GreenScape Landscaping",  vendor_type: "GARDENING",   contact_name: "Vijay Tiwari",    email: "vijay@greenscape.in",     phone: "9812044422", status: "ACTIVE",   is_verified: true  },
  { id: "demo-v4", vendor_code: "VND-2024-004", name: "SafeGuard Security",      vendor_type: "SECURITY",    contact_name: "Pawan Kumar",     email: "pawan@safeguard.in",      phone: "9813055533", status: "ACTIVE",   is_verified: false },
  { id: "demo-v5", vendor_code: "VND-2024-005", name: "CleanCo Housekeeping",    vendor_type: "HOUSEKEEPING",contact_name: "Meera Joshi",     email: "meera@cleanco.in",        phone: "9814066644", status: "ACTIVE",   is_verified: true  },
  { id: "demo-v6", vendor_code: "VND-2023-006", name: "BuildRight Contractors",  vendor_type: "CIVIL",       contact_name: "Arun Sawant",     email: "arun@buildright.com",     phone: "9815077755", status: "INACTIVE", is_verified: false },
];

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "); }

export function VendorsClient({ vendors }: { vendors: Vendor[] }) {
  const isDemo = vendors.length === 0;
  const displayVendors = isDemo ? DEMO_VENDORS : vendors;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Vendors
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              {isDemo ? "Illustrative vendors — register real vendors via Register Vendor" : `${vendors.length} approved vendor${vendors.length !== 1 ? "s" : ""} on record`}
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

        <div className="queue-section">
          {displayVendors.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>storefront</span>
              <p className="text-sm">No vendors registered yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Code", "Name", "Type", "Contact", "Phone", "Status", "Verified"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayVendors.map((v, i) => {
                  const sc = statusColor[v.status] ?? FALLBACK;
                  return (
                    <tr key={v.id} style={{ borderBottom: i < displayVendors.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{v.vendor_code}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{v.name}</td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
            <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
              {isDemo
                ? "Illustrative data. Live vendors appear here once registered."
                : `Showing ${displayVendors.length} vendor${displayVendors.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <RegisterVendorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
