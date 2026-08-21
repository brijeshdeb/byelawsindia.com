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
| Email | Supabase Auth email and Resend integration; production delivery requires verification |
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
| `/members/statutory-registers` | Form I and Form J registers, Excel exports, and immutable snapshots |
| `/units` | Unit (flat/shop) registry |
| `/applications` | Member application queue and approval workflow |
| `/documents` | Society document repository |
| `/finance/dues` | Maintenance due management |
| `/finance/payments` | Payment recording |
| `/maintenance/complaints` | Member complaints and service requests |
| `/maintenance/work-orders` | Maintenance work order tracking |
| `/procurement/rfqs` | Request for Quotation management |
| `/procurement/work-orders` | Procurement work order issuance |
| `/procurement/contracts` | Society-scoped contract management |
| `/vendors` | Society-scoped vendor directory |
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
| `society_settings` | Per-society configuration (number patterns, timezone, approval thresholds). |
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
- `RESEND_API_KEY`: server-only. Currently placeholder — emails broken.
- `society_id` is present on every transactional record. No record exists without tenant scope.
- Frontend filters are UX only. Authorization is enforced at DB layer.
- Storage paths use generated IDs, not raw member names or Aadhaar/PAN.
- Vendor A cannot see Vendor B's quotations (RLS + application logic).

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

Platform admins can switch into any society via the "Switch" action on the
Societies list page, which calls `switchToSociety(formData)` from
`platform/console/actions.ts`. This overwrites the context cookie and redirects
to `/dashboard`.

---

## 7. RBAC — Roles and Permissions

### System Roles (seeded, cannot be deleted)

| Role | Scope | Key Permissions |
|---|---|---|
| Society Admin | Society-wide | Full access to all modules |
| Wing Admin | Wing-scoped | Full access within their wing |
| Application Officer | Society or Wing | application.read/verify, document.read/upload/verify |
| Application Authority | Society or Wing | application.approve.level2 |
| Final Authority | Society or Wing | application.approve.final, member.create |
| Documents Officer | Society or Wing | document.read/upload/verify/archive |
| Procurement Officer | Society or Wing | rfq.create/publish/evaluate, quotation.evaluate/compare, contract.create |
| Procurement Authority | Society or Wing | rfq.approve, vendor_selection.approve, work_order.create/approve, contract.approve/renew |
| Finance Officer | Society or Wing | finance.view/manage |
| Report Viewer | Society or Wing | report.view (read-only) |
| Member (Read-only) | Self | Own records, submitted applications, service_request.create |

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

### Implemented foundations

- Multi-society and multi-wing data model with RLS-based isolation.
- Platform and society authentication, scoped RBAC and context switching.
- Mandatory Society Admin during registration and protection against removing the final administrator.
- Platform society directory, society registration, user access assignment and vendor directory.
- Society dashboard, member/unit registers, manual dues/payment recording and audit views.
- Form I and Form J Excel export with immutable snapshots.
- Responsive desktop/mobile shells and navigation.
- Self-service password change and email-based password recovery for every account type.

### Partially implemented modules

- Member applications, document management, nominations, vendors, RFQs, work orders and contracts have data models or screens but not every required lifecycle action.
- Audit coverage includes authentication, finance, access, society registration and statutory exports; full mutation coverage and actor-name resolution remain.
- Local search and filters exist on several directories; global search is not implemented.
- Platform and society dashboards are live; authority and vendor dashboards remain.

### Waiting modules

| Item | Dependency |
|---|---|
| Three-level approval workflow | Configurable workflow engine and complete decision actions |
| Society service letters and remaining forms | Template management plus PDF/DOCX generation |
| Associate membership | Application, documents, fees, approval and register |
| Vendor portal and quotation submission | Vendor authentication, documents and submission workflow |
| Quotation comparison and selection approval | Submitted quotation data and approval workflow |
| Contract renewal automation | Reminder engine, vendor quotation and approval workflow |
| Reports and MIS generation | Report builders and PDF/Excel/CSV/print outputs |
| Master data and email template management | Administrator configuration interfaces |
| Online payments and reconciliation | Gateway, webhooks, refunds, settlements and merchant model |
| Society deactivation workflow | Confirmation, session revocation, audit and recovery path |
| MFA | Enrollment, challenge and recovery user interfaces |
| Central notifications | Verified delivery provider, templates, logs and reminder engine |

---

## 12. Deployment and Environment

### Required Environment Variables (Vercel)

| Variable | Used In |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and SSR Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | `createAdminClient()` — server only, never public |
| `RESEND_API_KEY` | Application notifications via Resend; production delivery must be verified |
| `NEXT_PUBLIC_APP_URL` | Redirect URLs in auth callbacks |

---

## 13. Requirements Implementation Matrix

Status assessed against **ByelawsIndia Requirements**, 21 August 2026.

| No. | Requirement | Status | Reason / dependency |
|---:|---|---|---|
| 1 | Project overview and multi-society platform | Implemented | Multi-society, multi-wing Next.js and PostgreSQL foundation is live with tenant isolation. |
| 2 | User roles | Partial | Core platform, society, staff, authority and member roles exist; vendor portal roles and fully configurable authorities are incomplete. |
| 3 | Society/client registration | Partial | Basic registration and mandatory first administrator are implemented; committee, logo, signatory, document and template configuration remain. |
| 4 | Wing/branch management | Partial | Wings, units and scoped access exist; complete wing-specific workflows across every module are not finished. |
| 5 | Authentication and RBAC | Partial | Login, activation, deactivation, sessions, password change/reset, roles and scope checks exist; MFA and full denial regression remain. |
| 6 | Member registration | Partial | Core member and statutory fields are supported; joint/associate members, identity documents and complete application lifecycle remain. |
| 7 | Member document checklist | Partial | Application/document foundations exist; configurable checklist, blank-form, signed upload and replacement workflow remain. |
| 8 | Document management system | Partial | Repository and protected data model exist; full upload, preview, versioning, expiry and access-history workflow remain. |
| 9 | Three-level approval workflow | Waiting | Roles and statuses exist, but the complete three-authority decision workflow and configurable engine are not implemented. |
| 10 | Application tracking | Partial | Application records and statuses exist; complete timeline, member tracking and status notifications remain. |
| 11 | Society service requests | Waiting | Dedicated service-request types, approval history and generated service letters are not implemented. |
| 12 | Society letter and form generation | Partial | Form I and Form J Excel generation is live; remaining letters, PDF/DOCX output, signatures and template administration remain. |
| 13 | Form I and Form J management | Partial | Manual member data, Excel export and immutable history are implemented; Excel import, PDF generation and direct printing remain. |
| 14 | Nomination management | Partial | A single nominee and nomination date are captured for Form I; multiple nominees, shares, uploads, approval and history remain. |
| 15 | Associate membership management | Waiting | Dedicated applications, documents, fees, approval workflow and associate register are not implemented. |
| 16 | Vendor management | Partial | Central vendor directory and basic registration exist; full profile, category, bank, licence and lifecycle management remain. |
| 17 | Vendor document management | Waiting | Dedicated vendor-document upload, verification, expiry and reminder workflow is not implemented. |
| 18 | Vendor portal | Waiting | Separate vendor authentication, dashboard, RFQs, quotations, contracts and communications are not implemented. |
| 19 | Contract/AMC management | Partial | Contract schema and listings exist; complete create/edit, approval, documents, SLA and status lifecycle remain. |
| 20 | Contract renewal management | Partial | Expiry dates and presentation exist; configurable reminder engine and escalation are not implemented. |
| 21 | Contract renewal intimation | Waiting | Recipient rules, generated intimation, delivery and notification history depend on the notification engine. |
| 22 | Renewal quotation | Waiting | Vendor portal, renewal request, quotation submission and approval workflow are dependencies. |
| 23 | RFQ/quotation management | Partial | RFQ data model and screens exist; complete creation-to-submission workflow and attachments remain. |
| 24 | Vendor selection for RFQ | Partial | Vendor directory filtering exists; RFQ-linked multi-vendor selection and experience/preference scoring remain. |
| 25 | Email quotation invitation | Waiting | Requires production email delivery, templates, vendor portal links and delivery tracking. |
| 26 | Vendor quotation submission | Waiting | Requires the vendor portal, draft quotations, document uploads and submission controls. |
| 27 | Quotation comparison | Waiting | Requires submitted quotation data, evaluation controls and comparison-report generation. |
| 28 | Vendor selection and approval | Waiting | Depends on quotation evaluation and the configurable multi-level approval engine. |
| 29 | Work order management | Partial | Work-order records and screens exist; generation from selection, approvals, documents and contract linkage remain. |
| 30 | Vendor performance management | Waiting | Rating criteria, history, UI and RFQ-selection integration are not implemented. |
| 31 | Notification and email management | Partial | Authentication recovery emails are supported; centralized templates, portal notifications, reminders, delivery logs, SMS and WhatsApp remain. |
| 32 | Dashboards | Partial | Platform and society dashboards show live metrics; authority and vendor dashboards and complete operational metrics remain. |
| 33 | Search and filtering | Partial | Several directories have local search/filters; global cross-module search is not implemented. |
| 34 | Reports and MIS | Waiting | Report catalogue is visible but generation buttons are disabled; PDF, Excel, CSV and print outputs remain. |
| 35 | Audit trail | Partial | Authentication, finance, access, society and statutory exports are logged; full mutation coverage and actor-name resolution remain. |
| 36 | Security requirements | Partial | HTTPS, RBAC, RLS, CSP, token security and audit foundations exist; MFA, malware scanning, backup restore, DR and complete security tests remain. |
| 37 | Recommended database structure | Partial | Core identity, tenant, member, application, vendor, contract, RFQ, finance and audit tables exist; several workflow entities remain. |
| 38 | Recommended application architecture | Partial | Next.js, TypeScript, PostgreSQL, private server access and Vercel deployment exist; verified staging, backups, monitoring and email operations remain. |
| 39 | End-to-end member workflow | Waiting | Registration exists, but checklist, three-level approval, notifications and complete document/form lifecycle are dependencies. |
| 40 | End-to-end vendor procurement workflow | Waiting | Vendor portal, quotation submission/comparison, approvals, selection and renewal are dependencies. |
| 41 | Contract renewal workflow | Waiting | Reminder engine, vendor renewal quotation and approval automation are not implemented. |
| 42 | Master data management | Waiting | Configurable types, statuses, reasons, approval levels and template administration are not implemented. |
| 43 | Email template management | Waiting | Requires a template editor, dynamic-field validation, delivery provider and email logs. |
| 44 | Mobile and responsive requirements | Partial | Responsive shells and mobile navigation are live; all tables, uploads and unfinished vendor/RFQ flows need device regression. |
| 45 | Future enhancements | Waiting | Items are roadmap scope; complaint tracking and manual finance exist, but gateway, accounting, voting, facilities and other integrations remain. |
| 46 | Final module structure | Partial | Administration, member, finance, maintenance and foundation procurement modules exist; several complete workflows remain. |
| 47 | Overall system flow | Partial | Society registration, scoped access, member register and basic operational modules work; complete approval, procurement, renewal and notification flows remain. |

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
