"use client";
import { useState } from "react";
import { AddWingModal } from "@/components/modals/AddWingModal";

interface Wing {
  id: string;
  name: string;
  code: string;
  total_units: number | null;
  is_active: boolean;
  unit_count: number;
}

const DEMO_WINGS: Wing[] = [
  { id: "demo-w1", name: "Wing A", code: "A", total_units: 12, is_active: true,  unit_count: 12 },
  { id: "demo-w2", name: "Wing B", code: "B", total_units: 12, is_active: true,  unit_count: 10 },
  { id: "demo-w3", name: "Wing C", code: "C", total_units: 8,  is_active: true,  unit_count: 8  },
  { id: "demo-w4", name: "Wing D", code: "D", total_units: 6,  is_active: false, unit_count: 0  },
];

export function WingsClient({ wings }: { wings: Wing[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const isDemo = wings.length === 0;
  const displayWings = isDemo ? DEMO_WINGS : wings;

  return (
    <>
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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Add Wing
          </button>
        </div>

        {displayWings.length === 0 ? (
          <div className="queue-section flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
            <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>domain</span>
            <p className="text-sm">No wings yet. Add the first wing to organise units.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {displayWings.map((wing) => (
                <div key={wing.id} className="queue-section px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-lg" style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                      {wing.code}
                    </div>
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{
                      backgroundColor: wing.is_active ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                      color: wing.is_active ? "#10B981" : "#6B7280",
                      border: `1px solid ${wing.is_active ? "rgba(16,185,129,0.2)" : "rgba(107,114,128,0.2)"}`,
                    }}>
                      {wing.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h2 className="font-headline-sm text-headline-sm text-text-primary mb-3">{wing.name}</h2>

                  <div className="space-y-2">
                    {[
                      { label: "Units registered", value: String(wing.unit_count) },
                      { label: "Total capacity", value: wing.total_units != null ? String(wing.total_units) : "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{item.label}</span>
                        <span className="font-body-sm text-body-sm text-text-primary">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="queue-section px-4 py-3">
              <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
                {isDemo
                  ? "Illustrative data. Live wings appear here once added."
                  : `Showing ${displayWings.length} wing${displayWings.length !== 1 ? "s" : ""}.`}
              </p>
            </div>
          </>
        )}
      </div>

      <AddWingModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
