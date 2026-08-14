import type { Metadata } from "next";

export const metadata: Metadata = { title: "Work Orders" };

const SAMPLE = [
  { id: "WO-2024-022", title: "Repaint staircase, Wing A floors 1–3", category: "Painting", vendor: "ColorCraft Painters", scheduled: "15 Aug 2024", cost: "₹28,000", status: "Scheduled" },
  { id: "WO-2024-021", title: "CCTV repair, Gate 2", category: "Security", vendor: "SafeEye Systems", scheduled: "13 Aug 2024", cost: "₹4,500", status: "In Progress" },
  { id: "WO-2024-020", title: "Roof waterproofing, Terrace B", category: "Civil", vendor: "DryShield Works", scheduled: "10 Aug 2024", cost: "₹75,000", status: "Completed" },
  { id: "WO-2024-019", title: "Generator servicing", category: "Electrical", vendor: "PowerSure AMC", scheduled: "06 Aug 2024", cost: "₹12,000", status: "Completed" },
  { id: "WO-2024-018", title: "Swimming pool filter replacement", category: "Amenity", vendor: "AquaClean Pvt.", scheduled: "28 Jul 2024", cost: "₹32,000", status: "Completed" },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Scheduled: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" },
  "In Progress": { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Completed: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Cancelled: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function WorkOrdersPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Work Orders
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Planned maintenance jobs and AMC work orders
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          New Work Order
        </button>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["WO ID", "Title", "Category", "Vendor", "Scheduled", "Cost", "Status", "Actions"].map((h) => (
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
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary" style={{ maxWidth: "200px" }}>{row.title}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.category}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.vendor}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.scheduled}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.cost}</td>
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
            Phase 0: illustrative data. Live work order management arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
