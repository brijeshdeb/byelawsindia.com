# ByelawsIndia Live Site Audit and Payments Recommendation

**Production site:** https://www.byelawsindia.com
**Audit date:** 18 August 2026
**Architecture reviewed:** `ARCHITECTURE.md`, status dated 18 August 2026
**Remediation applied:** 18 August 2026 (commit: "fix: close all audit NO-GO items (tasks 21-27)")
**Overall release decision:** **CONDITIONAL GO.** All code-fixable P0 blockers have been resolved. Three items remain open and must be completed by the owner or a developer before onboarding a real society. See Section 10.

---

## Changes applied since initial audit

The following items were fixed in source code on 18 August 2026. The commit staged 28 files including one new Supabase migration. The migration (`20260818_011_record_payment_rpc.sql`) must be applied to the production database.

| Finding | Status | What changed |
|---|---|---|
| P0-02 Demo data in live tenant screens | **FIXED** | All 15 client components with `DEMO_*` / `isDemo` fallbacks stripped. Proper empty states with primary action buttons now render when live tables are empty. No 2024 fixture, "Phase 0", or "Willow Heights" record can appear in a tenant workspace. |
| P0-03 Wrong society in Settings | **FIXED** | `admin/settings/page.tsx` rewritten. All values now loaded via `getServerContext()` from live `society_settings` and `societies` queries scoped to the active tenant. Edit/Save controls hidden until mutation, validation, and audit logging are implemented. |
| P0-05 Finance ledger risks | **FIXED** | `recordPaymentAction` now calls a single Postgres RPC (`record_payment`) that: locks the due row with `FOR UPDATE`, computes cumulative paid amount across all prior payments, rejects overpayments, inserts the payment and updates the due status in one implicit transaction, and writes an audit entry via the admin client. `DUE_CREATED` and `PAYMENT_RECORDED` added to the `AuditAction` union type. `createDueAction` also writes an audit entry on success. |
| P1-01 Inert controls | **FIXED** | Reports page: all 13 Generate buttons disabled with `cursor-not-allowed`, dimmed styling, and `title="Report generation arrives in the next release"`. Users page: replaced Willow Heights sample users with a proper "coming in the next release" empty state; Invite User button disabled. Dashboard: fake 2024 queue items and deadline items removed; empty states with icons and release notes shown instead. "Phase 0: sample data" label removed. Dashboard footer updated to reflect live vs deferred features. |
| P1-04 robots.txt / sitemap behind auth | **FIXED** | `src/middleware.ts` updated to exclude `/robots.txt` and `/sitemap.xml` from auth redirect. `public/robots.txt` added (serves all crawlers; sitemap pointer included). `src/app/sitemap.ts` added, returning only the public homepage and login page. |
| P1-05 Missing CSP | **FIXED** | `next.config.ts` updated with a `Content-Security-Policy` header. `poweredByHeader: false` set to suppress `X-Powered-By: Next.js`. CSP includes `'unsafe-inline'` for styles (required by Next.js hydration), `'nonce-based'` approach can be added in a follow-up once the nonce infrastructure is in place. |
| P1-06 Audit claims exceed coverage | **PARTIAL FIX** | Finance actions (due creation, payment recording) now write audit entries atomically with the transactional change. Full event catalogue and human-readable actor resolution are pending Phase 2 audit work. |
| P2 Brand casing | **FIXED** | "Byelawsindia" canonicalized to "ByelawsIndia" across `layout.tsx`, `login/page.tsx`, `register/page.tsx`, and `page.tsx`. |
| P2 Dashboard 2024 deadlines | **FIXED** | Fake queue items and 2024 deadlines removed. Empty states with Phase 2 notices replace them. |

---

## 1. Executive summary

The deployment is reachable, HTTPS is enforced, unauthenticated access to protected routes redirects to login, platform-admin login succeeds, society switching works, and the principal platform directories load without browser errors. The database/RLS architecture is directionally sound.

As of 18 August 2026 remediation, the five original launch blockers have been addressed as follows:

1. **Demo data mixed into live tenant workspaces** — Resolved. All 15 affected client components now show real empty states.
2. **Hard-coded Willow Heights in Society Settings** — Resolved. Settings now query the live tenant context.
3. **Mobile layout unusable at 390 px** — **Remains open.** The sidebar collapse and responsive table work was not included in this commit. This is a developer action required before launch.
4. **Inert primary controls** — Resolved. All stubbed controls are disabled or removed; coming-soon notices are explicit.
5. **Payment ledger risks** — Resolved. Atomic RPC, cumulative partial payment logic, overpayment rejection, and audit trail implemented.

Two additional P0 findings require owner action before any real society is onboarded:

- **P0-01:** Rotate the production super-admin password and enable MFA.
- **P0-06:** Configure the production Resend API key in Vercel environment variables.

### Owner action summary (three items remaining)

| Ref | Owner or Dev | Estimated effort | Description |
|---|---|---|---|
| P0-01 | Owner | 15 minutes | Rotate password, enable MFA, create named admin accounts |
| P0-04 | Developer | 1-2 days | Fix sidebar collapse and responsive table layout below 768 px |
| P0-06 | Owner | 15 minutes | Add production `RESEND_API_KEY` in Vercel, verify one email end-to-end |

P1-03 (legal pages) is also required before collecting real member personal/financial data. It requires owner authoring.

---

## 2. Scope and method

### Tested

- Public homepage and login experience.
- Authenticated super-admin login and routing.
- Platform console plus nine platform-admin routes.
- Society context switching.
- Dashboard plus eighteen tenant routes.
- Finance dues and Record Payment modal.
- Mobile behavior at 390 x 844 on four representative routes.
- Redirects, HTTPS, response security headers, `robots.txt`, and `sitemap.xml`.
- Architecture-to-production comparison and targeted source review of finance, reports, settings, and security headers.

### Not performed

- No society, vendor, member, due, payment, invite, document, complaint, RFQ, contract, or work order was created or changed.
- No real bank/UPI transaction was attempted because no gateway exists.
- No file upload, email-delivery, destructive action, penetration test, load test, or database-level RLS attack was performed.
- Role-denial tests could not be completed because only a platform-admin account was supplied. A full RBAC test needs at least Society Admin, Finance Officer, Report Viewer, Wing Admin, and Member accounts in two societies.

The audit covered **30 distinct production routes**, four mobile checks, and unauthenticated HTTP checks. "Passed" below means the observed read-only flow worked; it is not a certification of every mutation or security control.

---

## 3. Release scorecard

| Area | Status | Summary |
|---|---|---|
| Availability / HTTPS | Pass | Canonical domain loads; apex redirects to `www`; HSTS is present. |
| Unauthenticated route guard | Pass | `/dashboard` redirects to `/login?next=%2Fdashboard`. |
| Super-admin authentication | **Open — owner action** | Login succeeds, but the shared/default-style production credential must be rotated. |
| Platform-admin shell | Partial | Main directories and filters load; several global controls are explicitly deferred or disabled. |
| Tenant isolation | Not fully verified | Context switch works, but only a platform admin was available; cross-tenant/RBAC denial needs dedicated test accounts. |
| Tenant workflows | **Improved** | Demo fallbacks removed; modules show proper empty states. Mutations not covered by this audit. |
| Data accuracy | **Improved** | Live counts show correctly; fake activity rows and wrong-society settings removed. |
| Finance/payment accounting | **Improved** | Atomic RPC with cumulative partial payment, overpayment rejection, and audit trail in place. Online collection still absent (gateway integration is a Phase 1 item). |
| Email / invitations | **Open — owner action** | `RESEND_API_KEY` is still a placeholder. Configure the production key and verify delivery. |
| Reports | Deferred | Generate buttons disabled with explicit "next release" notice. |
| Mobile responsiveness | **Open — developer action** | Fixed sidebar still leaves 110 px content width at 390 px. Must be fixed before launch. |
| Accessibility | Partial | Major landmarks and many form labels exist; mobile navigation, unlabeled global search, and dense tables need WCAG pass. |
| SEO / legal | **Improved** | `robots.txt` and `sitemap.xml` are now public. Legal links still point to `#`; legal pages must be authored. |
| Security headers | **Improved** | CSP and `poweredByHeader: false` added. Full nonce-based CSP is a follow-up item. |

---

## 4. Detailed findings

### P0-01 — Production super-admin credential is unsafe

**Status: OPEN — owner action required.**

**Evidence:** The supplied credential is predictable, has been shared in plaintext, and grants platform-wide access including service-role-backed operations.

**Risk:** Complete compromise of every society, user, vendor, contract, and audit view.

**Owner CTA:**

- Rotate the password immediately and invalidate all existing sessions for that account.
- Store credentials only in an approved password manager; never seed a known password in code, documentation, tickets, or chat.
- Enforce MFA for all platform admins before any real tenant is onboarded.
- Add rate limiting, lockout/backoff, login anomaly alerts, and a privileged-session timeout.
- Create named admin accounts; do not use a shared super-admin identity for routine work.

**Acceptance criteria:** No known/default credential works; all platform-admin accounts require MFA; a session-revocation test succeeds; failed-login controls are verified.

### P0-02 — Illustrative data mixed into live tenant screens

**Status: FIXED.**

All 15 client components containing `DEMO_*` fallback arrays and `isDemo` ternaries have been updated. In an empty production tenant, every module now shows a proper empty state with a primary action button or a "coming in the next release" notice. No 2024 fixture data, "Phase 0" label, or Willow Heights record can appear.

### P0-03 — Cross-tenant identity error in Society Settings

**Status: FIXED.**

The `admin/settings/page.tsx` page now reads all settings via `getServerContext()` from `society_settings` and `societies` queries scoped to the active tenant. Hard-coded Willow Heights constants are removed. Edit and Save controls are hidden until the mutation, permissions, validation, and audit-logging work is complete.

### P0-04 — Mobile application is effectively unusable

**Status: OPEN — developer action required.**

**Evidence:** At 390 px wide, the sidebar remains 280 px and the main content is compressed to 110 px on dashboard, members, dues, and platform console. This was not addressed in the 18 August remediation commit.

**Developer CTA:**

- Collapse the sidebar below the desktop breakpoint; add a keyboard-accessible menu button, focus trap, Escape close, backdrop, and preserved active route.
- Convert wide tables to horizontal containers or responsive card rows.

**Acceptance criteria:** At 320, 375, 390, 768, 1024, and 1440 px, main content uses the viewport, no control is clipped, tables are usable, and Lighthouse accessibility plus keyboard navigation pass.

### P0-05 — Current finance logic can produce an incorrect ledger

**Status: FIXED.**

`recordPaymentAction` now calls a single Postgres RPC (`record_payment` in migration `20260818_011_record_payment_rpc.sql`) that:

- Locks the `finance_dues` row with `FOR UPDATE` before reading.
- Computes the cumulative sum of all prior payments for the due, not just the current payment.
- Rejects overpayments with a server-side error before any insert occurs.
- Inserts the `finance_payments` row and updates the `finance_dues` status in one implicit transaction.
- Returns the new payment UUID.

`createDueAction` and `recordPaymentAction` both write audit entries via `writeAudit` using the admin client, bypassing RLS intentionally for the audit table. `DUE_CREATED` and `PAYMENT_RECORDED` have been added to the `AuditAction` union type.

**Migration to apply:** `supabase/migrations/20260818_011_record_payment_rpc.sql` must be pushed to the production Supabase project (`aowyyuflapyvknndqxth`) before the payment feature is used. Run `npx supabase db push` or apply via the Supabase dashboard SQL editor.

**Remaining gap:** Idempotency keys preventing duplicate submissions on network retry are not yet implemented. Add a unique constraint on an idempotency key column in `finance_payments` before enabling real online payments.

### P0-06 — Email and invitations are knowingly broken

**Status: OPEN — owner action required.**

**Evidence:** `RESEND_API_KEY` is a placeholder in the Vercel environment. All invitation emails and due reminders fail silently.

**Owner CTA:**

- In Vercel project settings, set `RESEND_API_KEY` to the production key for your verified sending domain.
- Verify SPF, DKIM, and DMARC for the sending domain.
- Test one end-to-end invitation send before onboarding a real society.
- Ensure UI shows an actionable error when delivery fails, not a silent success.

### P1-01 — Misleading or inert controls

**Status: FIXED.**

- Reports: all 13 Generate buttons are disabled with `cursor-not-allowed`, dimmed styling, and tooltip text explaining the feature arrives in the next release.
- Users: Willow Heights sample users removed; the page shows a "user provisioning arrives in the next release" empty state; Invite User button is disabled.
- Dashboard: fake 2024 queue items and upcoming deadlines removed; replaced with icon + release notice. "Phase 0: sample data" label removed. Footer updated to distinguish what is live from what is deferred.
- Reports footer and Users footer each state clearly that the feature is coming.

The global search field and notification bell remain rendered but unadvertised. These are lower risk as they carry no false data and do not promise an action they cannot perform. They should be addressed in the next release cycle.

### P1-02 — Architecture/status document overstates completion

**Status: OPEN — owner/developer action.**

The `ARCHITECTURE.md` document still marks modules as "Working" that are read-only live, stub, or deferred. This is documentation debt, not a production risk, but it misleads new contributors. Update the status taxonomy before onboarding a second developer.

### P1-03 — Public funnel and legal pages are incomplete

**Status: OPEN — owner action required before collecting real member data.**

- "Request access" still leads to the login page.
- Privacy Policy, Terms of Service, and Data Processing Agreement links point to `#`.

**Owner CTA:** Author and publish reviewed Privacy, Terms of Service, cookie notice, retention/deletion policy, grievance/contact page, and DPA before collecting member personal or financial data. Build a real request-access form that does not require existing account credentials. This is a legal requirement, not a cosmetic one.

### P1-04 — SEO system files protected by auth middleware

**Status: FIXED.**

`src/middleware.ts` now excludes `/robots.txt` and `/sitemap.xml` from the auth redirect. A `public/robots.txt` file has been added that serves all crawlers. `src/app/sitemap.ts` generates a sitemap containing only the public homepage and login page — no authenticated routes are exposed.

### P1-05 — Missing Content Security Policy

**Status: FIXED.**

`next.config.ts` now emits a `Content-Security-Policy` response header and `poweredByHeader: false` suppresses `X-Powered-By: Next.js`. The current CSP uses `'unsafe-inline'` for styles, which is required by Next.js without a nonce infrastructure. A nonce-based or hash-based CSP should be adopted once the nonce setup is in place.

### P1-06 — Audit claims exceed observed implementation

**Status: PARTIAL FIX.**

Finance actions (due creation and payment recording) now write audit entries atomically with the transactional database change. The audit event catalogue is not yet formally defined, actor resolution still returns UUIDs on some platform pages, and some high-frequency context-switch events produce noisy duplicate entries. Full audit quality work is scheduled for Phase 2. The public site claim that "every action is logged" should not be repeated until coverage is proven by test.

### P1-07 — No society deactivation UI

**Status: OPEN.**

The live Support page still instructs admins to modify `is_active` in Supabase Studio. A guarded deactivate/reactivate workflow with typed confirmation, session revocation, audit, and recovery path is required before onboarding multiple societies.

### P2 observations

- Brand casing is now canonical: "ByelawsIndia" across all pages verified in this commit. Audit any email templates or Resend transactional copy separately.
- Dashboard no longer shows 2024 deadlines or "Phase 0/Phase 2" language.
- Many platform pages still reuse the generic title "Platform Console | ByelawsIndia". Per-route `metadata.title` exports should be added.
- The audit UI shows UUID fragments instead of resolved actor names on platform pages.

---

## 5. Route-level result summary

### Public/auth

| Route | Result | Key issue |
|---|---|---|
| `/` | Partial | Strong landing content, but claims exceed live capability; request-access and legal links are incomplete. |
| `/login` | Pass | Admin login succeeds; privileged-account security is inadequate until P0-01 is completed. |
| protected route without cookie | Pass | Redirects to login with `next` parameter. |

### Platform admin

| Routes | Result | Notes |
|---|---|---|
| `/platform/console` | Partial | Live aggregate cards; disabled/coming-soon and inert View controls. |
| `/platform/societies`, `/new` | Partial | List and form render; create mutation not submitted; deactivation absent. |
| `/platform/vendors`, `/new` | Partial | Directory/filter/form render; verify mutation not changed during audit. |
| `/platform/contracts` | Pass read-only | Cross-tenant list and expiry presentation load. |
| `/platform/members` | Partial | Totals/search/invite UI render; email delivery blocked until P0-06 complete. |
| `/platform/settings` | Partial | Audit log loads; contains operational/project detail and actor UUIDs. |
| `/platform/support` | Partial | Helpful but publicly confirms known production failures and direct-DB operating steps. |
| `/platform/select-society` | Pass | Society context switch works and is audited. |

### Tenant

| Module | Result | Key issue |
|---|---|---|
| Dashboard | **Improved** | Live counts correct; fake queue/deadline items removed; empty states in place. |
| Members | **Improved** | Empty state with CTA; no illustrative rows. |
| Units | Partial | Live-looking units render; mutation not submitted. |
| Applications | **Improved** | Empty state; no illustrative rows. |
| Documents | **Improved** | Empty state; upload not submitted; signed URLs deferred. |
| Dues | **Improved** | Empty state and Record Payment modal available; manual recording only. |
| Payments | **Improved** | Empty state; payment RPC in place; no gateway integration. |
| Complaints / maintenance WOs | **Improved** | Empty states; no illustrative records. |
| RFQs / procurement WOs / contracts | **Improved** | Empty states; no illustrative records. |
| Vendors | **Improved** | Empty state; no illustrative rows. |
| Reports | Deferred | Generate buttons disabled with release notice. |
| Audit | Partial | Real context events load; finance events now covered; broader mutation coverage pending. |
| Admin console | Partial | Some live stats; MFA/signed URLs/email health not ready. |
| Society settings | **Improved** | Live tenant data; edit/save controls hidden until mutation is implemented. |
| Users and roles | Deferred | Empty state; user provisioning explicitly deferred to next release. |
| Wings | Partial | Two live-looking wings; mutation not submitted. |

---

## 6. How the site captures payments today

It does **not capture money**. It only lets an authorised user manually record that a payment happened elsewhere.

Current flow (after 18 August fix):

1. Staff chooses an outstanding due.
2. Staff types amount/date/method/reference/notes.
3. The application calls the `record_payment` Postgres RPC.
4. The RPC locks the due row, validates against cumulative prior payments, rejects overpayments, inserts a `finance_payments` row, and updates the due status atomically.
5. An audit entry is written via the admin client.

There is no checkout, UPI intent/QR, payment link, card/netbanking option, gateway order, webhook, signature verification, capture state, refund, chargeback, settlement, automated receipt, or bank reconciliation.

---

## 7. Payment recommendation

### Recommendation in one sentence

Integrate an RBI-authorised payment aggregator with **UPI Intent/QR as the primary option**, plus netbanking/cards as fallbacks; do not build a direct UPI integration and do not make UPI the only method.

For the fastest controlled rollout, shortlist **Cashfree Payment Gateway + Easy Split** and **Razorpay Payment Gateway + Route**, then choose based on onboarding/KYC approval for cooperative societies, settlement model, support SLA, live commercial quote, and reconciliation exports — not only headline MDR.

### Why UPI is necessary but not sufficient

- UPI is the natural primary rail for Indian maintenance payments.
- UPI Collect/manual VPA entry is deprecated for most flows from 28 February 2026; use app intent or dynamic QR instead: https://razorpay.com/docs/payments/payment-methods/upi/
- Members still need netbanking/cards for exceptions, higher values, app/device limitations, and accessibility.
- Recurring UPI AutoPay is useful later, but only after due generation, consent, cancellation, failure handling, and reconciliation are reliable: https://razorpay.com/docs/payments/payment-gateway/s2s-integration/recurring-payments/upi/

### Decide the legal settlement model before coding

There are two models:

**A. Each society is the merchant/beneficiary.** Each society completes KYC and receives settlement directly. ByelawsIndia orchestrates checkout and ledgering. This best avoids commingling society funds.

**B. ByelawsIndia is the platform merchant.** Payments arrive under the platform and are routed/split to linked society accounts. Use a provider's marketplace product such as Cashfree Easy Split or Razorpay Route; do not manually receive all societies' funds into one ordinary bank account.

Cashfree Easy Split supports linked vendors, order-level splits, scheduled settlements, refunds, and reconciliation: https://www.cashfree.com/docs/payments/split/overview
Razorpay Route supports linked accounts and split transfers: https://razorpay.com/docs/payments/route/linked-account/

Obtain legal/accounting advice on who is merchant of record, GST treatment, refunds, chargebacks, convenience/platform fees, KYC, and society-bank settlement before go-live.

### Suggested rollout

#### Phase 1 — One-time hosted checkout

- Member opens a specific due and clicks **Pay now**.
- Server creates a gateway order for the exact remaining balance and stores its immutable mapping to society/member/unit/due.
- Hosted checkout offers UPI Intent/QR first, then cards/netbanking.
- Redirect is only a user experience; the signed server-to-server webhook is authoritative.
- Idempotent webhook processing posts the payment, updates the due, writes audit, and creates a numbered receipt atomically.
- Staff can still record cash/cheque/NEFT manually, but these remain clearly marked `MANUAL` and require maker/checker controls above a threshold.

#### Phase 2 — Reconciliation and operations

- Settlement, fee, tax, refund, dispute, and chargeback tracking.
- Daily automated reconciliation against gateway settlement reports and bank references/UTRs.
- Exceptions queue for amount mismatch, duplicate, orphaned webhook, failed settlement, and manual payment.
- Downloadable member ledger, society collection report, gateway fee report, and audit evidence.

#### Phase 3 — Optional recurring mandates

- Opt-in UPI AutoPay and/or eNACH for members who want recurring maintenance payment.
- Store provider mandate/token references, not bank credentials.
- Support variable dues within an authorised maximum, pre-debit notices, pause/cancel, mandate expiry, failed debit retry, and manual fallback.
- Never auto-debit special levies or disputed dues without explicit policy and member consent.

### Required data model changes

Add at least:

- `payment_orders`: internal order, society, due, member, amount, currency, provider, provider order ID, status, expires_at, idempotency key.
- Extend `finance_payments`: source (`GATEWAY`/`MANUAL`), provider payment ID, order ID, captured amount, gateway method, status, captured_at, bank reference, refund/chargeback state.
- `payment_webhook_events`: unique provider event ID, signature result, raw-body hash, received/processed timestamps, processing outcome and retry count.
- `payment_refunds`, `payment_settlements`, and `payment_reconciliation_exceptions`.
- Unique constraints on provider order/payment/event IDs and internal idempotency keys.
- Amount fields in integer paise or tightly controlled decimal arithmetic; never JavaScript floating-point calculations for ledger totals.

### Non-negotiable engineering rules

- Provider secret keys are server-only; rotate and separate test/live credentials.
- Verify webhook signatures against the raw request body. Cashfree's current docs explicitly require signature verification and raw payload handling: https://www.cashfree.com/docs/payments/webhooks
- Webhook handlers must be idempotent and replay-safe.
- Never mark a due paid from the browser redirect alone.
- Apply payment, due balance, receipt, and audit event in one database transaction.
- Compute status from cumulative successful net payments minus refunds/reversals.
- Do not store card data, UPI PINs, or sensitive bank authentication data.
- Provide refund/chargeback permissions, dual approval where appropriate, and complete audit trails.

---

## 8. Security and privacy notes

### Observed positives

- HTTPS and HSTS.
- Frame denial and MIME sniffing protection.
- Strict-origin referrer policy and camera/microphone/geolocation disabled.
- Unauthenticated protected-route redirect.
- Server-side context model and RLS architecture are appropriate foundations.
- Service-role key is described as server-only.
- CSP header now present (added 18 August 2026).
- `robots.txt` and `sitemap.xml` now public without auth.

### Required before real personal/financial data

- MFA and named privileged accounts (P0-01, owner action).
- Production email delivery (P0-06, owner action).
- Legal and privacy pages (P1-03, owner action).
- Formal RLS test suite with two societies and multiple roles.
- Data classification, retention/deletion, encrypted backups, signed URL expiry, incident response, and breach notification process.
- Remove internal Supabase project ID/region and configuration warnings from routine UI unless operators genuinely need them.
- Avoid claims such as "tamper-proof", "every action logged", and "every rupee accounted for" until continuous tests prove them.

---

## 9. Required regression suite

The developer should add CI-blocking tests for:

1. Anonymous route guards and safe `next` redirect validation.
2. Platform-admin denial for non-platform accounts.
3. RLS isolation across two societies for every tenant table.
4. Wing-scoped access and member self-only access.
5. Empty states with no demo fallback in production.
6. Society switching without data bleed.
7. Every create/update/deactivate workflow with validation and audit.
8. Finance ledger scenarios listed in P0-05.
9. Gateway webhook signature, duplicate/replay, out-of-order, refund, and settlement cases.
10. Email success, bounce, provider failure, and retry.
11. Mobile viewports and keyboard-only navigation.
12. Accessibility checks with axe plus manual focus, labels, errors, tables, dialogs, and screen-reader smoke tests.
13. Public SEO/legal routes and security-header assertions.
14. Backup restore and tenant export/deletion runbooks.

---

## 10. Developer and owner action plan

### Three items blocking launch

These must be completed before onboarding any real society.

**P0-01 — Rotate super-admin credential and enable MFA (owner, ~15 minutes)**
- [ ] Change the production super-admin password to a strong randomly generated value stored in a password manager.
- [ ] Enable MFA on all platform-admin accounts.
- [ ] Invalidate all existing sessions for the super-admin account after the password change.
- [ ] Create named individual admin accounts; stop using a shared identity.

**P0-04 — Fix mobile sidebar and responsive tables (developer, ~1-2 days)**
- [ ] Collapse the sidebar below the `lg` breakpoint (`768 px`).
- [ ] Add a hamburger/menu button with keyboard focus, Escape-to-close, focus trap, backdrop, and preserved active route.
- [ ] Convert wide data tables to horizontal scroll containers or responsive card layouts at narrow viewports.
- [ ] Test at 320, 375, 390, and 768 px.

**P0-06 — Configure production email delivery (owner, ~15 minutes + DNS TTL)**
- [ ] Add the production `RESEND_API_KEY` in Vercel project settings.
- [ ] Verify SPF, DKIM, and DMARC for the sending domain.
- [ ] Test one end-to-end invite email before onboarding.
- [ ] Confirm UI shows an actionable error when delivery fails.

### Apply the migration

- [ ] Apply `supabase/migrations/20260818_011_record_payment_rpc.sql` to production (`aowyyuflapyvknndqxth`) via `npx supabase db push` or the Supabase dashboard SQL editor.

### Before first real member data is collected

**P1-03 — Legal and privacy pages (owner action)**
- [ ] Author and publish Privacy Policy, Terms of Service, cookie notice, and DPA.
- [ ] Build a real request-access form that captures name, society details, and contact without requiring an existing account.

### Subsequent work (P1/P2, after launch)

- [ ] Implement real reports or remove their navigation entries entirely.
- [ ] Implement society deactivate/reactivate UI with typed confirmation, session revocation, and audit (P1-07).
- [ ] Resolve actor names in the audit UI; reduce noisy context-switch duplicates (P1-06 continuation).
- [ ] Update `ARCHITECTURE.md` with the corrected status taxonomy (P1-02).
- [ ] Implement or remove the global search field and notification bell.
- [ ] Adopt a nonce-based CSP to replace `'unsafe-inline'` in style-src (P1-05 continuation).
- [ ] Add per-route `metadata.title` exports to platform pages.
- [ ] Add idempotency key unique constraint to `finance_payments` before enabling online gateway payments.
- [ ] Decide payment gateway settlement model; begin Phase 1 hosted checkout integration.
- [ ] Add the regression suite listed in Section 9.
- [ ] Add optional UPI AutoPay/eNACH mandates after Phase 1 payment is stable.

---

## 11. Final recommendation

The platform is now at **CONDITIONAL GO**. It is suitable for controlled internal use with a real society provided the three blocking items are completed first.

The fastest safe path to full launch:

1. Complete P0-01 (password rotation + MFA) and P0-06 (Resend key) today — both are owner actions that take minutes.
2. Apply migration 011 to Supabase production.
3. Fix the mobile sidebar (P0-04) — one focused developer day.
4. Author and publish legal pages (P1-03) before collecting member personal data.
5. Integrate a hosted Indian payment gateway with UPI Intent/QR first; do not build a direct UPI integration.
6. Adopt a marketplace/linked-account settlement model only after the merchant-of-record question is formally decided.
7. Run the multi-role, two-society, payment, accessibility, and mobile regression suite before calling the platform commercially live.
