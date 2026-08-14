-- ═══════════════════════════════════════════════════════════════════
-- Migration 008: Table-level grants for authenticated role
-- ═══════════════════════════════════════════════════════════════════
--
-- PostgreSQL enforces two independent access layers:
--   1. Table-level GRANT  — controls WHETHER a role can touch the table.
--   2. RLS policies       — controls WHICH rows within the table.
--
-- Migration 007 established all RLS policies but omitted GRANTs.
-- Without GRANTs, Postgres returns 42501 (permission denied) before
-- RLS is even evaluated.
--
-- Immutability: audit_logs and login_activity get SELECT + INSERT only.
-- Absence of UPDATE/DELETE GRANTs is the first enforcement layer;
-- absence of UPDATE/DELETE policies is the second.
-- ═══════════════════════════════════════════════════════════════════

-- ── Reference / lookup tables (read-only) ─────────────────────────
grant select on table public.roles                      to authenticated;
grant select on table public.permissions                to authenticated;
grant select on table public.role_permissions           to authenticated;

-- ── Core society tables ───────────────────────────────────────────
-- RLS policies on each table restrict rows to what the user may reach.
grant select, insert, update, delete
  on table public.societies                             to authenticated;
grant select, insert, update, delete
  on table public.society_settings                     to authenticated;
grant select, insert, update, delete
  on table public.society_officers                     to authenticated;
grant select, insert, update, delete
  on table public.wings                                to authenticated;
grant select, insert, update, delete
  on table public.units                                to authenticated;
grant select, insert, update, delete
  on table public.user_access_assignments              to authenticated;

-- ── Profiles ──────────────────────────────────────────────────────
-- INSERT is handled by handle_new_user() SECURITY DEFINER trigger;
-- no INSERT RLS policy exists, so direct INSERT is blocked by RLS.
grant select, insert, update, delete
  on table public.profiles                             to authenticated;

-- ── Append-only tables (immutable by GRANT absence) ───────────────
-- No UPDATE or DELETE grants — blocked at privilege layer before RLS.
grant select, insert
  on table public.login_activity                       to authenticated;
grant select, insert
  on table public.audit_logs                           to authenticated;

-- ── Sequences (writes go through get_next_sequence()) ─────────────
grant select
  on table public.document_number_sequences            to authenticated;
