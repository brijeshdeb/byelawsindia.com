# ByelawsIndia Live Site Audit and Payments Recommendation

**Production site:** https://www.byelawsindia.com  
**Audit date:** 18 August 2026  
**Architecture reviewed:** `ARCHITECTURE.md`, status dated 18 August 2026  
**Overall release decision:** **NO-GO for customer/society launch.** The platform-admin area is suitable for controlled internal use, but the tenant-facing product is still a mixture of live database counts, demo records, hard-coded settings, and non-functional controls.

---

## 1. Executive summary

The deployment is reachable, HTTPS is enforced, unauthenticated access to protected routes redirects to login, platform-admin login succeeds, society switching works, and the principal platform directories load without browser errors. The database/RLS architecture is directionally sound.

The live product nevertheless has five launch blockers:

1. **Demo data is presented inside live society workspaces.** Members, applications, documents, dues, payments, complaints, RFQs, work orders, contracts, vendors, reports, and users show illustrative 2023/2024 records whenever live tables are empty. This can be mistaken for real society data.
2. **The selected tenant is contradicted by hard-coded data.** While the active context is Sunrise Cooperative Housing Society, Society Settings shows “Willow Heights CHS” and an unrelated registration number/address.
3. **Mobile layouts are unusable.** At a 390 px viewport, the fixed 280 px sidebar remains visible and leaves only 110 px for the main application.
4. **Core controls advertise capabilities that do not exist.** Report “Generate”, Society Settings “Edit/Save Changes”, platform “View”, search, notifications, and parts of user administration are inert, illustrative, or explicitly deferred to “Phase 2”.
5. **Payments are only manually recorded.** The site does not collect money online. The existing payment action also has material accounting risks around partial payments, overpayments, duplicate submissions, transactional integrity, audit coverage, and reconciliation.

### Immediate owner decision

Do not onboard a real society until the P0 list in Section 10 is complete. If the site must remain publicly accessible, label it **Private Beta / Demo**, remove claims that imply all features are live, and restrict invitations to test users.

---

## 2. Scope and method

### Tested

- Public homepage and login experience.
- Authenticated super-admin login and routing.
- Platform console plus nine platform-admin routes.
- Society context switching.
- Dashboard plus eighteen tenant routes.
- Finance dues and Record Payment modal.
- Mobile behavior at 390 × 844 on four representative routes.
- Redirects, HTTPS, response security headers, `robots.txt`, and `sitemap.xml`.
- Architecture-to-production comparison and targeted source review of finance, reports, settings, and security headers.

### Not performed

- No society, vendor, member, due, payment, invite, document, complaint, RFQ, contract, or work order was created or changed.
- No real bank/UPI transaction was attempted because no gateway exists.
- No file upload, email-delivery, destructive action, penetration test, load test, or database-level RLS attack was performed.
- Role-denial tests could not be completed because only a platform-admin account was supplied. A full RBAC test needs at least Society Admin, Finance Officer, Report Viewer, Wing Admin, and Member accounts in two societies.

The audit covered **30 distinct production routes**, four mobile checks, and unauthenticated HTTP checks. “Passed” below means the observed read-only flow worked; it is not a certification of every mutation or security control.

---

## 3. Release scorecard

| Area | Status | Summary |
|---|---|---|
| Availability / HTTPS | Pass | Canonical domain loads; apex redirects to `www`; HSTS is present. |
| Unauthenticated route guard | Pass | `/dashboard` redirects to `/login?next=%2Fdashboard`. |
| Super-admin authentication | Pass with risk | Login succeeds, but the shared/default-style production credential must be rotated immediately. |
| Platform-admin shell | Partial | Main directories and filters load; several global controls are inert or coming soon. |
| Tenant isolation | Not fully verified | Context switch works, but only a platform admin was available; cross-tenant/RBAC denial needs dedicated test accounts. |
| Tenant workflows | Fail | Most modules substitute illustrative rows for empty live data. |
| Data accuracy | Fail | Live zero metrics coexist with fake activity; hard-coded settings name another society. |
| Finance/payment accounting | Fail | Manual recording exists; online collection, robust ledger logic, audit, idempotency, and reconciliation do not. |
| Email / invitations | Fail | Production UI itself confirms the Resend key is a placeholder and emails fail silently. |
| Reports | Fail | Generate buttons have no implementation. |
| Mobile responsiveness | Fail | Fixed sidebar leaves 110 px content width at 390 px. |
| Accessibility | Partial | Major landmarks and many form labels exist, but mobile navigation, unlabeled global search, inert controls, and dense tables need remediation and an automated/manual WCAG pass. |
| SEO / legal | Fail | `robots.txt` and `sitemap.xml` are auth-gated; legal links point to `#`; “Request access” routes to sign-in rather than a request flow. |
| Security headers | Partial | HSTS, frame denial, MIME protection, referrer, and permissions policies are present; CSP is missing and framework disclosure remains enabled. |

---

## 4. Detailed findings

### P0-01 — Production super-admin credential is unsafe

**Evidence:** The supplied credential is predictable, has been shared in plaintext, and grants platform-wide access including service-role-backed operations.

**Risk:** Complete compromise of every society, user, vendor, contract, and audit view.

**Developer CTA:**

- Rotate the password immediately and invalidate all existing sessions for that account.
- Store credentials only in an approved password manager; never seed a known password in code, documentation, tickets, or chat.
- Enforce MFA for all platform admins before any real tenant is onboarded.
- Add rate limiting, lockout/backoff, login anomaly alerts, and a privileged-session timeout.
- Create named admin accounts; do not use a shared super-admin identity for routine work.

**Acceptance criteria:** No known/default credential works; all platform-admin accounts require MFA; a session-revocation test succeeds; failed-login controls are verified.

### P0-02 — Illustrative data is mixed into live tenant screens

**Evidence:** The live tenant pages show illustrative rows when their real queries return no records. Examples include 2024 members, applications, payments, dues, maintenance, procurement, contracts, documents, vendors, and users. The dashboard says live counts are zero while simultaneously showing fake pending approvals and deadlines.

**Risk:** A society may act on fictitious financial or compliance information. This is especially serious for dues, payments, contracts, and audit/compliance screens.

**Developer CTA:** Remove all runtime demo fallbacks from production. Use a proper empty state with a primary action, or place demo content in a separately branded, isolated demo tenant whose data cannot be confused with customer records.

**Acceptance criteria:** In an empty production tenant, every module shows zero/empty state only; no `demo-*`, 2024 fixture, “Phase 0”, or “illustrative” record appears.

### P0-03 — Cross-tenant identity error in Society Settings

**Evidence:** Active context: Sunrise Cooperative Housing Society. `/admin/settings`: “Willow Heights CHS”, unrelated registration number and Mumbai address, hard-coded in the page source.

**Risk:** Severe trust failure and potential future tenant-data leakage if the stub is later connected incorrectly.

**Developer CTA:** Replace all constants with `society_settings` and `societies` queries scoped through `getServerContext()`. Hide edit/save controls until mutations, permissions, validation, and audit logging are implemented.

**Acceptance criteria:** Switching between Sunrise and Moonrise changes every setting to the correct tenant; a two-tenant automated test proves no cross-tenant value is rendered or updated.

### P0-04 — Mobile application is effectively unusable

**Evidence:** At 390 px wide, the sidebar remains 280 px and the main content is compressed to 110 px on dashboard, members, dues, and platform console.

**Developer CTA:** Collapse the sidebar below the desktop breakpoint; add a keyboard-accessible menu button, focus trap, Escape close, backdrop, and preserved active route. Convert wide tables to horizontal containers or responsive card rows.

**Acceptance criteria:** At 320, 375, 390, 768, 1024, and 1440 px, main content uses the viewport, no control is clipped, tables are usable, and Lighthouse accessibility plus keyboard navigation pass.

### P0-05 — Current finance logic can produce an incorrect ledger

**Evidence from `recordPaymentAction`:**

- A payment row is inserted, then the due is updated in a separate operation without a database transaction.
- The due status is based only on the latest `amountPaid`, not the cumulative sum of all successful payments.
- An overpayment is accepted.
- The result of the due-status update is not checked.
- No idempotency key prevents double-submit or webhook replay.
- No finance audit entry is written despite the architectural claim that privileged actions are audited.
- The current table represents a recorded payment, not a gateway order/payment lifecycle.

**Developer CTA:** Move payment application into a PostgreSQL transaction/RPC that locks the due, validates the remaining balance, inserts exactly once, computes cumulative paid amount, updates status, and writes the audit entry atomically. Reject or explicitly allocate overpayments. Add unique idempotency constraints.

**Acceptance criteria:** Automated tests cover exact, partial, multiple-partial, final partial, duplicate, concurrent, overpayment, reversed/refunded, and cross-tenant cases; ledger balance always equals due minus successful net payments.

### P0-06 — Email and invitations are knowingly broken

**Evidence:** Platform Support states `RESEND_API_KEY` is a placeholder and all invitations/reminders fail silently.

**Developer CTA:** Configure a verified sending domain, SPF/DKIM/DMARC, production Resend key, bounce/complaint webhooks, retry policy, and visible delivery status. Do not report success when delivery was not queued.

**Acceptance criteria:** Invite, password reset, due reminder, and failure/bounce scenarios are tested end to end; UI shows actionable errors.

### P1-01 — Misleading or inert controls

Observed examples:

- Reports: 13 enabled “Generate” buttons with no action.
- Society Settings: enabled Edit and Save buttons on a read-only hard-coded page.
- Platform overview: “View” buttons do not expose a destination in the observed UI.
- Global search is rendered throughout but has no demonstrated search behavior.
- Notifications is explicitly “coming soon”.
- “Configure Workflows” and “View All” are presented as unavailable/coming soon.

**Developer CTA:** Implement each control or remove/disable it with an explicit beta label and no misleading affordance. Never leave a primary button that silently does nothing.

### P1-02 — Architecture/status document overstates completion

The architecture marks the society dashboard, member directory, applications, documents, finance, maintenance, procurement, reports, settings, users, and wings as “Working”. Production and source show many are demo fallbacks or Phase 0/Phase 2 stubs.

**Developer CTA:** Replace “Working” with one of: `Live + mutation tested`, `Read-only live`, `Demo`, `Stub`, `Blocked`, or `Not built`. Add a release checklist tied to executable E2E tests.

### P1-03 — Public funnel and legal pages are incomplete

**Evidence:** “Request access” leads to the login page; the login page offers registration but email is broken; Privacy Policy, Terms of Service, and Data Processing links point to `#`.

**Developer CTA:** Build a real request-access/onboarding funnel and publish reviewed Privacy, Terms, cookie, retention/deletion, grievance/contact, and data-processing pages before collecting member personal/financial data.

### P1-04 — SEO system files are protected by auth middleware

**Evidence:** Unauthenticated requests to `/robots.txt` and `/sitemap.xml` redirect to login.

**Developer CTA:** Exclude these routes from auth middleware and generate a sitemap containing only public pages. Add canonical, Open Graph, favicon/manifest, and structured organization/software metadata as appropriate.

### P1-05 — Missing Content Security Policy

**Evidence:** Production has HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer Policy, and Permissions Policy, but no `Content-Security-Policy`. `X-Powered-By: Next.js` is exposed on the public page.

**Developer CTA:** Add a tested nonce/hash-based CSP, set `poweredByHeader: false`, and prefer CSP `frame-ancestors 'none'` alongside frame denial. Roll out CSP in report-only mode first if required.

### P1-06 — Audit claims exceed observed implementation

The public site says every action is logged and the log is tamper-proof. Finance actions reviewed do not write an audit record. Platform context switching is logged, but many repeats produce noisy entries.

**Developer CTA:** Define the authoritative event catalogue, require critical audit writes in the same transaction as financial/admin changes, add human-readable actor resolution, and reduce duplicate/no-op context events. Change public claims until coverage is proven.

### P1-07 — No society deactivation UI

The live Support page instructs admins to modify `is_active` in Supabase Studio.

**Developer CTA:** Add a guarded deactivate/reactivate workflow with impact preview, typed confirmation, session revocation, audit, and recovery path. Production operators should not need direct table edits.

### P2 observations

- Many platform pages reuse the generic title “Platform Console | ByelawsIndia”, reducing browser/history clarity.
- Platform admin totals and society dashboard totals use different meanings; label the metric source and definition (members vs active users/access assignments).
- Top-level dashboard still uses old 2024 deadlines and “Phase 0/Phase 2” language on a live product.
- The audit UI shows UUID fragments instead of resolved actor names on platform pages, making investigations slow.
- The brand appears as both “ByelawsIndia” and “Byelawsindia”; standardise casing.
- Add empty/loading/error states and user-visible retry paths to every server-rendered directory.

---

## 5. Route-level result summary

### Public/auth

| Route | Result | Key issue |
|---|---|---|
| `/` | Partial | Strong landing content, but claims exceed live capability; request-access and legal links are incomplete. |
| `/login` | Pass | Admin login succeeds; privileged-account security is inadequate until password rotation and MFA. |
| protected route without cookie | Pass | Redirects to login with `next` parameter. |

### Platform admin

| Routes | Result | Notes |
|---|---|---|
| `/platform/console` | Partial | Live aggregate cards; disabled/coming-soon and inert View controls. |
| `/platform/societies`, `/new` | Partial | List and form render; create mutation not submitted; deactivation absent. |
| `/platform/vendors`, `/new` | Partial | Directory/filter/form render; verify mutation not changed during audit. |
| `/platform/contracts` | Pass read-only | Cross-tenant list and expiry presentation load. |
| `/platform/members` | Partial | Totals/search/invite UI render; email delivery is broken. |
| `/platform/settings` | Partial | Audit log loads; contains operational/project detail and actor UUIDs. |
| `/platform/support` | Partial | Helpful but publicly confirms known production failures and direct-DB operating steps. |
| `/platform/select-society` | Pass | Society context switch works and is audited. |

### Tenant

| Module | Result | Key issue |
|---|---|---|
| Dashboard | Fail | Live zeros mixed with fake 2024 queue/deadlines. |
| Members | Fail | Illustrative rows replace empty live state. |
| Units | Partial | Live-looking units render; mutation not submitted. |
| Applications | Fail | Illustrative 2024 rows. |
| Documents | Fail | Illustrative rows; upload not submitted; signed URLs deferred. |
| Dues | Fail | Illustrative financial data; manual payment form only. |
| Payments | Fail | Illustrative payments; no gateway/settlement status. |
| Complaints / maintenance WOs | Fail | Illustrative 2024 records. |
| RFQs / procurement WOs / contracts | Fail | Illustrative records and dates. |
| Vendors | Fail | Illustrative rows differ from platform vendor records. |
| Reports | Fail | Generate buttons are stubs. |
| Audit | Partial | Real context events load; broader mutation coverage unproven. |
| Admin console | Partial | Some live stats; MFA/signed URLs/email health not ready. |
| Society settings | Fail | Wrong hard-coded society; inert controls. |
| Users & roles | Fail | Illustrative Willow users; live provisioning deferred. |
| Wings | Partial | Two live-looking wings; mutation not submitted. |

---

## 6. How the site captures payments today

It does **not capture money**. It only lets an authorised user manually record that a payment happened elsewhere.

Current flow:

1. Staff chooses an outstanding due.
2. Staff types amount/date/method/reference/notes.
3. The application inserts a `finance_payments` row.
4. It marks the due Paid or Partially Paid.

There is no checkout, UPI intent/QR, payment link, card/netbanking option, gateway order, webhook, signature verification, capture state, refund, chargeback, settlement, automated receipt, or bank reconciliation.

---

## 7. Payment recommendation

### Recommendation in one sentence

Integrate an RBI-authorised payment aggregator with **UPI Intent/QR as the primary option**, plus netbanking/cards as fallbacks; do not build a direct UPI integration and do not make UPI the only method.

For the fastest controlled rollout, shortlist **Cashfree Payment Gateway + Easy Split** and **Razorpay Payment Gateway + Route**, then choose based on onboarding/KYC approval for cooperative societies, settlement model, support SLA, live commercial quote, and reconciliation exports—not only headline MDR.

### Why UPI is necessary but not sufficient

- UPI is the natural primary rail for Indian maintenance payments.
- UPI Collect/manual VPA entry is deprecated for most flows from 28 February 2026; use app intent or dynamic QR instead: https://razorpay.com/docs/payments/payment-methods/upi/
- Members still need netbanking/cards for exceptions, higher values, app/device limitations, and accessibility.
- Recurring UPI AutoPay is useful later, but only after due generation, consent, cancellation, failure handling, and reconciliation are reliable: https://razorpay.com/docs/payments/payment-gateway/s2s-integration/recurring-payments/upi/

### Decide the legal settlement model before coding

There are two models:

**A. Each society is the merchant/beneficiary.** Each society completes KYC and receives settlement directly. ByelawsIndia orchestrates checkout and ledgering. This best avoids commingling society funds.

**B. ByelawsIndia is the platform merchant.** Payments arrive under the platform and are routed/split to linked society accounts. Use a provider’s marketplace product such as Cashfree Easy Split or Razorpay Route; do not manually receive all societies’ funds into one ordinary bank account.

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
- Verify webhook signatures against the raw request body. Cashfree’s current docs explicitly require signature verification and raw payload handling: https://www.cashfree.com/docs/payments/webhooks
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

### Required before real personal/financial data

- MFA and named privileged accounts.
- CSP, secure dependency/security scanning, SAST/DAST, secrets scanning, and regular backups with restore tests.
- Formal RLS test suite with two societies and multiple roles.
- Data classification, retention/deletion, encrypted backups, signed URL expiry, incident response, and breach notification process.
- Legal/privacy pages and a designated security/privacy contact.
- Remove internal Supabase project ID/region and configuration warnings from routine UI unless operators genuinely need them.
- Avoid claims such as “tamper-proof”, “every action logged”, and “every rupee accounted for” until continuous tests prove them.

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

## 10. Crystal-clear developer action plan

### P0 — Stop-ship, complete before onboarding any real society

- [ ] Rotate the exposed super-admin password; revoke sessions; create named admin identities; enforce MFA.
- [ ] Remove every production demo fallback and all stale 2024 illustrative rows/deadlines.
- [ ] Replace hard-coded Willow Heights settings/users with tenant-scoped live queries or remove those pages.
- [ ] Fix the mobile shell/sidebar at 320–768 px.
- [ ] Fix payment ledger atomicity, cumulative partial payments, overpayment, duplicate prevention, checked updates, and audit writes.
- [ ] Configure and verify production email delivery; stop silent failures.
- [ ] Remove or disable every inert primary action.
- [ ] Add two-society/multi-role RLS regression tests.

### P1 — Complete before public commercial launch

- [ ] Implement real reports and tenant settings, or remove their navigation entries.
- [ ] Publish Privacy, Terms, Data Processing, retention/deletion, and contact/grievance pages.
- [ ] Implement a real Request Access/onboarding funnel.
- [ ] Exclude `robots.txt` and `sitemap.xml` from auth middleware; add public metadata/canonical support.
- [ ] Add CSP and disable `X-Powered-By`.
- [ ] Implement society deactivate/reactivate UI with audit and session revocation.
- [ ] Resolve actor names and improve audit event quality/coverage.
- [ ] Reconcile the architecture/status document with actual implementation.

### P1 — Payments product decision

- [ ] Decide whether societies are direct merchants or linked beneficiaries under the platform.
- [ ] Obtain live proposals and sandbox access from Cashfree and Razorpay.
- [ ] Choose based on CHS onboarding/KYC, linked-account settlement, webhook/reconciliation quality, support, and commercial terms.
- [ ] Build Phase 1 hosted checkout with UPI Intent/QR + netbanking/cards and signed idempotent webhooks.
- [ ] Add receipts, refunds, settlements, reconciliation, exceptions, and finance audit.

### P2 — After stable one-time payments

- [ ] Add optional UPI AutoPay/eNACH mandates with consent, pre-debit, cancellation, and failure handling.
- [ ] Add automated reminders/notifications and member self-service ledger/receipts.
- [ ] Add observability dashboards, payment SLOs, and incident runbooks.

---

## 11. Final recommendation

Treat the current deployment as an **internal alpha**, not a finished live society-management platform. The fastest safe path is:

1. Secure privileged access.
2. Remove demo/hard-coded data and fix mobile.
3. Make the ledger correct and auditable.
4. Finish email, legal, and empty-state behavior.
5. Integrate a hosted Indian payment gateway with UPI Intent/QR first, not a standalone direct UPI build.
6. Add marketplace/linked-account settlement only after the merchant-of-record model is formally decided.
7. Run the multi-role, two-society, payment, accessibility, and mobile regression suite before onboarding the first real society.

Only then should marketing call the site “live” for customers.
