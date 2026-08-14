import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vendors" };

const SAMPLE = [
  { id: "VND-001", name: "SafeEye Systems", category: "Security / CCTV", contact: "Prakash Mehta", phone: "+91-98xxx-xxxx", status: "Active", contracts: 2, rating: "4.2" },
  { id: "VND-002", name: "ColorCraft Painters", category: "Civil / Painting", contact: "Dinesh Rao", phone: "+91-97xxx-xxxx", status: "Active", contracts: 1, rating: "4.5" },
  { id: "VND-003", name: "PowerSure AMC", category: "Electrical / DG", contact: "Ravi Kumar", phone: "+91-96xxx-xxxx", status: "Active", contracts: 1, rating: "3.8" },
  { id: "VND-004", name: "AquaClean Pvt.", category: "Plumbing / Water", contact: "Sanjay Patil", phone: "+91-95xxx-xxxx", status: "Inactive", contracts: 0, rating: "3.2" },
  { id: "VND-005", name: "Green Leaf Co.", category: "Landscaping", contact: "Mohan Das", phone: "+91-94xxx-xxxx", status: "Active", contracts: 1, rating: "4.0" },
  { id: "VND-006", name: "DryShield Works", category: "Civil / Waterproofing", contact: "Anil Joshi", phone: "+91-93xxx-xxxx", status: "Active", contracts: 1, rating: "4.7" },
];

export default function VendorsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Vendors
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Approved service providers and maintenance contractors
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Register Vendor
        </button>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Vendor ID", "Name", "Category", "Contact", "Phone", "Active Contracts", "Rating", "Status", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#10B981" }}>{row.id}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">{row.name}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.category}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.contact}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.phone}</td>
                <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF", textAlign: "center" }}>{row.contracts}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#F59E0B" }}>star</span>
                    <span className="font-body-sm text-body-sm text-text-primary">{row.rating}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{
                    backgroundColor: row.status === "Active" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                    color: row.status === "Active" ? "#10B981" : "#6B7280",
                    border: `1px solid ${row.status === "Active" ? "rgba(16,185,129,0.2)" : "rgba(107,114,128,0.2)"}`,
                  }}>{row.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>more_horiz</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live vendor management with RLS isolation arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
