-- High-risk finance adjustments use maker-checker approval. The requester can
-- never approve their own refund or waiver, and execution is atomic.

insert into public.permissions(code,name,description,module) values
  ('finance.adjustment.approve','Approve Finance Adjustments','Approve or reject refund and waiver requests raised by another user','finance')
on conflict(code) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='Society Admin' and p.code='finance.adjustment.approve'
on conflict(role_id,permission_id) do nothing;

alter table public.finance_dues
  add column if not exists waived_amount numeric(14,2) not null default 0,
  add column if not exists waiver_reason text,
  add column if not exists waived_at timestamptz,
  add column if not exists waived_by uuid references auth.users(id) on delete set null;

alter table public.finance_dues drop constraint if exists finance_dues_waived_amount_check;
alter table public.finance_dues add constraint finance_dues_waived_amount_check
  check (waived_amount >= 0 and waived_amount <= amount);
create index if not exists finance_dues_waived_by_idx on public.finance_dues(waived_by);

create table public.finance_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  adjustment_type text not null check (adjustment_type in ('REFUND','WAIVER')),
  payment_id uuid references public.finance_payments(id) on delete restrict,
  due_id uuid references public.finance_dues(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text,
  reference_number text,
  reason text not null check (length(trim(reason)) > 0),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  review_notes text,
  resulting_refund_id uuid references public.finance_refunds(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_adjustment_target_check check (
    (adjustment_type='REFUND' and payment_id is not null and due_id is null and payment_method is not null)
    or (adjustment_type='WAIVER' and due_id is not null and payment_id is null and payment_method is null)
  ),
  constraint finance_adjustment_method_check check (
    payment_method is null or payment_method in ('CASH','CHEQUE','BANK_TRANSFER','UPI','NEFT','RTGS','OTHER')
  ),
  constraint finance_adjustment_review_check check (
    (status='PENDING' and reviewed_by is null and reviewed_at is null)
    or (status<>'PENDING' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index finance_adjustment_requests_society_status_idx
  on public.finance_adjustment_requests(society_id,status,requested_at desc);
create index finance_adjustment_requests_payment_id_idx on public.finance_adjustment_requests(payment_id);
create index finance_adjustment_requests_due_id_idx on public.finance_adjustment_requests(due_id);
create index finance_adjustment_requests_requested_by_idx on public.finance_adjustment_requests(requested_by);
create index finance_adjustment_requests_reviewed_by_idx on public.finance_adjustment_requests(reviewed_by);
create unique index finance_adjustment_one_pending_refund_idx
  on public.finance_adjustment_requests(payment_id) where status='PENDING' and adjustment_type='REFUND';
create unique index finance_adjustment_one_pending_waiver_idx
  on public.finance_adjustment_requests(due_id) where status='PENDING' and adjustment_type='WAIVER';

create trigger trg_finance_adjustment_requests_updated_at before update on public.finance_adjustment_requests
  for each row execute function public.set_updated_at();

alter table public.finance_adjustment_requests enable row level security;
create policy "finance_adjustments_select" on public.finance_adjustment_requests for select to authenticated
  using ((select public.has_permission(society_id,'finance.view')) or (select public.has_permission(society_id,'finance.adjustment.approve')));
grant select on public.finance_adjustment_requests to authenticated;
grant all on public.finance_adjustment_requests to service_role;

create or replace function public.request_finance_adjustment(
  p_society_id uuid,
  p_adjustment_type text,
  p_payment_id uuid,
  p_due_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_reference_number text,
  p_reason text,
  p_actor_user_id uuid
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_id uuid; v_payment_amount numeric; v_refunded numeric; v_due_amount numeric;
  v_paid numeric; v_waived numeric;
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id then raise exception 'adjustment_access_denied'; end if;
  if p_adjustment_type not in ('REFUND','WAIVER') then raise exception 'invalid_adjustment_type'; end if;
  if p_amount is null or p_amount<=0 then raise exception 'invalid_adjustment_amount'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'adjustment_reason_required'; end if;

  if p_adjustment_type='REFUND' then
    if not public.has_permission(p_society_id,'finance.payment.refund') then raise exception 'adjustment_access_denied'; end if;
    if p_payment_method not in ('CASH','CHEQUE','BANK_TRANSFER','UPI','NEFT','RTGS','OTHER') then raise exception 'invalid_refund_method'; end if;
    select amount_paid into v_payment_amount from public.finance_payments
      where id=p_payment_id and society_id=p_society_id and status<>'REFUNDED' for update;
    if not found then raise exception 'payment_not_found'; end if;
    select coalesce(sum(amount),0) into v_refunded from public.finance_refunds
      where payment_id=p_payment_id and status='COMPLETED';
    if p_amount>v_payment_amount-v_refunded then raise exception 'refund_exceeds_payment'; end if;
    p_due_id:=null;
  else
    if not public.has_permission(p_society_id,'finance.due.waive') then raise exception 'adjustment_access_denied'; end if;
    select amount,waived_amount into v_due_amount,v_waived from public.finance_dues
      where id=p_due_id and society_id=p_society_id and status<>'PAID' and waived_amount<amount for update;
    if not found then raise exception 'due_not_waivable'; end if;
    select coalesce(sum(p.amount_paid),0) into v_paid from public.finance_payments p where p.due_id=p_due_id;
    select v_paid-coalesce(sum(r.amount),0) into v_paid
      from public.finance_refunds r join public.finance_payments p on p.id=r.payment_id
      where p.due_id=p_due_id and r.status='COMPLETED';
    v_paid:=coalesce(v_paid,0);
    if p_amount>v_due_amount-v_paid-v_waived then raise exception 'waiver_exceeds_balance'; end if;
    p_payment_id:=null; p_payment_method:=null;
  end if;

  insert into public.finance_adjustment_requests(
    society_id,adjustment_type,payment_id,due_id,amount,payment_method,reference_number,reason,requested_by
  ) values (
    p_society_id,p_adjustment_type,p_payment_id,p_due_id,p_amount,p_payment_method,nullif(trim(p_reference_number),''),trim(p_reason),p_actor_user_id
  ) returning id into v_id;

  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,new_values,metadata)
  values(p_society_id,p_actor_user_id,'FINANCE_ADJUSTMENT_REQUESTED','finance_adjustment_request',v_id::text,
    jsonb_build_object('type',p_adjustment_type,'amount',p_amount,'payment_id',p_payment_id,'due_id',p_due_id),
    jsonb_build_object('maker_checker',true));
  return v_id;
exception when unique_violation then
  raise exception 'pending_adjustment_exists';
end;
$$;

create or replace function public.decide_finance_adjustment(
  p_society_id uuid,
  p_request_id uuid,
  p_decision text,
  p_notes text,
  p_actor_user_id uuid
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_request public.finance_adjustment_requests%rowtype; v_refund_id uuid; v_refund_due_id uuid;
  v_due_amount numeric; v_paid numeric; v_new_waived numeric; v_status text;
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id
     or not public.has_permission(p_society_id,'finance.adjustment.approve') then
    raise exception 'adjustment_approval_denied';
  end if;
  if p_decision not in ('APPROVED','REJECTED') then raise exception 'invalid_adjustment_decision'; end if;

  select * into v_request from public.finance_adjustment_requests
    where id=p_request_id and society_id=p_society_id for update;
  if not found then raise exception 'adjustment_not_found'; end if;
  if v_request.status<>'PENDING' then raise exception 'adjustment_already_decided'; end if;
  if v_request.requested_by=p_actor_user_id then raise exception 'self_approval_not_allowed'; end if;
  if p_decision='REJECTED' and nullif(trim(p_notes),'') is null then raise exception 'rejection_reason_required'; end if;

  if p_decision='APPROVED' and v_request.adjustment_type='REFUND' then
    v_refund_id:=public.refund_payment(
      p_society_id,v_request.payment_id,v_request.amount,v_request.payment_method,
      coalesce(v_request.reference_number,''),v_request.reason,p_actor_user_id
    );
    select due_id into v_refund_due_id from public.finance_payments where id=v_request.payment_id;
    if v_refund_due_id is not null then
      select amount,waived_amount into v_due_amount,v_new_waived from public.finance_dues
        where id=v_refund_due_id and society_id=p_society_id for update;
      select coalesce(sum(amount_paid),0) into v_paid from public.finance_payments where due_id=v_refund_due_id;
      select v_paid-coalesce(sum(r.amount),0) into v_paid
        from public.finance_refunds r join public.finance_payments p on p.id=r.payment_id
        where p.due_id=v_refund_due_id and r.status='COMPLETED';
      v_status:=case when v_paid+v_new_waived>=v_due_amount then case when v_new_waived>0 then 'WAIVED' else 'PAID' end
        when v_paid>0 or v_new_waived>0 then 'PARTIALLY_PAID' else 'UNPAID' end;
      update public.finance_dues set status=v_status where id=v_refund_due_id;
    end if;
  elsif p_decision='APPROVED' then
    select d.amount,d.waived_amount into v_due_amount,v_new_waived
      from public.finance_dues d where d.id=v_request.due_id and d.society_id=p_society_id for update;
    if not found then raise exception 'due_not_found'; end if;
    select coalesce(sum(amount_paid),0) into v_paid from public.finance_payments where due_id=v_request.due_id;
    select v_paid-coalesce(sum(r.amount),0) into v_paid
      from public.finance_refunds r join public.finance_payments p on p.id=r.payment_id
      where p.due_id=v_request.due_id and r.status='COMPLETED';
    v_new_waived:=v_new_waived+v_request.amount;
    if v_paid+v_new_waived>v_due_amount then raise exception 'waiver_exceeds_balance'; end if;
    v_status:=case when v_paid+v_new_waived>=v_due_amount then 'WAIVED'
      when v_paid>0 or v_new_waived>0 then 'PARTIALLY_PAID' else 'UNPAID' end;
    update public.finance_dues set waived_amount=v_new_waived,waiver_reason=v_request.reason,
      waived_at=now(),waived_by=p_actor_user_id,status=v_status where id=v_request.due_id;
  end if;

  update public.finance_adjustment_requests set status=p_decision,reviewed_by=p_actor_user_id,
    reviewed_at=now(),review_notes=nullif(trim(p_notes),''),resulting_refund_id=v_refund_id
    where id=v_request.id;
  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values,metadata)
  values(p_society_id,p_actor_user_id,'FINANCE_ADJUSTMENT_'||p_decision,'finance_adjustment_request',v_request.id::text,
    jsonb_build_object('status','PENDING'),jsonb_build_object('status',p_decision,'refund_id',v_refund_id),
    jsonb_build_object('maker_checker',true,'requester',v_request.requested_by));
  return coalesce(v_refund_id,v_request.id);
end;
$$;

revoke all on function public.request_finance_adjustment(uuid,text,uuid,uuid,numeric,text,text,text,uuid) from public,anon;
revoke all on function public.decide_finance_adjustment(uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.request_finance_adjustment(uuid,text,uuid,uuid,numeric,text,text,text,uuid) to authenticated;
grant execute on function public.decide_finance_adjustment(uuid,uuid,text,text,uuid) to authenticated;

-- Direct refunds are no longer exposed; all authenticated callers must use the
-- approval request and a different authorized user must decide it.
revoke execute on function public.refund_payment_v2(uuid,uuid,numeric,text,text,text,uuid) from authenticated;

-- Payment collection respects previously approved partial waivers.
create or replace function public.record_payment(
  p_society_id uuid, p_due_id uuid, p_amount_paid numeric, p_payment_method text,
  p_payment_date date, p_reference_no text, p_notes text, p_recorded_by uuid,
  p_idempotency_key uuid default null
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_due_amount numeric; v_due_status text; v_waived numeric; v_prior_paid numeric; v_prior_refunded numeric;
  v_new_total numeric; v_new_status text; v_payment_id uuid; v_receipt_number text;
begin
  if auth.uid() is null or auth.uid()<>p_recorded_by or not public.has_permission(p_society_id,'finance.manage') then
    raise exception 'payment_access_denied';
  end if;
  if p_amount_paid<=0 then raise exception 'invalid_payment_amount'; end if;
  if p_payment_method not in ('CASH','CHEQUE','BANK_TRANSFER','UPI','NEFT','RTGS','OTHER') then raise exception 'invalid_payment_method'; end if;
  select amount,status,waived_amount into v_due_amount,v_due_status,v_waived from public.finance_dues
    where id=p_due_id and society_id=p_society_id for update;
  if not found then raise exception 'due_not_found'; end if;
  if v_due_status in ('PAID','WAIVED') then raise exception 'due_already_paid'; end if;
  select coalesce(sum(amount_paid),0) into v_prior_paid from public.finance_payments where due_id=p_due_id;
  select coalesce(sum(r.amount),0) into v_prior_refunded from public.finance_refunds r
    join public.finance_payments p on p.id=r.payment_id where p.due_id=p_due_id and r.status='COMPLETED';
  v_new_total:=v_prior_paid-v_prior_refunded+p_amount_paid;
  if v_new_total+v_waived>v_due_amount then raise exception 'overpayment'; end if;
  insert into public.finance_payments(society_id,due_id,amount_paid,payment_method,payment_date,reference_number,notes,recorded_by,idempotency_key)
  values(p_society_id,p_due_id,p_amount_paid,p_payment_method,p_payment_date,nullif(trim(p_reference_no),''),nullif(trim(p_notes),''),p_recorded_by,p_idempotency_key)
  returning id,receipt_number into v_payment_id,v_receipt_number;
  v_new_status:=case when v_new_total+v_waived>=v_due_amount then case when v_waived>0 then 'WAIVED' else 'PAID' end else 'PARTIALLY_PAID' end;
  update public.finance_dues set status=v_new_status where id=p_due_id;
  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,new_values,metadata)
  values(p_society_id,p_recorded_by,'PAYMENT_RECORDED','finance_payment',v_payment_id::text,
    jsonb_build_object('due_id',p_due_id,'receipt_number',v_receipt_number,'amount_paid',p_amount_paid,'waived_amount',v_waived,'new_due_status',v_new_status),
    jsonb_build_object('maker_checker_waiver_aware',true));
  return v_payment_id;
end;
$$;
revoke all on function public.record_payment(uuid,uuid,numeric,text,date,text,text,uuid,uuid) from public,anon,authenticated;
