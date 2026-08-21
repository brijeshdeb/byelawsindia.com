-- Configurable contract-expiry monitoring, automatic renewal intimations,
-- society/vendor notifications, and idempotent reminder history.

create unique index if not exists notifications_contract_reminder_unique_idx
  on public.notifications(user_id,entity_id,(metadata->>'reminder_key'))
  where notification_type='CONTRACT_EXPIRY_REMINDER';

create or replace function public.generate_contract_expiry_events(p_run_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_contract record;
  v_recipient record;
  v_days integer;
  v_reminder_key text;
  v_title text;
  v_message text;
  v_renewal_id uuid;
  v_sequence integer;
  v_renewal_number text;
  v_notifications integer:=0;
  v_renewals integer:=0;
  v_expired integer:=0;
  v_inserted integer;
begin
  for v_contract in
    select c.id,c.society_id,c.vendor_id,c.contract_number,c.title,c.end_date,c.created_by,
      s.name as society_name,coalesce(ss.contract_reminder_days,array[90,60,30,15,7,0]) as reminder_days
    from public.contracts c
    join public.societies s on s.id=c.society_id and s.is_active
    left join public.society_settings ss on ss.society_id=c.society_id
    where c.status='ACTIVE' and c.end_date is not null
      and ((c.end_date-p_run_date)=any(coalesce(ss.contract_reminder_days,array[90,60,30,15,7,0])) or c.end_date<p_run_date)
  loop
    v_days:=v_contract.end_date-p_run_date;
    v_reminder_key:=case when v_days<0 then 'EXPIRED' else 'DAYS_'||v_days::text end;
    v_title:=case when v_days<0 then 'Contract expired' when v_days=0 then 'Contract expires today' else 'Contract expiry reminder' end;
    v_message:=case when v_days<0
      then format('%s (%s) expired on %s.',v_contract.title,v_contract.contract_number,to_char(v_contract.end_date,'DD Mon YYYY'))
      when v_days=0 then format('%s (%s) expires today.',v_contract.title,v_contract.contract_number)
      else format('%s (%s) expires in %s days on %s.',v_contract.title,v_contract.contract_number,v_days,to_char(v_contract.end_date,'DD Mon YYYY')) end;

    select id into v_renewal_id from public.contract_renewals
    where contract_id=v_contract.id and status not in ('REJECTED','COMPLETED','CANCELLED')
    order by created_at desc limit 1;
    if v_renewal_id is null and v_contract.vendor_id is not null and v_days>=0 then
      v_sequence:=public.get_next_sequence(v_contract.society_id,'CONTRACT_RENEWAL',extract(year from p_run_date)::integer,null);
      v_renewal_number:='RNW-'||extract(year from p_run_date)::integer||'-'||lpad(v_sequence::text,3,'0');
      insert into public.contract_renewals(
        society_id,contract_id,vendor_id,renewal_number,status,current_end_date,
        response_due_at,intimation_sent_at,created_by
      ) values(
        v_contract.society_id,v_contract.id,v_contract.vendor_id,v_renewal_number,'INTIMATION_SENT',v_contract.end_date,
        least(v_contract.end_date::timestamptz,(p_run_date+14)::timestamptz),now(),v_contract.created_by
      ) returning id into v_renewal_id;
      v_renewals:=v_renewals+1;
    end if;

    for v_recipient in
      select distinct recipient_id from (
        select uaa.user_id as recipient_id
        from public.user_access_assignments uaa
        join public.roles r on r.id=uaa.role_id
        join public.profiles p on p.id=uaa.user_id and p.is_active and not p.is_platform_admin
        where uaa.society_id=v_contract.society_id and uaa.is_active
          and (uaa.valid_from is null or uaa.valid_from<=now()) and (uaa.valid_until is null or uaa.valid_until>now())
          and (r.name='Society Admin' or exists(
            select 1 from public.role_permissions rp join public.permissions permission on permission.id=rp.permission_id
            where rp.role_id=r.id and permission.code='contract.renewal.manage'
          ))
        union
        select vu.user_id from public.vendor_users vu
        join public.profiles p on p.id=vu.user_id and p.is_active
        where vu.society_id=v_contract.society_id and vu.vendor_id=v_contract.vendor_id and vu.is_active
        union
        select v_contract.created_by where v_contract.created_by is not null
      ) recipients
    loop
      insert into public.notifications(
        society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url,metadata
      ) values(
        v_contract.society_id,v_recipient.recipient_id,'CONTRACT_EXPIRY_REMINDER',v_title,v_message,
        'contract',v_contract.id,
        case when exists(select 1 from public.vendor_users vu where vu.user_id=v_recipient.recipient_id and vu.society_id=v_contract.society_id and vu.vendor_id=v_contract.vendor_id and vu.is_active) then '/vendor' else '/procurement/contracts' end,
        jsonb_build_object('reminder_key',v_reminder_key,'days_remaining',v_days,'end_date',v_contract.end_date,
          'contract_number',v_contract.contract_number,'renewal_id',v_renewal_id)
      ) on conflict do nothing;
      get diagnostics v_inserted=row_count;
      v_notifications:=v_notifications+v_inserted;
    end loop;

    if v_days<0 then
      update public.contracts set status='EXPIRED',updated_at=now() where id=v_contract.id and status='ACTIVE';
      get diagnostics v_inserted=row_count;
      v_expired:=v_expired+v_inserted;
    end if;
  end loop;

  insert into public.audit_logs(action,entity_type,new_values,metadata)
  values('CONTRACT_EXPIRY_SCAN_COMPLETED','system_job',jsonb_build_object(
    'run_date',p_run_date,'notifications_created',v_notifications,'renewals_created',v_renewals,'contracts_expired',v_expired
  ),jsonb_build_object('job','contract_expiry'));
  return jsonb_build_object('runDate',p_run_date,'notificationsCreated',v_notifications,'renewalsCreated',v_renewals,'contractsExpired',v_expired);
end;
$$;

revoke all on function public.generate_contract_expiry_events(date) from public,anon,authenticated;
grant execute on function public.generate_contract_expiry_events(date) to service_role;
