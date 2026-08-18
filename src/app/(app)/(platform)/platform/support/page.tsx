/**
 * Platform Support — help documentation and quick reference for platform admins.
 *
 * Static server component — no DB queries needed.
 * The parent layout.tsx confirms is_platform_admin from the DB before
 * this page is rendered.
 */

import Link from "next/link";

// ── data ──────────────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    title: "Register New Society",
    description: "Onboard a new co-operative housing society onto the platform.",
    href: "/platform/societies/new",
    icon: "add_business",
    color: "#10B981",
  },
  {
    title: "Manage Societies",
    description: "View and switch between all registered societies.",
    href: "/platform/societies",
    icon: "domain",
    color: "#60A5FA",
  },
  {
    title: "Vendor Directory",
    description: "Review and verify vendors across all societies.",
    href: "/platform/vendors",
    icon: "storefront",
    color: "#60A5FA",
  },
  {
    title: "Contracts",
    description: "Monitor contracts platform-wide, including those nearing expiry.",
    href: "/platform/contracts",
    icon: "assignment",
    color: "#F59E0B",
  },
  {
    title: "Audit Log",
    description: "Review all platform activity in the audit trail.",
    href: "/platform/settings",
    icon: "history",
    color: "#9CA3AF",
  },
  {
    title: "User Management",
    description: "Invite and manage platform and society users.",
    href: "/platform/members",
    icon: "group",
    color: "#10B981",
  },
];

const FAQ = [
  {
    q: "How do I add a new society to the platform?",
    a: 'Go to Societies in the sidebar and click "Register New Society". Fill in the society name, registration number, type, address, and contact information. The society will be created with Active status and you can immediately switch context into it.',
  },
  {
    q: "How do I switch into a society dashboard?",
    a: 'From the Societies list page, click the "Switch" button in the Action column next to any society. This sets your session context and redirects you to that society\'s dashboard. You can also use the "Switch to Society View" link at the bottom of this sidebar.',
  },
  {
    q: "How does vendor verification work?",
    a: 'Platform admins can verify vendors from the Vendors page using the "Verify" button in the Action column. Verification is a toggle — clicking "Unverify" reverts it. Every toggle is recorded in the audit log with the actor\'s user ID.',
  },
  {
    q: "The contracts page shows expiry dates in red or amber — what do they mean?",
    a: "Red end dates indicate a contract has expired or expires within 7 days. Amber indicates expiry within 30 days. Green/grey means more than 30 days remain. This is a visual signal only — no automated reminders are sent via this view.",
  },
  {
    q: "Why are email notifications not working?",
    a: "The RESEND_API_KEY environment variable is currently set to a placeholder value. All email notifications (invitations, reminders) are routed through Resend and will fail silently until the real API key is configured in Vercel environment settings.",
  },
  {
    q: "Can platform admins see individual society member data?",
    a: "Platform admin pages use a service-role client which bypasses PostgreSQL Row Level Security. This is intentional for platform management. However, sensitive member information (KYC documents, financial transactions) should be accessed by switching into the society context, not via platform-level admin tooling.",
  },
  {
    q: "Why does the audit log show actor IDs instead of names?",
    a: "Audit log entries store actor_user_id (a UUID) rather than display names to ensure tamper-resistance. To look up a specific user, cross-reference with the User Management section using the first 8 characters of the UUID shown.",
  },
  {
    q: "How do I handle a society that needs to be deactivated?",
    a: "Society deactivation is not yet available directly from the platform console. Update the is_active flag in the societies table via Supabase Studio or through a future admin action. Deactivating a society prevents members from accessing its dashboard.",
  },
];

// ── page ──────────────────────────────────────────────────────────────────────

export default function PlatformSupportPage() {
  return (
    <div className="p-4 sm:p-8 max-w-screen-xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1
          className="font-semibold"
          style={{ fontSize: "28px", color: "#FFFFFF" }}
        >
          Support
        </h1>
        <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
          Platform admin quick reference and frequently asked questions
        </p>
      </div>

      {/* Quick access links */}
      <section>
        <h2
          className="font-semibold mb-4"
          style={{ fontSize: "16px", color: "#FFFFFF" }}
        >
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl p-5 transition-colors hover:bg-[#242424] group"
              style={{
                backgroundColor: "#1E1E1E",
                border: "1px solid #333333",
                textDecoration: "none",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined mt-0.5 shrink-0"
                  style={{ fontSize: "22px", color: link.color }}
                  aria-hidden="true"
                >
                  {link.icon}
                </span>
                <div>
                  <p
                    className="font-medium group-hover:text-white transition-colors"
                    style={{ fontSize: "14px", color: "#FFFFFF" }}
                  >
                    {link.title}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#9CA3AF",
                      marginTop: "4px",
                      lineHeight: "1.5",
                    }}
                  >
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2
          className="font-semibold mb-4"
          style={{ fontSize: "16px", color: "#FFFFFF" }}
        >
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl p-5"
              style={{
                backgroundColor: "#1E1E1E",
                border: "1px solid #333333",
              }}
            >
              <p
                className="font-medium mb-2"
                style={{ fontSize: "14px", color: "#FFFFFF" }}
              >
                {item.q}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#9CA3AF",
                  lineHeight: "1.6",
                }}
              >
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Alert about email */}
      <section>
        <div
          className="rounded-xl p-5 flex gap-4"
          style={{
            backgroundColor: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span
            className="material-symbols-outlined shrink-0 mt-0.5"
            style={{ fontSize: "20px", color: "#F59E0B" }}
            aria-hidden="true"
          >
            warning
          </span>
          <div>
            <p
              className="font-medium mb-1"
              style={{ fontSize: "14px", color: "#F59E0B" }}
            >
              Email notifications require configuration
            </p>
            <p style={{ fontSize: "13px", color: "#9CA3AF", lineHeight: "1.6" }}>
              The{" "}
              <code
                className="rounded px-1"
                style={{
                  backgroundColor: "rgba(245,158,11,0.12)",
                  color: "#F59E0B",
                  fontSize: "12px",
                }}
              >
                RESEND_API_KEY
              </code>{" "}
              environment variable is currently set to a placeholder value in
              Vercel. All invitation emails, reminders, and notification emails
              are silently failing until the real API key is configured. Go to
              your Vercel project settings, then Environment Variables, and
              replace the placeholder with a valid key from your Resend account.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
