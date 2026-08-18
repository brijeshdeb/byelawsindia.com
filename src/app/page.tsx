/**
 * Public marketing homepage — byelawsindia.com
 *
 * Audience: Society committees/secretaries AND professional management offices.
 * Design: Stitch Obsidian — #121212 base, #10B981 emerald primary, Inter.
 *
 * DESIGN.md tokens used throughout:
 *   surface-base:    #121212
 *   surface:         #131313
 *   surface-elevated:#1E1E1E
 *   border-subtle:   #333333
 *   primary:         #10B981
 *   text-primary:    #FFFFFF
 *   text-secondary:  #9CA3AF
 *   text-muted:      #6B7280
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ByelawsIndia: Cooperative Housing Society Management",
  description:
    "The complete management platform for Indian cooperative housing societies. Membership, maintenance, procurement, compliance, all in one place, with a full audit trail.",
};

/* ── Design tokens ────────────────────────────────────────────────── */
const T = {
  base:     "#121212",
  surface:  "#131313",
  elevated: "#1E1E1E",
  high:     "#2A2A2A",
  border:   "#333333",
  primary:  "#10B981",
  primaryHover: "#0d9f6e",
  primaryDim: "rgba(16,185,129,0.12)",
  primaryDimBorder: "rgba(16,185,129,0.25)",
  white:    "#FFFFFF",
  secondary: "#9CA3AF",
  muted:    "#6B7280",
  dimText:  "#e5e2e1",
};

/* ─── Page ────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-dvh antialiased" style={{ backgroundColor: T.base, color: T.dimText }}>
      <SiteNav />
      <main>
        <Hero />
        <StatBar />
        <PainStrip />
        <Features />
        <HowItWorks />
        <AudienceSplit />
        <TrustSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

/* ─── Navigation ──────────────────────────────────────────────────── */

function SiteNav() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}` }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <NavLogoMark />
          <span className="font-semibold tracking-tight text-base leading-none" style={{ color: T.white }}>
            ByelawsIndia
          </span>
        </Link>

        {/* Nav links — hidden on small screens */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm"
          aria-label="Site navigation"
          style={{ color: T.secondary }}
        >
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#for-societies" className="transition-colors hover:text-white">For societies</a>
          <a href="#for-managers" className="transition-colors hover:text-white">For managers</a>
        </nav>

        {/* CTA */}
        <Link
          href="/login"
          className="text-sm font-semibold px-4 py-1.5 rounded transition-colors bg-primary-container text-white hover:bg-[#0d9f6e]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="pt-16 pb-20 px-6 overflow-hidden" style={{ backgroundColor: T.base }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: badge + headline + subheading + CTAs */}
        <div>
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-7"
            style={{
              backgroundColor: T.primaryDim,
              border: `1px solid ${T.primaryDimBorder}`,
              color: T.primary,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: T.primary }} />
            Built for Indian cooperative housing societies
          </div>

          <h1
            className="font-bold leading-tight tracking-tight mb-5"
            style={{ fontSize: "clamp(32px,4.5vw,48px)", color: T.white }}
          >
            Your society,{" "}
            <span style={{ color: T.primary }} className="italic">properly</span>{" "}
            managed.
          </h1>

          <p className="text-lg mb-9 leading-relaxed max-w-lg" style={{ color: T.secondary }}>
            Replace WhatsApp groups, Excel sheets, and shared email inboxes
            with one platform your entire committee can use. Every decision
            tracked. Every rupee accounted for. Full audit trail, always.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded text-sm transition-colors"
              style={{ backgroundColor: T.primary, color: T.white }}
            >
              Request access
              <ArrowRight />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-6 py-3 font-semibold rounded text-sm transition-colors text-center"
              style={{
                backgroundColor: "transparent",
                border: `1px solid ${T.border}`,
                color: T.secondary,
              }}
            >
              See what's included
            </a>
          </div>
        </div>

        {/* Right: live-looking dashboard mockup — desktop only */}
        <div className="hidden lg:block">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard Mockup ────────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <div
      className="rounded-xl p-5 text-sm select-none"
      style={{
        background: T.elevated,
        border: `1px solid ${T.border}`,
        transform: "perspective(1000px) rotateY(-7deg) rotateX(3deg)",
        boxShadow: "32px 40px 80px rgba(0,0,0,0.6)",
      }}
      aria-hidden="true"
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-1.5 pb-3 mb-3"
        style={{ borderBottom: `1px solid ${T.border}` }}
      >
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="ml-2 text-xs font-semibold" style={{ color: T.muted }}>
          Sunrise CHS — Dashboard
        </span>
      </div>

      {/* Stat cards 2x2 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: "Active Members", value: "142", color: T.white },
          { label: "Arrears Outstanding", value: "₹2.4L", color: "#F59E0B" },
          { label: "Open Complaints", value: "7", color: T.white },
          { label: "Compliance Rate", value: "98%", color: T.primary },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-3"
            style={{ background: T.high, border: `1px solid ${T.border}` }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {s.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <p className="text-xs font-semibold mb-2" style={{ color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Recent Activity
      </p>
      {[
        { text: "Flat 4B — Maintenance payment received", badge: "Paid", color: T.primary, bg: "rgba(16,185,129,0.15)" },
        { text: "Wing A — Water pump complaint", badge: "Open", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
        { text: "Annual AMC — Vendor selected", badge: "Done", color: T.primary, bg: "rgba(16,185,129,0.15)" },
        { text: "Flat 7C — NOC application pending", badge: "Review", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
      ].map((row) => (
        <div
          key={row.text}
          className="flex items-center justify-between px-2.5 py-2 rounded mb-1.5"
          style={{ background: T.base, border: `1px solid ${T.border}`, color: T.secondary, fontSize: "11.5px" }}
        >
          <span className="truncate mr-2">{row.text}</span>
          <span
            className="shrink-0 font-semibold px-2 py-0.5 rounded-full"
            style={{ color: row.color, background: row.bg, fontSize: "10px" }}
          >
            {row.badge}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat Bar ────────────────────────────────────────────────────── */

function StatBar() {
  const stats = [
    { value: "Early Access", label: "now open", highlight: true },
    { value: "6", label: "modules ready to use", highlight: false },
    { value: "100%", label: "audit trail, always on", highlight: false },
    { value: "Zero", label: "WhatsApp groups needed", highlight: false },
  ];

  return (
    <div style={{ backgroundColor: T.surface, borderBottom: `1px solid ${T.border}` }}>
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-y-3 gap-x-10 md:gap-x-14">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5">
            {i > 0 && (
              <div
                className="hidden md:block w-px h-7 -ml-5 md:-ml-7 mr-2.5 md:mr-3.5"
                style={{ backgroundColor: T.border }}
              />
            )}
            <span className="font-bold text-xl" style={{ color: s.highlight ? T.primary : T.white }}>
              {s.value}
            </span>
            <span className="text-sm" style={{ color: T.secondary }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Pain Strip ──────────────────────────────────────────────────── */

function PainStrip() {
  const points = [
    {
      heading: "Disputes without evidence",
      body: "When a member contests a charge or a committee decision is challenged, where is the paper trail? Every action on ByelawsIndia is logged, timestamped, and tamper-proof.",
      icon: <IconAlert />,
    },
    {
      heading: "Files across WhatsApp, email, and registers",
      body: "NOCs, share certificates, meeting minutes, vendor quotes, scattered everywhere. ByelawsIndia stores everything in one place, indexed and searchable.",
      icon: <IconFiles />,
    },
    {
      heading: "Spreadsheets for a job software should do",
      body: "Tracking arrears in Excel, applications in a notebook, vendors in a register. There is a better way, and it takes less time, not more.",
      icon: <IconGrid />,
    },
  ];

  return (
    <section className="py-16 px-6" style={{ backgroundColor: T.base, borderBottom: `1px solid ${T.border}` }}>
      <div className="max-w-5xl mx-auto">
        <p
          className="text-xs font-semibold uppercase tracking-widest text-center mb-10"
          style={{ color: T.muted }}
        >
          Problems we were built to solve
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p) => (
            <div key={p.heading} className="flex gap-4">
              <div
                className="mt-0.5 w-8 h-8 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: T.elevated, color: T.primary, border: `1px solid ${T.border}` }}
              >
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: T.white }}>{p.heading}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.secondary }}>{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features Grid ───────────────────────────────────────────────── */

function Features() {
  const features = [
    {
      title: "Member Management",
      desc: "Onboard owners and tenants, track nominees, manage unit assignments, and maintain a complete member register, all linked to a verifiable audit trail.",
      icon: <IconUsers />,
    },
    {
      title: "Maintenance & Dues",
      desc: "Generate demand notices, record payments, track arrears by unit, and give members a clear view of their ledger. No more manual reconciliation.",
      icon: <IconCoin />,
    },
    {
      title: "Application Workflows",
      desc: "Multi-step approval workflows for membership, NOC, flat transfer, and sub-letting applications. Every step assigned, every decision recorded.",
      icon: <IconFlow />,
    },
    {
      title: "Document Repository",
      desc: "Store byelaws, AGM minutes, share certificates, NOCs, and vendor contracts. Organised by society and wing, accessible only to those with permission.",
      icon: <IconFolder />,
    },
    {
      title: "Procurement & Vendors",
      desc: "Issue RFQs, collect sealed quotations, evaluate bids, and create work orders. Vendor A cannot see Vendor B's submission. Ever.",
      icon: <IconVendor />,
    },
    {
      title: "Audit & Compliance",
      desc: "Every action (approval, rejection, upload, deletion) is logged with actor, timestamp, and IP. The log cannot be edited or deleted, even by administrators.",
      icon: <IconShield />,
    },
  ];

  return (
    <section id="features" className="py-20 px-6" style={{ backgroundColor: T.base }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3" style={{ color: T.white }}>
            Everything your society needs, in one platform
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: T.secondary }}>
            Built around the actual workflows Indian cooperative housing
            societies run, not a generic tool adapted to fit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded p-5 transition-all duration-150"
              style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}` }}
            >
              <div
                className="w-9 h-9 rounded flex items-center justify-center mb-4"
                style={{ backgroundColor: T.primaryDim, color: T.primary }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: T.white }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.secondary }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Register your society",
      desc: "Create an account with your society name, location, and wing structure. Takes about five minutes, no IT team required.",
    },
    {
      num: "2",
      title: "Get access configured",
      desc: "We configure your wings, assign roles to your committee members, and help you import your existing member register.",
    },
    {
      num: "3",
      title: "Start managing",
      desc: "Members, dues, complaints, documents, vendors, all in one place from day one. Your data. Your history. Your audit trail.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 px-6"
      style={{ backgroundColor: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
            Getting started
          </p>
          <h2 className="text-3xl font-bold mb-3" style={{ color: T.white }}>
            Up and running in three steps
          </h2>
          <p className="max-w-md mx-auto" style={{ color: T.secondary }}>
            No IT team. No long implementation. No training sessions that nobody attends.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8 md:gap-0">
          {/* Connector line */}
          <div
            className="hidden md:block absolute"
            style={{
              top: "19px",
              left: "calc(16.67% + 20px)",
              right: "calc(16.67% + 20px)",
              height: "1px",
              backgroundColor: T.border,
            }}
          />
          {steps.map((step) => (
            <div key={step.num} className="text-center px-4 md:px-8 relative">
              <div
                className="w-10 h-10 rounded-full font-bold text-base flex items-center justify-center mx-auto mb-5 relative z-10"
                style={{ backgroundColor: T.primary, color: T.white }}
              >
                {step.num}
              </div>
              <h3 className="font-semibold mb-2" style={{ color: T.white }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: T.secondary }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Audience Split ──────────────────────────────────────────────── */

function AudienceSplit() {
  return (
    <section
      className="py-20 px-6"
      style={{ backgroundColor: T.base, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}
    >
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        {/* For society committees */}
        <div id="for-societies">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: T.elevated, color: T.primary, border: `1px solid ${T.border}` }}
          >
            <IconBuilding className="w-3.5 h-3.5" />
            For society committees
          </div>
          <h2 className="text-2xl font-bold mb-4 leading-snug" style={{ color: T.white }}>
            Your secretary does not need an IT department
          </h2>
          <p className="mb-6 leading-relaxed" style={{ color: T.secondary }}>
            ByelawsIndia is designed for the way Indian CHS committees actually
            work, where the secretary is a volunteer, the committee changes
            every few years, and compliance cannot wait for someone to find
            the right file.
          </p>
          <ul className="space-y-3">
            {[
              "Approvals flow through defined roles, no one can bypass a step",
              "Every demand notice, NOC, and resolution is timestamped and signed-off",
              "New committee members inherit context, not a pile of papers",
              "Members can check their dues and documents without calling the office",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm" style={{ color: T.dimText }}>
                <CheckMark />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* For management offices */}
        <div id="for-managers">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: T.primaryDim, color: T.primary, border: `1px solid ${T.primaryDimBorder}` }}
          >
            <IconOffice className="w-3.5 h-3.5" />
            For management offices
          </div>
          <h2 className="text-2xl font-bold mb-4 leading-snug" style={{ color: T.white }}>
            Manage multiple societies without losing your mind
          </h2>
          <p className="mb-6 leading-relaxed" style={{ color: T.secondary }}>
            If your office manages six societies across three buildings, you
            already know the problem: one spreadsheet per society, one WhatsApp
            group per committee, and no single view of where everything stands.
          </p>
          <ul className="space-y-3">
            {[
              "Each society is fully isolated, data never crosses tenancy boundaries",
              "Delegate wing-specific access to on-site staff without sharing admin credentials",
              "Role-based permissions down to individual workflow steps",
              "One login to switch between societies without logging out",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm" style={{ color: T.dimText }}>
                <CheckMark />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Section ───────────────────────────────────────────────── */

function TrustSection() {
  const pillars = [
    {
      title: "Data never crosses societies",
      body: "Row-level security is enforced at the database layer, not just in the application code. A user from Society A cannot read Society B's records even if they guess the URL.",
      icon: <IconLock />,
    },
    {
      title: "Audit logs are tamper-proof",
      body: "Audit records have no UPDATE or DELETE access, not even for platform administrators. What happened cannot be unwritten, by anyone.",
      icon: <IconLog />,
    },
    {
      title: "Hosted on enterprise infrastructure",
      body: "Built on Supabase (PostgreSQL) with automated backups, TLS everywhere, and secrets never exposed to the browser. No one should have to trust our word: the architecture makes it structural.",
      icon: <IconServer />,
    },
  ];

  return (
    <section className="py-20 px-6" style={{ backgroundColor: T.surface }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3" style={{ color: T.white }}>
            Security is structural, not a feature
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: T.secondary }}>
            We built the access controls into the database itself, not just
            the interface. That means misbehaving code cannot leak data any
            more than a locked vault can.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded p-6 flex flex-col gap-4"
              style={{ backgroundColor: T.elevated, border: `1px solid ${T.border}` }}
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: T.primaryDim, color: T.primary }}
              >
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-2" style={{ color: T.white }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.secondary }}>{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Banner ──────────────────────────────────────────────────── */

function CtaBanner() {
  return (
    <section className="py-16 px-6" style={{ backgroundColor: T.primary }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ color: T.white }}>
          Ready to modernise your society?
        </h2>
        <p className="mb-8 text-lg" style={{ color: "rgba(255,255,255,0.85)" }}>
          Request access and we will set up your society with seed data
          so you can see it working before you commit.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded transition-colors text-sm"
          style={{ backgroundColor: T.white, color: T.primary }}
        >
          Request access
          <ArrowRight />
        </Link>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="py-12 px-6" style={{ backgroundColor: T.surface }}>
      <div className="max-w-5xl mx-auto">
        <div
          className="flex flex-col md:flex-row md:items-start justify-between gap-10 pb-10"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <NavLogoMark />
              <span className="font-semibold" style={{ color: T.white }}>ByelawsIndia</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: T.secondary }}>
              The management platform built for Indian cooperative
              housing societies. Compliance-first, audit-ready, always.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="font-semibold mb-3" style={{ color: T.white }}>Platform</p>
              <ul className="space-y-2" style={{ color: T.secondary }}>
                <li><a href="#features" className="transition-colors hover:text-white">Features</a></li>
                <li><a href="#for-societies" className="transition-colors hover:text-white">For societies</a></li>
                <li><a href="#for-managers" className="transition-colors hover:text-white">For managers</a></li>
                <li><Link href="/login" className="transition-colors hover:text-white">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3" style={{ color: T.white }}>Legal</p>
              <ul className="space-y-2" style={{ color: T.secondary }}>
                <li><a href="#" className="transition-colors hover:text-white">Privacy policy</a></li>
                <li><a href="#" className="transition-colors hover:text-white">Terms of service</a></li>
                <li><a href="#" className="transition-colors hover:text-white">Data processing</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs" style={{ color: T.muted }}>
          <p>&copy; {new Date().getFullYear()} ByelawsIndia. All rights reserved.</p>
          <p>Built for Indian cooperative housing societies.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Micro-components ────────────────────────────────────────────── */

function CheckMark() {
  return (
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ color: T.primary }}
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M5 8l2.5 2.5L11 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Logo ────────────────────────────────────────────────────────── */

function NavLogoMark() {
  return (
    <Image
      src="/logo.png"
      alt="ByelawsIndia"
      width={100}
      height={67}
      style={{ height: "auto" }}
    />
  );
}

/* ─── Icons ───────────────────────────────────────────────────────── */

function IconUsers() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 7.5c1.5 0 3 1 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconCoin() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v7M6 6c0-.8.9-1.5 2-1.5s2 .7 2 1.5-1 1.5-2 1.5-2 .7-2 1.5.9 1.5 2 1.5 2-.7 2-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconFlow() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="11" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10.5" y="6.5" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 3.5h3a1 1 0 011 1v1.5M5.5 12.5h3a1 1 0 001-1V9.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 8h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L3 4.5v4C3 11 5 13.5 8 14.5c3-1 5-3.5 5-6v-4L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 8l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconVendor() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 6h12l-1 7H3L2 6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 6V4.5A2.5 2.5 0 018 2v0a2.5 2.5 0 012.5 2.5V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconFiles() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 5v9a1 1 0 001 1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 6.5h2.5M8 8.5h2.5M8 10.5h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="9" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconLog() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7h6M7 10.5h6M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconServer() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="6.5" cy="13.5" r="1" fill="currentColor" />
    </svg>
  );
}

function IconBuilding({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 14V5l5-3 5 3v9" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 14v-4h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function IconOffice({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 8v6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
