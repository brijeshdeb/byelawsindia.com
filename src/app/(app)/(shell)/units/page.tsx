import type { Metadata } from "next";

export const metadata: Metadata = { title: "Units" };

const SAMPLE = [
  { no: "A-101", wing: "Wing A", floor: "1st", type: "2BHK", area: "950 sq ft", owner: "Suresh Nair", status: "Occupied" },
  { no: "A-401", wing: "Wing A", floor: "4th", type: "3BHK", area: "1250 sq ft", owner: "Ramesh Iyer", status: "Occupied" },
  { no: "B-204", wing: "Wing B", floor: "2nd", type: "2BHK", area: "900 sq ft", owner: "Meena Rao", status: "Tenanted" },
  { no: "B-507", wing: "Wing B", floor: "5th", type: "1BHK", area: "650 sq ft", owner: "Girish Kumar", status: "Tenanted" },
  { no: "C-301", wing: "Wing C", floor: "3rd", type: "3BHK", area: "1300 sq ft", owner: "Kavitha Sharma", status: "Vacant" },
  { no: "C-601", wing: "Wing C", floor: "6th", type: "Penthouse", area: "2100 sq ft", owner: "Vijay Anand", status: "Occupied" },
];

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  Occupied: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Tenanted: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Vacant: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function UnitsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Units
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            All residential units registered in the society
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Add Unit
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Units", value: "—", icon: "apartment" },
          { label: "Occupied", value: "—", icon: "check_circle" },
          { label: "Vacant", value: "—", icon: "lock_open" },
        ].map((s) => (
          <div key={s.label} className="queue-section px-5 py-4 flex items-center gap-4">
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#10B981" }}>{s.icon}</span>
            <div>
              <p className="font-headline-md text-headline-md text-text-primary">{s.value}</p>
              <p className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Unit No.", "Wing", "Floor", "Type", "Carpet Area", "Owner", "Status", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const sc = statusColor[row.status] ?? FALLBACK_STYLE;
              return (
                <tr key={row.no} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono font-medium" style={{ fontSize: "13px", color: "#10B981" }}>{row.no}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.wing}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.floor}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.type}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.area}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.owner}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{row.status}</span>
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
            Phase 0: illustrative data. Live unit records arrive in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
