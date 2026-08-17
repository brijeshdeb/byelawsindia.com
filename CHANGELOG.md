# Byelawsindia — Changelog

Changes made after the Stitch Obsidian design system baseline (`ed51799`, 14 Aug 2026).

---

## [beadb48] — 17 Aug 2026
**fix: feature card titles invisible on marketing homepage**

**File changed:** `src/app/page.tsx`

During the Stitch Obsidian migration, the Tailwind token `chs-text` was remapped to `#FFFFFF` (white) to match the dark shell palette. The marketing homepage feature cards use a white card background (`bg-white`), so the `<h3>` headings using `text-chs-text` became white-on-white — invisible. Fixed by switching the card title class to `text-chs-navy` (`#17324D`), which is explicitly dark and correct for light backgrounds.

---

## [c01ba7e] — 17 Aug 2026
**feat: live admin console + new admin registration page**

**Files changed:** 6

### Admin Console (`src/app/(app)/(shell)/admin/console/page.tsx`)
Replaced all hardcoded "Willow Heights CHS" stub data with real live queries from Supabase:

- Reads `chs_selected_context` cookie and resolves full `UserContext` via `resolveUserContext()`
- Parallel Supabase queries: active wings count, total units count, active members count, active user access assignments count, last 6 audit log entries
- `auditLabel()` maps 20+ action codes (`LOGIN_SUCCESS`, `RFQ_CREATED`, etc.) to human-readable strings
- `relativeTime()` shows "just now", "5m ago", "2h ago", "3d ago", or a formatted date
- Tenant Summary card shows real society name, wing count, unit count, member count, user count, and role — all from live data
- Empty state rendered when no audit entries exist for the society
- Access context card at bottom right shows real signed-in user name, role, wing scope, and permissions count
- Health checks remain static; Email relay correctly shows Warning until Resend is configured

### Registration Page (`src/app/(auth)/register/`)
New self-service sign-up flow for new society admins — three new files:

**`actions.ts`** (Server Action)
- Validates: full name (min 2 chars), email (regex), password (min 8 chars), confirm password match
- Uses `createAdminClient()` — service-role key stays server-side only, never reaches the browser
- Calls `admin.auth.admin.createUser()` with `email_confirm: true` (skips email verification loop — admin-created accounts are pre-verified)
- `handle_new_user` PostgreSQL trigger auto-creates `profiles` row from `user_metadata.full_name`
- No access assignment is created — a platform admin must manually assign the registrant to a society before they can access any data
- Writes an audit record: action `USER_CREATED`, entity `profile`, metadata includes `selfRegistered: true`
- Duplicate email detected from Supabase error message and returned as a field-level error

**`RegisterForm.tsx`** (Client Component)
- Uses `useActionState` for Server Action integration
- Fields: full name (required), email (required), phone (optional), society name (optional, reference only), password (required), confirm password (required)
- Field-level error display, inline border colour transitions on focus/blur, `useEffect` auto-focuses first invalid field
- Success screen: green checkmark icon, "Account created" heading, email confirmation, pending-approval message, "Back to sign in" link

**`register/page.tsx`** (Route Page)
- Same split-panel layout as the login page
- Left branding panel: logo, "Your society, managed properly." heading, 3-step onboarding explanation
- Right form panel: `RegisterForm`, Terms and Privacy links
- Mobile logo visible when branding panel is hidden on small screens

### Login Page (`src/app/(auth)/login/page.tsx`)
Added a "New society admin? Create an account" link below the reset-password line, pointing to `/register`.

### Environment (`src/lib/env.ts`)
Made Resend environment variables optional so the build does not fail when email relay is not yet configured.

---

## [1a8031b] — 17 Aug 2026
**chore: upgrade Next.js to latest for security fix**

`package.json` and `package-lock.json` updated. Security patch applied to the Next.js runtime.

---

## [2fe0cb7] — 17 Aug 2026
**chore: upgrade Next.js to 15.3.5 for React 19 stable compatibility**

`package.json` and `package-lock.json` updated to pin Next.js at 15.3.5, aligning with the stable React 19 release.

---

## [2fddd44] — 14 Aug 2026
**fix: restore demo data fallback across all pages**

**Files changed:** 13 client components

All domain list pages (`members`, `units`, `wings`, `applications`, `documents`, `finance/dues`, `finance/payments`, `maintenance/complaints`, `maintenance/work-orders`, `procurement/rfqs`, `procurement/contracts`, `procurement/work-orders`, `vendors`) were updated to show seeded demo rows when the Supabase query returns an empty result set. This ensures the UI remains useful during onboarding before any real data exists, while live Supabase queries remain wired and active.

---

## [2159c22] — 14 Aug 2026
**fix: restore demo rows in audit trail as live-data fallback**

**File changed:** `src/app/(app)/(shell)/reports/audit/page.tsx`

The audit trail page was showing a blank state when no audit entries existed for the society. Fixed by rendering seeded demo audit rows when the live query returns zero records, with a visible "Demo data — no live entries yet" label so the intent is clear.

---

## [4a6723c] — 14 Aug 2026
**feat: live dashboard, all domain pages wired to Supabase, server actions, modals**

**Files changed:** 63 (6,096 insertions)

### Database
- Migration `20260813_009_create_domain_tables.sql`: 519-line migration creating all domain tables (`members`, `units`, `wings`, `applications`, `documents`, `finance_dues`, `finance_payments`, `maintenance_complaints`, `maintenance_work_orders`, `procurement_rfqs`, `procurement_contracts`, `procurement_work_orders`, `vendors`) with Row Level Security policies, `society_id` foreign keys on every table, and trigger-based audit logging.

### TypeScript types (`src/types/database.ts`)
Full generated type coverage for all new domain tables (+1,036 lines).

### Server Actions (`src/app/actions/`)
Nine new server action files — one per domain. Each action validates input, checks permissions via `UserContext`, enforces `society_id` scoping, writes to Supabase, and appends an audit record:

| File | Actions |
|------|---------|
| `wings.ts` | `createWing` |
| `units.ts` | `createUnit` |
| `members.ts` | `registerMember` |
| `applications.ts` | `submitApplication`, `updateApplicationStatus` |
| `documents.ts` | `uploadDocument`, `verifyDocument` |
| `finance.ts` | `createDue`, `recordPayment` |
| `maintenance.ts` | `createComplaint`, `createWorkOrder`, `updateComplaintStatus` |
| `procurement.ts` | `createRfq`, `publishRfq`, `submitQuotation`, `selectVendor`, `createContract`, `createProcurementWorkOrder` |
| `vendors.ts` | `registerVendor` |

### Modal System (`src/components/modals/`, `src/components/ui/Modal.tsx`)
Base `Modal` component + 14 domain-specific modal forms:

`AddWingModal`, `AddUnitModal`, `RegisterMemberModal`, `NewApplicationModal`, `UploadDocumentModal`, `AddDueModal`, `RecordPaymentModal`, `NewComplaintModal`, `NewMaintenanceWorkOrderModal`, `NewRfqModal`, `NewContractModal`, `NewProcurementWorkOrderModal`, `RegisterVendorModal`

All modals use `useActionState` against their corresponding server action, show field-level errors, and auto-dismiss on success.

### Domain Pages — client/server split
All 13 domain pages refactored from single server components into a server page + `*Client.tsx` client component pair. The server page fetches data from Supabase (scoped to `society_id` via RLS), passes it as props to the client component, which handles modal open/close state and action wiring.

### Dashboard (`src/app/(app)/(shell)/dashboard/page.tsx`)
Live counts from Supabase: active members, total units, open applications, active vendors. Parallel queries via `Promise.all`. Recent audit trail entries live from `audit_logs` table.

### Infrastructure updates
- `src/lib/context.ts`: `resolveUserContext()` helper for reading and validating the `chs_selected_context` cookie
- `src/server/services/AccessService.ts`: `getAccessOptions()`, `resolveUserContext()`, `CONTEXT_COOKIE` constant, `is_platform_admin` bypass
- `src/lib/supabase/server.ts`, `admin.ts`, `middleware.ts`: refactored client factory functions
- `src/lib/audit/index.ts`: `writeAudit()` helper updated for optional `societyId`
- `src/components/common/PermissionGate.tsx`: platform admin wildcard permission bypass
- `src/components/layout/SidebarNav.tsx`: active state fix

---

## Baseline — [ed51799] — 14 Aug 2026
**Phase 0: Stitch Obsidian design system, 20+ pages, Supabase auth, RLS**

This is the baseline from which all changes above are measured. It established:
- Next.js 15 App Router scaffold with TypeScript and Tailwind
- Stitch Obsidian dark design system (`#121212` canvas, `#10B981` emerald primary)
- Supabase Auth with middleware, server client, and admin client
- Row Level Security enforced at database layer
- Full shell layout: Sidebar, Topbar, AppShell
- 20+ stub pages covering all application routes
- Public marketing homepage at `byelawsindia.com`
- Select-context page for multi-society switching
- Migrations 001–008: profiles, roles, societies, wings, units, user access assignments, audit logs
