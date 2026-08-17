/**
 * Dashboard — Stitch Obsidian design.
 *
 * Typography uses the Obsidian type scale via Tailwind class pairs:
 *   font-{name} text-{name}  (e.g. font-headline-sm text-headline-sm)
 *
 * Layout: summary strip + work queue + upcoming + access context.
 * Metric values are placeholders until Phase 2 data queries land.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { resolveUserContext, CONTEXT_COOKIE } from "@/server/services/AccessService";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/types";
import { safeJsonParse } from "@/lib/utils";
import { PERMISSIONS } from "@/types";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/auth";
import type { UserContext } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface ContextCookie {
  societyId: string;
  wingId: string | null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONTEXT_COOKIE)?.value ?? null;
  const ctx = safeJsonParse<ContextCookie>(raw);

  if (!ctx?.societyId) {
    // Platform admins don't use society context — send them straight to the console.
    const currentUser = await getCurrentUser();
    if (currentUser?.is_platform_admin) {
      redirect("/platform/console");
    }
    redirect("/select-context");
  }

  let userContext: UserContext;
  try {
    userContext = await resolveUserContext(ctx.societyId, ctx.wingId ?? null);
  } catch (err) {
    if (err instanceof AppError) {
      redirect("/select-context?error=" + encodeURIComponent(err.code));
    }
    redirect("/select-context?error=unexpected");
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const canViewApplications = userContext.isPlatformAdmin ||
    hasAnyPermission(userContext, [
      PERMISSIONS.APPLICATION_VIEW,
      PERMISSIONS.APPLICATION_CREATE,
      PERMISSIONS.APPLICATION_APPROVE_LEVEL1,
      PERMISSIONS.APPLICATION_APPROVE_LEVEL2,
      PERMISSIONS.APPLICATION_APPROVE_FINAL,
    ]);

  const canViewMembers = userContext.isPlatformAdmin ||
    hasAnyPermission(userContext, [PERMISSIONS.MEMBER_VIEW, PERMISSIONS.MEMBER_CREATE]);

  const canViewFinance = userContext.isPlatformAdmin ||
    hasPermission(userContext, PERMISSIONS.FINANCE_VIEW);

  const canViewMaintenance = userContext.isPlatformAdmin ||
    hasPermission(userContext, PERMISSIONS.MAINTENANCE_VIEW);

  // Live summary counts — parallel queries, each falls back to 0 on RLS miss.
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [membersRes, openAppsRes, overdueAppsRes, complaintsRes, duesRes] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .eq("status", "ACTIVE"),
    supabase
      .from("member_applications")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["SUBMITTED", "UNDER_REVIEW"]),
    supabase
      .from("member_applications")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["SUBMITTED", "UNDER_REVIEW"])
      .lt("submitted_at", sevenDaysAgo),
    supabase
      .from("maintenance_complaints")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["OPEN", "IN_PROGRESS"]),
    supabase
      .from("finance_dues")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["UNPAID", "PARTIALLY_PAID"]),
  ]);

  const memberCount  = membersRes.count    ?? 0;
  const openApps     = openAppsRes.count   ?? 0;
  const overdueApps  = overdueAppsRes.count ?? 0;
  const openCmps     = complaintsRes.count  ?? 0;
  const unpaidDues   = duesRes.count        ?? 0;

  return (
    <div className="page-container">

      {/* Page header — flat, no card */}
      <div className="page-header">
        <div>
          {/* headline-lg-mobile on mobile, headline-lg on desktop — Obsidian type scale */}
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            {userContext.societyName}
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            {userContext.wingName
              ? `${userContext.wingName} (${userContext.wingCode}) | ${userContext.roleName}`
              : `Society-Wide | ${userContext.roleName}`}
          </p>
        </div>
        {/* label-md for small metadata text */}
        <p
          className="font-label-md text-label-md hidden sm:block"
          style={{ color: "#6B7280" }}
        >
          {today}
        </p>
      </div>

      {/* Summary strip — one continuous bar, not four equal cards */}
      <div className="summary-strip mb-6">
        <SummaryItem
          value={String(memberCount)}
          label="Members registered"
          href={canViewMembers ? "/members" : undefined}
        />
        <SummaryItem
          value={String(openApps)}
          label="Applications open"
          flag={overdueApps > 0 ? `${overdueApps} overdue` : "0 overdue"}
          flagVariant={overdueApps > 0 ? "warning" : "neutral"}
          href={canViewApplications ? "/applications" : undefined}
        />
        <SummaryItem
          value={String(openCmps)}
          label="Maintenance requests"
          href={canViewMaintenance ? "/maintenance/complaints" : undefined}
        />
        <SummaryItem
          value={String(unpaidDues)}
          label="Dues outstanding"
          href={canViewFinance ? "/finance/dues" : undefined}
        />
      </div>

      {/* Main content: work queue + upcoming, side by side at lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Work queue — items needing the user's action */}
        <div className="lg:col-span-2 queue-section">
          <div className="queue-section-header">
            {/* headline-sm (20px/28px/600) matches Obsidian section heading */}
            <p className="font-headline-sm text-headline-sm text-text-primary">
              Awaiting your action
            </p>
            <span className="font-label-md text-label-md" style={{ color: "#6B7280" }}>
              Phase 0: sample data
            </span>
          </div>

          <Phase0QueueItem
            id="APP-2024-018"
            title="NOC: Sale of flat 4B, Wing A"
            meta="Submitted by Ramesh Iyer · Pending Level 2 approval"
            age="3 days"
            overdue={false}
          />
          <Phase0QueueItem
            id="APP-2024-017"
            title="Sub-let permission, Flat 7C"
            meta="Submitted by Priya Menon · Pending Secretary sign-off"
            age="7 days"
            overdue={true}
          />
          <Phase0QueueItem
            id="RFQ-2024-004"
            title="Terrace waterproofing: evaluate quotations"
            meta="3 vendor quotes received · Closes 20 Aug 2024"
            age="1 day"
            overdue={false}
          />
          <Phase0QueueItem
            id="DOC-2024-031"
            title="Society audit report 2023–24, pending verification"
            meta="Uploaded by Treasurer · Awaiting Committee sign-off"
            age="12 days"
            overdue={true}
          />

          {/* Phase 0 notice — dark surface, NOT bg-white */}
          <div
            className="px-6 py-3"
            style={{ backgroundColor: "#1c1b1b", borderTop: "1px solid #333333" }}
          >
            <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
              Live queue arrives in Phase 2. Items above are illustrative.
            </p>
          </div>
        </div>

        {/* Right column: upcoming + access context */}
        <div className="space-y-6">

          {/* Upcoming statutory / workflow obligations */}
          <div className="queue-section">
            <div className="queue-section-header">
              <p className="font-headline-sm text-headline-sm text-text-primary">Upcoming</p>
            </div>
            <UpcomingItem date="20 Aug" label="RFQ-2024-004 quotation deadline" />
            <UpcomingItem date="31 Aug" label="Quarterly maintenance due notices" />
            <UpcomingItem date="15 Sep" label="AGM notice period opens" />
            <UpcomingItem date="30 Sep" label="Audit submission, statutory" critical />
            <div className="px-4 py-3">
              <p className="font-label-md text-label-md italic" style={{ color: "#6B7280" }}>
                Phase 0: illustrative
              </p>
            </div>
          </div>

          {/* Access context card */}
          <div className="queue-section">
            <div className="queue-section-header">
              <p className="font-headline-sm text-headline-sm text-text-primary">Your access</p>
            </div>
            <div className="px-4 py-3">
              <dl className="space-y-2">
                <ContextRow
                  label="Signed in as"
                  value={userContext.profile.full_name ?? userContext.profile.email ?? "—"}
                />
                <ContextRow label="Society" value={userContext.societyName} />
                <ContextRow
                  label="Wing"
                  value={userContext.wingName
                    ? `${userContext.wingName} (${userContext.wingCode})`
                    : "Society-Wide"}
                />
                <ContextRow label="Role" value={userContext.roleName} />
                <ContextRow label="Permissions" value={`${userContext.permissions.size} granted`} />
              </dl>
            </div>
          </div>

        </div>
      </div>

      {/* Footer note */}
      <p
        className="font-body-sm text-body-sm pt-4"
        style={{ color: "#6B7280", borderTop: "1px solid #333333" }}
      >
        Summary counts are live from the database. Work queue and statutory deadline tracking arrive in Phase 2.
      </p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SummaryItem({
  value,
  label,
  flag,
  flagVariant = "neutral",
  href,
}: {
  value: string;
  label: string;
  flag?: string;
  flagVariant?: "neutral" | "warning" | "danger";
  href?: string;
}) {
  const flagColor =
    flagVariant === "danger"
      ? "#EF4444"
      : flagVariant === "warning"
        ? "#F59E0B"
        : "#6B7280";

  const content = (
    <div className="summary-strip-item">
      <div className="summary-strip-value">
        {value}
        {flag && (
          <span
            className="summary-strip-flag font-label-md"
            style={{ color: flagColor }}
          >
            {flag}
          </span>
        )}
      </div>
      {/* label-md: 12px/16px/600/0.05em tracking — matches Obsidian card label style */}
      <p className="font-label-md text-label-md" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
    </div>
  );

  if (href) {
    // Hover handled by .summary-strip-item:hover in globals.css
    return (
      <Link
        href={href}
        className="block"
        style={{
          flex: 1,
          borderRight: "1px solid #333333",
          textDecoration: "none",
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
}

function Phase0QueueItem({
  id,
  title,
  meta,
  age,
  overdue,
}: {
  id: string;
  title: string;
  meta: string;
  age: string;
  overdue: boolean;
}) {
  return (
    <div className="queue-item">
      {/* Monospace ref ID — body-sm size */}
      <span className="queue-item-id font-mono">{id}</span>
      <div className="queue-item-body">
        <p className="queue-item-title">{title}</p>
        <p className="queue-item-meta font-body-sm">{meta}</p>
      </div>
      <span className={`queue-item-age${overdue ? " overdue" : ""}`}>
        {overdue ? `${age} ⚑` : age}
      </span>
    </div>
  );
}

function UpcomingItem({
  date,
  label,
  critical = false,
}: {
  date: string;
  label: string;
  critical?: boolean;
}) {
  return (
    <div className="queue-item items-center">
      <span
        className="font-label-md text-label-md shrink-0 w-14 text-right"
        style={{ color: critical ? "#EF4444" : "#9CA3AF" }}
      >
        {date}
      </span>
      <p
        className="font-body-sm text-body-sm"
        style={{ color: critical ? "#EF4444" : "#e5e2e1" }}
      >
        {label}
      </p>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border-subtle last:border-b-0">
      {/* label-md for the key */}
      <dt className="font-label-md text-label-md shrink-0" style={{ color: "#6B7280" }}>
        {label}
      </dt>
      {/* body-sm for the value */}
      <dd
        className="font-body-sm text-body-sm font-medium text-right truncate"
        style={{ maxWidth: "55%", color: "#FFFFFF" }}
      >
        {value}
      </dd>
    </div>
  );
}
