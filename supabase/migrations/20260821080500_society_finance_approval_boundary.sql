-- Finance maker-checker is deliberately tenant-operated:
-- Society Treasurer raises; a non-platform Society Admin for the same society decides.

delete from public.role_permissions rp using public.roles r,public.permissions p
where rp.role_id=r.id and rp.permission_id=p.id
  and r.name in ('Society Admin','Wing Admin')
  and p.code in ('finance.payment.refund','finance.due.waive');

alter function public.request_finance_adjustment(uuid,text,uuid,uuid,numeric,text,text,text,uuid)
  rename to request_finance_adjustment_internal;
alter function public.decide_finance_adjustment(uuid,uuid,text,text,uuid)
  rename to decide_finance_adjustment_internal;

revoke all on function public.request_finance_adjustment_internal(uuid,text,uuid,uuid,numeric,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.decide_finance_adjustment_internal(uuid,uuid,text,text,uuid) from public,anon,authenticated;

create or replace function public.request_finance_adjustment(
  p_society_id uuid,p_adjustment_type text,p_payment_id uuid,p_due_id uuid,p_amount numeric,
  p_payment_method text,p_reference_number text,p_reason text,p_actor_user_id uuid
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin() then
    raise exception 'treasurer_request_required';
  end if;
  if not exists(
    select 1 from public.user_access_assignments u
    join public.roles r on r.id=u.role_id
    where u.user_id=auth.uid() and u.society_id=p_society_id and u.wing_id is null
      and u.is_active and (u.valid_from is null or u.valid_from<=now()) and (u.valid_until is null or u.valid_until>now())
      and r.name='Society Treasurer'
  ) then raise exception 'treasurer_request_required'; end if;
  return public.request_finance_adjustment_internal(p_society_id,p_adjustment_type,p_payment_id,p_due_id,p_amount,p_payment_method,p_reference_number,p_reason,p_actor_user_id);
end;
$$;

create or replace function public.decide_finance_adjustment(
  p_society_id uuid,p_request_id uuid,p_decision text,p_notes text,p_actor_user_id uuid
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin() then
    raise exception 'society_admin_approval_required';
  end if;
  if not exists(
    select 1 from public.user_access_assignments u
    join public.roles r on r.id=u.role_id
    where u.user_id=auth.uid() and u.society_id=p_society_id and u.wing_id is null
      and u.is_active and (u.valid_from is null or u.valid_from<=now()) and (u.valid_until is null or u.valid_until>now())
      and r.name='Society Admin'
  ) then raise exception 'society_admin_approval_required'; end if;
  return public.decide_finance_adjustment_internal(p_society_id,p_request_id,p_decision,p_notes,p_actor_user_id);
end;
$$;

revoke all on function public.request_finance_adjustment(uuid,text,uuid,uuid,numeric,text,text,text,uuid) from public,anon;
revoke all on function public.decide_finance_adjustment(uuid,uuid,text,text,uuid) from public,anon;
grant execute on function public.request_finance_adjustment(uuid,text,uuid,uuid,numeric,text,text,text,uuid) to authenticated;
grant execute on function public.decide_finance_adjustment(uuid,uuid,text,text,uuid) to authenticated;
