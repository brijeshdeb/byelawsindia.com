/**
 * Protected app layout.
 *
 * All routes under (app)/ require an authenticated session.
 * Middleware handles the redirect to /login — if we reach here,
 * the user is authenticated. We do a final server-side check anyway
 * because defense-in-depth is not optional.
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.is_active) {
    redirect("/login?error=account_inactive");
  }

  return <>{children}</>;
}
