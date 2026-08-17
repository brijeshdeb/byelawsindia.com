/**
 * Public marketing homepage — byelawsindia.com
 *
 * Audience: Society committees/secretaries AND professional management offices.
 * Design: Institutional navy + amber palette, desktop-first but responsive.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Byelawsindia: Cooperative Housing Society Management",
  description:
    "The complete management platform for Indian cooperative housing societies. Membership, maintenance, procurement, compliance, all in one place, with a full audit trail.",
};

/* ─── Page ────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-white text-chs-text antialiased">
      <SiteNav />
      <main>
        <Hero />
        <PainStrip />
        <Features />
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
    <header className="sticky top-0 z-50 bg-chs-navy border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <NavLogoMark />
          <span className="font-semibold text-white tracking-tight text-base leading-none">
            Byelawsindia
          </span>
        </Link>

        {/* Nav links — hidden on small screens */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm text-chs-navy-100"
          aria-label="Site navigation"
        >
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#for-societies" className="hover:text-white transition-colors">
            For societies
          </a>
          <a href="#for-managers" className="hover:text-white transition-colors">
            For managers
          </a>
        </nav>

        {/* CTA */}
        <Link
          href="/login"
          className="text-sm font-semibold text-white bg-chs-amber hover:bg-chs-amber-hover px-4 py-1.5 rounded transition-colors"
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
    <section className="bg-chs-navy pt-20 pb-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 text-chs-navy-100 text-xs font-medium px-3 py-1 rounded-full mb-8 border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-chs-amber shrink-0" />
          Built for Indian cooperative housing societies
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
          Run your cooperative housing society{" "}
          <span className="text-chs-amber">without the paperwork</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-chs-navy-200 max-w-2xl mx-auto mb-10 leading-relaxed">
          From membership applications to maintenance demands, every process
          your society depends on, digitised. With a complete audit trail
          that protects your committee and your members.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 bg-chs-amber hover:bg-chs-amber-hover text-white font-semibold rounded text-sm transition-colors"
          >
            Request access
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded text-sm transition-colors border border-white/20"
          >
            See all features
          </a>
        </div>
      </div>

      {/* Feature preview cards */}
      <div className="max-w-5xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Member management", icon: <IconUsers /> },
          { label: "Maintenance & dues", icon: <IconCoin /> },
          { label: "Document repository", icon: <IconFolder /> },
          { label: "Full audit trail", icon: <IconShield /> },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 bg-white/8 border border-white/12 rounded px-3 py-3 text-sm text-chs-navy-100"
          >
            <span className="text-chs-amber shrink-0">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Pain Strip ──────────────────────────────────────────────────── */

function PainStrip() {
  const points = [
    {
      heading: "Disputes without evidence",
      body: "When a member contests a charge or a committee decision is challenged, where is the paper trail? Every action on Byelawsindia is logged, timestamped, and tamper-proof.",
      icon: <IconAlert />,
    },
    {
      heading: "Files across WhatsApp, email, and registers",
      body: "NOCs, share certificates, meeting minutes, vendor quotes, scattered everywhere. Byelawsindia stores everything in one place, indexed and searchable.",
      icon: <IconFiles />,
    },
    {
      heading: "Spreadsheets for a job software should do",
      body: "Tracking arrears in Excel, applications in a notebook, vendors in a register. There is a better way, and it takes less time, not more.",
      icon: <IconGrid />,
    },
  ];

  return (
    <section className="bg-chs-bg py-16 px-6 border-b border-chs-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-chs-text-muted text-center mb-10">
          Problems we were built to solve
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {points.map((p) => (
            <div key={p.heading} className="flex gap-4">
              <div className="mt-0.5 w-8 h-8 rounded flex items-center justify-center bg-chs-navy-50 text-chs-navy shrink-0">
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold text-chs-text mb-1">{p.heading}</h3>
                <p className="text-sm text-chs-text-secondary leading-relaxed">{p.body}</p>
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
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-chs-navy mb-3">
            Everything your society needs, in one platform
          </h2>
          <p className="text-chs-text-secondary max-w-xl mx-auto">
            Built around the actual workflows Indian cooperative housing
            societies run, not a generic tool adapted to fit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-chs-border rounded p-5 hover:shadow-md hover:border-chs-navy/25 transition-all duration-150"
            >
              <div className="w-9 h-9 rounded bg-chs-navy-50 text-chs-navy flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-chs-navy mb-1.5">{f.title}</h3>
              <p className="text-sm text-chs-text-secondary leading-relaxed">{f.desc}</p>
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
    <section className="bg-chs-bg border-t border-b border-chs-border py-20 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        {/* For society committees */}
        <div id="for-societies">
          <div className="inline-flex items-center gap-2 bg-chs-navy text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <IconBuilding className="w-3.5 h-3.5" />
            For society committees
          </div>
          <h2 className="text-2xl font-bold text-chs-navy mb-4 leading-snug">
            Your secretary does not need an IT department
          </h2>
          <p className="text-chs-text-secondary mb-6 leading-relaxed">
            Byelawsindia is designed for the way Indian CHS committees actually
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
              <li key={item} className="flex gap-2.5 text-sm text-chs-text">
                <CheckMark />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* For management offices */}
        <div id="for-managers">
          <div className="inline-flex items-center gap-2 bg-chs-amber text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <IconOffice className="w-3.5 h-3.5" />
            For management offices
          </div>
          <h2 className="text-2xl font-bold text-chs-navy mb-4 leading-snug">
            Manage multiple societies without losing your mind
          </h2>
          <p className="text-chs-text-secondary mb-6 leading-relaxed">
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
              <li key={item} className="flex gap-2.5 text-sm text-chs-text">
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
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-chs-navy mb-3">
            Security is structural, not a feature
          </h2>
          <p className="text-chs-text-secondary max-w-xl mx-auto">
            We built the access controls into the database itself, not just
            the interface. That means misbehaving code cannot leak data any
            more than a locked vault can.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="bg-chs-navy rounded p-6 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded bg-white/10 text-chs-amber flex items-center justify-center shrink-0">
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-chs-navy-200 leading-relaxed">{p.body}</p>
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
    <section className="bg-chs-amber py-16 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to modernise your society?
        </h2>
        <p className="text-white/85 mb-8 text-lg">
          Request access and we will set up your society with seed data
          so you can see it working before you commit.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-white text-chs-amber font-semibold px-6 py-3 rounded hover:bg-white/90 transition-colors text-sm"
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
    <footer className="bg-chs-navy py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 pb-10 border-b border-white/10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <NavLogoMark />
              <span className="font-semibold text-white">Byelawsindia</span>
            </div>
            <p className="text-sm text-chs-navy-200 leading-relaxed">
              The management platform built for Indian cooperative
              housing societies. Compliance-first, audit-ready, always.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-white font-semibold mb-3">Platform</p>
              <ul className="space-y-2 text-chs-navy-200">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#for-societies" className="hover:text-white transition-colors">For societies</a></li>
                <li><a href="#for-managers" className="hover:text-white transition-colors">For managers</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3">Legal</p>
              <ul className="space-y-2 text-chs-navy-200">
                <li><a href="#" className="hover:text-white transition-colors">Privacy policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Data processing</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-chs-navy-300">
          <p>© {new Date().getFullYear()} Byelawsindia. All rights reserved.</p>
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
      className="w-4 h-4 text-chs-success shrink-0 mt-0.5"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
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
