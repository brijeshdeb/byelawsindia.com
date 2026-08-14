/**
 * Shell layout — wraps all authenticated, context-aware pages with the
 * AppShell (Topbar + Sidebar + main content area).
 *
 * This is a nested route group inside (app)/. The (shell) segment is
 * invisible in the URL — /dashboard still resolves to /dashboard.
 *
 * Pages that need their own full-screen layout (e.g. /select-context)
 * stay outside this group and are handled by (app)/layout.tsx only.
 */
import { AppShell } from "@/components/layout/AppShell";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
