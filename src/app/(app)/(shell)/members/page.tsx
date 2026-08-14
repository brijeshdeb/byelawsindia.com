import type { Metadata } from "next";

export const metadata: Metadata = { title: "Members" };

const SAMPLE = [
  { id: "MBR-001", name: "Ramesh Iyer", unit: "A-401", wing: "Wing A", type: "Owner", status: "Active", since: "Jan 2019" },
  { id: "MBR-002", name: "Priya Menon", unit: "B-204", wing: "Wing B", type: "Tenant", status: "Active", since: "Mar 2022" },
  { id: "MBR-003", name: "Suresh Nair", unit: "A-102", wing: "Wing A", type: "Owner", status: "Active", since: "Jun 2015" },
  { id: "MBR-004", name: "Kavitha Sharma", unit: "C-301", wing: "Wing C", type: "Owner", status: "Inactive", since: "Sep 2018" },
  { id: "MBR-005", name: "Deepak Patel", unit: "B-507", wing: "Wing B", type: "Tenant", status: "Active", since: "Nov 2023" },
];

export default function MembersPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Members
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Registered members across all wings of the society
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
          Register Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        {["All", "Owners", "Tenants", "Active", "Inactive"].map((f) => (
          <button
            key={f}
            className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: f === "All" ? "rgba(16,185,129,0.12)" : "#1E1E1E",
              color: f === "All" ? "#10B981" : "#9CA3AF",
              border: `1px solid ${f === "All" ? "rgba(16,185,129,0.3)" : "#333333"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Member ID", "Name", "Unit", "Wing", "Type", "Status", "Member Since", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{row.id}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.name}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.unit}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.wing}</td>
                <td className="px-4 py-3">
                  <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{
                    backgroundColor: row.type === "Owner" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                    color: row.type === "Owner" ? "#10B981" : "#F59E0B",
                    border: `1px solid ${row.type === "Owner" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}>{row.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{
                    backgroundColor: row.status === "Active" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                    color: row.status === "Active" ? "#10B981" : "#6B7280",
                    border: `1px solid ${row.status === "Active" ? "rgba(16,185,129,0.2)" : "rgba(107,114,128,0.2)"}`,
                  }}>{row.status}</span>
                </td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.since}</td>
                <td className="px-4 py-3">
                  <button className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
                    more_horiz
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live member records arrive in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
