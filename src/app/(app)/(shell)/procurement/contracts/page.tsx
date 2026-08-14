import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contracts" };

const SAMPLE = [
  { id: "CNT-2024-005", title: "CCTV Maintenance AMC", vendor: "SafeEye Systems", value: "₹48,000/yr", start: "01 Jan 2024", expiry: "31 Dec 2024", status: "Active", daysLeft: 140 },
  { id: "CNT-2024-004", title: "Landscaping Annual Contract", vendor: "Green Leaf Co.", value: "₹60,000/yr", start: "01 Apr 2024", expiry: "31 Mar 2025", status: "Active", daysLeft: 229 },
  { id: "CNT-2024-003", title: "DG Set AMC", vendor: "PowerSure AMC", value: "₹1,20,000/yr", start: "01 Jun 2024", expiry: "31 May 2025", status: "Active", daysLeft: 289 },
  { id: "CNT-2023-007", title: "Security Guard Services", vendor: "ShieldForce Pvt.", value: "₹3,60,000/yr", start: "01 Aug 2023", expiry: "31 Jul 2024", status: "Expired", daysLeft: 0 },
  { id: "CNT-2023-006", title: "Housekeeping Contract", vendor: "CleanMate Services", value: "₹2,40,000/yr", start: "01 Jul 2023", expiry: "30 Jun 2024", status: "Expired", daysLeft: 0 },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Active: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Expiring: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Expired: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function ContractsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Contracts
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            AMC agreements and service contracts with expiry tracking
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Add Contract
        </button>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Contract ID", "Title", "Vendor", "Annual Value", "Start", "Expiry", "Days Left", "Status", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const EXPIRING_STYLE = { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" };
              const ss = (row.daysLeft > 0 && row.daysLeft < 30) ? EXPIRING_STYLE : (statusStyle[row.status] ?? FALLBACK_STYLE);
              const displayStatus = row.daysLeft > 0 && row.daysLeft < 30 ? "Expiring Soon" : row.status;
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#10B981" }}>{row.id}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.title}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.vendor}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.value}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.start}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.expiry}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: row.daysLeft === 0 ? "#6B7280" : row.daysLeft < 30 ? "#F59E0B" : "#9CA3AF" }}>
                    {row.daysLeft === 0 ? "—" : `${row.daysLeft}d`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{displayStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>more_horiz</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Automated expiry alerts arrive in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
