"use client";
import { useState } from "react";
import { AddUnitModal } from "@/components/modals/AddUnitModal";

interface Unit {
  id: string;
  unit_number: string;
  floor: number | null;
  unit_type: string;
  carpet_area_sqft: number | null;
  status: string;
  wing_id: string;
  wing_name: string;
}

interface Wing {
  id: string;
  name: string;
  code: string;
}

interface Summary {
  total: number;
  occupied: number;
  vacant: number;
  tenanted: number;
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  OCCUPIED: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  TENANTED: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  VACANT: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
  MAINTENANCE: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }

export function UnitsClient({ units, wings, summary }: { units: Unit[]; wings: Wing[]; summary: Summary }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Add Unit
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total units", value: summary.total, icon: "apartment" },
            { label: "Occupied", value: summary.occupied, icon: "check_circle" },
            { label: "Vacant", value: summary.vacant, icon: "lock_open" },
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
          {units.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>apartment</span>
              <p className="text-sm">No units yet. Add the first unit to get started.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Unit no.", "Wing", "Floor", "Type", "Carpet area", "Status"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {units.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < units.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono font-medium" style={{ fontSize: "13px", color: "#10B981" }}>{row.unit_number}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.wing_name}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.floor != null ? `${row.floor}${row.floor === 1 ? "st" : row.floor === 2 ? "nd" : row.floor === 3 ? "rd" : "th"}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{label(row.unit_type)}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.carpet_area_sqft ? `${row.carpet_area_sqft.toLocaleString("en-IN")} sq ft` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddUnitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wings={wings}
      />
    </>
  );
}
