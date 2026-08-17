/**
 * Context selector.
 *
 * Shown after login when a user has multiple access assignments
 * (e.g. they manage both Wing A and Wing B of a society, or they
 * belong to two different societies).
 *
 * If the user has exactly one assignment, we redirect them straight
 * to the dashboard — no friction.
 *
 * Design: card grid. Each card shows:
 *   - Society name
 *   - Wing name (or "Society-Wide Access")
 *   - Role name
 *   - A right-chevron to signal it's a clickable destination
 */
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAccessOptions } from "@/server/services/AccessService";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Select Context",
};

export default async function SelectContextPage() {
  // Check raw Supabase auth first so we can distinguish "not logged in" from
  // "logged in but profile row is missing." The second case must not redirect
  // to /login — that creates an infinite loop.
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const [user, options] = await Promise.all([
    getCurrentUser(),
    getAccessOptions(),
  ]);

  // Profile row is missing. Show a clear message instead of looping to login.
  if (!user) {
    return <ProfileMissing email={authUser.email ?? authUser.id} />;
  }

  // Platform admins don't need a society context — take them straight to the console.
  if (user.is_platform_admin) redirect("/platform/console");

  // No assignments — show a blocking message (not a redirect loop)
  if (options.length === 0) {
    return <NoAccess name={user.full_name ?? user.email ?? "User"} />;
  }

  // Single assignment — hand off to the Route Handler which can set cookies.
  // Server Components cannot call cookieStore.set(); the Route Handler can.
  if (options.length === 1) {
    const o = options[0]!;
    const qs = `societyId=${o.societyId}${o.wingId ? `&wingId=${encodeURIComponent(o.wingId)}` : ""}`;
    redirect(`/api/auth/select-context?${qs}`);
  }

  return (
    <div className="min-h-dvh bg-chs-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Brand mark */}
        <div className="mb-10">
          <Image
            src="/logo.png"
            alt="ByelawsIndia"
            width={140}
            height={93}
            style={{ height: "auto" }}
            priority
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-chs-text-secondary text-sm mb-1">
            Welcome back,{" "}
            <span className="font-medium text-chs-text">
              {user.full_name ?? user.email}
            </span>
          </p>
          <h1 className="text-2xl font-semibold text-chs-navy">
            Select your access context
          </h1>
          <p className="text-sm text-chs-text-secondary mt-1">
            You have access to multiple areas. Choose which one to open.
          </p>
        </div>

        {/* Context cards */}
        <ul className="space-y-3" role="list">
          {options.map((o) => (
            <li key={o.assignmentId}>
              <ContextCard option={o} />
            </li>
          ))}
        </ul>

        {/* Sign out link */}
        <div className="mt-10 text-center">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-chs-text-secondary hover:text-chs-text underline underline-offset-2"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

interface AccessOption {
  assignmentId: string;
  societyId: string;
  societyName: string;
  societyLogoUrl: string | null;
  wingId: string | null;
  wingName: string | null;
  wingCode: string | null;
  roleId: string;
  roleName: string;
}

function ContextCard({ option: o }: { option: AccessOption }) {
  const href = `/api/auth/select-context?societyId=${o.societyId}${o.wingId ? `&wingId=${o.wingId}` : ""}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 w-full bg-white border border-chs-border rounded p-4 hover:border-chs-navy hover:shadow-sm transition-all duration-150 text-left"
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded flex items-center justify-center text-white font-semibold text-sm shrink-0"
        style={{ backgroundColor: "#17324D" }}
        aria-hidden="true"
      >
        {getInitials(o.societyName)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-chs-text truncate">{o.societyName}</p>
        <p className="text-sm text-chs-text-secondary truncate">
          {o.wingName ? `${o.wingName} (${o.wingCode})` : "Society-Wide Access"}
          <span className="mx-1.5 text-chs-border" aria-hidden="true">
            |
          </span>
          {o.roleName}
        </p>
      </div>

      {/* Chevron */}
      <svg
        className="w-4 h-4 text-chs-border group-hover:text-chs-navy transition-colors shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function ProfileMissing({ email }: { email: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-12" style={{ backgroundColor: "#121212" }}>
      <div className="w-full max-w-sm text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "#EF4444" }}>
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: "#FFFFFF" }}>
          Account setup incomplete
        </h1>
        <p className="text-sm mb-2" style={{ color: "#9CA3AF" }}>
          Signed in as <span style={{ color: "#FFFFFF" }}>{email}</span>, but no profile record was found.
        </p>
        <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>
          Contact your platform administrator to complete account setup.
        </p>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-sm underline underline-offset-2" style={{ color: "#10B981" }}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function NoAccess({ name }: { name: string }) {
  return (
    <div className="min-h-dvh bg-chs-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#FEF3C7" }}
        >
          <svg
            className="w-6 h-6 text-amber-600"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-chs-navy mb-2">
          No access assigned
        </h1>
        <p className="text-sm text-chs-text-secondary mb-6">
          {name}, your account does not have any active access assignments.
          Contact your society administrator.
        </p>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm text-chs-navy underline underline-offset-2 hover:text-chs-slate"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
