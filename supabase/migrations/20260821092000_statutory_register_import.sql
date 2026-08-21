-- Atomic, society-scoped Form I / Form J import after server-side workbook
-- parsing and unambiguous member matching.

create or replace function public.import_statutory_register(
  p_society_id uuid,p_form_type text,p_rows jsonb,p_actor_user_id uuid
) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_row jsonb;
  v_count integer:=0;
  v_member_id uuid;
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(p_society_id,'member.update') then
    raise exception 'statutory_import_access_denied';
  end if;
  if p_form_type not in ('FORM_I','FORM_J') or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>5000 then
    raise exception 'invalid_statutory_import';
  end if;
  if (select count(distinct item->>'memberId') from jsonb_array_elements(p_rows) item)<>jsonb_array_length(p_rows) then
    raise exception 'duplicate_member_in_import';
  end if;
  if exists(
    select 1 from jsonb_array_elements(p_rows) item
    where not exists(select 1 from public.members member where member.id=nullif(item->>'memberId','')::uuid and member.society_id=p_society_id)
  ) then raise exception 'import_member_scope_mismatch'; end if;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_member_id:=(v_row->>'memberId')::uuid;
    if p_form_type='FORM_I' then
      update public.members set
        address=nullif(trim(v_row->>'address'),''),
        correspondence_address=coalesce(nullif(trim(v_row->>'address'),''),correspondence_address),
        occupation=nullif(trim(v_row->>'occupation'),''),
        age_at_admission=nullif(v_row->>'ageAtAdmission','')::smallint,
        effective_from=coalesce(nullif(v_row->>'admissionDate','')::date,effective_from),
        entrance_fee_paid_at=nullif(v_row->>'entranceFeePaidAt','')::date,
        nominee_name_address=nullif(trim(v_row->>'nomineeNameAddress'),''),
        nomination_date=nullif(v_row->>'nominationDate','')::date,
        effective_until=nullif(v_row->>'cessationDate','')::date,
        cessation_reason=nullif(trim(v_row->>'cessationReason'),''),
        remark=nullif(trim(v_row->>'remark'),''),updated_at=now()
      where id=v_member_id and society_id=p_society_id;
    else
      update public.members set
        address=nullif(trim(v_row->>'address'),''),
        correspondence_address=coalesce(nullif(trim(v_row->>'address'),''),correspondence_address),
        member_type=case upper(replace(coalesce(v_row->>'memberClass','OWNER'),' ','_'))
          when 'TENANT' then 'TENANT' when 'ASSOCIATE' then 'ASSOCIATE' when 'COMMITTEE' then 'COMMITTEE' else 'OWNER' end,
        status=case upper(coalesce(v_row->>'status','ACTIVE')) when 'INACTIVE' then 'INACTIVE' else 'ACTIVE' end,
        updated_at=now()
      where id=v_member_id and society_id=p_society_id;
    end if;
    v_count:=v_count+1;
  end loop;

  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,new_values,metadata)
  values(p_society_id,p_actor_user_id,'STATUTORY_REGISTER_IMPORTED','member_register',
    jsonb_build_object('form_type',p_form_type,'rows_updated',v_count),jsonb_build_object('atomic',true));
  return v_count;
end;
$$;

revoke all on function public.import_statutory_register(uuid,text,jsonb,uuid) from public,anon;
grant execute on function public.import_statutory_register(uuid,text,jsonb,uuid) to authenticated,service_role;
