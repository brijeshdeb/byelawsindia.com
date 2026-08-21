-- Society-level service-request decisions with immutable status history.

create or replace function public.is_society_wide_admin(p_society_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql security definer stable set search_path=public,pg_temp as $$
  select exists(
    select 1 from public.user_access_assignments uaa
    join public.roles r on r.id=uaa.role_id and r.name='Society Admin'
    join public.profiles p on p.id=uaa.user_id and p.is_active and not p.is_platform_admin
    where uaa.society_id=p_society_id and uaa.user_id=p_user_id and uaa.wing_id is null and uaa.is_active
      and (uaa.valid_from is null or uaa.valid_from<=now()) and (uaa.valid_until is null or uaa.valid_until>now())
  );
$$;
revoke all on function public.is_society_wide_admin(uuid,uuid) from public,anon;
grant execute on function public.is_society_wide_admin(uuid,uuid) to authenticated,service_role;

create table public.service_request_status_history(
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  resolution text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index service_request_history_request_idx on public.service_request_status_history(request_id,changed_at desc);
create index service_request_history_society_idx on public.service_request_status_history(society_id,changed_at desc);
alter table public.service_request_status_history enable row level security;
revoke all on public.service_request_status_history from anon,authenticated;
grant select on public.service_request_status_history to authenticated;
grant all on public.service_request_status_history to service_role;
create policy "service_request_history_read" on public.service_request_status_history for select to authenticated
using(public.can_access_society(society_id));

create or replace function public.enforce_service_request_status_boundary()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.status is not distinct from old.status or auth.uid() is null then return new; end if;
  if public.is_platform_admin() then raise exception 'platform_operational_decision_denied'; end if;
  if new.status in ('APPROVED','REJECTED') then
    if not public.is_society_wide_admin(new.society_id,auth.uid())
       or not public.has_permission(new.society_id,'service_request.approve') then
      raise exception 'society_admin_service_approval_required';
    end if;
  elsif not public.has_permission(new.society_id,'service_request.process') then
    raise exception 'service_request_processing_access_denied';
  end if;
  return new;
end;
$$;

create or replace function public.record_service_request_status_history()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if tg_op='INSERT' or new.status is distinct from old.status then
    insert into public.service_request_status_history(society_id,request_id,from_status,to_status,resolution,changed_by,metadata)
    values(new.society_id,new.id,case when tg_op='INSERT' then null else old.status end,new.status,new.resolution,
      coalesce(auth.uid(),new.updated_by,new.created_by),jsonb_build_object('source',case when tg_op='INSERT' then 'CREATE' else 'STATUS_CHANGE' end));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_service_request_status_boundary on public.service_requests;
create trigger trg_service_request_status_boundary before update of status on public.service_requests
for each row execute function public.enforce_service_request_status_boundary();
drop trigger if exists trg_service_request_status_history on public.service_requests;
create trigger trg_service_request_status_history after insert or update of status on public.service_requests
for each row execute function public.record_service_request_status_history();

drop policy if exists "service_requests_insert" on public.service_requests;
create policy "service_requests_insert" on public.service_requests for insert to authenticated
with check(not public.is_platform_admin() and public.has_permission(society_id,'service_request.create'));
drop policy if exists "service_requests_update" on public.service_requests;
create policy "service_requests_update" on public.service_requests for update to authenticated
using(not public.is_platform_admin() and (public.has_permission(society_id,'service_request.process') or public.has_permission(society_id,'service_request.approve')))
with check(not public.is_platform_admin() and (public.has_permission(society_id,'service_request.process') or public.has_permission(society_id,'service_request.approve')));

insert into public.service_request_status_history(society_id,request_id,from_status,to_status,resolution,changed_by,changed_at,metadata)
select sr.society_id,sr.id,null,sr.status,sr.resolution,sr.created_by,sr.created_at,jsonb_build_object('source','HISTORY_BACKFILL')
from public.service_requests sr
where not exists(select 1 from public.service_request_status_history history where history.request_id=sr.id);
