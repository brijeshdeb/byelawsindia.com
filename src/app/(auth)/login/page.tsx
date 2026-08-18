/**
 * Login page — Stitch Obsidian design.
 *
 * Split layout:
 *   Left (lg+):  Dark #131313 branding panel, emerald wordmark + feature list.
 *   Right:       Pure #121212 canvas with a #1E1E1E form card.
 *
 * Auth route group has its own layout chain — background must be set here,
 * it does NOT inherit .app-main's canvas-bg.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

interface Props {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div
      className="min-h-dvh flex"
      style={{ backgroundColor: "#121212" }}
    >
      {/* ── Left: Branding panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 px-12 py-14"
        style={{
          backgroundColor: "#131313",
          borderRight: "1px solid #333333",
        }}
        aria-hidden="true"
      >
        {/* Logo + wordmark */}
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
            Society management, simplified.
          </h1>
          <p style={{ fontSize: "15px", lineHeight: "1.65", color: "#9CA3AF" }}>
            Applications, documents, maintenance, procurement: managed in one
            platform designed for Indian cooperative housing societies.
          </p>
        </div>

        {/* Feature highlights */}
        <ul className="space-y-4" role="list">
          {[
            "Multi-wing application workflows",
            "RFQ and procurement management",
            "Compliance document repository",
            "Member and unit registry",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-3" style={{ color: "#e5e2e1" }}>
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "13px", color: "#10B981" }}
                  aria-hidden="true"
                >
                  check
                </span>
              </span>
              <span style={{ fontSize: "14px" }}>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <p style={{ fontSize: "11px", color: "#6B7280" }}>
          &copy; {new Date().getFullYear()} ByelawsIndia. All rights reserved.
        </p>
      </div>

      {/* ── Right: Auth form ─────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12"
        style={{ backgroundColor: "#121212" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo — shown only when branding panel is hidden */}
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

          {/* Form card — Level 1 elevated surface */}
          <div
            className="rounded-lg p-8"
            style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
          >
            <div className="mb-6">
              <h2
                className="font-semibold leading-tight"
                style={{ fontSize: "22px", color: "#FFFFFF" }}
              >
                Sign in to your account
              </h2>
              <p className="mt-1.5" style={{ fontSize: "13px", color: "#9CA3AF" }}>
                Enter your email and password to continue.
              </p>
            </div>

            <LoginForm
              redirectTo={params.redirectTo}
              urlError={params.error}
            />
          </div>

          <p className="mt-6 text-center" style={{ fontSize: "12px", color: "#6B7280" }}>
            Forgot your password?{" "}
            <Link
              href="/reset-password"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "#10B981" }}
            >
              Reset it here
            </Link>
          </p>

          <p className="mt-3 text-center" style={{ fontSize: "12px", color: "#6B7280" }}>
            New society admin?{" "}
            <Link
              href="/register"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "#10B981" }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
