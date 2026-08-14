import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management" };

const SAMPLE = [
  { id: "USR-001", name: "Anand Krishnan", email: "chairman@willow.in", role: "Chairman", wing: "Society-Wide", status: "Active", lastLogin: "12 Aug 2024" },
  { id: "USR-002", name: "Meera Joshi", email: "sec@willow.in", role: "Secretary", wing: "Society-Wide", status: "Active", lastLogin: "12 Aug 2024" },
  { id: "USR-003", name: "Venkat Rao", email: "treasurer@willow.in", role: "Treasurer", wing: "Society-Wide", status: "Active", lastLogin: "11 Aug 2024" },
  { id: "USR-004", name: "Priya Singh", email: "admin@willow.in", role: "Admin", wing: "Society-Wide", status: "Active", lastLogin: "12 Aug 2024" },
  { id: "USR-005", name: "Ramesh Iyer", email: "ramesh@willow.in", role: "Member", wing: "Wing A", status: "Active", lastLogin: "08 Aug 2024" },
  { id: "USR-006", name: "Deepak Patel", email: "deepak@willow.in", role: "Member", wing: "Wing B", status: "Invited", lastLogin: "—" },
];

const roleColor: Record<string, string> = {
  Chairman: "#8B5CF6",
  Secretary: "#3B82F6",
  Treasurer: "#F59E0B",
  Admin: "#10B981",
  Member: "#9CA3AF",
};

export default function UsersPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            User Management
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Registered users and their access assignments
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
          Invite User
        </button>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["User ID", "Name", "Email", "Role", "Scope", "Status", "Last Login", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const rc = roleColor[row.role] ?? "#9CA3AF";
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#6B7280" }}>{row.id}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">{row.name}</td>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: `${rc}18`, color: rc, border: `1px solid ${rc}30` }}>{row.role}</span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.wing}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{
                      backgroundColor: row.status === "Active" ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)",
                      color: row.status === "Active" ? "#10B981" : "#3B82F6",
                      border: `1px solid ${row.status === "Active" ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.2)"}`,
                    }}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#6B7280" }}>{row.lastLogin}</td>
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
            Phase 0: illustrative data. Live user provisioning with email invites arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
