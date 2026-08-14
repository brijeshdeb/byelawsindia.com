import type { Metadata } from "next";

export const metadata: Metadata = { title: "Procurement Work Orders" };

const SAMPLE = [
  { id: "PWO-2024-011", title: "CCTV Upgrade Installation", rfq: "RFQ-2024-008", vendor: "SafeEye Systems", value: "₹1,08,000", startDate: "22 Aug 2024", status: "Upcoming" },
  { id: "PWO-2024-010", title: "Annual Landscaping, Q3", rfq: "RFQ-2024-007", vendor: "Green Leaf Co.", value: "₹15,000", startDate: "01 Aug 2024", status: "In Progress" },
  { id: "PWO-2024-009", title: "Terrace Waterproofing, Wing C", rfq: "RFQ-2024-006", vendor: "DryShield Works", value: "₹74,500", startDate: "10 Jul 2024", status: "Completed" },
  { id: "PWO-2024-008", title: "Pool Maintenance, Jul", rfq: "RFQ-2024-005", vendor: "AquaClean Pvt.", value: "₹15,000", startDate: "01 Jul 2024", status: "Completed" },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Upcoming: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" },
  "In Progress": { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Completed: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Cancelled: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function ProcurementWorkOrdersPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Procurement Work Orders
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Work orders raised from awarded RFQs
          </p>
        </div>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["PWO ID", "Title", "From RFQ", "Vendor", "Value", "Start Date", "Status", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const ss = statusStyle[row.status] ?? FALLBACK_STYLE;
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#10B981" }}>{row.id}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.title}</td>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "11px", color: "#6B7280" }}>{row.rfq}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.vendor}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.value}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.startDate}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>open_in_new</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live procurement tracking arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
