# ByelawsIndia Portal — Architecture & Feature Reference

> Status as of: 21 August 2026
> Supabase project: `aowyyuflapyvknndqxth` (eu-west-1)
> Deployed: Vercel

---

## 1. Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 — App Router, React Server Components |
| Language | TypeScript (strict, noUncheckedIndexedAccess) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT + httpOnly cookie) |
| ORM / Query | Supabase JS client with PostgREST |
| Row Security | PostgreSQL RLS — every tenant table is protected |
| UI primitives | Radix UI |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query (client components) |
| Table | TanStack Table |
| Forms | React Hook Form + Zod |
| Email | Supabase Auth plus Resend-backed queued delivery, retry, webhook and delivery history |
| Hosting | Vercel |

---

## 2. High-Level Architecture

```
Browser
  │
  ├── Next.js Middleware (session refresh + route guards)
  │
  ├── Route Group: (auth)
  │     /login, /register
  │
  └── Route Group: (app)
        │
        ├── /select-context          ← context selector after login
        │
        ├── Route Group: (platform)  ← Platform Admin shell
        │     Verified: is_platform_admin = true in DB
        │
        └── Route Group: (shell)     ← Society / Tenant shell
              Verified: active session + chs_selected_context cookie
```

The two shells are completely independent. Platform admins see a different
sidebar, topbar, and layout from society users. The same user account can
hold both flags.

---

## 3. Route Map

### Platform Admin Shell (`/platform/*`)

| Route | Purpose |
|---|---|
| `/platform/console` | System overview — society count, member count, vendor count, recent audit entries |
| `/platform/societies` | Cross-tenant society directory — search, filter, Switch to Society action |
| `/platform/societies/new` | Register a new society |
| `/platform/vendors` | Cross-tenant vendor directory — search, filter by type and status, Verify / Unverify toggle |
| `/platform/vendors/new` | Add a vendor to a society |
| `/platform/contracts` | Cross-tenant contracts list — colour-coded expiry (red ≤7 days, amber ≤30 days) |
| `/platform/members` | Platform-level user management — invite users, deactivate accounts |
| `/platform/settings` | Audit log viewer — filter by action, entity, time window |
| `/platform/support` | Admin FAQ and quick-access links |
| `/platform/select-society` | Manual society context switcher |

### Society / Tenant Shell (`/dashboard`, `/members`, etc.)

| Route | Purpose |
|---|---|
| `/dashboard` | Society dashboard — key metrics and recent activity |
| `/members` | Member directory |
| `/members/statutory-registers` | Form I and Form J manual register, atomic Excel import, Excel/PDF/print exports and immutable snapshots |
| `/members/nominations` | Nominee records, percentage validation and Society Admin decisions |
| `/members/associates` | Associate applications, fees, approval and member-register creation |
| `/units` | Unit (flat/shop) registry |
| `/applications` | Member application queue and approval workflow |
| `/service-requests` | Member service requests, approval history and generated letters/forms |
| `/documents` | Society document repository |
| `/finance/dues` | Maintenance due management |
| `/finance/payments` | Payment recording |
| `/maintenance/complaints` | Member complaints and service requests |
| `/maintenance/work-orders` | Maintenance work order tracking |
| `/procurement/rfqs` | Request for Quotation management |
| `/procurement/work-orders` | Procurement work order issuance |
| `/procurement/contracts` | Society-scoped contract management |
| `/vendors` | Society-scoped vendor directory |
| `/vendor` | Isolated vendor portal for RFQs, quotations, documents, contracts and renewals |
| `/notifications` | Portal notification inbox and read history |
| `/search` | Society-scoped global search |
| `/reports` | Reports hub |
| `/reports/audit` | Society audit log |
| `/admin/console` | Society admin — overview and settings |
| `/admin/settings` | Society configuration |
| `/admin/users` | Society user and role management |
| `/admin/wings` | Wing management |
| `/profile` | Authenticated self-service password change for every account type |
| `/reset-password` | Public password recovery request and secure recovery completion |

---

## 4. Database Schema

### Core / Identity Tables

| Table | Purpose |
|---|---|
| `profiles` | Extended user record linked to `auth.users`. Holds `is_platform_admin` flag and `is_active`. |
| `login_activity` | Login event log (success, failure, logout). |
| `societies` | Top-level tenant entity. Every transactional table references `society_id`. |
| `society_settings` | Per-society numbering, timezone, payment and renewal-notification configuration. |
| `sequences` | Atomic counter table — drives `get_next_sequence()` DB function for number generation. |
| `wings` | Physical blocks/wings within a society. |
| `units` | Individual flats/shops within a wing. |

### RBAC Tables

| Table | Purpose |
|---|---|
| `roles` | Global role definitions (not society-scoped at definition level). |
| `permissions` | Permission codes — must match `PERMISSIONS` const in TypeScript exactly. |
| `role_permissions` | Many-to-many: which permissions belong to which role. |
| `user_access_assignments` | A user's role assignment for a specific society (and optionally a specific wing). This is the scope record. |

### Domain / Transactional Tables

| Table | Key Columns |
|---|---|
| `members` | `society_id`, `unit_id`, `member_number`, `member_type`, `status` |
| `society_documents` | `society_id`, `document_type`, `storage_path`, `is_verified` |
| `member_applications` | `society_id`, `applicant_user_id`, `status`, workflow state columns |
| `vendors` | `society_id`, `vendor_code`, `vendor_type`, `status`, `is_verified` |
| `maintenance_complaints` | `society_id`, `unit_id`, `category`, `status`, `assigned_to` |
| `maintenance_work_orders` | `society_id`, `complaint_id`, `vendor_id`, `status` |
| `rfqs` | `society_id`, `rfq_number`, `status`, `closing_date` |
| `procurement_work_orders` | `society_id`, `rfq_id`, `vendor_id`, `status` |
| `contracts` | `society_id`, `vendor_id`, `rfq_id`, `status`, `start_date`, `end_date`, `auto_renew` |
| `finance_dues` | `society_id`, `member_id`, `unit_id`, `due_type`, `amount`, `status` |
| `finance_payments` | `society_id`, `due_id`, `payment_method`, `amount_paid`, `payment_date` |
| `audit_logs` | `society_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values` |
| `approval_workflows`, `approval_workflow_steps`, `approval_instances`, `approval_decisions` | Configurable and auditable staged approvals |
| `application_checklist_items`, `application_status_history` | Member-document checklist and application timeline |
| `joint_members`, `nominations`, `nominees`, `associate_memberships` | Detailed membership and statutory relations |
| `service_requests`, `service_request_status_history` | Society service workflow and immutable status history |
| `master_data_items`, `content_templates`, `generated_documents` | Configurable master data, versioned templates and generated outputs |
| `vendor_users`, `vendor_documents`, `vendor_performance_reviews` | Isolated vendor access, compliance files and performance history |
| `rfq_invitations`, `quotations`, `quotation_items`, `quotation_evaluations`, `vendor_selections` | End-to-end procurement workflow |
| `contract_renewals` | Renewal intimation, vendor quotation and Society Admin decision |
| `notifications`, `notification_deliveries` | Portal/email queue, retries and delivery events |
| `finance_refunds`, `finance_adjustment_requests` | Refund/waiver maker-checker workflow |

### Migration History

| Migration | Description |
|---|---|
| `000` | PostgreSQL extensions (uuid-ossp, pgcrypto, pg_trgm) |
| `001` | profiles + login_activity + handle_new_user trigger |
| `002` | societies + society_settings + sequences + get_next_sequence() |
| `003` | wings + units |
| `004` | roles + permissions + role_permissions (seeded with 11 roles) |
| `005` | user_access_assignments |
| `006` | audit_logs |
| `007` | RLS policies + user_has_society_access() helper function |
| `008` | Table grants (anon, authenticated roles) |
| `009` | All domain/transactional tables |
| `010` | Service role grants (PostgREST schema reload) |

---

## 5. Security Model

### Layer 1 — Middleware (edge)

`src/middleware.ts` runs on every non-static request. It refreshes the
Supabase session cookie and enforces:

- `/` redirects authenticated users to `/select-context`, unauthenticated users see the marketing page.
- Auth routes (`/login`) bounce authenticated users to `/dashboard`.
- All other routes require a valid session; missing session redirects to `/login?next=<path>`.

### Layer 2 — Layout server components

`(app)/layout.tsx` — calls `supabase.auth.getUser()`. Redirects to `/login` if
no valid user token.

`(platform)/layout.tsx` — additionally reads `is_platform_admin` from the
`profiles` table in the DB. Redirects non-admins to `/dashboard`.

`(shell)/layout.tsx` — reads the `chs_selected_context` cookie (httpOnly,
`societyId` + optional `wingId`). Resolves the user's permissions for that
society via `AccessService.resolveUserContext()`.

### Layer 3 — Server actions

Every server action that touches data calls `requireCurrentUser()` or
`getServerContext()` at the top of the function body, re-validating the
session and admin flag from the DB on every call. There is no trust of
client-supplied identity.

Platform admin mutations (`verifyVendor`, `addVendor`, `registerSociety`,
`switchToSociety`) additionally check `caller.is_platform_admin` and throw
`Forbidden` if false.

### Layer 4 — Database (PostgreSQL RLS)

Every tenant table has RLS enabled. The `user_has_society_access()` function
checks `user_access_assignments` for the current `auth.uid()`. Rows belonging
to a different society are invisible — they return empty rather than an error.

The service-role client (`createAdminClient()`) bypasses RLS intentionally for
platform admin operations. It is a server-side singleton — the service role key
is never sent to the browser.

### Key Security Rules (non-negotiable)

- Service role key: server-only, never in browser bundle.
- `RESEND_API_KEY`: server-only. Missing configuration leaves email deliveries queued/retryable without exposing the key.
- `society_id` is present on every transactional record. No record exists without tenant scope.
- Frontend filters are UX only. Authorization is enforced at DB layer.
- Storage paths use generated IDs, not raw member names or Aadhaar/PAN.
- Vendor A cannot see Vendor B's quotations (RLS + application logic).
- Platform Owner has cross-society oversight, configuration and account-recovery access but cannot make society operational decisions.
- Final society decisions require an active, society-wide Society Admin for the same society; the database rejects Platform Owner or cross-society attempts.

---

## 6. Context and Session System

After login, the user is sent to `/select-context`. The page calls
`AccessService.getAccessOptions()` which returns all societies and wings the
user has an active assignment for. Platform admins also see a "Platform Admin"
synthetic option.

On selection, a POST to `/api/auth/select-context` sets:

```
chs_selected_context = { societyId: "<uuid>", wingId: "<uuid> | null" }
```

Cookie properties: `httpOnly`, `sameSite: lax`, `secure` in production, `path: /`.

All subsequent tenant server actions call `getServerContext()` which reads this
cookie and returns a typed `ServerContext` object containing the Supabase
client, `userId`, `societyId`, and `wingId`.

Platform admins can switch into any society for oversight via the "Switch"
action. This never grants operational approval authority: application,
finance, procurement, service-request, nomination, associate, renewal and
document decisions explicitly reject Platform Owner sessions.

---

## 7. RBAC — Roles and Permissions

### System Roles (seeded, cannot be deleted)

| Role | Scope | Key Permissions |
|---|---|---|
| Society Admin | Society-wide | Full access to all modules |
| Wing Admin | Wing-scoped | Full access within their wing |
| Application Officer | Society or Wing | application.read/verify, document.read/upload/verify |
| Application Authority | Society or Wing | application.approve.level2 |
| Society Treasurer | Society-wide | Record/reconcile payments and raise refund/waiver requests; cannot self-approve adjustments |
| Documents Officer | Society or Wing | document.read/upload/verify/archive |
| Procurement Officer | Society or Wing | rfq.create/publish/evaluate, quotation.evaluate/compare, contract.create |
| Procurement Authority | Society-wide | First-stage vendor-selection approval |
| Procurement Authority 2 | Society-wide | Second-stage vendor-selection approval |
| Finance Officer | Society or Wing | finance.view/manage |
| Report Viewer | Society or Wing | report.view (read-only) |
| Member (Read-only) | Self | Own records, submitted applications, service_request.create |
| Vendor | Vendor-scoped | Own profile/documents, invited RFQs, quotations, work orders, contracts and renewals |

The three-stage member flow is Application Officer → Application Authority →
same-society Society Admin. The three-stage vendor-selection flow is
Procurement Authority 1 → Procurement Authority 2 → same-society Society
Admin. Platform Owner is excluded from every stage.

### Permission Code Format

`<module>.<action>` — e.g. `members.read`, `application.approve.level1`,
`finance.manage`. Codes are defined in `src/types/index.ts` as the `PERMISSIONS`
const and seeded into the `permissions` table in migration 004. The two must
stay in sync or authorization silently fails.

---

## 8. Key Library Modules

| Module | File | Purpose |
|---|---|---|
| Admin client | `src/lib/supabase/admin.ts` | `createAdminClient()` — service role singleton, server-only, bypasses RLS |
| SSR client | `src/lib/supabase/server.ts` | `createClient()` — user-session client for server components and actions |
| Browser client | `src/lib/supabase/client.ts` | `createBrowserClient()` — used only in client components |
| Middleware client | `src/lib/supabase/middleware.ts` | Session refresh in edge middleware |
| Auth helpers | `src/lib/auth/index.ts` | `getCurrentUser()`, `requireCurrentUser()`, `disableUserAccount()`, `getClientIp()` |
| Context helpers | `src/lib/context.ts` | `getServerContext()`, `nextSequenceNumber()`, `wrapAction()` |
| Audit service | `src/lib/audit/index.ts` | `writeAudit()` (non-blocking), `writeAuditCritical()` (throws on failure) |
| Permission helpers | `src/lib/permissions/index.ts` | `hasPermission()`, `hasAnyPermission()`, `canAccessWing()` — UX helpers only |
| Access service | `src/server/services/AccessService.ts` | `getAccessOptions()`, `resolveUserContext()` — authoritative RBAC resolver |

---

## 9. Server Actions Pattern

All mutations follow this pattern:

```typescript
"use server";

export async function doSomething(formData: FormData): Promise<void> {
  // 1. Verify caller — re-reads from DB, throws if not authenticated/admin
  const caller = await requireCurrentUser();
  if (!caller.is_platform_admin) throw new Error("Forbidden");

  // 2. Extract and validate form inputs
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) throw new Error("Name is required.");

  // 3. DB operation via service-role or session client
  const admin = createAdminClient();
  const { error } = await admin.from("table").insert({ ... });
  if (error) throw new Error("Operation failed.");

  // 4. Audit (non-blocking — won't fail the operation)
  await writeAudit({ actorUserId: caller.id, action: "...", ... });

  // 5. Revalidate and redirect
  revalidatePath("/platform/...");
  redirect("/platform/...");
}
```

Search / filter operations use plain HTML `<form method="GET">` with named
inputs. The page receives `searchParams` as a `Promise<{...}>` (Next.js 15+
pattern — must be awaited) and re-renders server-side. No client JavaScript
is required for filtering.

---

## 10. Number Generation

All document and entity numbers are generated by the `get_next_sequence()`
PostgreSQL function (security definer, safe to call from any authenticated
session). Format: `{PREFIX}-{YEAR}-{SEQ}` e.g. `MBR-2026-001`.

Called from TypeScript via `nextSequenceNumber(supabase, societyId, type, prefix)`.

Vendor codes use a different format generated in application code:
`VND-YYMM-XXXX` (e.g. `VND-2608-A3B7`) with collision retry logic.

---

## 11. Feature Status

### Release implementation summary

- **Implemented: 38 of 47 sections.** Primary member, approval, service,
  document, procurement, vendor portal, renewal, finance, notification,
  reporting, audit and configuration workflows are operational.
- **Partial: 8 sections.** Remaining work is concentrated in full wing parity,
  signed nomination/associate uploads, extended vendor/contract fields,
  quotation draft persistence, the long-tail MIS catalogue and external
  security operations.
- **Waiting: 1 section.** Future integrations remain roadmap scope.
- All four demo societies and their test accounts remain available. Every
  society has an active Society Admin and the final-admin invariant is enforced.

---

## 12. Deployment and Environment

### Required Environment Variables (Vercel)

| Variable | Used In |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and SSR Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | `createAdminClient()` — server only, never public |
| `RESEND_API_KEY` | Resend email delivery; queued portal notifications remain available if omitted |
| `NEXT_PUBLIC_APP_URL` | Redirect URLs in auth callbacks |

---

## 13. Requirements Implementation Matrix

Status assessed against **ByelawsIndia Requirements**, 21 August 2026.

| No. | Requirement | Status | Reason / dependency |
|---:|---|---|---|
| 1 | Project overview and multi-society platform | Implemented | Multi-society, multi-wing portal with isolated member and procurement operations is live. |
| 2 | User roles | Implemented | Platform, society, staff, two authority stages, Society Admin final approval, Treasurer, member and vendor roles are permission-scoped. |
| 3 | Society/client registration | Implemented | Atomic society registration captures configuration and requires an active first Society Admin. |
| 4 | Wing/branch management | Partial | Wings, units, users, members, documents and dashboards are scoped; vendor/contract/RFQ wing parity remains. |
| 5 | Authentication and RBAC | Implemented | Login, sessions, activation, password change/reset, scoped RBAC, login history and denial tests are operational; MFA is optional. |
| 6 | Member registration | Implemented | Detailed member, identity mask/hash, ownership, share and joint-member registration is atomic and audited. |
| 7 | Member document checklist | Implemented | Configurable checklist, blank-form download, signed upload, verification, rejection and replacement are live. |
| 8 | Document management system | Implemented | Private upload/download, preview, versions, replacement, classification, expiry, verification and access history are live. |
| 9 | Three-level approval workflow | Implemented | Authority 1, Authority 2 and same-society Society Admin decisions are atomic, distinct and fully audited. |
| 10 | Application tracking | Implemented | Status timeline, checklist progress, correction/resubmission, approval history and notifications are live. |
| 11 | Society service requests | Implemented | Configurable request types, status controls, Society Admin approval, history and generated documents are live. |
| 12 | Society letter and form generation | Implemented | Versioned templates, dynamic fields, numbering, letterhead/signatory inputs and PDF, Word-compatible and print outputs are live. |
| 13 | Form I and Form J management | Implemented | Manual data, atomic Excel import, Excel/PDF/print export and immutable historical snapshots are live. |
| 14 | Nomination management | Partial | Multiple nominees, percentage validation, approval and records are live; signed-form upload and replacement history remain. |
| 15 | Associate membership management | Partial | Application, consent, fee, Society Admin approval and register creation are live; signed/supporting document upload remains. |
| 16 | Vendor management | Partial | Registration, categories, service areas, branch availability, status and preferred flags are live; structured bank/licence fields remain. |
| 17 | Vendor document management | Implemented | Private upload, version replacement, verification/rejection, expiry and reminder processing are live. |
| 18 | Vendor portal | Implemented | Vendor-scoped login, dashboard, documents, RFQs, quotations, contracts, renewals and notifications are live. |
| 19 | Contract/AMC management | Partial | Registration, tracking, vendor/RFQ links, value, dates and renewal are live; full SLA/penalty/document detail remains. |
| 20 | Contract renewal management | Implemented | Configurable reminders, expiry detection, escalation records and idempotent daily automation are live. |
| 21 | Contract renewal intimation | Implemented | Society, authority and vendor recipients receive recorded portal/email intimations with contract context. |
| 22 | Renewal quotation | Implemented | Society initiation, vendor quotation, Society Admin decision and contract renewal are operational. |
| 23 | RFQ/quotation management | Implemented | RFQ numbering, requirement details, deadlines, publishing, invitations and quotation lifecycle are operational. |
| 24 | Vendor selection for RFQ | Implemented | Multi-select search/filter covers category, location/wing/service area, status, experience, contracts and preference. |
| 25 | Email quotation invitation | Implemented | Invitations queue email/portal delivery with recipients, timestamps, status, response and retry history. |
| 26 | Vendor quotation submission | Partial | Vendor acceptance and itemized commercial submission are live; server-persisted draft editing and quotation-file upload remain. |
| 27 | Quotation comparison | Implemented | Price comparison, technical/commercial/experience scoring, remarks and recommendation are live. |
| 28 | Vendor selection and approval | Implemented | Recommendation follows two procurement authorities and final same-society Society Admin approval. |
| 29 | Work order management | Implemented | Final vendor approval atomically generates a numbered, RFQ/vendor-linked work order visible to society and vendor. |
| 30 | Vendor performance management | Implemented | Multi-criteria ratings, comments and rating history feed vendor-selection experience filters. |
| 31 | Notification and email management | Implemented | Central portal/email queue, templates, retries, provider webhook, reminders and delivery history are live; SMS/WhatsApp are optional. |
| 32 | Dashboards | Implemented | Platform, Society Admin, authority work queues and vendor operational dashboards use live database data. |
| 33 | Search and filtering | Implemented | Society-scoped global search covers members, flats, applications, vendors, contracts, RFQs, documents and requests. |
| 34 | Reports and MIS | Partial | Core finance, member, application, document, vendor, contract, procurement and audit outputs work in PDF/Excel/CSV/print; long-tail catalogue expansion remains. |
| 35 | Audit trail | Implemented | Critical identity, access, member, document, approval, finance, procurement, renewal, export and notification events are immutable and queryable. |
| 36 | Security requirements | Partial | HTTPS, hashing, RBAC/RLS, private files, validation, isolation and regression tests are live; malware scanning and client-owned DR rehearsal remain. |
| 37 | Recommended database structure | Implemented | Required identity, workflow, document, member, vendor, procurement, notification, finance and audit entities are deployed. |
| 38 | Recommended application architecture | Implemented | Next.js/TypeScript, PostgreSQL, private storage, Resend, Vercel preview/production CI and provider logging are deployed. |
| 39 | End-to-end member workflow | Implemented | Application through checklist, signed documents, three-stage decision, member creation, generation, notification and audit is operational. |
| 40 | End-to-end vendor procurement workflow | Implemented | RFQ through portal quotation, evaluation, staged selection, work order, performance and renewal is operational. |
| 41 | Contract renewal workflow | Implemented | Expiry monitoring, reminders, vendor quote, Society Admin decision and renewed/not-renewed outcomes are operational. |
| 42 | Master data management | Implemented | Society-scoped administrator CRUD supports configurable categories, types, statuses, reasons and periods. |
| 43 | Email template management | Implemented | Versioned template CRUD, activation and validated dynamic-field rendering feed the notification system. |
| 44 | Mobile and responsive requirements | Implemented | Responsive navigation, forms, upload controls, vendor portal and RFQ actions support desktop through mobile layouts. |
| 45 | Future enhancements | Waiting | Gateway, accounting, voting, facilities, OCR/e-signature and native-mobile integrations remain roadmap scope. |
| 46 | Final module structure | Implemented | Administration, member, service, approval, document, vendor, procurement, contract, communication, report and security modules are present. |
| 47 | Overall system flow | Implemented | Platform setup, society member flow, procurement flow, contract renewal and vendor self-service operate end to end. |

### Build Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run type-check   # npx tsc --noEmit
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright end-to-end tests
```

---

## 14. File Structure (abbreviated)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/           page + form + server action
│   │   ├── register/        page + form + server action
│   │   └── reset-password/  recovery request + secure password update
│   ├── (app)/
│   │   ├── layout.tsx       session validation
│   │   ├── profile/         self-service password change
│   │   ├── select-context/  context picker after login
│   │   ├── (platform)/
│   │   │   ├── layout.tsx   is_platform_admin check
│   │   │   └── platform/
│   │   │       ├── console/         system overview + switchToSociety action
│   │   │       ├── societies/       list + new
│   │   │       ├── vendors/         list + new + verifyVendor action
│   │   │       ├── contracts/       list
│   │   │       ├── members/         user management
│   │   │       ├── settings/        audit log viewer
│   │   │       └── support/         FAQ
│   │   └── (shell)/
│   │       ├── layout.tsx   context cookie + permission resolution
│   │       ├── dashboard/
│   │       ├── members/
│   │       │   └── statutory-registers/ Form I + Form J exports and history
│   │       ├── units/
│   │       ├── applications/
│   │       ├── documents/
│   │       ├── finance/dues/ + payments/
│   │       ├── maintenance/complaints/ + work-orders/
│   │       ├── procurement/rfqs/ + work-orders/ + contracts/
│   │       ├── vendors/
│   │       ├── reports/
│   │       └── admin/console/ + settings/ + users/ + wings/
│   ├── actions/             shared server actions by domain
│   └── api/auth/            callback + select-context + signout routes
├── components/
│   ├── layout/              AppShell, Sidebar, SidebarNav, PlatformSidebarNav, Topbar
│   ├── modals/              all form modals (register member, add due, etc.)
│   ├── common/              EmptyState, StatusBadge, PermissionGate
│   └── ui/                  Modal primitive
├── lib/
│   ├── supabase/            admin, server, client, middleware clients
│   ├── auth/                getCurrentUser, requireCurrentUser
│   ├── audit/               writeAudit, writeAuditCritical
│   ├── permissions/         hasPermission, hasAnyPermission
│   └── context.ts           getServerContext, nextSequenceNumber, wrapAction
├── server/services/
│   └── AccessService.ts     RBAC resolution — resolveUserContext, getAccessOptions
├── types/
│   ├── database.ts          Supabase generated types
│   └── index.ts             PERMISSIONS const, AppError, UserContext, AccessOption
└── middleware.ts             edge routing + session refresh
supabase/
└── migrations/              versioned schema, RLS, domain, finance and statutory migrations
```
