import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PasswordChangeForm } from "./PasswordChangeForm";

export const metadata: Metadata = { title: "My Profile | ByelawsIndia" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const returnHref = user.is_platform_admin ? "/platform/console" : "/dashboard";

  return (
    <main className="min-h-screen px-5 py-10" style={{ backgroundColor: "#101010", color: "white" }}>
      <div className="mx-auto max-w-2xl">
        <Link href={returnHref} className="inline-flex items-center gap-2 text-sm mb-7" style={{ color: "#10B981" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to dashboard
        </Link>

        <header className="mb-7">
          <h1 className="text-3xl font-semibold">My Profile</h1>
          <p className="mt-2 text-sm" style={{ color: "#9CA3AF" }}>
            Manage the password for {user.email}. Your account and access privileges remain unchanged.
          </p>
        </header>

        <section className="rounded-xl p-6" style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="mt-1.5 text-sm leading-6" style={{ color: "#9CA3AF" }}>
              Confirm the existing password before setting a new one. Changing it does not remove platform or society access.
            </p>
          </div>
          <PasswordChangeForm />
        </section>
      </div>
    </main>
  );
}
