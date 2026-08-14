/**
 * Auth group layout.
 *
 * Minimal wrapper — no sidebar, no topbar. Just the page.
 * Security headers and session redirect are handled in middleware.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
