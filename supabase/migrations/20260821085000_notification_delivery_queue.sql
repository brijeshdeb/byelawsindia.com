-- Auditable external notification delivery queue. Portal notifications remain
-- the source event; this table records every email delivery decision and retry.

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'EMAIL',
  recipient text,
  subject text not null,
  text_body text not null,
  action_url text,
  status text not null default 'QUEUED',
  skip_reason text,
  provider text,
  provider_message_id text,
  idempotency_key text not null,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint notification_deliveries_notification_channel_unique unique(notification_id,channel),
  constraint notification_deliveries_idempotency_unique unique(idempotency_key),
  constraint notification_deliveries_channel_check check(channel in ('EMAIL','SMS','WHATSAPP')),
  constraint notification_deliveries_status_check check(status in (
    'QUEUED','PROCESSING','SENT','FAILED','DEAD','SKIPPED','DELIVERED',
    'BOUNCED','COMPLAINED','SUPPRESSED'
  )),
  constraint notification_deliveries_attempt_check check(attempt_count>=0)
);

create index notification_deliveries_queue_idx
  on public.notification_deliveries(status,next_attempt_at,created_at)
  where status in ('QUEUED','FAILED','PROCESSING');
create index notification_deliveries_society_idx
  on public.notification_deliveries(society_id,created_at desc);
create index notification_deliveries_user_idx
  on public.notification_deliveries(user_id,created_at desc);
create unique index notification_deliveries_provider_message_idx
  on public.notification_deliveries(provider,provider_message_id)
  where provider_message_id is not null;
create trigger trg_notification_deliveries_updated_at
  before update on public.notification_deliveries
  for each row execute procedure public.set_updated_at();

alter table public.notification_deliveries enable row level security;
revoke all on table public.notification_deliveries from anon,authenticated;
grant select on table public.notification_deliveries to authenticated;
grant all on table public.notification_deliveries to service_role;

create policy "notification_deliveries_read_own_or_admin"
on public.notification_deliveries for select to authenticated
using (
  user_id=(select auth.uid())
  or (
    not (select public.is_platform_admin())
    and (select public.has_permission(society_id,'admin.settings'))
  )
);

create or replace function public.queue_notification_delivery()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_environment text;
  v_preferences jsonb;
  v_email text;
  v_status text:='QUEUED';
  v_skip_reason text;
begin
  select s.environment_type,coalesce(ss.notification_preferences,'{}'::jsonb),lower(trim(p.email))
    into v_environment,v_preferences,v_email
  from public.societies s
  left join public.society_settings ss on ss.society_id=s.id
  left join public.profiles p on p.id=new.user_id
  where s.id=new.society_id;

  if v_environment is distinct from 'CUSTOMER' then
    v_status:='SKIPPED'; v_skip_reason:='NON_CUSTOMER_ENVIRONMENT';
  elsif coalesce((v_preferences->>'email')::boolean,true)=false then
    v_status:='SKIPPED'; v_skip_reason:='EMAIL_DISABLED_BY_SOCIETY';
  elsif v_email is null or v_email!~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    v_status:='SKIPPED'; v_skip_reason:='RECIPIENT_EMAIL_MISSING_OR_INVALID';
  elsif v_email like '%@test.byelawsindia.com' or v_email like '%.invalid' then
    v_status:='SKIPPED'; v_skip_reason:='TEST_RECIPIENT_GUARD';
  end if;

  insert into public.notification_deliveries(
    notification_id,society_id,user_id,channel,recipient,subject,text_body,
    action_url,status,skip_reason,idempotency_key,metadata
  ) values (
    new.id,new.society_id,new.user_id,'EMAIL',v_email,new.title,new.message,
    new.action_url,v_status,v_skip_reason,'notification-email-'||new.id,
    jsonb_build_object('notification_type',new.notification_type,'entity_type',new.entity_type,
      'entity_id',new.entity_id,'environment_type',v_environment)
  ) on conflict(notification_id,channel) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_queue_notification_delivery on public.notifications;
create trigger trg_queue_notification_delivery
after insert on public.notifications
for each row execute procedure public.queue_notification_delivery();

-- Historical portal notifications are deliberately not sent retroactively.
insert into public.notification_deliveries(
  notification_id,society_id,user_id,channel,recipient,subject,text_body,action_url,
  status,skip_reason,idempotency_key,metadata
)
select n.id,n.society_id,n.user_id,'EMAIL',lower(trim(p.email)),n.title,n.message,n.action_url,
  'SKIPPED','PRE_QUEUE_HISTORY','notification-email-'||n.id,
  jsonb_build_object('notification_type',n.notification_type,'historical',true)
from public.notifications n
left join public.profiles p on p.id=n.user_id
on conflict(notification_id,channel) do nothing;

create or replace function public.claim_notification_deliveries(
  p_batch_size integer,
  p_worker_id text
) returns table(
  id uuid,
  notification_id uuid,
  society_id uuid,
  recipient text,
  subject text,
  text_body text,
  action_url text,
  idempotency_key text,
  attempt_count integer
)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if current_user not in ('service_role','postgres') then raise exception 'delivery_worker_access_denied'; end if;
  if p_batch_size<1 or p_batch_size>100 then raise exception 'invalid_delivery_batch_size'; end if;
  if nullif(trim(p_worker_id),'') is null then raise exception 'delivery_worker_id_required'; end if;

  return query
  with candidates as (
    select d.id from public.notification_deliveries d
    join public.societies s on s.id=d.society_id and s.environment_type='CUSTOMER'
    where d.attempt_count<5
      and (
        (d.status in ('QUEUED','FAILED') and d.next_attempt_at<=now())
        or (d.status='PROCESSING' and d.locked_at<now()-interval '15 minutes')
      )
      and d.recipient is not null
      and d.recipient not like '%@test.byelawsindia.com'
      and d.recipient not like '%.invalid'
    order by d.next_attempt_at,d.created_at
    for update of d skip locked
    limit p_batch_size
  ), claimed as (
    update public.notification_deliveries d set
      status='PROCESSING',attempt_count=d.attempt_count+1,locked_at=now(),locked_by=trim(p_worker_id),
      last_error=null
    from candidates c where d.id=c.id
    returning d.*
  )
  select c.id,c.notification_id,c.society_id,c.recipient,c.subject,c.text_body,
    c.action_url,c.idempotency_key,c.attempt_count from claimed c;
end;
$$;

create or replace function public.complete_notification_delivery(
  p_delivery_id uuid,
  p_succeeded boolean,
  p_provider text,
  p_provider_message_id text,
  p_error text,
  p_worker_id text
) returns text
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_delivery public.notification_deliveries%rowtype;
  v_status text;
begin
  if current_user not in ('service_role','postgres') then raise exception 'delivery_worker_access_denied'; end if;
  select * into v_delivery from public.notification_deliveries where id=p_delivery_id for update;
  if not found then raise exception 'notification_delivery_not_found'; end if;
  if v_delivery.status<>'PROCESSING' or v_delivery.locked_by is distinct from trim(p_worker_id) then
    raise exception 'notification_delivery_not_claimed_by_worker';
  end if;

  if p_succeeded then
    if nullif(trim(p_provider_message_id),'') is null then raise exception 'provider_message_id_required'; end if;
    v_status:='SENT';
    update public.notification_deliveries set
      status=v_status,provider=coalesce(nullif(trim(p_provider),''),'RESEND'),
      provider_message_id=trim(p_provider_message_id),sent_at=now(),failed_at=null,
      locked_at=null,locked_by=null,last_error=null
    where id=p_delivery_id;
  else
    v_status:=case when v_delivery.attempt_count>=5 then 'DEAD' else 'FAILED' end;
    update public.notification_deliveries set
      status=v_status,provider=coalesce(nullif(trim(p_provider),''),'RESEND'),
      failed_at=now(),locked_at=null,locked_by=null,
      last_error=left(coalesce(nullif(trim(p_error),''),'Unknown provider error'),2000),
      next_attempt_at=now()+(least(60,power(2,greatest(0,v_delivery.attempt_count-1))::integer)*interval '1 minute')
    where id=p_delivery_id;
  end if;

  insert into public.audit_logs(
    society_id,action,entity_type,entity_id,new_values,metadata
  ) values (
    v_delivery.society_id,
    case when p_succeeded then 'NOTIFICATION_EMAIL_SENT' else 'NOTIFICATION_EMAIL_FAILED' end,
    'notification_delivery',p_delivery_id::text,
    jsonb_build_object('status',v_status,'attempt_count',v_delivery.attempt_count,
      'provider_message_id',p_provider_message_id),
    jsonb_build_object('notification_id',v_delivery.notification_id,'worker_id',p_worker_id,
      'error',case when p_succeeded then null else left(p_error,2000) end)
  );
  return v_status;
end;
$$;

create or replace function public.record_notification_delivery_event(
  p_provider_message_id text,
  p_event_status text,
  p_event_id text,
  p_event_payload jsonb
) returns boolean
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_delivery public.notification_deliveries%rowtype;
begin
  if current_user not in ('service_role','postgres') then raise exception 'delivery_webhook_access_denied'; end if;
  if p_event_status not in ('DELIVERED','BOUNCED','COMPLAINED','SUPPRESSED') then
    raise exception 'invalid_delivery_event_status';
  end if;
  select * into v_delivery from public.notification_deliveries
  where provider='RESEND' and provider_message_id=p_provider_message_id for update;
  if not found then return false; end if;
  if v_delivery.metadata->'provider_event_ids' ? p_event_id then return true; end if;
  update public.notification_deliveries set
    status=p_event_status,
    delivered_at=case when p_event_status='DELIVERED' then coalesce(delivered_at,now()) else delivered_at end,
    failed_at=case when p_event_status in ('BOUNCED','COMPLAINED','SUPPRESSED') then now() else failed_at end,
    metadata=jsonb_set(
      metadata||jsonb_build_object('last_provider_event',p_event_payload),
      '{provider_event_ids}',coalesce(metadata->'provider_event_ids','{}'::jsonb)||jsonb_build_object(p_event_id,true),true
    )
  where id=v_delivery.id;
  insert into public.audit_logs(society_id,action,entity_type,entity_id,new_values,metadata)
  values(v_delivery.society_id,'NOTIFICATION_EMAIL_'||p_event_status,'notification_delivery',v_delivery.id::text,
    jsonb_build_object('status',p_event_status),jsonb_build_object('event_id',p_event_id));
  return true;
end;
$$;

revoke all on function public.queue_notification_delivery() from public,anon,authenticated;
revoke all on function public.claim_notification_deliveries(integer,text) from public,anon,authenticated;
revoke all on function public.complete_notification_delivery(uuid,boolean,text,text,text,text) from public,anon,authenticated;
revoke all on function public.record_notification_delivery_event(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_notification_deliveries(integer,text) to service_role;
grant execute on function public.complete_notification_delivery(uuid,boolean,text,text,text,text) to service_role;
grant execute on function public.record_notification_delivery_event(text,text,text,jsonb) to service_role;
