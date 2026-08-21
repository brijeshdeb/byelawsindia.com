/**
 * AppShell — the primary application chrome.
 *
 * This is a server component. It:
 * 1. Resolves the UserContext from the cookie (validates against DB).
 * 2. Renders the Topbar and Sidebar with real user/context data.
 * 3. Wraps the page content in the main content area.
 *
 * Usage: wrap the (app)/layout.tsx children with this component after
 * the authentication check in that layout has confirmed a session exists.
 *
 * The shell is NOT used on auth pages (/login, /reset-password) or
 * on /select-context.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { resolveUserContext, CONTEXT_COOKIE } from "@/server/services/AccessService";
import { AppError } from "@/types";
import { safeJsonParse } from "@/lib/utils";
import { Sidebar, SidebarContents } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { DemoBanner } from "./DemoBanner";
import { createClient } from "@/lib/supabase/server";

interface ContextCookie {
  societyId: string;
  wingId: string | null;
}

interface Props {
  children: React.ReactNode;
}

export async function AppShell({ children }: Props) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONTEXT_COOKIE)?.value ?? null;
  const ctx = safeJsonParse<ContextCookie>(raw);

  if (!ctx?.societyId) {
    redirect("/select-context");
  }

  let userContext;
  try {
    userContext = await resolveUserContext(ctx.societyId, ctx.wingId ?? null);
  } catch (err) {
    if (err instanceof AppError) {
      redirect("/select-context?error=" + encodeURIComponent(err.code));
    }
    redirect("/select-context?error=unexpected");
  }

  const profile = userContext.profile;
  // Platform admins viewing a tenant context still identify as "Platform Admin"
  // in the topbar — their personal name is only relevant in the tenant role context.
  const userName = userContext.isPlatformAdmin
    ? "Platform Admin"
    : (profile.full_name ?? "");
  const userEmail = profile.email ?? "";
  const roleLabel = userContext.isPlatformAdmin
    ? "Super Admin"
    : (userContext.roleName ?? "Society Admin");
  const supabase=await createClient();
  const{count:unreadNotifications}=await supabase.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userContext.userId).is("read_at",null);

  return (
    <>
      {/*
       * MobileNavDrawer is a fixed overlay — position in the DOM does not
       * matter for layout. It renders only when open (returns null otherwise)
       * and listens for the "mobile-nav-toggle" CustomEvent from Topbar.
       * SidebarContents is RSC-rendered so permission data stays server-side.
       */}
      <MobileNavDrawer>
        <SidebarContents context={userContext} />
      </MobileNavDrawer>

      <div className="app-shell">
        {/* ── Topbar ── spans the full width (grid-column 1 / -1) */}
        <div className="app-topbar">
          <Topbar userName={userName} userEmail={userEmail} roleLabel={roleLabel} unreadNotifications={unreadNotifications??0} />
        </div>

        {/* ── Sidebar ── left column below the topbar (hidden on mobile via CSS) */}
        <div className="app-sidebar">
          <Sidebar context={userContext} />
        </div>

        {/* ── Main content area ── right column below the topbar */}
        <main
          id="main-content"
          className="app-main"
          tabIndex={-1}
          aria-label="Main content"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <DemoBanner environmentType={userContext.environmentType} />
          {children}
        </main>
      </div>
    </>
  );
}
