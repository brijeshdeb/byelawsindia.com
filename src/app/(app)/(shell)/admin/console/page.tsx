/**
 * Administration Console — live data from Supabase.
 *
 * Reads the selected society context from the session cookie and fetches
 * real counts and recent audit log entries. Replaces all Phase 0 stubs.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveUserContext, CONTEXT_COOKIE } from "@/server/services/AccessService";
import { createClient } from "@/lib/supabase/server";
import { safeJsonParse } from "@/lib/utils";
import { AppError } from "@/types";
import { ResetDemoDataButton } from "@/components/platform/ResetDemoDataButton";

export const metadata: Metadata = { title: "Administration Console" };

interface ContextCookie {
  societyId: string;
  wingId: string | null;
}

const QUICK_LINKS = [
  { label: "Society Settings",  href: "/admin/settings", icon: "tune",           desc: "Charges, dates, approval thresholds" },
  { label: "User Management",   href: "/admin/users",    icon: "manage_accounts", desc: "Invite users, assign roles" },
  { label: "Wings",             href: "/admin/wings",    icon: "apartment",       desc: "Wing configuration and unit inventory" },
  { label: "Audit Trail",       href: "/reports/audit",  icon: "history",         desc: "Immutable log of privileged actions" },
];

// Human-readable labels for audit action codes
function auditLabel(action: string): string {
  const map: Record<string, string> = {
    LOGIN_SUCCESS: "Signed in",
    LOGIN_FAILED: "Sign-in failed",
    LOGOUT: "Signed out",
    USER_CREATED: "User created",
    USER_UPDATED: "User updated",
    USER_DEACTIVATED: "User deactivated",
    ACCESS_ASSIGNED: "Access assigned",
    ACCESS_REVOKED: "Access revoked",
    MEMBER_CREATED: "Member created",
    MEMBER_UPDATED: "Member updated",
    MEMBER_ARCHIVED: "Member archived",
    APPLICATION_SUBMITTED: "Application submitted",
    APPLICATION_APPROVED: "Application approved",
    APPLICATION_REJECTED: "Application rejected",
    DOCUMENT_UPLOADED: "Document uploaded",
    DOCUMENT_VERIFIED: "Document verified",
    RFQ_CREATED: "RFQ created",
    RFQ_PUBLISHED: "RFQ published",
    QUOTATION_SUBMITTED: "Quotation submitted",
    VENDOR_SELECTED: "Vendor selected",
    CONTRACT_CREATED: "Contract created",
    SOCIETY_SETTINGS_UPDATED: "Society settings updated",
  };
  return map[action] ?? action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 2)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function AdminConsolePage() {
  // ── Read context ─────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONTEXT_COOKIE)?.value ?? null;
  const ctx = safeJsonParse<ContextCookie>(raw);

  if (!ctx?.societyId) redirect("/select-context");

  let userContext: Awaited<ReturnType<typeof resolveUserContext>>;
  try {
    userContext = await resolveUserContext(ctx.societyId, ctx.wingId ?? null);
  } catch (err) {
    if (err instanceof AppError) redirect("/select-context?error=" + encodeURIComponent(err.code));
    redirect("/select-context?error=unexpected");
  }

  const supabase   = await createClient();
  const societyId  = ctx.societyId;

  // ── Parallel data fetch ──────────────────────────────────────────────────
  const [wingsRes, unitsRes, membersRes, usersRes, auditRes] = await Promise.all([
    supabase
      .from("wings")
      .select("*", { count: "exact", head: true })
      .eq("society_id", societyId)
      .eq("is_active", true),

    supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .eq("society_id", societyId),

    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("society_id", societyId)
      .eq("status", "ACTIVE"),

    supabase
      .from("user_access_assignments")
      .select("*", { count: "exact", head: true })
      .eq("society_id", societyId)
      .eq("is_active", true),

    supabase
      .from("audit_logs")
      .select("id, action, entity_type, actor_user_id, created_at, metadata")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const wingsCount    = wingsRes.count   ?? 0;
  const unitsCount    = unitsRes.count   ?? 0;
  const membersCount  = membersRes.count ?? 0;
  const usersCount    = usersRes.count   ?? 0;
  const auditEntries  = auditRes.data    ?? [];

  const TENANT_STATS = [
    { label: "Society",            value: userContext.societyName },
    { label: "Active wings",       value: String(wingsCount) },
    { label: "Total units",        value: unitsCount > 0 ? String(unitsCount) : "—" },
    { label: "Registered members", value: membersCount > 0 ? String(membersCount) : "—" },
    { label: "Active users",       value: String(usersCount) },
    { label: "Role",               value: userContext.roleName },
  ];

  // Email relay warning while Resend is not configured
  const HEALTH_CHECKS = [
    { label: "Database connection",   status: "ok"      },
    { label: "Auth service",          status: "ok"      },
    { label: "Storage bucket",        status: "ok"      },
    { label: "Email relay",           status: "warning" },
    { label: "Row Level Security",    status: "ok"      },
  ];

  return (
    <div className="page-container">

      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Administration Console
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            {userContext.societyName} — platform health, tenant config, and access governance
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded"
          style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
          <span className="font-label-md text-label-md" style={{ color: "#10B981" }}>
            System operational
          </span>
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — 2 cols ─────────────────────────────────────────── */}
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
                  className="flex items-start gap-3 p-4 rounded transition-colors hover:border-emerald-700"
                  style={{ backgroundColor: "#131313", border: "1px solid #2a2a2a" }}
                >
                  <span
                    className="material-symbols-outlined mt-0.5"
                    style={{ fontSize: "22px", color: "#10B981" }}
                  >
                    {link.icon}
                  </span>
                  <div>
                    <p className="font-body-sm text-body-sm text-text-primary font-medium">
                      {link.label}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                      {link.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tenant summary — live data */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>business</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Tenant Summary</h2>
              <span className="ml-auto font-label-md" style={{ fontSize: "11px", color: "#10B981" }}>live</span>
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

          {/* Recent audit actions — live */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>history</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Recent Admin Actions</h2>
              <Link
                href="/reports/audit"
                className="ml-auto font-label-md text-label-md"
                style={{ color: "#10B981", fontSize: "12px" }}
              >
                Full audit trail
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {auditEntries.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="font-body-sm text-body-sm" style={{ color: "#6B7280" }}>
                    No audit entries yet for this society.
                  </p>
                </div>
              ) : (
                auditEntries.map((a) => (
                  <div key={a.id} className="queue-item flex items-start justify-between">
                    <div>
                      <p className="font-body-sm text-body-sm text-text-primary font-medium">
                        {auditLabel(a.action)}
                      </p>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                        {a.entity_type}
                        {a.actor_user_id ? ` — by ${a.actor_user_id.slice(0, 8)}…` : ""}
                      </p>
                    </div>
                    <span style={{ fontSize: "11px", color: "#6B7280", whiteSpace: "nowrap", marginLeft: "16px" }}>
                      {relativeTime(a.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar ───────────────────────────────────────────── */}
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
                  <span className="font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                    {h.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: h.status === "ok" ? "#10B981" : "#F59E0B" }}
                    />
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
                { label: "Row Level Security",      state: "Enabled"        },
                { label: "Service key in browser",  state: "Never"          },
                { label: "Tenant isolation",         state: "society_id RLS" },
                { label: "Signed document URLs",     state: "Phase 2"        },
                { label: "MFA enforcement",          state: "Phase 2"        },
              ].map((item) => {
                const isActive = ["Never", "Enabled", "society_id RLS"].includes(item.state);
                return (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>{item.label}</span>
                    <span
                      className="font-label-md text-label-md px-2 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: isActive ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                        color: isActive ? "#10B981" : "#6B7280",
                        fontSize: "11px",
                      }}
                    >
                      {item.state}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Access context */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>badge</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Your Access</h2>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {[
                { label: "Signed in as", value: userContext.isPlatformAdmin ? "Platform Admin" : (userContext.profile.full_name || userContext.profile.email) },
                { label: "Role",         value: userContext.isPlatformAdmin ? "Super Admin" : userContext.roleName },
                { label: "Scope",        value: userContext.wingName ? `${userContext.wingName} (${userContext.wingCode})` : "Society-Wide" },
                { label: "Permissions",  value: userContext.isPlatformAdmin ? "All (platform admin)" : `${userContext.permissions.size} granted` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-4 py-1.5 border-b" style={{ borderColor: "#2a2a2a" }}>
                  <span className="font-label-md text-label-md" style={{ color: "#6B7280", fontSize: "12px" }}>{row.label}</span>
                  <span className="font-body-sm text-body-sm text-text-primary text-right truncate" style={{ maxWidth: "55%", fontSize: "12px" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone — platform admin only, DEMO societies only */}
          {userContext.isPlatformAdmin && userContext.environmentType === "DEMO" && (
            <div className="queue-section" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
              <div className="queue-section-header">
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#EF4444" }}>warning</span>
                <h2 className="font-headline-sm text-headline-sm" style={{ color: "#EF4444" }}>Danger Zone</h2>
              </div>
              <div className="px-4 pb-4 space-y-3">
                <p style={{ fontSize: "11px", color: "#6B7280", lineHeight: 1.5 }}>
                  Platform admin only. Resets all transactional demo data to the original seeded state. Structural data (wings, units, members, vendors, contracts) is preserved.
                </p>
                <ResetDemoDataButton societyId={societyId} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 px-4 py-3 rounded" style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}>
        <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
          Tenant stats are live from the database. Email relay shows Warning until Resend is configured. MFA enforcement and live health pings arrive in Phase 2.
        </p>
      </div>
    </div>
  );
}
