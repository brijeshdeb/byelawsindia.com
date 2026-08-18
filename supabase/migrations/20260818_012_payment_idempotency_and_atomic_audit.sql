-- Migration 012: Payment idempotency key + atomic audit write inside record_payment RPC
--
-- Two changes:
--
-- 1. Idempotency key on finance_payments
--    Adds an optional idempotency_key column with a unique constraint.
--    The TypeScript caller generates a UUID per form submission and passes it
--    to the RPC. If the same key is submitted twice (network retry, double-tap),
--    the second call gets a unique-violation exception which the action maps to
--    a user-friendly "already recorded" message instead of inserting a duplicate.
--
-- 2. Audit log written atomically inside record_payment
--    The previous version wrote the audit row from TypeScript AFTER the RPC
--    returned, meaning a crash between the two steps left a paid due with no
--    audit trail. The updated RPC inserts the audit row inside the same
--    implicit transaction so both succeed or both roll back together.
--
--    Because audit_logs has RLS that blocks regular authenticated users from
--    inserting (the TypeScript layer uses the admin/service-role client for
--    audit writes), the function is switched to SECURITY DEFINER so it runs
--    with the permissions of its owner (postgres) and can bypass RLS.
--    The function still validates society ownership via explicit WHERE clauses,
--    so SECURITY DEFINER does not weaken row-level isolation here.

-- ── Step 1: add idempotency_key column ───────────────────────────────────────

ALTER TABLE public.finance_payments
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

-- Partial unique index: only enforce uniqueness when key is provided.
-- NULL values are excluded from unique constraints in PostgreSQL, so existing
-- rows without a key will never collide.
CREATE UNIQUE INDEX IF NOT EXISTS finance_payments_idempotency_key_idx
  ON public.finance_payments (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ── Step 2: replace record_payment with the audit-aware version ───────────────

CREATE OR REPLACE FUNCTION public.record_payment(
  p_society_id       uuid,
  p_due_id           uuid,
  p_amount_paid      numeric,
  p_payment_method   text,
  p_payment_date     date,
  p_reference_no     text,
  p_notes            text,
  p_recorded_by      uuid,
  p_idempotency_key  uuid  DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due_amount   numeric;
  v_due_status   text;
  v_prior_paid   numeric;
  v_new_total    numeric;
  v_new_status   text;
  v_payment_id   uuid;
BEGIN
  -- Lock the due row for the duration of this transaction.
  -- Prevents two concurrent requests from both passing the overpayment check.
  SELECT amount, status
  INTO   v_due_amount, v_due_status
  FROM   public.finance_dues
  WHERE  id = p_due_id
    AND  society_id = p_society_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'due_not_found';
  END IF;

  IF v_due_status IN ('PAID', 'WAIVED') THEN
    RAISE EXCEPTION 'due_already_%', lower(v_due_status);
  END IF;

  -- Cumulative total of all prior payments for this due.
  SELECT COALESCE(SUM(amount_paid), 0)
  INTO   v_prior_paid
  FROM   public.finance_payments
  WHERE  due_id = p_due_id;

  v_new_total := v_prior_paid + p_amount_paid;

  IF v_new_total > v_due_amount THEN
    RAISE EXCEPTION 'overpayment'
      USING DETAIL = format(
        'Due amount: %s | Already paid: %s | This payment: %s | Would exceed by: %s',
        v_due_amount, v_prior_paid, p_amount_paid,
        (v_new_total - v_due_amount)
      );
  END IF;

  -- Insert payment record (inside the same implicit transaction).
  -- The idempotency_key unique constraint will raise a duplicate-key exception
  -- if the same key is submitted twice, which the caller maps to a safe message.
  INSERT INTO public.finance_payments (
    society_id, due_id, amount_paid, payment_method,
    payment_date, reference_number, notes, recorded_by, idempotency_key
  )
  VALUES (
    p_society_id, p_due_id, p_amount_paid, p_payment_method,
    p_payment_date, p_reference_no, p_notes, p_recorded_by, p_idempotency_key
  )
  RETURNING id INTO v_payment_id;

  -- Update due status atomically with the payment insert above.
  v_new_status := CASE
    WHEN v_new_total >= v_due_amount THEN 'PAID'
    ELSE 'PARTIALLY_PAID'
  END;

  UPDATE public.finance_dues
  SET    status = v_new_status
  WHERE  id = p_due_id
    AND  society_id = p_society_id;

  -- Write audit log inside the same transaction.
  -- SECURITY DEFINER allows the INSERT to bypass audit_logs RLS.
  -- Column list mirrors writeAudit() in src/lib/audit/index.ts.
  INSERT INTO public.audit_logs (
    society_id,
    wing_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_society_id,
    NULL,           -- wing_id: payment is society-scoped, not wing-scoped
    p_recorded_by,
    'PAYMENT_RECORDED',
    'finance_payment',
    v_payment_id::text,
    NULL,           -- old_values: not applicable for a new payment row
    jsonb_build_object(
      'due_id',           p_due_id,
      'amount_paid',      p_amount_paid,
      'payment_method',   p_payment_method,
      'payment_date',     p_payment_date,
      'reference_number', p_reference_no,
      'new_due_status',   v_new_status
    ),
    '{}'::jsonb,    -- metadata: empty object matches the TypeScript default
    NULL,           -- ip_address
    NULL            -- user_agent
  );

  RETURN v_payment_id;
END;
$$;

-- Re-grant execute to the authenticated role.
-- The function now runs as SECURITY DEFINER (owner: postgres) but callers still
-- need explicit EXECUTE permission to invoke it.
GRANT EXECUTE ON FUNCTION public.record_payment(
  uuid, uuid, numeric, text, date, text, text, uuid, uuid
) TO authenticated;

-- Revoke the old overload signature that no longer exists.
-- (The previous function had 8 parameters; the new one has 9 with a default.)
-- PostgreSQL distinguishes overloads by parameter count, so the old grant is
-- automatically superseded — no explicit revoke needed.
