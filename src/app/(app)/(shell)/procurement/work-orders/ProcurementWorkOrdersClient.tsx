"use client";
import { useState } from "react";
import { NewProcurementWorkOrderModal } from "@/components/modals/NewProcurementWorkOrderModal";

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  amount: number;
  status: string;
  start_date: string | null;
  completion_date: string | null;
  vendor_name?: string;
  created_at: string;
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
  ISSUED: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
  IN_PROGRESS: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  COMPLETED: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  CANCELLED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "); }

export function ProcurementWorkOrdersClient({ workOrders, vendors, rfqs }: { workOrders: WorkOrder[]; vendors: Vendor[]; rfqs: Rfq[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Work orders
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Procurement work orders issued to vendors
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            New Work Order
          </button>
        </div>

        <div className="queue-section">
          {workOrders.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>assignment</span>
              <p className="text-sm">No procurement work orders yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["WO no.", "Title", "Vendor", "Amount", "Status", "Completion"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workOrders.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < workOrders.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{row.work_order_number}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.title}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.vendor_name ?? "—"}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">
                        INR {row.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.completion_date ? new Date(row.completion_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <NewProcurementWorkOrderModal open={modalOpen} onClose={() => setModalOpen(false)} vendors={vendors} rfqs={rfqs} />
    </>
  );
}
