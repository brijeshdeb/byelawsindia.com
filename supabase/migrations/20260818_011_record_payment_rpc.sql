-- Migration 011: Atomic record_payment RPC
--
-- Replaces the two-write pattern in recordPaymentAction (insert payment,
-- then update due status) with a single PL/pgSQL function that wraps both
-- operations inside one implicit transaction.
--
-- Additional enforcements:
--   * Cumulative partial-payment logic: sums ALL prior payments before
--     deciding the new due status. The old TypeScript code compared only
--     the current payment amount against the full due amount and would
--     set status = PAID incorrectly on the second of two partial payments.
--   * Overpayment rejection: raises an exception if prior paid + new
--     payment would exceed the due amount.
--   * Row-level lock (FOR UPDATE) on the due prevents two concurrent
--     payment submissions racing on the same due.
--
-- SECURITY INVOKER (default): function runs with the caller's permissions.
-- RLS policies on finance_dues and finance_payments remain in force.

CREATE OR REPLACE FUNCTION public.record_payment(
  p_society_id      uuid,
  p_due_id          uuid,
  p_amount_paid     numeric,
  p_payment_method  text,
  p_payment_date    date,
  p_reference_no    text,
  p_notes           text,
  p_recorded_by     uuid
) RETURNS uuid
LANGUAGE plpgsql
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
  -- Fixes the bug where partial payment 1 + partial payment 2 could each
  -- be individually less than the due amount but together exceed it.
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
  INSERT INTO public.finance_payments (
    society_id, due_id, amount_paid, payment_method,
    payment_date, reference_number, notes, recorded_by
  )
  VALUES (
    p_society_id, p_due_id, p_amount_paid, p_payment_method,
    p_payment_date, p_reference_no, p_notes, p_recorded_by
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

  RETURN v_payment_id;
END;
$$;

-- Grant execute to the authenticated role.
-- The function runs as the caller (SECURITY INVOKER) so the underlying
-- RLS policies on finance_dues and finance_payments remain in force.
GRANT EXECUTE ON FUNCTION public.record_payment(
  uuid, uuid, numeric, text, date, text, text, uuid
) TO authenticated;
