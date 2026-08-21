-- Complete the offline/manual payment lifecycle with immutable receipts,
-- reconciliation and auditable partial/full refunds.

alter table public.finance_payments
  add column receipt_number text,
  add column status text not null default 'RECORDED',
  add column reconciliation_status text not null default 'UNRECONCILED',
  add column reconciled_at timestamptz,
  add column reconciled_by uuid references auth.users(id) on delete set null,
  add column reconciliation_notes text;

with numbered as (
  select id, 'RCT-' || to_char(created_at, 'YYYY') || '-' ||
    lpad(row_number() over (partition by society_id, extract(year from created_at) order by created_at, id)::text, 6, '0') as receipt_number
  from public.finance_payments
)
update public.finance_payments p set receipt_number = n.receipt_number
from numbered n where p.id = n.id and p.receipt_number is null;

alter table public.finance_payments
  alter column receipt_number set not null,
  alter column receipt_number set default ('RCT-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  add constraint finance_payments_receipt_unique unique (society_id, receipt_number),
  add constraint finance_payments_status_check check (status in ('RECORDED','PARTIALLY_REFUNDED','REFUNDED')),
  add constraint finance_payments_reconciliation_check check (reconciliation_status in ('UNRECONCILED','MATCHED','EXCEPTION'));

create index finance_payments_reconciliation_idx
  on public.finance_payments(society_id, reconciliation_status, payment_date desc);
create index finance_payments_reconciled_by_idx on public.finance_payments(reconciled_by);

create table public.finance_refunds (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  payment_id uuid not null references public.finance_payments(id) on delete restrict,
  refund_number text not null default ('RFD-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  amount numeric(12,2) not null,
  refund_method text not null,
  reference_number text,
  reason text not null,
  status text not null default 'COMPLETED',
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint finance_refunds_number_unique unique (society_id, refund_number),
  constraint finance_refunds_amount_check check (amount > 0),
  constraint finance_refunds_method_check check (refund_method in ('CASH','CHEQUE','BANK_TRANSFER','UPI','NEFT','RTGS','OTHER')),
  constraint finance_refunds_status_check check (status in ('COMPLETED','VOID'))
);

alter table public.finance_refunds enable row level security;
create policy "finance_refunds_select" on public.finance_refunds for select to authenticated
  using ((select public.has_permission(society_id, 'finance.view')) or (select public.has_permission(society_id, 'finance.manage')));

grant select on public.finance_refunds to authenticated;
grant all on public.finance_refunds to service_role;

create index finance_refunds_society_date_idx on public.finance_refunds(society_id, processed_at desc);
create index finance_refunds_payment_id_idx on public.finance_refunds(payment_id);
create index finance_refunds_processed_by_idx on public.finance_refunds(processed_by);

create or replace function public.reconcile_payment(
  p_society_id uuid,
  p_payment_id uuid,
  p_status text,
  p_notes text,
  p_actor_user_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_old_status text;
begin
  if auth.uid() is null or auth.uid() <> p_actor_user_id or not public.has_permission(p_society_id, 'finance.manage') then
    raise exception 'payment_access_denied';
  end if;
  if p_status not in ('MATCHED','EXCEPTION','UNRECONCILED') then raise exception 'invalid_reconciliation_status'; end if;
  select reconciliation_status into v_old_status from public.finance_payments
    where id = p_payment_id and society_id = p_society_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  update public.finance_payments set reconciliation_status = p_status,
    reconciled_at = case when p_status = 'UNRECONCILED' then null else now() end,
    reconciled_by = case when p_status = 'UNRECONCILED' then null else p_actor_user_id end,
    reconciliation_notes = nullif(trim(p_notes), '')
  where id = p_payment_id;
  insert into public.audit_logs(society_id, actor_user_id, action, entity_type, entity_id, old_values, new_values, metadata)
  values (p_society_id, p_actor_user_id, 'PAYMENT_RECONCILED', 'finance_payment', p_payment_id::text,
    jsonb_build_object('reconciliation_status', v_old_status), jsonb_build_object('reconciliation_status', p_status, 'notes', p_notes), '{}'::jsonb);
end;
$$;

create or replace function public.refund_payment(
  p_society_id uuid,
  p_payment_id uuid,
  p_amount numeric,
  p_refund_method text,
  p_reference_number text,
  p_reason text,
  p_actor_user_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_amount numeric; v_due_id uuid; v_payment_status text;
  v_prior_refunds numeric; v_refund_id uuid; v_refund_number text;
  v_due_amount numeric; v_net_paid numeric; v_new_due_status text; v_new_payment_status text;
begin
  if auth.uid() is null or auth.uid() <> p_actor_user_id or not public.has_permission(p_society_id, 'finance.manage') then
    raise exception 'payment_access_denied';
  end if;
  if p_amount <= 0 then raise exception 'invalid_refund_amount'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'refund_reason_required'; end if;
  if p_refund_method not in ('CASH','CHEQUE','BANK_TRANSFER','UPI','NEFT','RTGS','OTHER') then raise exception 'invalid_refund_method'; end if;

  select amount_paid, due_id, status into v_payment_amount, v_due_id, v_payment_status
  from public.finance_payments where id = p_payment_id and society_id = p_society_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  if v_payment_status = 'REFUNDED' then raise exception 'payment_already_refunded'; end if;
  select coalesce(sum(amount),0) into v_prior_refunds from public.finance_refunds
    where payment_id = p_payment_id and status = 'COMPLETED';
  if v_prior_refunds + p_amount > v_payment_amount then raise exception 'refund_exceeds_payment'; end if;

  insert into public.finance_refunds(society_id, payment_id, amount, refund_method, reference_number, reason, processed_by)
  values (p_society_id, p_payment_id, p_amount, p_refund_method, nullif(trim(p_reference_number), ''), trim(p_reason), p_actor_user_id)
  returning id, refund_number into v_refund_id, v_refund_number;

  v_new_payment_status := case when v_prior_refunds + p_amount = v_payment_amount then 'REFUNDED' else 'PARTIALLY_REFUNDED' end;
  update public.finance_payments set status = v_new_payment_status where id = p_payment_id;

  if v_due_id is not null then
    select amount into v_due_amount from public.finance_dues where id = v_due_id and society_id = p_society_id for update;
    select coalesce(sum(p.amount_paid),0) - coalesce((select sum(r.amount) from public.finance_refunds r join public.finance_payments p2 on p2.id = r.payment_id where p2.due_id = v_due_id and r.status = 'COMPLETED'),0)
      into v_net_paid from public.finance_payments p where p.due_id = v_due_id;
    v_new_due_status := case when v_net_paid <= 0 then 'UNPAID' when v_net_paid >= v_due_amount then 'PAID' else 'PARTIALLY_PAID' end;
    update public.finance_dues set status = v_new_due_status where id = v_due_id;
  end if;

  insert into public.audit_logs(society_id, actor_user_id, action, entity_type, entity_id, old_values, new_values, metadata)
  values (p_society_id, p_actor_user_id, 'PAYMENT_REFUNDED', 'finance_refund', v_refund_id::text,
    null, jsonb_build_object('payment_id',p_payment_id,'refund_number',v_refund_number,'amount',p_amount,'payment_status',v_new_payment_status,'due_status',v_new_due_status), '{}'::jsonb);
  return v_refund_id;
end;
$$;

revoke all on function public.reconcile_payment(uuid,uuid,text,text,uuid) from public, anon;
revoke all on function public.refund_payment(uuid,uuid,numeric,text,text,text,uuid) from public, anon;
grant execute on function public.reconcile_payment(uuid,uuid,text,text,uuid) to authenticated;
grant execute on function public.refund_payment(uuid,uuid,numeric,text,text,text,uuid) to authenticated;

-- Replace the earlier payment recorder so refunded amounts become collectable
-- again and the SECURITY DEFINER entry point validates the authenticated actor.
create or replace function public.record_payment(
  p_society_id uuid, p_due_id uuid, p_amount_paid numeric, p_payment_method text,
  p_payment_date date, p_reference_no text, p_notes text, p_recorded_by uuid,
  p_idempotency_key uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_due_amount numeric; v_due_status text; v_prior_paid numeric; v_prior_refunded numeric;
  v_new_total numeric; v_new_status text; v_payment_id uuid; v_receipt_number text;
begin
  if auth.uid() is null or auth.uid() <> p_recorded_by or not public.has_permission(p_society_id, 'finance.manage') then
    raise exception 'payment_access_denied';
  end if;
  if p_amount_paid <= 0 then raise exception 'invalid_payment_amount'; end if;
  if p_payment_method not in ('CASH','CHEQUE','BANK_TRANSFER','UPI','NEFT','RTGS','OTHER') then raise exception 'invalid_payment_method'; end if;

  select amount, status into v_due_amount, v_due_status from public.finance_dues
    where id = p_due_id and society_id = p_society_id for update;
  if not found then raise exception 'due_not_found'; end if;
  if v_due_status = 'WAIVED' then raise exception 'due_already_waived'; end if;

  select coalesce(sum(amount_paid),0) into v_prior_paid from public.finance_payments where due_id = p_due_id;
  select coalesce(sum(r.amount),0) into v_prior_refunded
    from public.finance_refunds r join public.finance_payments p on p.id = r.payment_id
    where p.due_id = p_due_id and r.status = 'COMPLETED';
  v_new_total := v_prior_paid - v_prior_refunded + p_amount_paid;
  if v_new_total > v_due_amount then raise exception 'overpayment'; end if;

  insert into public.finance_payments(society_id,due_id,amount_paid,payment_method,payment_date,reference_number,notes,recorded_by,idempotency_key)
  values(p_society_id,p_due_id,p_amount_paid,p_payment_method,p_payment_date,nullif(trim(p_reference_no),''),nullif(trim(p_notes),''),p_recorded_by,p_idempotency_key)
  returning id, receipt_number into v_payment_id, v_receipt_number;
  v_new_status := case when v_new_total >= v_due_amount then 'PAID' else 'PARTIALLY_PAID' end;
  update public.finance_dues set status = v_new_status where id = p_due_id;
  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,new_values,metadata)
  values(p_society_id,p_recorded_by,'PAYMENT_RECORDED','finance_payment',v_payment_id::text,
    jsonb_build_object('due_id',p_due_id,'receipt_number',v_receipt_number,'amount_paid',p_amount_paid,'payment_method',p_payment_method,'payment_date',p_payment_date,'reference_number',p_reference_no,'new_due_status',v_new_status),'{}'::jsonb);
  return v_payment_id;
end;
$$;

revoke all on function public.record_payment(uuid,uuid,numeric,text,date,text,text,uuid,uuid) from public, anon;
grant execute on function public.record_payment(uuid,uuid,numeric,text,date,text,text,uuid,uuid) to authenticated;
