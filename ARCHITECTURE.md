# ByelawsIndia Portal — Architecture & Feature Reference

> Status as of: 18 August 2026
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
| Email | Resend (placeholder key — emails not working yet) |
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

### Platform Admin — Working

- System overview console (society count, member count, vendor count, recent audit)
- Society directory with search and Switch to Society
- Register New Society form
- Vendor directory with search, type/status filters, Verify/Unverify action
- Add Vendor form (with vendor code generation)
- Cross-tenant contracts list with expiry colour coding
- Platform user management (invite, deactivate)
- Audit log viewer (filter by action, entity, limit)
- Platform settings and support / FAQ page

### Society / Tenant Shell — Working

- Society dashboard (key metrics)
- Member directory and member registration
- Unit registry (flats/shops by wing)
- Member application submission and multi-level approval workflow
- Document repository with upload, verification, and archiving
- Finance dues tracking and payment recording
- Maintenance complaints and work order management
- RFQ creation, vendor quotation management, evaluation
- Procurement work orders
- Contract management (create, status tracking)
- Society-scoped vendor directory
- Reports hub and audit log
- Society admin: settings, user/role management, wing configuration

### Known Limitations / Not Yet Built

| Item | Reason |
|---|---|
| Online payment collection | Out of scope — spec Section 45: Future Enhancement |
| Email notifications | `RESEND_API_KEY` is placeholder `re_your_key_here` — all emails silently fail |
| Society deactivation action | No admin UI — must use Supabase Studio to flip `is_active` |
| Vendor quotation portal | Vendor-facing submission portal not yet built |
| Two-factor authentication (MFA) | `mfa_enabled` column exists in profiles, UI not wired |
| Push / in-app notifications | Not in scope |

---

## 12. Deployment and Environment

### Required Environment Variables (Vercel)

| Variable | Used In |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and SSR Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | `createAdminClient()` — server only, never public |
| `RESEND_API_KEY` | Email sending via Resend — currently placeholder |
| `NEXT_PUBLIC_APP_URL` | Redirect URLs in auth callbacks |

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

## 13. File Structure (abbreviated)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/           page + form + server action
│   │   └── register/        page + form + server action
│   ├── (app)/
│   │   ├── layout.tsx       session validation
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
└── migrations/              000 – 010 SQL migrations
```
