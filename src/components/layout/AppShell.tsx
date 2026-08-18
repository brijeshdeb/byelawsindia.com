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
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

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
  const userName = profile.full_name ?? "";
  const userEmail = profile.email ?? "";
  const roleLabel = userContext.roleName ?? "Society Admin";

  return (
    <div className="app-shell">
      {/* ── Topbar ── spans the full width (grid-column 1 / -1) */}
      <div className="app-topbar">
        <Topbar userName={userName} userEmail={userEmail} roleLabel={roleLabel} />
      </div>

      {/* ── Sidebar ── left column below the topbar */}
      <div className="app-sidebar">
        <Sidebar context={userContext} />
      </div>

      {/* ── Main content area ── right column below the topbar */}
      <main
        id="main-content"
        className="app-main"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>
    </div>
  );
}
