"use client";
import { useState } from "react";
import { RegisterMemberModal } from "@/components/modals/RegisterMemberModal";

interface Member {
  id: string;
  member_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_type: string;
  status: string;
  effective_from: string | null;
  unit_number?: string | null;
  wing_name?: string | null;
}

interface Unit {
  id: string;
  unit_number: string;
  wing_name: string;
}

const typeColor: Record<string, { bg: string; text: string; border: string }> = {
  OWNER: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  TENANT: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  ASSOCIATE: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
  COMMITTEE: { bg: "rgba(236,72,153,0.1)", text: "#F472B6", border: "rgba(236,72,153,0.2)" },
};
const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  INACTIVE: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
  TRANSFERRED: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  DECEASED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

function label(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");
}

export function MembersClient({ members, units }: { members: Member[]; units: Unit[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("All");

  const FILTERS = ["All", "Owner", "Tenant", "Active", "Inactive"];

  const filtered = members.filter((m) => {
    if (filter === "All") return true;
    if (filter === "Owner") return m.member_type === "OWNER";
    if (filter === "Tenant") return m.member_type === "TENANT";
    if (filter === "Active") return m.status === "ACTIVE";
    if (filter === "Inactive") return m.status === "INACTIVE";
    return true;
  });

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Members
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              {members.length > 0 ? `${members.length} registered member${members.length !== 1 ? "s" : ""} across all wings` : "Register the first member to get started"}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
            Register Member
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === f ? "rgba(16,185,129,0.12)" : "#1E1E1E",
                color: filter === f ? "#10B981" : "#9CA3AF",
                border: `1px solid ${filter === f ? "rgba(16,185,129,0.3)" : "#333333"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="queue-section">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>group</span>
              <p className="text-sm">No members found. Register the first member to get started.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Member ID", "Name", "Unit", "Type", "Status", "Member since"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const tc = typeColor[row.member_type] ?? FALLBACK;
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{row.member_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-body-sm text-body-sm text-text-primary">{row.full_name}</p>
                        {row.email && <p className="text-xs" style={{ color: "#6B7280" }}>{row.email}</p>}
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.unit_number ? `${row.wing_name ?? ""} ${row.unit_number}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                          {label(row.member_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.effective_from ? new Date(row.effective_from).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
            <p className="font-body-sm text-body-sm" style={{ color: "#6B7280" }}>
              {`Showing ${filtered.length} member${filtered.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <RegisterMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        units={units}
      />
    </>
  );
}
