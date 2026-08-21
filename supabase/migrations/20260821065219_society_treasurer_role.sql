insert into public.permissions(code,name,description,module) values
  ('finance.dues.manage','Manage Dues','Create and maintain member dues','finance'),
  ('finance.payment.record','Record Payments','Record offline and online payment confirmations','finance'),
  ('finance.payment.reconcile','Reconcile Payments','Match collections against bank and payment records','finance'),
  ('finance.payment.refund','Refund Payments','Process partial or full payment refunds','finance'),
  ('finance.due.waive','Waive Dues','Approve full or partial due waivers','finance'),
  ('finance.settings.manage','Manage Finance Settings','Manage finance rules, bank references and receipt settings','finance')
on conflict(code) do nothing;

insert into public.roles(name,description,is_system_role)
values ('Society Treasurer','Society office bearer responsible for dues, collections, reconciliation, refunds and finance reporting',true)
on conflict(name) do update set description=excluded.description, is_system_role=true;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='Society Treasurer' and (p.module='finance' or p.code in ('member.read','report.view','report.member','audit.read','audit.log.view'))
on conflict(role_id,permission_id) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name='Finance Officer' and p.code in ('finance.dues.manage','finance.payment.record','finance.payment.reconcile')
on conflict(role_id,permission_id) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('Society Admin','Wing Admin') and p.module='finance'
on conflict(role_id,permission_id) do nothing;

-- Replace directly callable broad finance RPCs with capability-specific wrappers.
revoke execute on function public.record_payment(uuid,uuid,numeric,text,date,text,text,uuid,uuid) from authenticated;
revoke execute on function public.reconcile_payment(uuid,uuid,text,text,uuid) from authenticated;
revoke execute on function public.refund_payment(uuid,uuid,numeric,text,text,text,uuid) from authenticated;

create or replace function public.record_payment_v2(
  p_society_id uuid,p_due_id uuid,p_amount_paid numeric,p_payment_method text,p_payment_date date,
  p_reference_no text,p_notes text,p_recorded_by uuid,p_idempotency_key uuid default null
) returns uuid language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or auth.uid() <> p_recorded_by or not public.has_permission(p_society_id,'finance.payment.record') then raise exception 'payment_access_denied'; end if;
  return public.record_payment(p_society_id,p_due_id,p_amount_paid,p_payment_method,p_payment_date,p_reference_no,p_notes,p_recorded_by,p_idempotency_key);
end; $$;

create or replace function public.reconcile_payment_v2(
  p_society_id uuid,p_payment_id uuid,p_status text,p_notes text,p_actor_user_id uuid
) returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or auth.uid() <> p_actor_user_id or not public.has_permission(p_society_id,'finance.payment.reconcile') then raise exception 'payment_access_denied'; end if;
  perform public.reconcile_payment(p_society_id,p_payment_id,p_status,p_notes,p_actor_user_id);
end; $$;

create or replace function public.refund_payment_v2(
  p_society_id uuid,p_payment_id uuid,p_amount numeric,p_refund_method text,p_reference_number text,p_reason text,p_actor_user_id uuid
) returns uuid language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or auth.uid() <> p_actor_user_id or not public.has_permission(p_society_id,'finance.payment.refund') then raise exception 'payment_access_denied'; end if;
  return public.refund_payment(p_society_id,p_payment_id,p_amount,p_refund_method,p_reference_number,p_reason,p_actor_user_id);
end; $$;

revoke all on function public.record_payment_v2(uuid,uuid,numeric,text,date,text,text,uuid,uuid) from public,anon;
revoke all on function public.reconcile_payment_v2(uuid,uuid,text,text,uuid) from public,anon;
revoke all on function public.refund_payment_v2(uuid,uuid,numeric,text,text,text,uuid) from public,anon;
grant execute on function public.record_payment_v2(uuid,uuid,numeric,text,date,text,text,uuid,uuid) to authenticated;
grant execute on function public.reconcile_payment_v2(uuid,uuid,text,text,uuid) to authenticated;
grant execute on function public.refund_payment_v2(uuid,uuid,numeric,text,text,text,uuid) to authenticated;
