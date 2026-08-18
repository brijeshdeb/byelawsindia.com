/**
 * Sidebar — server component.
 *
 * Stitch Obsidian design:
 * - Background: #131313 (surface — same tone as topbar)
 * - Border: #333333 (border-subtle)
 * - Society identity block: left border in emerald #10B981
 * - Logo + wordmark at top
 *
 * SidebarContents is exported separately so AppShell can pass it as children
 * to MobileNavDrawer without duplicating markup. The <aside> wrapper is only
 * rendered in the desktop grid; the drawer gets the raw contents.
 */
import Image from "next/image";
import Link from "next/link";
import type { UserContext } from "@/types";
import { SidebarNav } from "./SidebarNav";

interface Props {
  context: UserContext;
}

/**
 * SidebarContents — the inner markup shared by the desktop sidebar and the
 * mobile nav drawer. No <aside> or grid-positioning wrapper here.
 */
export function SidebarContents({ context }: Props) {
  return (
    <>
      {/* Brand + society identity */}
      <div className="px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #333333" }}>

        {/* Logo mark */}
        <Link
          href="/dashboard"
          className="flex items-center mb-5"
          aria-label="Byelawsindia: go to dashboard"
        >
          <Image
            src="/logo.png"
            alt="ByelawsIndia"
            width={160}
            height={107}
            className="shrink-0"
            style={{ maxWidth: "148px", height: "auto" }}
            priority
          />
        </Link>

        {/* Society identity — legal name, wing, role */}
        <div
          className="rounded px-3 py-2.5"
          style={{
            backgroundColor: "rgba(16,185,129,0.05)",
            borderLeft: "3px solid #10B981",
            border: "1px solid rgba(16,185,129,0.15)",
            borderLeftWidth: "3px",
          }}
        >
          <div className="flex items-center gap-2">
            <p
              className="font-medium leading-snug truncate"
              style={{ fontSize: "14px", color: "#FFFFFF" }}
              title={context.societyName}
            >
              {context.societyName}
            </p>
            {context.environmentType === "DEMO" && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#D97706",
                  backgroundColor: "rgba(217,119,6,0.15)",
                  border: "1px solid rgba(217,119,6,0.35)",
                  borderRadius: "3px",
                  padding: "1px 5px",
                  flexShrink: 0,
                }}
              >
                DEMO
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "#9CA3AF" }}>
            {context.wingName
              ? `${context.wingName} (${context.wingCode})`
              : "Society-Wide"}
          </p>
          <p className="text-xs mt-1.5" style={{ color: "rgba(156,163,175,0.7)" }}>
            {context.isPlatformAdmin ? "Platform Admin" : context.roleName}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <SidebarNav context={context} />
      </div>

      {/* Footer: switch context */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid #333333" }}>
        <Link
          href="/select-context"
          className="flex items-center gap-2 text-xs transition-colors py-1 text-[rgba(156,163,175,0.7)] hover:text-[#10B981]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }} aria-hidden="true">
            swap_horiz
          </span>
          Switch context
        </Link>
      </div>
    </>
  );
}

/** Desktop sidebar — wraps SidebarContents in the grid-positioned <aside>. */
export function Sidebar({ context }: Props) {
  return (
    <aside
      className="app-sidebar flex flex-col"
      style={{ backgroundColor: "#131313", borderRight: "1px solid #333333" }}
      aria-label="Application sidebar"
    >
      <SidebarContents context={context} />
    </aside>
  );
}
