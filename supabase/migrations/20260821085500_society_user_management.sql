-- Society-level user provisioning and an invariant that every active society
-- always retains at least one active, society-wide Society Admin.

create or replace function public.assert_society_has_admin()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_society_id uuid;
begin
  if tg_table_name='societies' then
    v_society_id:=coalesce(new.id,old.id);
  else
    v_society_id:=coalesce(new.society_id,old.society_id);
  end if;
  if exists(select 1 from public.societies s where s.id=v_society_id and s.is_active)
     and not exists(
       select 1 from public.user_access_assignments uaa
       join public.roles r on r.id=uaa.role_id and r.name='Society Admin'
       where uaa.society_id=v_society_id and uaa.wing_id is null and uaa.is_active
         and (uaa.valid_from is null or uaa.valid_from<=now())
         and (uaa.valid_until is null or uaa.valid_until>now())
     ) then
    raise exception 'active_society_requires_society_admin';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_society_requires_admin_on_society on public.societies;
create constraint trigger trg_society_requires_admin_on_society
after insert or update of is_active on public.societies
deferrable initially deferred
for each row execute procedure public.assert_society_has_admin();

drop trigger if exists trg_society_requires_admin_on_assignment on public.user_access_assignments;
create constraint trigger trg_society_requires_admin_on_assignment
after insert or update or delete on public.user_access_assignments
deferrable initially deferred
for each row execute procedure public.assert_society_has_admin();

create or replace function public.assign_society_user_access(
  p_society_id uuid,
  p_target_user_id uuid,
  p_role_id uuid,
  p_wing_id uuid,
  p_actor_user_id uuid
) returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_assignment_id uuid;
  v_role_name text;
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(p_society_id,'admin.users')
     or not exists(
       select 1 from public.user_access_assignments uaa
       join public.roles r on r.id=uaa.role_id and r.name='Society Admin'
       where uaa.user_id=p_actor_user_id and uaa.society_id=p_society_id
         and uaa.wing_id is null and uaa.is_active
         and (uaa.valid_from is null or uaa.valid_from<=now())
         and (uaa.valid_until is null or uaa.valid_until>now())
     ) then raise exception 'society_user_management_access_denied'; end if;
  if not exists(select 1 from public.profiles where id=p_target_user_id and is_active) then
    raise exception 'target_user_not_active';
  end if;
  select name into v_role_name from public.roles where id=p_role_id;
  if v_role_name is null then raise exception 'role_not_found'; end if;
  if v_role_name='Society Admin' and p_wing_id is not null then
    raise exception 'society_admin_must_be_society_wide';
  end if;
  if p_wing_id is not null and not exists(
    select 1 from public.wings where id=p_wing_id and society_id=p_society_id and is_active
  ) then raise exception 'wing_not_in_society'; end if;

  select id into v_assignment_id from public.user_access_assignments
  where user_id=p_target_user_id and society_id=p_society_id
    and role_id=p_role_id and wing_id is not distinct from p_wing_id
  for update;
  if v_assignment_id is null then
    insert into public.user_access_assignments(
      user_id,society_id,wing_id,role_id,is_active,valid_from,valid_until,created_by
    ) values (
      p_target_user_id,p_society_id,p_wing_id,p_role_id,true,null,null,p_actor_user_id
    ) returning id into v_assignment_id;
  else
    update public.user_access_assignments set
      is_active=true,valid_from=null,valid_until=null,updated_by=p_actor_user_id
    where id=v_assignment_id;
  end if;

  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,new_values
  ) values (
    p_society_id,p_actor_user_id,'ACCESS_ASSIGNED','user_access_assignments',v_assignment_id::text,
    jsonb_build_object('user_id',p_target_user_id,'role_id',p_role_id,'role_name',v_role_name,
      'wing_id',p_wing_id,'scope',case when p_wing_id is null then 'SOCIETY' else 'WING' end)
  );
  return v_assignment_id;
end;
$$;

create or replace function public.revoke_society_user_access(
  p_assignment_id uuid,
  p_actor_user_id uuid
) returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_assignment public.user_access_assignments%rowtype;
  v_role_name text;
begin
  select * into v_assignment from public.user_access_assignments where id=p_assignment_id for update;
  if not found then raise exception 'access_assignment_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(v_assignment.society_id,'admin.users')
     or not exists(
       select 1 from public.user_access_assignments uaa
       join public.roles r on r.id=uaa.role_id and r.name='Society Admin'
       where uaa.user_id=p_actor_user_id and uaa.society_id=v_assignment.society_id
         and uaa.wing_id is null and uaa.is_active
     ) then raise exception 'society_user_management_access_denied'; end if;
  if v_assignment.user_id=p_actor_user_id then raise exception 'cannot_revoke_own_access'; end if;
  select name into v_role_name from public.roles where id=v_assignment.role_id;
  update public.user_access_assignments set is_active=false,updated_by=p_actor_user_id
  where id=v_assignment.id;
  if v_role_name='Society Admin' and not exists(
    select 1 from public.user_access_assignments uaa
    join public.roles r on r.id=uaa.role_id and r.name='Society Admin'
    where uaa.society_id=v_assignment.society_id and uaa.wing_id is null and uaa.is_active
  ) then raise exception 'cannot_revoke_last_society_admin'; end if;
  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values
  ) values (
    v_assignment.society_id,p_actor_user_id,'ACCESS_REVOKED','user_access_assignments',v_assignment.id::text,
    jsonb_build_object('user_id',v_assignment.user_id,'role_id',v_assignment.role_id,
      'role_name',v_role_name,'wing_id',v_assignment.wing_id,'is_active',v_assignment.is_active),
    jsonb_build_object('is_active',false)
  );
end;
$$;

create or replace function public.list_society_user_access(p_society_id uuid)
returns table(
  assignment_id uuid,
  user_id uuid,
  full_name text,
  email text,
  role_id uuid,
  role_name text,
  wing_id uuid,
  wing_name text,
  is_active boolean,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path=public,pg_temp
as $$
begin
  if auth.uid() is null or public.is_platform_admin()
     or not public.has_permission(p_society_id,'admin.users') then
    raise exception 'society_user_management_access_denied';
  end if;
  return query
  select uaa.id,p.id,p.full_name,p.email,r.id,r.name,uaa.wing_id,w.name,
    uaa.is_active,p.last_sign_in_at,uaa.created_at
  from public.user_access_assignments uaa
  join public.profiles p on p.id=uaa.user_id
  join public.roles r on r.id=uaa.role_id
  left join public.wings w on w.id=uaa.wing_id
  where uaa.society_id=p_society_id
  order by uaa.is_active desc,r.name,p.full_name,p.email;
end;
$$;

revoke all on function public.assert_society_has_admin() from public,anon,authenticated;
revoke all on function public.assign_society_user_access(uuid,uuid,uuid,uuid,uuid) from public,anon;
revoke all on function public.revoke_society_user_access(uuid,uuid) from public,anon;
revoke all on function public.list_society_user_access(uuid) from public,anon;
grant execute on function public.assign_society_user_access(uuid,uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.revoke_society_user_access(uuid,uuid) to authenticated;
grant execute on function public.list_society_user_access(uuid) to authenticated;
grant execute on function public.assign_society_user_access(uuid,uuid,uuid,uuid,uuid) to service_role;
grant execute on function public.revoke_society_user_access(uuid,uuid) to service_role;
grant execute on function public.list_society_user_access(uuid) to service_role;
