import type { Metadata } from "next";

export const metadata: Metadata = { title: "Wings" };

const SAMPLE = [
  { id: "WNG-A", code: "A", name: "Wing A", floors: 6, unitsPerFloor: 4, totalUnits: 24, occupied: 22, wingManager: "Suresh Nair (MBR-003)", status: "Active" },
  { id: "WNG-B", code: "B", name: "Wing B", floors: 6, unitsPerFloor: 4, totalUnits: 24, occupied: 23, wingManager: "Priya Menon (MBR-002)", status: "Active" },
  { id: "WNG-C", code: "C", name: "Wing C", floors: 6, unitsPerFloor: 4, totalUnits: 24, occupied: 21, wingManager: "Unassigned", status: "Active" },
];

export default function WingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Wings
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Society wings: configuration and unit summary
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Add Wing
        </button>
      </div>

      {/* Wing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {SAMPLE.map((wing) => (
          <div key={wing.id} className="queue-section px-6 py-5">
            {/* Wing letter badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-lg" style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                {wing.code}
              </div>
              <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>{wing.status}</span>
            </div>

            <h2 className="font-headline-sm text-headline-sm text-text-primary mb-3">{wing.name}</h2>

            <div className="space-y-2">
              {[
                { label: "Floors", value: String(wing.floors) },
                { label: "Units per Floor", value: String(wing.unitsPerFloor) },
                { label: "Total Units", value: String(wing.totalUnits) },
                { label: "Occupied", value: `${wing.occupied} / ${wing.totalUnits}` },
                { label: "Wing Representative", value: wing.wingManager },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{item.label}</span>
                  <span className="font-body-sm text-body-sm text-text-primary text-right" style={{ maxWidth: "180px" }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: "1px solid #2a2a2a" }}>
              <button className="flex-1 px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: "#1c1b1b", color: "#9CA3AF", border: "1px solid #333333" }}>
                View Units
              </button>
              <button className="px-3 py-1.5 rounded text-xs font-medium material-symbols-outlined" style={{ fontSize: "16px", backgroundColor: "#1c1b1b", color: "#6B7280", border: "1px solid #333333" }}>
                edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 rounded" style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}>
        <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
          Phase 0: illustrative data. Live wing management with unit grid arrives in Phase 2.
        </p>
      </div>
    </div>
  );
}
