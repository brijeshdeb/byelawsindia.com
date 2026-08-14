-- ════════════════════════════════════════════════════════════════════
-- Byelawsindia.com — Development / Test Seed Data
-- ════════════════════════════════════════════════════════════════════
--
-- PURPOSE:
--   Populate a local or staging Supabase database with deterministic
--   test personas so that:
--     1. Developers can log in immediately without manual setup
--     2. Tenant isolation tests (tests/isolation/) have reproducible
--        UUIDs and known credentials to sign in with
--
-- NEVER run this against production. All data here is for testing only.
--
-- IDEMPOTENCY:
--   Every INSERT uses ON CONFLICT DO NOTHING (or DO UPDATE where we
--   need to ensure updated values). Running this script multiple times
--   is safe.
--
-- HOW TO RUN:
--   supabase db reset     (drops + recreates schema + applies seed)
--   supabase db seed      (applies seed to existing schema)
--   psql $DATABASE_URL -f supabase/seed.sql
--
-- ════════════════════════════════════════════════════════════════════

-- ── Fixed UUID scheme ─────────────────────────────────────────────
--
--  Users (auth.users + profiles):
--    0001-0001  Platform Admin
--    0001-0002  Society A — Society Admin (society-wide)
--    0001-0003  Society A — Wing A Staff (Application Officer, Wing A)
--    0001-0004  Society A — Wing B Staff (Application Officer, Wing B)
--    0001-0005  Society A — Authority 1 (Application Authority, Wing A)
--    0001-0006  Society A — Final Authority (society-wide)
--    0001-0007  Society A — Member A (Wing A, read-only)
--    0001-0008  Society A — Member B (Wing B, read-only)
--    0001-0009  Society B — Society B Admin (society-wide)
--
--  Societies:
--    0002-0001  Sunrise CHS (Society A)
--    0002-0002  Moonrise CHS (Society B)
--
--  Wings:
--    0003-0001  Wing A (Society A)
--    0003-0002  Wing B (Society A)
--    0003-0003  Wing X (Society B)
--
--  Units:
--    0004-0001  A-101 (Wing A, Society A)
--    0004-0002  A-102 (Wing A, Society A)
--    0004-0003  B-101 (Wing B, Society A)
--    0004-0004  B-102 (Wing B, Society A)
--    0004-0005  X-101 (Wing X, Society B)
--
-- All passwords: Test1234!@

-- ════════════════════════════════════════════════════════════════════
-- SECTION 1: AUTH USERS
-- ════════════════════════════════════════════════════════════════════
--
-- Inserting into auth.users triggers handle_new_user() which creates
-- a corresponding row in public.profiles automatically.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  -- Platform Admin
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'platform-admin@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Platform Admin"}',
    now(), now(), '', '', '', ''
  ),
  -- Society A Admin
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'society-a-admin@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Society A Admin"}',
    now(), now(), '', '', '', ''
  ),
  -- Wing A Staff (Application Officer, Wing A)
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'wing-a-staff@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Wing A Staff"}',
    now(), now(), '', '', '', ''
  ),
  -- Wing B Staff (Application Officer, Wing B)
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'wing-b-staff@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Wing B Staff"}',
    now(), now(), '', '', '', ''
  ),
  -- Authority 1 (Application Authority, Wing A scoped)
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000005',
    'authenticated', 'authenticated',
    'authority-1@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Authority One"}',
    now(), now(), '', '', '', ''
  ),
  -- Final Authority (society-wide, Final Authority role)
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000006',
    'authenticated', 'authenticated',
    'final-authority@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Final Authority"}',
    now(), now(), '', '', '', ''
  ),
  -- Member A (Wing A, read-only)
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000007',
    'authenticated', 'authenticated',
    'member-a@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Member A"}',
    now(), now(), '', '', '', ''
  ),
  -- Member B (Wing B, read-only)
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000008',
    'authenticated', 'authenticated',
    'member-b@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Member B"}',
    now(), now(), '', '', '', ''
  ),
  -- Society B Admin
  (
    '00000000-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000009',
    'authenticated', 'authenticated',
    'society-b-admin@test.byelawsindia.com',
    crypt('Test1234!@', gen_salt('bf', 8)),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Society B Admin"}',
    now(), now(), '', '', '', ''
  )
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SECTION 2: PROFILES PATCH
-- ════════════════════════════════════════════════════════════════════
--
-- handle_new_user() trigger creates profiles rows. We only need to
-- patch the platform admin flag — regular users start with false.
--
-- Wait briefly to ensure trigger has run (rare race in direct SQL sessions)

update public.profiles
set    is_platform_admin = true
where  id = '00000001-0000-0000-0000-000000000001';

-- ════════════════════════════════════════════════════════════════════
-- SECTION 3: SOCIETIES
-- ════════════════════════════════════════════════════════════════════

insert into public.societies (
  id,
  name,
  registration_number,
  address,
  city,
  state,
  pin_code,
  phone,
  email,
  registered_at,
  is_active
)
values
  (
    '00000002-0000-0000-0000-000000000001',
    'Sunrise Cooperative Housing Society',
    'MH/MUM/HSG/123/2015',
    '12, Sunrise Road, Andheri East',
    'Mumbai',
    'Maharashtra',
    '400069',
    '+91 22 1234 5678',
    'admin@sunrisechs.example.com',
    '2015-04-01',
    true
  ),
  (
    '00000002-0000-0000-0000-000000000002',
    'Moonrise Cooperative Housing Society',
    'MH/MUM/HSG/456/2018',
    '7, Moonrise Marg, Powai',
    'Mumbai',
    'Maharashtra',
    '400076',
    '+91 22 8765 4321',
    'admin@moonrisechs.example.com',
    '2018-07-15',
    true
  )
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SECTION 4: SOCIETY SETTINGS
-- ════════════════════════════════════════════════════════════════════

insert into public.society_settings (society_id)
values
  ('00000002-0000-0000-0000-000000000001'),
  ('00000002-0000-0000-0000-000000000002')
on conflict (society_id) do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SECTION 5: WINGS
-- ════════════════════════════════════════════════════════════════════

insert into public.wings (id, society_id, name, code, total_units, display_order)
values
  -- Society A wings
  ('00000003-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', 'Wing A', 'A', 24, 1),
  ('00000003-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', 'Wing B', 'B', 24, 2),
  -- Society B wings
  ('00000003-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000002', 'Wing X', 'X', 16, 1)
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SECTION 6: UNITS
-- ════════════════════════════════════════════════════════════════════

insert into public.units (id, society_id, wing_id, unit_number, floor, unit_type, status)
values
  -- Wing A, Society A
  ('00000004-0000-0000-0000-000000000001', '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000001', 'A-101', 1, 'RESIDENTIAL', 'OCCUPIED'),
  ('00000004-0000-0000-0000-000000000002', '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000001', 'A-102', 1, 'RESIDENTIAL', 'VACANT'),
  -- Wing B, Society A
  ('00000004-0000-0000-0000-000000000003', '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000002', 'B-101', 1, 'RESIDENTIAL', 'OCCUPIED'),
  ('00000004-0000-0000-0000-000000000004', '00000002-0000-0000-0000-000000000001', '00000003-0000-0000-0000-000000000002', 'B-102', 1, 'RESIDENTIAL', 'VACANT'),
  -- Wing X, Society B
  ('00000004-0000-0000-0000-000000000005', '00000002-0000-0000-0000-000000000002', '00000003-0000-0000-0000-000000000003', 'X-101', 1, 'RESIDENTIAL', 'OCCUPIED')
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SECTION 7: USER ACCESS ASSIGNMENTS
-- ════════════════════════════════════════════════════════════════════
--
-- Map each test persona to their role in their society/wing.
-- Role IDs are looked up by name (seeded in migration 004).

-- Society A Admin — society-wide (wing_id = null)
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000002',                -- Society A Admin
  '00000002-0000-0000-0000-000000000001',                -- Society A
  null,                                                   -- society-wide
  r.id,
  '00000001-0000-0000-0000-000000000001'                 -- created by platform admin
from public.roles r
where r.name = 'Society Admin'
on conflict on constraint user_access_assignments_unique do nothing;

-- Wing A Staff — Wing A scoped
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000003',
  '00000002-0000-0000-0000-000000000001',
  '00000003-0000-0000-0000-000000000001',                -- Wing A
  r.id,
  '00000001-0000-0000-0000-000000000002'
from public.roles r
where r.name = 'Application Officer'
on conflict on constraint user_access_assignments_unique do nothing;

-- Wing B Staff — Wing B scoped
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000004',
  '00000002-0000-0000-0000-000000000001',
  '00000003-0000-0000-0000-000000000002',                -- Wing B
  r.id,
  '00000001-0000-0000-0000-000000000002'
from public.roles r
where r.name = 'Application Officer'
on conflict on constraint user_access_assignments_unique do nothing;

-- Authority 1 — Wing A scoped, Application Authority
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000005',
  '00000002-0000-0000-0000-000000000001',
  '00000003-0000-0000-0000-000000000001',                -- Wing A
  r.id,
  '00000001-0000-0000-0000-000000000002'
from public.roles r
where r.name = 'Application Authority'
on conflict on constraint user_access_assignments_unique do nothing;

-- Final Authority — society-wide
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000006',
  '00000002-0000-0000-0000-000000000001',
  null,                                                   -- society-wide
  r.id,
  '00000001-0000-0000-0000-000000000002'
from public.roles r
where r.name = 'Final Authority'
on conflict on constraint user_access_assignments_unique do nothing;

-- Member A — Wing A, read-only
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000007',
  '00000002-0000-0000-0000-000000000001',
  '00000003-0000-0000-0000-000000000001',                -- Wing A
  r.id,
  '00000001-0000-0000-0000-000000000002'
from public.roles r
where r.name = 'Member (Read-only)'
on conflict on constraint user_access_assignments_unique do nothing;

-- Member B — Wing B, read-only
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000008',
  '00000002-0000-0000-0000-000000000001',
  '00000003-0000-0000-0000-000000000002',                -- Wing B
  r.id,
  '00000001-0000-0000-0000-000000000002'
from public.roles r
where r.name = 'Member (Read-only)'
on conflict on constraint user_access_assignments_unique do nothing;

-- Society B Admin — society-wide in Society B
insert into public.user_access_assignments (user_id, society_id, wing_id, role_id, created_by)
select
  '00000001-0000-0000-0000-000000000009',
  '00000002-0000-0000-0000-000000000002',                -- Society B
  null,
  r.id,
  '00000001-0000-0000-0000-000000000001'
from public.roles r
where r.name = 'Society Admin'
on conflict on constraint user_access_assignments_unique do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SECTION 8: SEED AUDIT RECORD
-- ════════════════════════════════════════════════════════════════════
--
-- Insert one audit record per society so isolation tests can verify
-- that society-scoped audit reads are enforced.

insert into public.audit_logs (society_id, actor_user_id, action, entity_type, entity_id, metadata)
values
  (
    '00000002-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000001',
    'SEED_RECORD',
    'seed',
    'society-a',
    '{"source": "seed.sql"}'
  ),
  (
    '00000002-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000001',
    'SEED_RECORD',
    'seed',
    'society-b',
    '{"source": "seed.sql"}'
  )
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ════════════════════════════════════════════════════════════════════
--
-- Test credentials (all passwords: Test1234!@):
--
-- PLATFORM:
--   platform-admin@test.byelawsindia.com     — platform admin (sees all)
--
-- SOCIETY A (Sunrise CHS):
--   society-a-admin@test.byelawsindia.com    — Society Admin, society-wide
--   wing-a-staff@test.byelawsindia.com       — Application Officer, Wing A only
--   wing-b-staff@test.byelawsindia.com       — Application Officer, Wing B only
--   authority-1@test.byelawsindia.com        — Application Authority, Wing A only
--   final-authority@test.byelawsindia.com    — Final Authority, society-wide
--   member-a@test.byelawsindia.com           — Member (Read-only), Wing A only
--   member-b@test.byelawsindia.com           — Member (Read-only), Wing B only
--
-- SOCIETY B (Moonrise CHS):
--   society-b-admin@test.byelawsindia.com    — Society Admin, society-wide
