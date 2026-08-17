/**
 * Platform Super Admin Console -- System Overview.
 *
 * Cross-tenant aggregate view of the entire ByelawsIndia platform.
 *
 * Security: createAdminClient() is called ONLY in this server component,
 * after the parent layout.tsx has already confirmed is_platform_admin = true
 * from the database. The service-role key never reaches the browser.
 *
 * Queries:
 *   - Total active societies
 *   - Active members across all societies
 *   - Pending approvals (member applications in-progress + unverified vendors)
 *   - Active contracts + expiry alerts by bucket
 *   - Recent society registrations (for the table)
 *
 * Design reference: stitch_obsidian_ui_design/super_admin_dashboard/screen.png
 */
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { switchToSociety } from "./actions";

// ── date helpers for contract expiry buckets ──────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── data fetching ─────────────────────────────────────────────────────────────

const EMPTY_SUMMARY = {
  societyCount: 0,
  memberCount: 0,
  pendingApplications: 0,
  unverifiedVendors: 0,
  contractCount: 0,
  expiry30: 0,
  expiry60: 0,
  expiry90: 0,
  recentSocieties: [] as {
    id: string;
    name: string;
    registration_number: string;
    city: string;
    state: string;
    is_active: boolean;
    created_at: string;
  }[],
};

async function fetchConsoleSummary() {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // Service role key missing — show zeroed dashboard rather than crashing.
    return EMPTY_SUMMARY;
  }

  try {
  const today = daysFromNow(0);
  const day30 = daysFromNow(30);
  const day60 = daysFromNow(60);
  const day90 = daysFromNow(90);

  const [
    societiesResult,
    membersResult,
    applicationsResult,
    vendorsResult,
    contractsResult,
    expiry30Result,
    expiry60Result,
    expiry90Result,
    recentSocietiesResult,
  ] = await Promise.all([
    // Total active societies
    admin
      .from("societies")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    // Active members across all societies
    admin
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),

    // Pending member applications (submitted but not finalized)
    admin
      .from("member_applications")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("FINALIZED","DRAFT","REJECTED")'),

    // Unverified vendors
    admin
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("is_verified", false)
      .eq("status", "ACTIVE"),

    // Active contracts
    admin
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),

    // Contracts expiring within 30 days
    admin
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .gte("end_date", today)
      .lte("end_date", day30),

    // Contracts expiring in 31-60 days
    admin
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .gt("end_date", day30)
      .lte("end_date", day60),

    // Contracts expiring in 61-90 days
    admin
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .gt("end_date", day60)
      .lte("end_date", day90),

    // Recent society registrations (last 8)
    admin
      .from("societies")
      .select(
        "id, name, registration_number, city, state, is_active, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    societyCount: societiesResult.count ?? 0,
    memberCount: membersResult.count ?? 0,
    pendingApplications: applicationsResult.count ?? 0,
    unverifiedVendors: vendorsResult.count ?? 0,
    contractCount: contractsResult.count ?? 0,
    expiry30: expiry30Result.count ?? 0,
    expiry60: expiry60Result.count ?? 0,
    expiry90: expiry90Result.count ?? 0,
    recentSocieties: recentSocietiesResult.data ?? [],
  };
  } catch {
    return EMPTY_SUMMARY;
  }
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  icon: string;
  accent?: string;
  alert?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-5 flex flex-col justify-between transition-colors"
      style={{
        backgroundColor: "#1E1E1E",
        border: alert
          ? "1px solid rgba(245,158,11,0.4)"
          : "1px solid #333333",
        borderLeft: alert ? "4px solid #F59E0B" : undefined,
        minHeight: "128px",
      }}
    >
      <div className="flex justify-between items-start">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: alert ? "#F59E0B" : "#9CA3AF" }}
        >
          {label}
        </span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "22px",
            color: accent ?? "#9CA3AF",
            opacity: 0.6,
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div>
        <div
          className="font-bold"
          style={{ fontSize: "36px", lineHeight: 1, color: "#FFFFFF" }}
        >
          {value}
        </div>
        {sub && (
          <div className="mt-1.5" style={{ fontSize: "12px", color: "#9CA3AF" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
    >
      <div
        className="flex justify-between items-center px-6 py-4"
        style={{ borderBottom: "1px solid #333333" }}
      >
        <h3
          className="font-semibold"
          style={{ fontSize: "16px", color: "#FFFFFF" }}
        >
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function PlatformConsolePage() {
  const data = await fetchConsoleSummary();
  const pendingTotal = data.pendingApplications + data.unverifiedVendors;

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: "28px", color: "#FFFFFF" }}
          >
            System Overview
          </h1>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
            Real-time metrics across all ByelawsIndia societies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: "#1E1E1E",
              border: "1px solid #333333",
              color: "#FFFFFF",
            }}
            disabled
            title="Coming soon"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
              aria-hidden="true"
            >
              settings_suggest
            </span>
            Configure Workflows
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
            disabled
            title="Coming soon"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px" }}
              aria-hidden="true"
            >
              add_business
            </span>
            Register New Society
          </button>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Societies"
          value={data.societyCount.toLocaleString("en-IN")}
          icon="domain"
          accent="#10B981"
          sub={
            <span style={{ color: "#10B981" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "12px", verticalAlign: "middle" }}>
                trending_up
              </span>{" "}
              All registered societies
            </span>
          }
        />
        <StatCard
          label="Active Members"
          value={
            data.memberCount >= 1000
              ? `${(data.memberCount / 1000).toFixed(1)}k`
              : data.memberCount.toLocaleString("en-IN")
          }
          icon="group"
          accent="#60A5FA"
          sub={
            <span style={{ color: "#10B981" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "12px", verticalAlign: "middle" }}>
                trending_up
              </span>{" "}
              Across all societies
            </span>
          }
        />
        <StatCard
          label="Pending Approvals"
          value={pendingTotal.toLocaleString("en-IN")}
          icon="pending_actions"
          accent="#F59E0B"
          alert={pendingTotal > 0}
          sub={
            pendingTotal > 0 ? (
              <span>
                <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                  {data.pendingApplications}
                </span>{" "}
                applications &nbsp;
                <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                  {data.unverifiedVendors}
                </span>{" "}
                vendors
              </span>
            ) : (
              <span style={{ color: "#10B981" }}>All caught up</span>
            )
          }
        />
        <StatCard
          label="Active Contracts"
          value={data.contractCount.toLocaleString("en-IN")}
          icon="assignment"
          accent="#A78BFA"
          sub={
            <span>
              <span
                className="border-b border-dashed cursor-help"
                style={{ borderColor: "#9CA3AF" }}
                title="Contracts expiring within 30 days"
              >
                {data.expiry30} expiring soon
              </span>
            </span>
          }
        />
      </div>

      {/* Main grid: table + sidebar panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Society Registrations */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Recent Society Registrations"
            action={
              <Link
                href="/platform/societies"
                className="text-sm font-medium transition-colors"
                style={{ color: "#10B981" }}
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                title="Coming soon"
              >
                View All
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#161616",
                      borderBottom: "1px solid #333333",
                    }}
                  >
                    {["Society Name", "Reg Number", "Location", "Date", "Status", "Action"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3"
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "#9CA3AF",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.recentSocieties.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center"
                        style={{ color: "#9CA3AF", fontSize: "14px" }}
                      >
                        No societies registered yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentSocieties.map((s, idx) => (
                      <tr
                        key={s.id}
                        className="transition-colors hover:bg-[#242424]"
                        style={{
                          borderBottom:
                            idx < data.recentSocieties.length - 1
                              ? "1px solid #333333"
                              : undefined,
                        }}
                      >
                        <td className="px-4 py-3">
                          <span
                            className="font-medium"
                            style={{ fontSize: "14px", color: "#FFFFFF" }}
                          >
                            {s.name}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ fontSize: "13px", color: "#9CA3AF" }}
                        >
                          {s.registration_number}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ fontSize: "13px", color: "#9CA3AF" }}
                        >
                          {s.city}, {s.state}
                        </td>
                        <td
                          className="px-4 py-3"
                          style={{ fontSize: "13px", color: "#9CA3AF" }}
                        >
                          {formatDate(s.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={
                              s.is_active
                                ? {
                                    backgroundColor: "rgba(16,185,129,0.12)",
                                    color: "#10B981",
                                  }
                                : {
                                    backgroundColor: "rgba(245,158,11,0.12)",
                                    color: "#F59E0B",
                                  }
                            }
                          >
                            {s.is_active ? "Active" : "Pending Setup"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <form action={switchToSociety}>
                            <input type="hidden" name="societyId" value={s.id} />
                            <button
                              type="submit"
                              className="text-xs font-medium transition-colors hover:text-white"
                              style={{ color: "#10B981" }}
                              title={`Enter ${s.name} dashboard`}
                            >
                              View
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Right column: Contract Expiry + Admin Toolkit */}
        <div className="space-y-6">
          {/* Contract Expiry Alerts */}
          <SectionCard title="Contract Expiry Alerts">
            <div className="p-4 space-y-3">
              {[
                {
                  label: "Expiring within 30 days",
                  count: data.expiry30,
                  color: "#EF4444",
                  bg: "rgba(239,68,68,0.10)",
                },
                {
                  label: "31 to 60 days",
                  count: data.expiry60,
                  color: "#F59E0B",
                  bg: "rgba(245,158,11,0.10)",
                },
                {
                  label: "61 to 90 days",
                  count: data.expiry90,
                  color: "#60A5FA",
                  bg: "rgba(96,165,250,0.10)",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{ backgroundColor: row.bg, border: `1px solid ${row.color}22` }}
                >
                  <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
                    {row.label}
                  </span>
                  <span
                    className="font-bold"
                    style={{ fontSize: "20px", color: row.color }}
                  >
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Admin Toolkit */}
          <SectionCard title="Admin Toolkit">
            <div className="p-4 space-y-3">
              {[
                {
                  icon: "add_business",
                  label: "Register New Society",
                  sub: "Initialise base setup",
                  href: "/platform/societies/new",
                },
                {
                  icon: "storefront",
                  label: "Add Global Vendor",
                  sub: "Available to all societies",
                  href: "/platform/vendors/new",
                },
                {
                  icon: "settings_suggest",
                  label: "Configure Workflows",
                  sub: "Manage approval chains",
                  href: "/platform/settings/workflows",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-lg px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: "#161616",
                    border: "1px solid #333333",
                    cursor: "not-allowed",
                    opacity: 0.7,
                  }}
                  title="Coming soon"
                >
                  <span
                    className="material-symbols-outlined mt-0.5 shrink-0"
                    style={{ fontSize: "18px", color: "#10B981" }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p
                      className="font-medium"
                      style={{ fontSize: "13px", color: "#FFFFFF" }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
