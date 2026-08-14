"use client";
import { useState } from "react";
import { NewContractModal } from "@/components/modals/NewContractModal";

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  value: number;
  status: string;
  start_date: string;
  end_date: string | null;
  vendor_name?: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Rfq {
  id: string;
  rfq_number: string;
  title: string;
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: "rgba(107,114,128,0.1)", text: "#9CA3AF", border: "rgba(107,114,128,0.2)" },
  ACTIVE: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  EXPIRED: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  TERMINATED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  RENEWED: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

const DEMO_CONTRACTS: Contract[] = [
  { id: "demo-ct1", contract_number: "CNT-2024-001", title: "Lift AMC – Wing A & B",          value: 72000,  status: "ACTIVE",      start_date: "2024-04-01", end_date: "2025-03-31", vendor_name: "Shree Electricals"      },
  { id: "demo-ct2", contract_number: "CNT-2024-002", title: "Garden maintenance – annual",     value: 30000,  status: "ACTIVE",      start_date: "2024-01-01", end_date: "2024-12-31", vendor_name: "GreenScape Landscaping" },
  { id: "demo-ct3", contract_number: "CNT-2024-003", title: "Housekeeping – daily services",   value: 120000, status: "ACTIVE",      start_date: "2024-04-01", end_date: "2025-03-31", vendor_name: "CleanCo Housekeeping"   },
  { id: "demo-ct4", contract_number: "CNT-2023-004", title: "Security guard services",         value: 180000, status: "EXPIRED",     start_date: "2023-04-01", end_date: "2024-03-31", vendor_name: "SafeGuard Security"     },
  { id: "demo-ct5", contract_number: "CNT-2024-005", title: "Compound painting – Phase 1",     value: 45000,  status: "DRAFT",       start_date: "2024-09-01", end_date: "2024-11-30", vendor_name: "BuildRight Contractors" },
];

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }

export function ContractsClient({ contracts, vendors, rfqs }: { contracts: Contract[]; vendors: Vendor[]; rfqs: Rfq[] }) {
  const isDemo = contracts.length === 0;
  const displayContracts = isDemo ? DEMO_CONTRACTS : contracts;
  const [modalOpen, setModalOpen] = useState(false);

  const totalActiveValue = displayContracts
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + c.value, 0);

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Contracts
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Vendor contracts and service agreements
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            New Contract
          </button>
        </div>

        {totalActiveValue > 0 && (
          <div className="mb-5 px-5 py-3 rounded flex items-center gap-3" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#10B981" }}>contract</span>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Active contract value: <span className="font-semibold" style={{ color: "#10B981" }}>INR {totalActiveValue.toLocaleString("en-IN")}</span>
            </p>
          </div>
        )}

        <div className="queue-section">
          {displayContracts.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>gavel</span>
              <p className="text-sm">No contracts yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Contract no.", "Title", "Vendor", "Value", "Status", "Validity"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayContracts.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < displayContracts.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{row.contract_number}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.title}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.vendor_name ?? "—"}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">
                        INR {row.value.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {new Date(row.start_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        {row.end_date ? ` - ${new Date(row.end_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : " onwards"}
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
                ? "Illustrative data. Live contracts appear here once created."
                : `Showing ${displayContracts.length} contract${displayContracts.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <NewContractModal open={modalOpen} onClose={() => setModalOpen(false)} vendors={vendors} rfqs={rfqs} />
    </>
  );
}
