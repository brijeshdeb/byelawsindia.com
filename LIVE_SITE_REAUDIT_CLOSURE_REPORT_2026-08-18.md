# ByelawsIndia Live Site Re-Audit — Bug Closure Report

**Production:** https://www.byelawsindia.com  
**Re-audit date:** 18 August 2026  
**Compared against:** `LIVE_SITE_AUDIT_REPORT_2026-08-18.md`  
**Release decision:** **NO-GO — not all bugs are closed.**

---

## 1. Bottom line

Meaningful remediation has been deployed, especially around empty states, tenant settings, mobile tenant navigation, finance accounting logic, CSP, and disabling unfinished features. However, the product is not ready for real-society onboarding.

Of the 13 primary findings in the first audit:

| Result | Count |
|---|---:|
| Fully closed | 1 |
| Partially closed | 6 |
| Still open | 6 |

The re-audit also identified **one new P0 systemic authorization defect**: tenant-domain server actions do not enforce RBAC permissions, and database RLS generally checks society membership rather than action-level permission.

### Stop-ship items

1. **P0 — Server-side RBAC enforcement is missing for tenant mutations.**
2. **P0 — MFA and privileged session revocation remain unresolved.**
3. **P0 — Demo documents are injected into ordinary society contexts without tenant-level classification or isolation.**
4. **P0 — Email/invitations still fail silently because Resend is not configured.**
5. **P0/P1 — Finance remediation is incomplete: idempotency and atomic audit are absent, and it was not possible to run the regression suite.**

---

## 2. Re-audit coverage

- Re-tested the public production deployment and authenticated admin/tenant shells.
- Re-tested all 19 representative tenant routes used in the original audit.
- Re-tested eight platform-admin routes.
- Switched between Sunrise and Moonrise societies and compared tenant-scoped output.
- Re-tested 390 × 844 and 320 × 700 responsive behavior on dashboard, members, documents, dues, and platform console.
- Re-checked security headers, unauthenticated route protection, `robots.txt`, and `sitemap.xml`.
- Re-checked public Request Access and legal links.
- Reviewed the current finance action, payment RPC migration, RLS policies, domain server actions, middleware, reports, settings, and document fallbacks.
- Ran TypeScript type-check and the available test suite.

No business records were created, edited, verified, paid, uploaded, invited, or deleted. One normal society-context switch to Moonrise was performed and recorded in the audit log.

---

## 3. Original finding closure matrix

| ID | Original finding | Status | Re-audit evidence | Required next action |
|---|---|---|---|---|
| P0-01 | Unsafe super-admin credential / no MFA | **Open** | Existing sessions from the earlier audit remained authenticated; Admin Console still states `MFA enforcement — Phase 2`. Password rotation itself could not be safely verified without signing out and risking loss of audit access. | Rotate password, revoke every session, create named admins, enforce MFA, and provide evidence from a clean browser. |
| P0-02 | Demo data mixed into ordinary tenant screens | **Partial** | Members, applications, dues, payments, maintenance, procurement, vendors, and dashboard queues now show honest empty states. **Documents still show the same six 2023/2024 illustrative records in both Sunrise and Moonrise, without either society being clearly identified as a demo tenant.** Audit source also retains a latent demo fallback, although real audit rows prevented it from rendering. | Keep demo data as a sales capability, but store it only in explicitly classified demo tenants. Remove automatic UI fallbacks from ordinary/customer tenants and visibly label every demo context. |
| P0-03 | Wrong hard-coded society in Settings | **Closed** | Sunrise Settings shows Sunrise data; after switching, Moonrise Settings shows Moonrise registration, address, contact, and dates. No Willow Heights data rendered. | Keep two-tenant regression coverage. |
| P0-04 | Mobile app unusable | **Partial** | Tenant sidebar now collapses; main content uses 320/390 px and a labelled menu button is present. Platform console sidebar remains static and visible at mobile width, consuming roughly 780 px of vertical space before content; observed width also exceeded the 390 px viewport in one check. | Apply the responsive drawer implementation to the platform shell and test keyboard/focus behavior. |
| P0-05 | Incorrect finance ledger | **Partial** | New `record_payment` RPC locks the due, sums cumulative payments, rejects overpayment, and atomically inserts payment + updates due. Audit writing remains outside the transaction; no idempotency key/unique duplicate protection exists; action-level `finance.manage` authorization is absent. Tests could not execute. | Add idempotency, atomic critical audit, action permission enforcement, and executable payment concurrency/duplicate tests. |
| P0-06 | Email/invitations broken | **Open** | Platform Support still says `RESEND_API_KEY` is a placeholder, emails fail silently, and Admin Console shows Email relay Warning. | Configure verified sending domain/key and test invite, reset, reminder, bounce, failure, and retry. |
| P1-01 | Misleading or inert controls | **Partial** | Report Generate buttons and tenant Invite User are now disabled with next-release copy. Platform View buttons still do not navigate or open details; global search still produces no observed result; notifications remain coming soon. | Remove/disable remaining inert controls or implement them. |
| P1-02 | Architecture overstates completion | **Open** | `ARCHITECTURE.md` still labels the tenant shell “Working”, including reports and user/role management, while live UI says these arrive in the next release. | Use explicit Live / Read-only / Demo / Stub / Blocked statuses tied to tests. |
| P1-03 | Public funnel and legal pages incomplete | **Open** | Request Access still links to `/login`; Privacy Policy, Terms, and Data Processing still link to `#`. | Implement real onboarding and publish reviewed legal/privacy pages. |
| P1-04 | `robots.txt` and `sitemap.xml` auth-gated | **Open** | Production returns 307 to `/login?next=...` for both. Local middleware now appears to exclude them, indicating the fix is not effective in the deployed build. | Fix route/middleware behavior and assert HTTP 200 anonymously in deployment smoke tests. |
| P1-05 | Missing CSP / framework disclosure | **Partial** | CSP is now present and `X-Powered-By` is absent. CSP still permits both `'unsafe-eval'` and `'unsafe-inline'` for scripts, so it does not provide the intended strong XSS boundary. | Move to nonce/hash-based scripts and remove unsafe directives, using report-only rollout if necessary. |
| P1-06 | Audit claims exceed implementation | **Partial** | Finance due/payment audit calls were added, but payment audit is separate from the atomic RPC and can fail independently. Platform audit still contains many duplicate context-switch events and platform pages still resolve actors mostly as UUID fragments. | Make critical audit atomic, define event coverage, and reduce/no-op context noise. |
| P1-07 | Society deactivation requires direct DB edit | **Open** | Platform Support still instructs admins to change `is_active` in Supabase Studio. No deactivation UI is present. | Implement guarded deactivate/reactivate with typed confirmation, session revocation, impact preview, audit, and recovery. |

---

## 4. New P0 finding — RBAC is not enforced for tenant mutations

### Evidence

The current server actions for applications, documents, finance, maintenance, members, procurement, units, vendors, and wings contain no explicit action-level permission check such as `resolveUserContext()`, `hasPermission()`, or `PERMISSIONS.*`.

`getServerContext()` explicitly documents that it **does not load permissions**. It validates authentication and reads `societyId`, but it does not determine whether the caller has `finance.manage`, `member.create`, `document.upload`, or any other mutation permission.

The reviewed RLS policies for finance permit insert/update when `user_has_society_access(society_id)` is true. They do not require `finance.manage`. The `record_payment` RPC is granted to the entire `authenticated` role and runs as security invoker; it therefore inherits these society-access policies rather than action-level RBAC.

The repository’s own `PermissionGate` states that UI gating is not a security boundary. No matching server-side boundary was found in the tenant action files.

### Risk

A low-privilege society user may be able to invoke mutation actions directly even when the UI hides the control. Depending on the table/action, this could permit creating or altering members, dues, payments, documents, work orders, RFQs, vendors, units, wings, and applications within the user’s society.

This is a **broken function-level authorization** risk and is a stop-ship defect.

### Developer CTA

1. Add one authoritative `requirePermission(permission)` helper that:
   - authenticates the user;
   - resolves the selected society and wing;
   - reloads active assignments/roles from the database;
   - grants platform admin only after rechecking the profile flag;
   - throws before any read/write when permission is absent.
2. Call it at the top of every tenant server action with the exact permission required.
3. Strengthen database policies or expose controlled RPCs so direct PostgREST/RPC calls cannot bypass permission rules.
4. Never trust `created_by`, `recorded_by`, society, wing, or actor IDs supplied by the caller; derive them from authenticated context inside the trusted boundary.
5. Add negative tests with Member, Report Viewer, Finance Officer, Society Admin, Wing Admin, and Platform Admin accounts across two societies.

### Acceptance criteria

- A Member cannot create/update dues, payments, members, units, documents, vendors, RFQs, contracts, work orders, wings, or admin assignments.
- A Report Viewer cannot perform any mutation.
- A Finance Officer can perform only authorised finance operations in the assigned society/wing.
- A Wing Admin cannot mutate another wing when wing scope applies.
- Direct Supabase RPC/PostgREST attempts fail with the same denial as the UI/server action.
- All denials and privileged mutations have correct audit evidence.

---

## 5. Improvements confirmed live

The following changes are real and valuable:

- Dashboard fake 2024 work queue and deadlines were removed.
- Members now show an honest zero-state.
- Applications now show an honest zero-state.
- Dues and payments now show honest zero-states.
- Maintenance complaints and both work-order modules now show honest zero-states.
- RFQs, procurement contracts, and vendor pages now show honest zero-states.
- Society Settings is tenant-scoped and switches correctly between Sunrise and Moonrise.
- Tenant user-provisioning stub no longer shows fake Willow Heights users and its Invite button is disabled.
- Report Generate buttons are disabled rather than silently inert.
- Tenant mobile sidebar collapses at 320/390 px and exposes an accessible menu label.
- CSP was added and `X-Powered-By` was removed.
- Finance payment application now uses a row lock, cumulative totals, overpayment rejection, and an atomic payment/due-status RPC.
- TypeScript type-check passes.

---

## 6. Recommended demo-data strategy

Demo data is useful and appropriate because prospective clients need to see realistic workflows before deciding to adopt the platform. The defect is not the existence of demo data; it is the current ambiguity and automatic reuse of the same illustrative rows inside ordinary society contexts.

### Recommended operating model

Create one or more fully populated **Demo Societies** specifically for sales demonstrations. A prospective client should enter a clearly branded demo workspace rather than having demo rows silently appear whenever a new or empty customer tenant has no records.

Use an explicit tenant classification, for example:

```sql
alter table societies
  add column environment_type text not null default 'CUSTOMER'
  check (environment_type in ('CUSTOMER', 'DEMO', 'TEST'));
```

Demo rows remain tenant-scoped through `society_id`. If row-level classification is also needed for exports, seeding, or analytics, add `data_classification = 'DEMO'`, but the primary control should be an immutable tenant/environment classification.

### Required UX

- Show a persistent, high-visibility banner: **Demo Environment — fictitious data; no real transactions or communications.**
- Display a Demo badge in the sidebar, topbar, exports, reports, and printable receipts/documents.
- Use clearly fictional names, email domains, phone numbers, registration details, bank references, and documents.
- Provide a guided scenario or tour so sales users can demonstrate approvals, dues, complaints, procurement, and reporting consistently.
- Add a versioned **Reset Demo Data** action available only to platform administrators.

### Required safeguards

- Never inject demo rows into a `CUSTOMER` tenant because its query returned no data; show an honest empty state instead.
- Do not allow a tenant to change from `DEMO` to `CUSTOMER` merely by editing a flag after activity begins. Production onboarding should create a clean customer tenant or use an audited, purpose-built conversion process that excludes demo records.
- Block real payment gateway calls, payouts, email/SMS/WhatsApp delivery, external webhooks, and regulatory submissions from demo tenants.
- Prevent demo records from entering customer financial totals, platform commercial metrics, compliance evidence, real audit exports, reminders, settlement reconciliation, or backups intended for customer recovery.
- Prefix demo-generated identifiers where useful, such as `DEMO-MBR-*`, `DEMO-RFQ-*`, and `DEMO-PAY-*`.
- Deny uploads containing real personal documents unless the demo workspace is explicitly configured as a time-limited prospect sandbox with appropriate consent and deletion controls.
- Expire prospect demo access automatically and provide a platform-admin revoke action.

### Database and test acceptance criteria

- Every society is explicitly classified as `CUSTOMER`, `DEMO`, or `TEST`.
- Demo seeds can run only against a `DEMO` tenant and fail closed against `CUSTOMER` tenants.
- A customer tenant with zero records always renders empty states, never demo fallbacks.
- Demo tenants cannot invoke live payment, email, payout, webhook, or notification integrations.
- Cross-tenant tests prove demo rows are invisible to customer tenants and excluded from customer/platform production metrics.
- Resetting a demo tenant restores the same versioned scenario without affecting any other society.
- Exports and screenshots generated from demo tenants visibly identify the data as fictitious.

### Revised finding language

> Retain demo data as a sales feature, but isolate it in database-backed Demo Societies, label it continuously, and prohibit automatic demo fallbacks in customer tenant contexts.

---

## 7. Remaining route observations

### Tenant

| Route/module | Current result |
|---|---|
| Dashboard | Improved; live zero counts and honest next-release placeholders, but still contains Phase 2 language. |
| Members | Empty state correct. |
| Units/Wings | Four units and two wings render consistently in both contexts checked; mutation not submitted. |
| Applications | Empty state correct. |
| Documents | **Fail — the same illustrative records render in both societies without either context being classified or labelled as Demo.** |
| Dues/Payments | Empty state correct; ledger remediation only partially complete. |
| Maintenance | Empty states correct. |
| Procurement | Empty states correct. |
| Vendors | Empty state correct. |
| Reports | Clearly disabled/next release; capability remains unbuilt. |
| Audit | Real context-switch rows render; audit quality/atomicity remain incomplete. |
| Society Settings | Correctly tenant-scoped and read-only. |
| Tenant Users | Clearly disabled/next release; provisioning remains unbuilt. |

### Platform

| Route/module | Current result |
|---|---|
| Console | Loads, but View actions and global search remain inert; workflow configuration unavailable. |
| Societies | Directory/filter/switch render; deactivation unavailable. |
| Vendors | Directory/filters render; mutations not changed during re-audit. |
| Contracts | Read-only cross-tenant list renders. |
| User Management | UI renders; actual email invitations remain unsafe until email is configured. |
| Settings/Audit | Loads; actor UUIDs and noisy context events remain. |
| Support | Still documents broken email and direct database deactivation. |

---

## 8. Security/production checks

| Check | Result |
|---|---|
| HTTPS/HSTS | Pass |
| Anonymous `/dashboard` guard | Pass — 307 to login with `next` |
| CSP present | Partial — unsafe script directives remain |
| Frame denial / MIME / Referrer / Permissions Policy | Pass |
| `X-Powered-By` removed | Pass |
| Anonymous `robots.txt` | Fail — 307 to login |
| Anonymous `sitemap.xml` | Fail — 307 to login |
| MFA | Fail / not built |
| Old sessions revoked | Fail — prior audit sessions remained authenticated |
| Legal pages | Fail — `#` links |
| Request Access flow | Fail — routes to login |

---

## 9. Finance status

### Closed portions

- Cumulative partial-payment calculation.
- Overpayment rejection.
- Row lock for concurrent payments on the same due.
- Atomic insert of the payment and update of the due status.
- Finance audit calls added.

### Still missing

- Action-level `finance.manage` authorization.
- Idempotency key and unique duplicate-submit/replay protection.
- Audit in the same critical transaction as payment application.
- Automated regression evidence for exact, multiple partial, duplicate, concurrent, overpayment, refund/reversal, and cross-tenant cases.
- Online payment order/capture/webhook/refund/settlement lifecycle.
- Gateway reconciliation and bank settlement exceptions.

The site still **records payments received elsewhere**; it does not capture money online.

---

## 10. Automated verification result

### Passed

- `npm run type-check`

### Not executed successfully

- `npm test` did not run its 32 isolation tests because the required local Supabase test environment was unavailable. The suite failed during test-user sign-in and all 32 tests were skipped.

This means tenant isolation and RBAC cannot be claimed as verified. CI must provision its own deterministic Supabase test instance, run migrations/seeds, execute the tests, and fail the deployment if any test is skipped.

---

## 11. Prioritised developer checklist

### P0 — before any real society data

- [ ] Add server-side and database-enforced action-level RBAC to every tenant mutation.
- [ ] Add and run negative RBAC/isolation tests for multiple roles, wings, and two societies.
- [ ] Create explicitly classified Demo Societies and migrate demo fixtures into them.
- [ ] Remove automatic document/audit demo fallbacks from customer tenants.
- [ ] Add visible demo labelling and block real integrations for demo tenants.
- [ ] Rotate privileged credentials, revoke all sessions, and require MFA.
- [ ] Configure Resend and prove invite/reset/reminder/bounce/failure flows.
- [ ] Add payment idempotency and atomic critical audit.
- [ ] Make the isolation test environment reproducible in CI; zero skipped tests.

### P1 — before public commercial launch

- [ ] Fix the platform mobile sidebar/drawer.
- [ ] Disable or implement platform View, global search, and notifications.
- [ ] Make `robots.txt` and `sitemap.xml` anonymously accessible in production.
- [ ] Publish real Privacy, Terms, Data Processing, and grievance/contact pages.
- [ ] Implement a genuine Request Access flow.
- [ ] Add society deactivate/reactivate UI.
- [ ] Remove `'unsafe-eval'` and `'unsafe-inline'` from script CSP using nonces/hashes.
- [ ] Correct architecture/status documentation.
- [ ] Improve actor display and de-duplicate no-op context-switch audit entries.

### Product gaps still intentionally unbuilt

- [ ] Online UPI/card/netbanking payment collection and settlement.
- [ ] Report generation/export.
- [ ] Tenant user invitations/role assignment UI.
- [ ] Editable billing/workflow settings.
- [ ] Notification system and statutory deadline/action queues.

---

## 12. Final decision

**Not all bugs are closed. Keep the release classified as internal alpha/private beta.**

The team fixed several visible trust problems, but the newly identified server-side RBAC gap is more serious than the remaining cosmetic or incomplete-feature issues. The next production deployment should be blocked until:

1. action-level RBAC is enforced and proven with negative tests;
2. privileged access uses MFA with session revocation;
3. demo data is isolated, database-classified, visibly labelled, and cannot appear in customer tenants;
4. email works without silent failure; and
5. finance idempotency/audit guarantees are complete and tested.

Only after those pass should the site be re-audited for a customer-launch decision.
