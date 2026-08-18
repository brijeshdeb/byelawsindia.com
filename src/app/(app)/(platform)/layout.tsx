/**
 * Platform admin layout.
 *
 * Sits inside (app)/ which already validates an active Supabase session.
 * This layout adds a second server-side check: is_platform_admin must be
 * true in the profiles table.
 *
 * Security properties:
 *   - is_platform_admin is read from the DB on every request, not from a
 *     cookie or any client-supplied value.
 *   - The layout renders its own shell (sidebar + topbar + main area),
 *     completely independent of the tenant AppShell.
 *   - No society context cookie is required or trusted here.
 *   - Service-role queries (createAdminClient) are only done in page.tsx,
 *     after this layout has confirmed the admin flag.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PlatformSidebarNav } from "@/components/layout/PlatformSidebarNav";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { Topbar } from "@/components/layout/Topbar";
import Image from "next/image";
import Link from "next/link";

/**
 * PlatformSidebarContents — inner sidebar markup shared by the desktop aside
 * and the mobile nav drawer. Keeps the two in sync without duplication.
 */
function PlatformSidebarContents() {
  return (
    <>
      {/* Brand + platform identity */}
      <div
        className="px-6 pt-5 pb-4 shrink-0"
        style={{ borderBottom: "1px solid #333333" }}
      >
        <Link
          href="/platform/console"
          className="flex items-center mb-4"
          aria-label="ByelawsIndia Admin Portal"
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

        {/* Platform identity badge */}
        <div
          className="rounded px-3 py-2.5"
          style={{
            backgroundColor: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderLeftWidth: "3px",
            borderLeftColor: "#10B981",
          }}
        >
          <p
            className="font-medium text-sm leading-snug"
            style={{ color: "#FFFFFF" }}
          >
            Admin Portal
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            Super Admin / System Owner
          </p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <PlatformSidebarNav />
      </div>

      {/* Footer: switch to a society view */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid #333333" }}
      >
        <Link
          href="/platform/select-society"
          className="flex items-center gap-2 text-xs transition-colors py-1"
          style={{ color: "rgba(156,163,175,0.7)" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "14px" }}
            aria-hidden="true"
          >
            swap_horiz
          </span>
          Switch to Society View
        </Link>
      </div>
    </>
  );
}

export const metadata = {
  title: "Platform Console | ByelawsIndia",
};

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.is_platform_admin) {
    // Regular users are redirected to the tenant dashboard.
    redirect("/dashboard");
  }

  return (
    <>
      {/*
       * MobileNavDrawer is a fixed overlay — its position in the DOM does not
       * affect the grid. Opens via the "mobile-nav-toggle" CustomEvent from Topbar.
       */}
      <MobileNavDrawer>
        <PlatformSidebarContents />
      </MobileNavDrawer>

      <div className="app-shell">
        {/* Topbar spans the full width (grid-column 1 / -1 via .app-topbar) */}
        <div className="app-topbar">
          <Topbar userName="Platform Admin" userEmail={user.email} roleLabel="Super Admin" />
        </div>

        {/* Platform-specific sidebar — hidden on mobile via CSS */}
        <aside
          className="app-sidebar flex flex-col"
          style={{
            backgroundColor: "#131313",
            borderRight: "1px solid #333333",
          }}
          aria-label="Platform administration navigation"
        >
          <PlatformSidebarContents />
        </aside>

        {/* Main content area */}
        <main
          id="main-content"
          className="app-main"
          tabIndex={-1}
          aria-label="Platform main content"
        >
          {children}
        </main>
      </div>
    </>
  );
}
