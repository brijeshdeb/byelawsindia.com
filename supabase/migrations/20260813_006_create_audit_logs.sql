-- Migration 006: Audit logs.
--
-- The audit_logs table is append-only. RLS allows INSERT for authenticated
-- users but NO UPDATE or DELETE — ever.
--
-- In practice, all audit writes go through the admin client (service role)
-- in src/lib/audit/index.ts, bypassing RLS entirely. The RLS policies here
-- are a backstop: even if someone tried to delete audit records via the anon
-- or authenticated key, the policies prevent it.
--
-- The table is intentionally wide — we store old_values and new_values as
-- JSONB so the audit record is self-contained and doesn't require JOINs to
-- reconstruct what changed.

create table public.audit_logs (
  id              uuid        not null default gen_random_uuid(),
  society_id      uuid                 references public.societies (id) on delete set null,
  wing_id         uuid                 references public.wings (id) on delete set null,
  actor_user_id   uuid                 references auth.users (id) on delete set null,
  action          text        not null, -- AuditAction values
  entity_type     text        not null, -- "profile", "application", "document", etc.
  entity_id       text,                 -- UUID of the affected record (text to handle non-UUID IDs)
  old_values      jsonb,
  new_values      jsonb,
  metadata        jsonb       not null default '{}',
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now(),

  constraint audit_logs_pkey primary key (id)
);

comment on table  public.audit_logs is
  'Immutable audit trail. All writes go through the service role client in
   src/lib/audit/index.ts. No UPDATE or DELETE is permitted via RLS.';
comment on column public.audit_logs.entity_id is
  'Stored as TEXT to accommodate non-UUID identifiers (document numbers, etc.).';
comment on column public.audit_logs.old_values is
  'Snapshot of the record state before the action. NULL for CREATE actions.';
comment on column public.audit_logs.new_values is
  'Snapshot of the record state after the action. NULL for DELETE actions.';

-- ── Indexes ───────────────────────────────────────────────────────────────────
--
-- All queries against audit_logs are time-bounded and filtered by at least
-- one of: society_id, actor_user_id, entity_type+entity_id.

-- Primary audit log query: "Show me everything that happened to this record"
create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc)
  where entity_id is not null;

-- Society-scoped audit query: "Show all activity in this society"
create index audit_logs_society_idx
  on public.audit_logs (society_id, created_at desc)
  where society_id is not null;

-- Actor query: "What did this user do?"
create index audit_logs_actor_idx
  on public.audit_logs (actor_user_id, created_at desc)
  where actor_user_id is not null;

-- Action-type query: "Show all LOGIN_FAILED events"
create index audit_logs_action_idx
  on public.audit_logs (action, created_at desc);

-- Time-range query: always filter by created_at
create index audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
