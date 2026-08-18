-- Migration 015: reset_demo_society() SQL function
--
-- Creates a SECURITY DEFINER function that atomically resets a DEMO society
-- back to its canonical seeded state. Only callable by the service role.
--
-- The function:
--   1. Verifies society has environment_type = 'DEMO' (rejects all others)
--   2. Deletes all transactional records in FK-safe order
--      (structural records — society, settings, wings, units, members,
--       vendors, contracts — are left untouched)
--   3. Re-inserts the canonical demo seed data from migration 014
--   4. Runs atomically (single implicit transaction in plpgsql)
--
-- Security:
--   SECURITY DEFINER so the function runs with superuser-equivalent rights
--   when called by the service role. REVOKE from PUBLIC and authenticated
--   so tenant code cannot call it directly.

CREATE OR REPLACE FUNCTION public.reset_demo_society(p_society_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Safety: only DEMO-classified societies can be reset.
  IF NOT EXISTS (
    SELECT 1 FROM public.societies
    WHERE id = p_society_id AND environment_type = 'DEMO'
  ) THEN
    RAISE EXCEPTION 'reset_demo_society: society % is not a DEMO environment. Reset aborted.', p_society_id;
  END IF;

  -- ── Delete transactional data (FK-safe order) ─────────────────────────────
  -- finance_payments references finance_dues; delete payments first.
  DELETE FROM public.finance_payments  WHERE society_id = p_society_id;
  DELETE FROM public.finance_dues      WHERE society_id = p_society_id;
  DELETE FROM public.society_documents WHERE society_id = p_society_id;

  -- maintenance table name matches migration 014
  DELETE FROM public.maintenance_complaints WHERE society_id = p_society_id;

  -- procurement: work orders before quotations before rfqs
  DELETE FROM public.procurement_work_orders WHERE society_id = p_society_id;
  DELETE FROM public.rfq_quotations
    WHERE rfq_id IN (SELECT id FROM public.rfqs WHERE society_id = p_society_id);
  DELETE FROM public.rfqs WHERE society_id = p_society_id;

  -- Wipe audit log for this society so reset is clean
  DELETE FROM public.audit_logs WHERE society_id = p_society_id;

  -- ── Re-seed transactional data ────────────────────────────────────────────
  -- Structural data (society, settings, wings, units, members, vendors, contracts)
  -- is not deleted and therefore not re-seeded here.
  -- All inserts use ON CONFLICT (id) DO NOTHING for idempotency.

  -- 6. Finance dues
  INSERT INTO public.finance_dues (
    id, society_id, member_id, unit_id, due_type, description,
    amount, due_date, status, period_from, period_to,
    created_by, created_at, updated_at
  ) VALUES
    -- June 2026 (all PAID)
    ('d0000000-0000-0000-0004-000000000001', p_society_id, 'd0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0002-000000000001', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000002', p_society_id, 'd0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0002-000000000002', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000003', p_society_id, 'd0000000-0000-0000-0003-000000000003', 'd0000000-0000-0000-0002-000000000003', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000004', p_society_id, 'd0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0002-000000000004', 'MAINTENANCE', 'Maintenance Charges — June 2026', 4000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000005', p_society_id, 'd0000000-0000-0000-0003-000000000005', 'd0000000-0000-0000-0002-000000000005', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000006', p_society_id, 'd0000000-0000-0000-0003-000000000006', 'd0000000-0000-0000-0002-000000000006', 'MAINTENANCE', 'Maintenance Charges — June 2026', 3000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000007', p_society_id, 'd0000000-0000-0000-0003-000000000007', 'd0000000-0000-0000-0002-000000000007', 'MAINTENANCE', 'Maintenance Charges — June 2026', 4000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0004-000000000008', p_society_id, 'd0000000-0000-0000-0003-000000000008', 'd0000000-0000-0000-0002-000000000008', 'MAINTENANCE', 'Maintenance Charges — June 2026', 4000.00, '2026-06-05', 'PAID',   '2026-06-01', '2026-06-30', '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    -- July 2026 (5 PAID, 3 UNPAID)
    ('d0000000-0000-0000-0004-000000000009', p_society_id, 'd0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0002-000000000001', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-00000000000a', p_society_id, 'd0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0002-000000000002', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-00000000000b', p_society_id, 'd0000000-0000-0000-0003-000000000003', 'd0000000-0000-0000-0002-000000000003', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'UNPAID', '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-00000000000c', p_society_id, 'd0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0002-000000000004', 'MAINTENANCE', 'Maintenance Charges — July 2026', 4000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-00000000000d', p_society_id, 'd0000000-0000-0000-0003-000000000005', 'd0000000-0000-0000-0002-000000000005', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-00000000000e', p_society_id, 'd0000000-0000-0000-0003-000000000006', 'd0000000-0000-0000-0002-000000000006', 'MAINTENANCE', 'Maintenance Charges — July 2026', 3000.00, '2026-07-05', 'UNPAID', '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-00000000000f', p_society_id, 'd0000000-0000-0000-0003-000000000007', 'd0000000-0000-0000-0002-000000000007', 'MAINTENANCE', 'Maintenance Charges — July 2026', 4000.00, '2026-07-05', 'PAID',   '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    ('d0000000-0000-0000-0004-000000000010', p_society_id, 'd0000000-0000-0000-0003-000000000008', 'd0000000-0000-0000-0002-000000000008', 'MAINTENANCE', 'Maintenance Charges — July 2026', 4000.00, '2026-07-05', 'UNPAID', '2026-07-01', '2026-07-31', '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now()),
    -- Special levy (August 2026, UNPAID)
    ('d0000000-0000-0000-0004-000000000011', p_society_id, 'd0000000-0000-0000-0003-000000000001', 'd0000000-0000-0000-0002-000000000001', 'SPECIAL_LEVY', 'Lift Modernisation Special Levy', 5000.00, '2026-08-15', 'UNPAID', '2026-08-01', '2026-08-31', '00000001-0000-0000-0000-000000000001', now() - interval '7 days', now()),
    ('d0000000-0000-0000-0004-000000000012', p_society_id, 'd0000000-0000-0000-0003-000000000002', 'd0000000-0000-0000-0002-000000000002', 'SPECIAL_LEVY', 'Lift Modernisation Special Levy', 5000.00, '2026-08-15', 'UNPAID', '2026-08-01', '2026-08-31', '00000001-0000-0000-0000-000000000001', now() - interval '7 days', now()),
    ('d0000000-0000-0000-0004-000000000013', p_society_id, 'd0000000-0000-0000-0003-000000000004', 'd0000000-0000-0000-0002-000000000004', 'SPECIAL_LEVY', 'Lift Modernisation Special Levy', 5000.00, '2026-08-15', 'UNPAID', '2026-08-01', '2026-08-31', '00000001-0000-0000-0000-000000000001', now() - interval '7 days', now())
  ON CONFLICT (id) DO NOTHING;

  -- 7. Finance payments
  INSERT INTO public.finance_payments (
    id, society_id, due_id, payment_method, reference_number,
    amount_paid, payment_date, notes, recorded_by, idempotency_key, created_at
  ) VALUES
    ('d0000000-0000-0000-0005-000000000001', p_society_id, 'd0000000-0000-0000-0004-000000000001', 'BANK_TRANSFER', 'NEFT/2026/JUN/A101', 3000.00, '2026-06-03', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000001', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000002', p_society_id, 'd0000000-0000-0000-0004-000000000002', 'UPI',           'UPI/2026/JUN/A201',  3000.00, '2026-06-04', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000002', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000003', p_society_id, 'd0000000-0000-0000-0004-000000000003', 'CHEQUE',        'CQ/2026/JUN/A301',   3000.00, '2026-06-02', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000003', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000004', p_society_id, 'd0000000-0000-0000-0004-000000000004', 'BANK_TRANSFER', 'NEFT/2026/JUN/A401', 4000.00, '2026-06-01', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000004', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000005', p_society_id, 'd0000000-0000-0000-0004-000000000005', 'UPI',           'UPI/2026/JUN/B101',  3000.00, '2026-06-05', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000005', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000006', p_society_id, 'd0000000-0000-0000-0004-000000000006', 'UPI',           'UPI/2026/JUN/B201',  3000.00, '2026-06-03', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000006', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000007', p_society_id, 'd0000000-0000-0000-0004-000000000007', 'BANK_TRANSFER', 'NEFT/2026/JUN/B301', 4000.00, '2026-06-04', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000007', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000008', p_society_id, 'd0000000-0000-0000-0004-000000000008', 'CASH',          'CASH/2026/JUN/B401', 4000.00, '2026-06-06', 'June maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000008', now() - interval '3 months'),
    ('d0000000-0000-0000-0005-000000000009', p_society_id, 'd0000000-0000-0000-0004-000000000009', 'UPI',           'UPI/2026/JUL/A101',  3000.00, '2026-07-03', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-0000-000000000009', now() - interval '2 months'),
    ('d0000000-0000-0000-0005-00000000000a', p_society_id, 'd0000000-0000-0000-0004-00000000000a', 'BANK_TRANSFER', 'NEFT/2026/JUL/A201', 3000.00, '2026-07-02', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000001', now() - interval '2 months'),
    ('d0000000-0000-0000-0005-00000000000b', p_society_id, 'd0000000-0000-0000-0004-00000000000c', 'UPI',           'UPI/2026/JUL/A401',  4000.00, '2026-07-04', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000002', now() - interval '2 months'),
    ('d0000000-0000-0000-0005-00000000000c', p_society_id, 'd0000000-0000-0000-0004-00000000000d', 'CHEQUE',        'CQ/2026/JUL/B101',   3000.00, '2026-07-05', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000003', now() - interval '2 months'),
    ('d0000000-0000-0000-0005-00000000000d', p_society_id, 'd0000000-0000-0000-0004-00000000000f', 'BANK_TRANSFER', 'NEFT/2026/JUL/B301', 4000.00, '2026-07-01', 'July maintenance', '00000001-0000-0000-0000-000000000001', 'd0a00001-0000-0000-000a-000000000004', now() - interval '2 months')
  ON CONFLICT (id) DO NOTHING;

  -- 8. Society documents
  INSERT INTO public.society_documents (
    id, society_id, title, category, description,
    file_name, file_size_bytes, mime_type, storage_path,
    is_verified, uploaded_by, created_at, updated_at
  ) VALUES
    ('d0000000-0000-0000-0006-000000000001', p_society_id,
     'AGM Minutes — March 2026', 'MINUTES',
     'Minutes of the Annual General Meeting held on 22 March 2026. Agenda: budget approval, election of office bearers, lift modernisation proposal.',
     'agm-minutes-march-2026.pdf', 245760, 'application/pdf',
     'd0000000/documents/d0000000-0000-0000-0006-000000000001/agm-minutes-march-2026.pdf',
     true, '00000001-0000-0000-0000-000000000001', now() - interval '5 months', now()),
    ('d0000000-0000-0000-0006-000000000002', p_society_id,
     'Monsoon Preparedness Notice — June 2026', 'NOTICE',
     'Circular to all members regarding monsoon-season precautions, waterproofing status, and drainage clearing schedule.',
     'monsoon-notice-june-2026.pdf', 98304, 'application/pdf',
     'd0000000/documents/d0000000-0000-0000-0006-000000000002/monsoon-notice-june-2026.pdf',
     true, '00000001-0000-0000-0000-000000000001', now() - interval '3 months', now()),
    ('d0000000-0000-0000-0006-000000000003', p_society_id,
     'Audited Accounts Report FY 2024-25', 'FINANCIAL',
     'Statutory audit report for FY 2024-25. Net surplus Rs 1,42,500. All dues collected within fiscal year.',
     'audit-report-fy2024-25.pdf', 512000, 'application/pdf',
     'd0000000/documents/d0000000-0000-0000-0006-000000000003/audit-report-fy2024-25.pdf',
     true, '00000001-0000-0000-0000-000000000001', now() - interval '5 months', now()),
    ('d0000000-0000-0000-0006-000000000004', p_society_id,
     'Registered Bye-Laws of the Society', 'LEGAL',
     'Registered bye-laws under Maharashtra Co-operative Societies Act 1960, as amended in 2019.',
     'bye-laws-registered.pdf', 1048576, 'application/pdf',
     'd0000000/documents/d0000000-0000-0000-0006-000000000004/bye-laws-registered.pdf',
     true, '00000001-0000-0000-0000-000000000001', now() - interval '6 months', now()),
    ('d0000000-0000-0000-0006-000000000005', p_society_id,
     'Fire NOC — Municipal Corporation 2025', 'COMPLIANCE',
     'No Objection Certificate from Pune Municipal Corporation for fire safety compliance. Valid until 31 Dec 2026.',
     'fire-noc-2025.pdf', 184320, 'application/pdf',
     'd0000000/documents/d0000000-0000-0000-0006-000000000005/fire-noc-2025.pdf',
     true, '00000001-0000-0000-0000-000000000001', now() - interval '4 months', now())
  ON CONFLICT (id) DO NOTHING;

  -- 9. Maintenance complaints
  INSERT INTO public.maintenance_complaints (
    id, society_id, complaint_number, title, description, location,
    wing_id, unit_id, urgency, status,
    reported_by_member_id, assigned_to,
    resolved_at, created_by, created_at, updated_at
  ) VALUES
    ('d0000000-0000-0000-0007-000000000001', p_society_id,
     'SNCHS/COMP/2026/001',
     'Lift malfunction — Wing A',
     'The lift in Wing A has been stuck between floors 2 and 3 since Monday morning. Residents above floor 2 are using the staircase. Urgent repair required.',
     'Wing A — Lift shaft',
     'd0000000-0000-0000-0001-000000000001',
     NULL, 'HIGH', 'IN_PROGRESS',
     'd0000000-0000-0000-0003-000000000002',
     'Otis Elevator Company',
     NULL, '00000001-0000-0000-0000-000000000001',
     now() - interval '5 days', now()),
    ('d0000000-0000-0000-0007-000000000002', p_society_id,
     'SNCHS/COMP/2026/002',
     'Low water pressure — B-301',
     'Water pressure in flat B-301 has been consistently low for the past two weeks, particularly in the mornings. Overhead tank level appears normal.',
     'Wing B, Flat B-301',
     'd0000000-0000-0000-0001-000000000002',
     'd0000000-0000-0000-0002-000000000007',
     'NORMAL', 'OPEN',
     'd0000000-0000-0000-0003-000000000007',
     NULL, NULL, '00000001-0000-0000-0000-000000000001',
     now() - interval '12 days', now()),
    ('d0000000-0000-0000-0007-000000000003', p_society_id,
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

  -- 12. Procurement work orders
  INSERT INTO public.procurement_work_orders (
    id, society_id, work_order_number, title,
    vendor_id, contract_id,
    amount, status, start_date, completion_date, description,
    created_by, created_at, updated_at
  ) VALUES
    ('d0000000-0000-0000-000a-000000000001', p_society_id,
     'SNCHS/WO/2026/001',
     'Emergency Lift Repair — Wing A',
     'd0000000-0000-0000-0008-000000000003',
     NULL,
     28500.00, 'IN_PROGRESS',
     '2026-08-14', '2026-08-20',
     'Emergency repair of Wing A passenger lift. Motor bearing replacement and cabin door mechanism service. Under AMC — cost covers parts only.',
     '00000001-0000-0000-0000-000000000001', now() - interval '4 days', now()),
    ('d0000000-0000-0000-000a-000000000002', p_society_id,
     'SNCHS/WO/2026/002',
     'External Painting — Common Areas',
     'd0000000-0000-0000-0008-000000000002',
     NULL,
     75000.00, 'ISSUED',
     '2026-09-01', '2026-09-30',
     'External painting of staircase walls (both wings), lobby, and entrance porch. Two coats Asian Paints Apex. Approved at July 2026 managing committee meeting.',
     '00000001-0000-0000-0000-000000000001', now() - interval '2 months', now())
  ON CONFLICT (id) DO NOTHING;

END;
$$;

-- Restrict: only the service role (which bypasses GRANT checks) may call this.
-- Revoke from PUBLIC and the authenticated role so tenant queries cannot invoke it.
REVOKE ALL ON FUNCTION public.reset_demo_society(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_demo_society(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.reset_demo_society(uuid) FROM anon;
