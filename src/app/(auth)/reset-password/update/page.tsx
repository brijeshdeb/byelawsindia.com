import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Choose New Password | ByelawsIndia" };

export default function ResetPasswordUpdatePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10" style={{ backgroundColor: "#121212", color: "white" }}>
      <section className="w-full max-w-md rounded-xl p-7" style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
