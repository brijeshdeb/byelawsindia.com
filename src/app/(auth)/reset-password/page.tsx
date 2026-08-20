import type { Metadata } from "next";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata: Metadata = { title: "Reset Password | ByelawsIndia" };

export default function ResetPasswordPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10" style={{ backgroundColor: "#121212", color: "white" }}>
      <section className="w-full max-w-md rounded-xl p-7" style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}>
        <ResetRequestForm />
      </section>
    </main>
  );
}
