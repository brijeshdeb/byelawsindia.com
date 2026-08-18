-- Migration 014: Demo Society Seed Data
--
-- Inserts a fully-formed DEMO-classified society for sales demonstrations.
-- Every record is scoped to society_id d0000000-0000-0000-0000-000000000001.
--
-- Security guarantees:
--   - environment_type = 'DEMO' prevents this society from triggering real
--     external integrations (email, payment gateway, webhooks).
--   - All IDs use the d0000000-* prefix so they are visually identifiable
--     and easily filtered in any ad-hoc query.
--   - No real personal data: all names, emails, phone numbers are fictional.
--   - Storage paths use generated IDs, not names or Aadhaar/PAN numbers.
--
-- Idempotent: all inserts use ON CONFLICT (id) DO NOTHING so this migration
-- is safe to re-run after a demo data reset.
--
-- To reset: run the Reset Demo Data action in the Platform Console, which
-- deletes all d0000000-* records and re-runs this migration in a transaction.

BEGIN;

-- ─── IDs (constants for readability) ───────────────────────────────────────
-- Society  : d0000000-0000-0000-0000-000000000001
-- Wing A   : d0000000-0000-0000-0001-000000000001
-- Wing B   : d0000000-0000-0000-0001-000000000002
-- Units    : d0000000-0000-0000-0002-00000000000{1-8}
-- Members  : d0000000-0000-0000-0003-00000000000{1-8}
-- Dues     : d0000000-0000-0000-0004-00000000000{1-13}
-- Payments : d0000000-0000-0000-0005-00000000000{1-13}
-- Docs     : d0000000-0000-0000-0006-00000000000{1-5}
-- Complaints: d0000000-0000-0000-0007-00000000000{1-3}
-- Vendors  : d0000000-0000-0000-0008-00000000000{1-3}
-- Contracts: d0000000-0000-0000-0009-00000000000{1-2}
-- WorkOrders: d0000000-0000-0000-000a-00000000000{1-2}
-- Settings : d0000000-0000-0000-000b-000000000001
-- ───────────────────────────────────────────────────────────────────────────

-- ─── 1. SOCIETY ────────────────────────────────────────────────────────────
INSERT INTO societies (
  id, name, registration_number, society_type,
  address, city, state, pin_code,
  email, phone, website,
  pan, gstin,
  registered_at, is_active, environment_type,
  created_by, created_at, updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Shivaji Nagar Cooperative Housing Society',
  'MH/PN/CHS/2009/04521',
  'Cooperative Housing Society',
  'Plot No. 45, Shivaji Nagar, Near Central Mall',
  'Pune',
  'Maharashtra',
  '411005',
  'admin@shivajinaharchs.demo',
  '+91 20 2556 7890',
  'https://shivajinaharchs.demo',
  'AABCS1234D',
  '27AABCS1234D1Z5',
  '2009-03-15',
  true,
  'DEMO',
  '00000001-0000-0000-0000-000000000001',
  now() - interval '6 months',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ─── 2. SOCIETY SETTINGS ───────────────────────────────────────────────────
INSERT INTO society_settings (
  id, society_id,
  application_number_pattern, contract_number_pattern,
  rfq_number_pattern, work_order_number_pattern,
  default_timezone, max_upload_size_bytes,
  contract_reminder_days,
  created_at, updated_at
) VALUES (
  'd0000000-0000-0000-000b-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'SNCHS/APP/{YYYY}/{SEQ}',
  'SNCHS/CON/{YYYY}/{SEQ}',
  'SNCHS/RFQ/{YYYY}/{SEQ}',
  'SNCHS/WO/{YYYY}/{SEQ}',
  'Asia/Kolkata',
  10485760,
  ARRAY[30, 14, 7]::integer[],
  now() - interval '6 months',
  now()
) ON CONFLICT (id) DO NOTHING;

-- ─── 3. WINGS ──────────────────────────────────────────────────────────────
INSERT INTO wings (id, society_id, name, code, address, total_units, is_active, display_order, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0001-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Laxmi Wing', 'A', 'Building A, Shivaji Nagar CHS', 4, true, 1, now() - interval '6 months', now()),
  ('d0000000-0000-0000-0001-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'Saraswati Wing', 'B', 'Building B, Shivaji Nagar CHS', 4, true, 2, now() - interval '6 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 4. UNITS ──────────────────────────────────────────────────────────────
-- Wing A: floors 1-4 (850 sqft carpet / 1050 sqft builtup; A-401 is larger)
-- Wing B: floors 1-4 (mixed sizes; B-401 is vacant)
INSERT INTO units (id, society_id, wing_id, unit_number, floor, unit_type, carpet_area_sqft, built_up_area_sqft, status, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0002-000000000001', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000001', 'A-101', 1, 'RESIDENTIAL',  850.00, 1050.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000002', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000001', 'A-201', 2, 'RESIDENTIAL',  850.00, 1050.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000003', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000001', 'A-301', 3, 'RESIDENTIAL',  850.00, 1050.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000004', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000001', 'A-401', 4, 'RESIDENTIAL', 1100.00, 1350.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000005', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000002', 'B-101', 1, 'RESIDENTIAL',  875.00, 1075.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000006', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000002', 'B-201', 2, 'RESIDENTIAL',  875.00, 1075.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000007', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000002', 'B-301', 3, 'RESIDENTIAL', 1100.00, 1350.00, 'OCCUPIED', now() - interval '6 months', now()),
  ('d0000000-0000-0000-0002-000000000008', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0001-000000000002', 'B-401', 4, 'RESIDENTIAL', 1100.00, 1350.00, 'VACANT',   now() - interval '6 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 5. MEMBERS ────────────────────────────────────────────────────────────
INSERT INTO members (
  id, society_id, unit_id, member_number, full_name, email, phone,
  member_type, status, effective_from,
  created_by, created_at, updated_at
) VALUES
  ('d0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000001',
   'SNCHS-001', 'Rajesh Kumar Sharma', 'rajesh.sharma@demo.invalid', '+91 98201 11001',
   'OWNER', 'ACTIVE', '2009-04-01',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000002',
   'SNCHS-002', 'Priya Agarwal', 'priya.agarwal@demo.invalid', '+91 98201 11002',
   'OWNER', 'ACTIVE', '2010-07-15',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000003', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000003',
   'SNCHS-003', 'Suresh Ramchandra Patil', 'suresh.patil@demo.invalid', '+91 98201 11003',
   'OWNER', 'ACTIVE', '2011-01-10',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000004',
   'SNCHS-004', 'Anita Desai', 'anita.desai@demo.invalid', '+91 98201 11004',
   'OWNER', 'ACTIVE', '2009-04-01',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000005', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000005',
   'SNCHS-005', 'Vikram Nair', 'vikram.nair@demo.invalid', '+91 98201 11005',
   'OWNER', 'ACTIVE', '2012-03-20',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000006', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000006',
   'SNCHS-006', 'Kavitha Menon', 'kavitha.menon@demo.invalid', '+91 98201 11006',
   'OWNER', 'ACTIVE', '2013-09-05',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000007', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000007',
   'SNCHS-007', 'Mohit Gupta', 'mohit.gupta@demo.invalid', '+91 98201 11007',
   'OWNER', 'ACTIVE', '2015-06-30',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0003-000000000008', 'd0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0002-000000000008',
   'SNCHS-008', 'Sunita Joshi', 'sunita.joshi@demo.invalid', '+91 98201 11008',
   'OWNER', 'ACTIVE', '2020-11-01',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 6. FINANCE DUES ───────────────────────────────────────────────────────
-- June 2026: all 8 units, PAID.
-- July 2026: 5 PAID, 3 UNPAID (outstanding).
-- Special levy: Lift Modernisation Fund (August 2026, 3 units, UNPAID).

INSERT INTO finance_dues (
  id, society_id, member_id, unit_id, due_type, description,
  amount, due_date, status, period_from, period_to,
  created_by, created_at, updated_at
) VALUES
  -- June 2026 (all PAID)
  ('d0000000-0000-0000-0004-000000000001', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0002-000000000001', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000002', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0002-000000000002', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000003', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000003', 'd0000000-0000-0000-0002-000000000003', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000004', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0002-000000000004', 'MAINTENANCE', 'Maintenance Charges — June 2026', 4000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000005', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000005', 'd0000000-0000-0000-0002-000000000005', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000006', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000006', 'd0000000-0000-0000-0002-000000000006', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000007', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000007', 'd0000000-0000-0000-0002-000000000007', 'MAINTENANCE', 'Maintenance Charges — June 2026', 4000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
  ('d0000000-0000-0000-0004-000000000008', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000008', 'd0000000-0000-0000-0002-000000000008', 'MAINTENANCE', 'Maintenance Charges — June 2026', 4000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),

  -- July 2026 (5 PAID, 3 UNPAID)
  ('d0000000-0000-0000-0004-000000000009', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0002-000000000001', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-00000000000a', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0002-000000000002', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-00000000000b', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000003', 'd0000000-0000-0000-0002-000000000003', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'UNPAID', '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-00000000000c', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0002-000000000004', 'MAINTENANCE', 'Maintenance Charges — July 2026', 4000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-00000000000d', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000005', 'd0000000-0000-0000-0002-000000000005', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-00000000000e', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000006', 'd0000000-0000-0000-0002-000000000006', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'UNPAID', '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-00000000000f', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000007', 'd0000000-0000-0000-0002-000000000007', 'MAINTENANCE', 'Maintenance Charges — July 2026', 4000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
  ('d0000000-0000-0000-0004-000000000010', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000008', 'd0000000-0000-0000-0002-000000000008', 'MAINTENANCE', 'Maintenance Charges — July 2026', 4000.00, '2026-07-05', 'UNPAID', '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),

  -- Special levy: Lift Modernisation Fund (August 2026, UNPAID)
  ('d0000000-0000-0000-0004-000000000011', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0002-000000000001', 'SPECIAL_LEVY', 'Lift Modernisation Special Levy', 5000.00, '2026-08-15', 'UNPAID', '2026-08-01', '2026-08-31', '00000001-0000-0000-0000-000000000001', now() - interval '7 days', now()),
  ('d0000000-0000-0000-0004-000000000012', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0002-000000000002', 'SPECIAL_LEVY', 'Lift Modernisation Special Levy', 5000.00, '2026-08-15', 'UNPAID', '2026-08-01', '2026-08-31', '00000001-0000-0000-0000-000000000001', now() - interval '7 days', now()),
  ('d0000000-0000-0000-0004-000000000013', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0002-000000000004', 'SPECIAL_LEVY', 'Lift Modernisation Special Levy', 5000.00, '2026-08-15', 'UNPAID', '2026-08-01', '2026-08-31', '00000001-0000-0000-0000-000000000001', now() - interval '7 days', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 7. PAYMENTS (for PAID dues) ───────────────────────────────────────────
-- June dues: all 8 paid.
-- July dues: 5 paid.
INSERT INTO finance_payments (
  id, society_id, due_id, payment_method, reference_number,
  amount_paid, payment_date, notes, recorded_by, idempotency_key, created_at
) VALUES
  ('d0000000-0000-0000-0005-000000000001', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000001', 'BANK_TRANSFER', 'NEFT/2026/JUN/A101', 3000.00, '2026-06-03', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000001', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000002', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000002', 'UPI',           'UPI/2026/JUN/A201',  3000.00, '2026-06-04', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000002', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000003', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000003', 'CHEQUE',        'CQ/2026/JUN/A301',   3000.00, '2026-06-02', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000003', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000004', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000004', 'BANK_TRANSFER', 'NEFT/2026/JUN/A401', 4000.00, '2026-06-01', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000004', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000005', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000005', 'UPI',           'UPI/2026/JUN/B101',  3000.00, '2026-06-05', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000005', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000006', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000006', 'UPI',           'UPI/2026/JUN/B201',  3000.00, '2026-06-03', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000006', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000007', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000007', 'BANK_TRANSFER', 'NEFT/2026/JUN/B301', 4000.00, '2026-06-04', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000007', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000008', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000008', 'CASH',          'CASH/2026/JUN/B401', 4000.00, '2026-06-06', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000008', now() - interval '3 months'),
  ('d0000000-0000-0000-0005-000000000009', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-000000000009', 'UPI',           'UPI/2026/JUL/A101',  3000.00, '2026-07-03', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000009', now() - interval '2 months'),
  ('d0000000-0000-0000-0005-00000000000a', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-00000000000a', 'BANK_TRANSFER', 'NEFT/2026/JUL/A201', 3000.00, '2026-07-02', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000001', now() - interval '2 months'),
  ('d0000000-0000-0000-0005-00000000000b', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-00000000000c', 'UPI',           'UPI/2026/JUL/A401',  4000.00, '2026-07-04', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000002', now() - interval '2 months'),
  ('d0000000-0000-0000-0005-00000000000c', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-00000000000d', 'CHEQUE',        'CQ/2026/JUL/B101',   3000.00, '2026-07-05', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000003', now() - interval '2 months'),
  ('d0000000-0000-0000-0005-00000000000d', 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0004-00000000000f', 'BANK_TRANSFER', 'NEFT/2026/JUL/B301', 4000.00, '2026-07-01', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000004', now() - interval '2 months')
ON CONFLICT (id) DO NOTHING;

-- ─── 8. SOCIETY DOCUMENTS ──────────────────────────────────────────────────
INSERT INTO society_documents (
  id, society_id, title, category, description,
  file_name, file_size_bytes, mime_type, storage_path,
  is_verified, uploaded_by, created_at, updated_at
) VALUES
  ('d0000000-0000-0000-0006-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'AGM Minutes — March 2026', 'MINUTES',
   'Minutes of the Annual General Meeting held on 22 March 2026. Agenda: budget approval, election of office bearers, lift modernisation proposal.',
   'agm-minutes-march-2026.pdf', 245760, 'application/pdf',
   'd0000000/documents/d0000000-0000-0000-0006-000000000001/agm-minutes-march-2026.pdf',
   true, '00000001-0000-0000-0000-000000000001',
   now() - interval '5 months', now()),

  ('d0000000-0000-0000-0006-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'Monsoon Preparedness Notice — June 2026', 'NOTICE',
   'Circular to all members regarding monsoon-season precautions, waterproofing status, and drainage clearing schedule.',
   'monsoon-notice-june-2026.pdf', 98304, 'application/pdf',
   'd0000000/documents/d0000000-0000-0000-0006-000000000002/monsoon-notice-june-2026.pdf',
   true, '00000001-0000-0000-0000-000000000001',
   now() - interval '3 months', now()),

  ('d0000000-0000-0000-0006-000000000003', 'd0000000-0000-0000-0000-000000000001',
   'Audited Accounts Report FY 2024-25', 'FINANCIAL',
   'Statutory audit report for FY 2024-25. Net surplus Rs 1,42,500. All dues collected within fiscal year.',
   'audit-report-fy2024-25.pdf', 512000, 'application/pdf',
   'd0000000/documents/d0000000-0000-0000-0006-000000000003/audit-report-fy2024-25.pdf',
   true, '00000001-0000-0000-0000-000000000001',
   now() - interval '5 months', now()),

  ('d0000000-0000-0000-0006-000000000004', 'd0000000-0000-0000-0000-000000000001',
   'Registered Bye-Laws of the Society', 'LEGAL',
   'Registered bye-laws under Maharashtra Co-operative Societies Act 1960, as amended in 2019.',
   'bye-laws-registered.pdf', 1048576, 'application/pdf',
   'd0000000/documents/d0000000-0000-0000-0006-000000000004/bye-laws-registered.pdf',
   true, '00000001-0000-0000-0000-000000000001',
   now() - interval '6 months', now()),

  ('d0000000-0000-0000-0006-000000000005', 'd0000000-0000-0000-0000-000000000001',
   'Fire NOC — Municipal Corporation 2025', 'COMPLIANCE',
   'No Objection Certificate from Pune Municipal Corporation for fire safety compliance. Valid until 31 Dec 2026.',
   'fire-noc-2025.pdf', 184320, 'application/pdf',
   'd0000000/documents/d0000000-0000-0000-0006-000000000005/fire-noc-2025.pdf',
   true, '00000001-0000-0000-0000-000000000001',
   now() - interval '4 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 9. MAINTENANCE COMPLAINTS ─────────────────────────────────────────────
INSERT INTO maintenance_complaints (
  id, society_id, complaint_number, title, description, location,
  wing_id, unit_id, urgency, status,
  reported_by_member_id, assigned_to,
  resolved_at, created_by, created_at, updated_at
) VALUES
  ('d0000000-0000-0000-0007-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/COMP/2026/001',
   'Lift malfunction — Wing A',
   'The lift in Wing A has been stuck between floors 2 and 3 since Monday morning. Residents above floor 2 are using the staircase. Urgent repair required.',
   'Wing A — Lift shaft',
   'd0000000-0000-0000-0001-000000000001',
   NULL, 'HIGH', 'IN_PROGRESS',
   'd0000000-0000-0000-0003-000000000002',
   'Otis Elevator Company',
   NULL,
   '00000001-0000-0000-0000-000000000001',
   now() - interval '5 days', now()),

  ('d0000000-0000-0000-0007-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/COMP/2026/002',
   'Low water pressure — B-301',
   'Water pressure in flat B-301 has been consistently low for the past two weeks, particularly in the mornings. Overhead tank level appears normal.',
   'Wing B, Flat B-301',
   'd0000000-0000-0000-0001-000000000002',
   'd0000000-0000-0000-0002-000000000007',
   'NORMAL', 'OPEN',
   'd0000000-0000-0000-0003-000000000007',
   NULL,
   NULL,
   '00000001-0000-0000-0000-000000000001',
   now() - interval '12 days', now()),

  ('d0000000-0000-0000-0007-000000000003', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/COMP/2026/003',
   'Unauthorised parking — Visitor bay',
   'A vehicle (MH-12 AB 5678) has been occupying visitor parking bay #3 continuously for a week. Owner could not be identified initially.',
   'Basement parking — visitor bay 3',
   NULL, NULL, 'LOW', 'RESOLVED',
   'd0000000-0000-0000-0003-000000000005',
   'Society Security',
   now() - interval '10 days',
   '00000001-0000-0000-0000-000000000001',
   now() - interval '25 days', now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

-- ─── 10. VENDORS ───────────────────────────────────────────────────────────
INSERT INTO vendors (
  id, society_id, vendor_code, name, vendor_type,
  contact_name, email, phone, address, gstin, pan,
  status, is_verified, notes,
  created_by, created_at, updated_at
) VALUES
  ('d0000000-0000-0000-0008-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'VND-001', 'SecureGuard Facility Services Pvt Ltd', 'SECURITY',
   'Amit Kulkarni', 'contracts@secureguard.demo', '+91 20 4567 8900',
   '302 Baner Road, Pune 411045',
   '27AASCS4321B1ZA', 'AASCS4321B',
   'ACTIVE', true,
   '3-year contract. 4 guards deployed. 24/7 coverage with CCTV monitoring included.',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0008-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'VND-002', 'CleanPro Facility Management', 'HOUSEKEEPING',
   'Sneha Kadam', 'ops@cleanpro.demo', '+91 98765 43210',
   '14 Kothrud, Pune 411038',
   '27AABCP9876C1Z1', 'AABCP9876C',
   'ACTIVE', true,
   'Daily housekeeping for common areas. Weekly deep-clean of lobby and staircases. Includes garbage segregation.',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0008-000000000003', 'd0000000-0000-0000-0000-000000000001',
   'VND-003', 'Otis Elevator Company India Ltd', 'OTHER',
   'Rajan Iyer', 'service.pune@otis.demo', '+91 20 6789 0123',
   '5th Floor, Creaticity, Pune 411036',
   '27AAACO1234E1ZP', 'AAACO1234E',
   'ACTIVE', true,
   'Annual Maintenance Contract for 2 passenger lifts. Monthly visits, 24/7 breakdown response.',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 11. CONTRACTS ─────────────────────────────────────────────────────────
INSERT INTO contracts (
  id, society_id, contract_number, title, vendor_id,
  value, status, start_date, end_date, auto_renew, description,
  created_by, created_at, updated_at
) VALUES
  ('d0000000-0000-0000-0009-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/CON/2026/001',
   'Security Services Contract — SecureGuard',
   'd0000000-0000-0000-0008-000000000001',
   432000.00, 'ACTIVE',
   '2026-01-01', '2028-12-31', false,
   'Three-year security contract. 4 guards (day shift 2, night shift 2). Monthly billing Rs 36,000 + GST. CCTV monitoring included.',
   '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),

  ('d0000000-0000-0000-0009-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/CON/2026/002',
   'Housekeeping Services — CleanPro',
   'd0000000-0000-0000-0008-000000000002',
   96000.00, 'ACTIVE',
   '2026-04-01', '2026-09-30', true,
   'Six-month housekeeping contract. Daily cleaning of common areas, lobby, staircase, and basement. Monthly billing Rs 16,000 + GST. Auto-renews unless cancelled 30 days before expiry.',
   '00000001-0000-0000-0000-000000000001', now() - interval '4 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── 12. PROCUREMENT WORK ORDERS ───────────────────────────────────────────
INSERT INTO procurement_work_orders (
  id, society_id, work_order_number, title,
  vendor_id, contract_id,
  amount, status, start_date, completion_date, description,
  created_by, created_at, updated_at
) VALUES
  ('d0000000-0000-0000-000a-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/WO/2026/001',
   'Emergency Lift Repair — Wing A',
   'd0000000-0000-0000-0008-000000000003',
   NULL,
   28500.00, 'IN_PROGRESS',
   '2026-08-14', '2026-08-20',
   'Emergency repair of Wing A passenger lift. Motor bearing replacement and cabin door mechanism service. Under AMC — cost covers parts only.',
   '00000001-0000-0000-0000-000000000001', now() - interval '4 days', now()),

  ('d0000000-0000-0000-000a-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'SNCHS/WO/2026/002',
   'External Painting — Common Areas',
   'd0000000-0000-0000-0008-000000000002',
   NULL,
   75000.00, 'ISSUED',
   '2026-09-01', '2026-09-30',
   'External painting of staircase walls (both wings), lobby, and entrance porch. Two coats Asian Paints Apex. Approved at July 2026 managing committee meeting.',
   '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now())
ON CONFLICT (id) DO NOTHING;

-- ─── Access assignment: platform admin gets Society Admin role ──────────────
-- Required so that requirePermission() in server actions passes for the
-- platform admin when they browse the demo society in the tenant shell.
-- The RLS function user_has_society_access also grants platform admins
-- implicit access (see migration 016), but the RBAC layer reads this table
-- directly, so the explicit row is still needed.
INSERT INTO public.user_access_assignments (
  id, user_id, society_id, wing_id, role_id,
  is_active, valid_from, valid_until,
  created_by, updated_by, created_at, updated_at
)
VALUES (
  'd0000000-0000-0000-000b-000000000001',
  'ad53907a-de3c-4d63-8a15-1f2f8e3e2c92',  -- admin@byelawsindia.com (platform admin)
  'd0000000-0000-0000-0000-000000000001',  -- demo society
  NULL,
  '34264cd7-9de4-450f-a96e-d36c0bbb2b20', -- Society Admin role
  true, NULL, NULL,
  'ad53907a-de3c-4d63-8a15-1f2f8e3e2c92',
  'ad53907a-de3c-4d63-8a15-1f2f8e3e2c92',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
