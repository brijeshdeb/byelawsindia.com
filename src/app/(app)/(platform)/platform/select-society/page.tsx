/**
 * Platform admin: society picker.
 *
 * Lists every society in the platform and lets the platform admin "enter"
 * one as the active tenant context. On selection the existing switchToSociety
 * Server Action sets the chs_selected_context cookie and redirects to /dashboard.
 *
 * Security:
 *   - The enclosing (platform)/layout.tsx already requires is_platform_admin.
 *   - createAdminClient() is used to read all societies, bypassing RLS.
 *     This is valid here: the platform admin is explicitly entitled to see
 *     all societies. Regular society members never reach this page.
 *   - switchToSociety re-validates is_platform_admin server-side before
 *     writing the context cookie, so there is no trust gap between the
 *     picker and the action.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { switchToSociety } from "../console/actions";

export const metadata: Metadata = {
  title: "Select Society | ByelawsIndia Admin",
};

type Society = {
  id: string;
  name: string;
  registration_number: string;
  city: string;
  state: string;
  is_active: boolean;
};

async function fetchSocieties(): Promise<Society[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("societies")
      .select("id, name, registration_number, city, state, is_active")
      .order("name", { ascending: true });
    if (error) return [];
    return (data as Society[]) ?? [];
  } catch {
    return [];
  }
}

export default async function SelectSocietyPage() {
  const societies = await fetchSocieties();

  return (
    <div
      style={{
        padding: "32px 40px",
        maxWidth: "860px",
        minHeight: "100%",
      }}
    >
      {/* Back link */}
      <Link
        href="/platform/console"
        className="inline-flex items-center gap-1.5 mb-8 text-xs transition-colors hover:opacity-100"
        style={{ color: "rgba(156,163,175,0.6)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "15px" }}
          aria-hidden="true"
        >
          arrow_back
        </span>
        Back to Console
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-semibold mb-1.5"
          style={{ color: "#FFFFFF", fontSize: "20px" }}
        >
          Switch to Society View
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "13px", lineHeight: "1.5" }}>
          Select a society to enter its tenant dashboard. You can return to the
          platform console at any time from the sidebar.
        </p>
      </div>

      {/* Content */}
      {societies.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p
            className="mb-4 text-xs font-medium uppercase tracking-wider"
            style={{ color: "rgba(156,163,175,0.5)" }}
          >
            {societies.length} {societies.length === 1 ? "Society" : "Societies"}
          </p>
          <ul
            style={{ listStyle: "none", padding: 0, margin: 0 }}
            className="space-y-2"
          >
            {societies.map((s) => (
              <li key={s.id}>
                <SocietyCard society={s} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function SocietyCard({ society: s }: { society: Society }) {
  const initials = s.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex items-center gap-4 rounded-lg transition-colors hover:border-[rgba(16,185,129,0.35)]"
      style={{
        backgroundColor: "#1A1A1A",
        border: "1px solid #2A2A2A",
        padding: "14px 18px",
      }}
    >
      {/* Avatar */}
      <div
        className="shrink-0 flex items-center justify-center rounded-lg font-semibold text-sm"
        style={{
          width: "40px",
          height: "40px",
          backgroundColor: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.2)",
          color: "#10B981",
        }}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium truncate"
          style={{ color: "#FFFFFF", fontSize: "14px" }}
        >
          {s.name}
        </p>
        <p
          className="text-xs mt-0.5 truncate"
          style={{ color: "#9CA3AF" }}
        >
          {s.registration_number}
          <span
            className="mx-1.5"
            style={{ color: "#333333" }}
            aria-hidden="true"
          >
            |
          </span>
          {s.city}, {s.state}
          {!s.is_active && (
            <span
              className="ml-2 font-medium"
              style={{ color: "#F59E0B", fontSize: "10px", letterSpacing: "0.04em" }}
            >
              INACTIVE
            </span>
          )}
        </p>
      </div>

      {/* Enter form */}
      <form action={switchToSociety} className="shrink-0">
        <input type="hidden" name="societyId" value={s.id} />
        <button
          type="submit"
          className="text-xs font-medium transition-colors rounded-md"
          style={{
            backgroundColor: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            color: "#10B981",
            padding: "5px 14px",
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg text-center"
      style={{
        border: "1px dashed #2A2A2A",
        padding: "56px 32px",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "rgba(156,163,175,0.06)",
          border: "1px solid #2A2A2A",
        }}
        aria-hidden="true"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "22px", color: "rgba(156,163,175,0.4)" }}
        >
          domain
        </span>
      </div>
      <p
        className="font-medium mb-1"
        style={{ color: "#FFFFFF", fontSize: "14px" }}
      >
        No societies yet
      </p>
      <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
        Societies will appear here once they are registered on the platform.
      </p>
    </div>
  );
}
