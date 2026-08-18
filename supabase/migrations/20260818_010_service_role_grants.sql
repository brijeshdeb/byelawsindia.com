-- ═══════════════════════════════════════════════════════════════════
-- Migration 010: Table-level grants for service_role
-- ═══════════════════════════════════════════════════════════════════
--
-- Migration 008 granted table access to the authenticated role only.
-- The service_role also needs explicit table-level grants even though
-- it bypasses RLS — RLS bypass and table GRANT are two separate layers.
--
-- Without these grants Postgres returns 42501 (permission denied)
-- before RLS is evaluated, making createAdminClient() queries fail
-- silently and the platform console return all-zero counts.
-- ═══════════════════════════════════════════════════════════════════

-- ── Reference / lookup tables ─────────────────────────────────────
grant select on table public.roles                        to service_role;
grant select on table public.permissions                  to service_role;
grant select on table public.role_permissions             to service_role;

-- ── Core society tables ───────────────────────────────────────────
grant select, insert, update, delete
  on table public.societies                               to service_role;
grant select, insert, update, delete
  on table public.society_settings                       to service_role;
grant select, insert, update, delete
  on table public.society_officers                       to service_role;
grant select, insert, update, delete
  on table public.wings                                  to service_role;
grant select, insert, update, delete
  on table public.units                                  to service_role;
grant select, insert, update, delete
  on table public.user_access_assignments                to service_role;

-- ── Profiles ──────────────────────────────────────────────────────
grant select, insert, update, delete
  on table public.profiles                               to service_role;

-- ── Audit / activity ──────────────────────────────────────────────
grant select, insert, update, delete
  on table public.audit_logs                             to service_role;
grant select, insert, update, delete
  on table public.login_activity                         to service_role;

-- ── Sequences ─────────────────────────────────────────────────────
grant select, insert, update, delete
  on table public.document_number_sequences              to service_role;

-- ── Domain tables (migration 009) ─────────────────────────────────
grant select, insert, update, delete
  on table public.members                                to service_role;
grant select, insert, update, delete
  on table public.member_applications                    to service_role;
grant select, insert, update, delete
  on table public.society_documents                      to service_role;
grant select, insert, update, delete
  on table public.maintenance_complaints                 to service_role;
grant select, insert, update, delete
  on table public.maintenance_work_orders                to service_role;
grant select, insert, update, delete
  on table public.finance_dues                           to service_role;
grant select, insert, update, delete
  on table public.finance_payments                       to service_role;
grant select, insert, update, delete
  on table public.vendors                                to service_role;
grant select, insert, update, delete
  on table public.contracts                              to service_role;
grant select, insert, update, delete
  on table public.rfqs                                   to service_role;
grant select, insert, update, delete
  on table public.procurement_work_orders                to service_role;
grant select, insert, update, delete
  on table public.survey_responses                       to service_role;

-- ── Default privileges for all future tables ──────────────────────
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;
