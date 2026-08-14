import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Administration Console" };

const HEALTH_CHECKS = [
  { label: "Database connection", status: "ok" },
  { label: "Auth service", status: "ok" },
  { label: "Storage bucket", status: "ok" },
  { label: "Email relay", status: "warning" },
  { label: "Supabase Realtime", status: "ok" },
];

const QUICK_LINKS = [
  { label: "Society Settings", href: "/admin/settings", icon: "tune", desc: "Charges, dates, approval thresholds" },
  { label: "User Management", href: "/admin/users", icon: "manage_accounts", desc: "Invite users, assign roles" },
  { label: "Wings", href: "/admin/wings", icon: "apartment", desc: "Wing configuration and unit inventory" },
  { label: "Audit Trail", href: "/reports/audit", icon: "history", desc: "Immutable log of privileged actions" },
];

const TENANT_STATS = [
  { label: "Society", value: "Willow Heights CHS" },
  { label: "Active Wings", value: "3" },
  { label: "Total Units", value: "72" },
  { label: "Registered Members", value: "—" },
  { label: "Active Users", value: "6" },
  { label: "Environment", value: "Phase 0 (Preview)" },
];

const RECENT_ADMIN_ACTIONS = [
  { action: "Role updated", detail: "Deepak Patel → Member (Wing B)", actor: "admin@willow.in", ts: "12 Aug, 14:05" },
  { action: "Wing created", detail: "Wing C added (24 units)", actor: "admin@willow.in", ts: "10 Aug, 11:22" },
  { action: "Maintenance charge updated", detail: "₹3,800 → ₹4,200 per unit", actor: "chairman@willow.in", ts: "01 Apr, 09:00" },
  { action: "User invited", detail: "Deepak Patel (deepak@willow.in)", actor: "sec@willow.in", ts: "28 Jul, 16:45" },
];

export default function AdminConsolePage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Administration Console
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Platform health, tenant configuration, and access governance
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
          <span className="font-label-md text-label-md" style={{ color: "#10B981" }}>System operational</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — main content (2 cols) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Quick nav tiles */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>grid_view</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Administration</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-start gap-3 p-4 rounded transition-colors"
                  style={{ backgroundColor: "#131313", border: "1px solid #2a2a2a" }}
                >
                  <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "22px", color: "#10B981" }}>{link.icon}</span>
                  <div>
                    <p className="font-body-sm text-body-sm text-text-primary font-medium">{link.label}</p>
                    <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tenant summary */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>business</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Tenant Summary</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {TENANT_STATS.map((s) => (
                <div key={s.label} className="px-5 py-3 flex items-center justify-between">
                  <span className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{s.label}</span>
                  <span className="font-body-sm text-body-sm text-text-primary">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent admin actions */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>history</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Recent Admin Actions</h2>
              <Link href="/reports/audit" className="ml-auto font-label-md text-label-md" style={{ color: "#10B981", fontSize: "12px" }}>
                Full audit trail
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {RECENT_ADMIN_ACTIONS.map((a, i) => (
                <div key={i} className="queue-item flex items-start justify-between">
                  <div>
                    <p className="font-body-sm text-body-sm text-text-primary font-medium">{a.action}</p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>{a.detail}</p>
                    <p style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>by {a.actor}</p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#6B7280", whiteSpace: "nowrap", marginLeft: "16px" }}>{a.ts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar — health + security */}
        <div className="space-y-5">

          {/* System health */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>monitor_heart</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">System Health</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {HEALTH_CHECKS.map((h) => (
                <div key={h.label} className="px-4 py-3 flex items-center justify-between">
                  <span className="font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{h.label}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.status === "ok" ? "#10B981" : "#F59E0B" }} />
                    <span style={{ fontSize: "11px", color: h.status === "ok" ? "#10B981" : "#F59E0B" }}>
                      {h.status === "ok" ? "OK" : "Warning"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security posture */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>security</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Security</h2>
            </div>
            <div className="space-y-3 px-4 pb-4">
              {[
                { label: "Row Level Security", state: "Enabled" },
                { label: "Service key in browser", state: "Never" },
                { label: "Tenant isolation", state: "society_id RLS" },
                { label: "Signed document URLs", state: "Phase 2" },
                { label: "MFA enforcement", state: "Phase 2" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-2">
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>{item.label}</span>
                  <span className="font-label-md text-label-md px-2 py-0.5 rounded shrink-0" style={{
                    backgroundColor: item.state === "Never" || item.state === "Enabled" || item.state === "society_id RLS" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                    color: item.state === "Never" || item.state === "Enabled" || item.state === "society_id RLS" ? "#10B981" : "#6B7280",
                    fontSize: "11px",
                  }}>
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 px-4 py-3 rounded" style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}>
        <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
          Phase 0 build. Live health checks, MFA enforcement, and per-tenant billing arrive in Phase 2.
        </p>
      </div>
    </div>
  );
}
