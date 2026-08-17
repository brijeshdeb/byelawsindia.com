/**
 * Registration page — new society admin sign-up.
 *
 * Same split-panel layout as the login page. The right panel hosts
 * the registration form. On success, shows a pending-approval message
 * (a platform admin must assign the user to a society before they can
 * access any data).
 *
 * Route: /register  (inside (auth) group — no shell, no sidebar)
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex" style={{ backgroundColor: "#121212" }}>

      {/* ── Left: Branding panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 px-12 py-14"
        style={{ backgroundColor: "#131313", borderRight: "1px solid #333333" }}
        aria-hidden="true"
      >
        {/* Logo */}
        <div>
          <div className="mb-12">
            <Link href="/" aria-label="Back to homepage">
              <Image
                src="/logo.png"
                alt="ByelawsIndia"
                width={160}
                height={107}
                style={{ maxWidth: "148px", height: "auto" }}
                priority
              />
            </Link>
          </div>

          <h1
            className="font-semibold leading-snug mb-4"
            style={{ fontSize: "28px", color: "#FFFFFF" }}
          >
            Your society, managed properly.
          </h1>
          <p style={{ fontSize: "15px", lineHeight: "1.65", color: "#9CA3AF" }}>
            Register as a society administrator to get started. Once your account
            is active, you manage members, applications, documents, and procurement
            in one place.
          </p>
        </div>

        {/* Steps */}
        <ol className="space-y-5" role="list">
          {[
            { n: "1", label: "Create your account below" },
            { n: "2", label: "We verify and assign you to your society" },
            { n: "3", label: "Log in and start managing your CHS" },
          ].map((step) => (
            <li key={step.n} className="flex items-center gap-3" style={{ color: "#e5e2e1" }}>
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold"
                style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", fontSize: "12px", color: "#10B981" }}
              >
                {step.n}
              </span>
              <span style={{ fontSize: "14px" }}>{step.label}</span>
            </li>
          ))}
        </ol>

        <p style={{ fontSize: "11px", color: "#6B7280" }}>
          &copy; {new Date().getFullYear()} Byelawsindia. All rights reserved.
        </p>
      </div>

      {/* ── Right: Registration form ─────────────────────────────── */}
      <div
        className="flex-1 flex items-start justify-center px-6 py-12 overflow-y-auto"
        style={{ backgroundColor: "#121212" }}
      >
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" aria-label="Back to homepage">
              <Image
                src="/logo.png"
                alt="ByelawsIndia"
                width={120}
                height={80}
                style={{ height: "auto" }}
                priority
              />
            </Link>
          </div>

          {/* Form card */}
          <div
            className="rounded-lg p-8"
            style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
          >
            <div className="mb-6">
              <h2
                className="font-semibold leading-tight"
                style={{ fontSize: "22px", color: "#FFFFFF" }}
              >
                Create your account
              </h2>
              <p className="mt-1.5" style={{ fontSize: "13px", color: "#9CA3AF" }}>
                Society access is assigned within 1 business day of registration.
              </p>
            </div>

            <RegisterForm />
          </div>

          <p className="mt-4 text-center" style={{ fontSize: "11px", color: "#6B7280" }}>
            By registering you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2" style={{ color: "#9CA3AF" }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2" style={{ color: "#9CA3AF" }}>
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
