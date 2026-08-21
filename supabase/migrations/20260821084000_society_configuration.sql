-- Complete society onboarding/configuration and tenant-owned settings updates.

alter table public.society_settings
  add column if not exists default_approval_workflow_id uuid
    references public.approval_workflows(id) on delete set null,
  add column if not exists notification_preferences jsonb not null
    default '{"portal":true,"email":true,"sms":false,"whatsapp":false}'::jsonb,
  add column if not exists configuration_completed_at timestamptz;

create index if not exists society_settings_default_workflow_idx
on public.society_settings(default_approval_workflow_id);

create or replace function public.update_society_configuration(
  p_society_id uuid,
  p_name text,
  p_address text,
  p_city text,
  p_state text,
  p_pin_code text,
  p_email text,
  p_phone text,
  p_website text,
  p_pan text,
  p_gstin text,
  p_logo_path text,
  p_letterhead_path text,
  p_application_pattern text,
  p_contract_pattern text,
  p_rfq_pattern text,
  p_work_order_pattern text,
  p_timezone text,
  p_max_upload_size_bytes bigint,
  p_contract_reminder_days integer[],
  p_notification_preferences jsonb,
  p_actor_user_id uuid
) returns void
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
begin
  if auth.uid() is null
     or auth.uid() <> p_actor_user_id
     or not (
       public.is_platform_admin()
       or (
         public.has_permission(p_society_id, 'admin.settings')
         and public.has_permission(p_society_id, 'society.update')
       )
     ) then
    raise exception 'society_configuration_access_denied';
  end if;
  if nullif(trim(p_name), '') is null
     or nullif(trim(p_address), '') is null
     or nullif(trim(p_city), '') is null
     or nullif(trim(p_state), '') is null
     or p_pin_code !~ '^[0-9]{6}$'
     or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
     or nullif(trim(p_phone), '') is null then
    raise exception 'invalid_society_configuration';
  end if;
  if p_pan is not null and nullif(trim(p_pan), '') is not null and upper(trim(p_pan)) !~ '^[A-Z]{5}[0-9]{4}[A-Z]$' then
    raise exception 'invalid_pan';
  end if;
  if p_gstin is not null and nullif(trim(p_gstin), '') is not null and upper(trim(p_gstin)) !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$' then
    raise exception 'invalid_gstin';
  end if;
  if p_max_upload_size_bytes < 1048576 or p_max_upload_size_bytes > 20971520 then
    raise exception 'invalid_upload_limit';
  end if;
  if cardinality(p_contract_reminder_days) = 0
     or exists(select 1 from unnest(p_contract_reminder_days) day_value where day_value < 0 or day_value > 365) then
    raise exception 'invalid_reminder_days';
  end if;
  if p_notification_preferences is null or jsonb_typeof(p_notification_preferences) <> 'object' then
    raise exception 'invalid_notification_preferences';
  end if;

  if nullif(trim(p_logo_path), '') is not null and not exists (
    select 1 from storage.objects object
    where object.bucket_id = 'society-documents'
      and object.name = p_logo_path
      and object.owner_id = auth.uid()::text
      and p_logo_path like p_society_id::text || '/branding/logo/%'
  ) then raise exception 'invalid_logo_storage_path'; end if;
  if nullif(trim(p_letterhead_path), '') is not null and not exists (
    select 1 from storage.objects object
    where object.bucket_id = 'society-documents'
      and object.name = p_letterhead_path
      and object.owner_id = auth.uid()::text
      and p_letterhead_path like p_society_id::text || '/branding/letterhead/%'
  ) then raise exception 'invalid_letterhead_storage_path'; end if;

  update public.societies
  set name = trim(p_name),
      address = trim(p_address),
      city = trim(p_city),
      state = trim(p_state),
      pin_code = p_pin_code,
      email = lower(trim(p_email)),
      phone = trim(p_phone),
      website = nullif(trim(p_website), ''),
      pan = upper(nullif(trim(p_pan), '')),
      gstin = upper(nullif(trim(p_gstin), '')),
      logo_url = coalesce(nullif(trim(p_logo_path), ''), logo_url),
      letterhead_url = coalesce(nullif(trim(p_letterhead_path), ''), letterhead_url),
      updated_by = p_actor_user_id
  where id = p_society_id;
  if not found then raise exception 'society_not_found'; end if;

  update public.society_settings
  set application_number_pattern = trim(p_application_pattern),
      contract_number_pattern = trim(p_contract_pattern),
      rfq_number_pattern = trim(p_rfq_pattern),
      work_order_number_pattern = trim(p_work_order_pattern),
      default_timezone = trim(p_timezone),
      max_upload_size_bytes = p_max_upload_size_bytes,
      contract_reminder_days = (
        select array_agg(distinct day_value order by day_value desc)
        from unnest(p_contract_reminder_days) day_value
      ),
      notification_preferences = p_notification_preferences,
      configuration_completed_at = coalesce(configuration_completed_at, now())
  where society_id = p_society_id;

  insert into public.audit_logs(
    society_id, actor_user_id, action, entity_type, entity_id, new_values
  ) values (
    p_society_id,
    p_actor_user_id,
    'SOCIETY_SETTINGS_UPDATED',
    'society',
    p_society_id::text,
    jsonb_build_object(
      'name', trim(p_name),
      'city', trim(p_city),
      'state', trim(p_state),
      'notificationPreferences', p_notification_preferences,
      'contractReminderDays', p_contract_reminder_days
    )
  );
end;
$$;

revoke all on function public.update_society_configuration(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,bigint,integer[],jsonb,uuid
) from public, anon;
grant execute on function public.update_society_configuration(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,bigint,integer[],jsonb,uuid
) to authenticated;

create or replace function public.register_society_with_admin_v2(
  p_name text,
  p_registration_number text,
  p_society_type text,
  p_address text,
  p_city text,
  p_state text,
  p_pin_code text,
  p_email text,
  p_phone text,
  p_website text,
  p_pan text,
  p_gstin text,
  p_registered_at date,
  p_admin_user_id uuid,
  p_created_by uuid,
  p_officers jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_society_id uuid;
  v_society_admin_role_id uuid;
  v_default_workflow_id uuid;
begin
  if not exists (
    select 1 from public.profiles where id = p_admin_user_id and is_active = true
  ) then raise exception 'The selected Society Admin account is not active.'; end if;
  if p_officers is null or jsonb_typeof(p_officers) <> 'array'
     or not exists(select 1 from jsonb_array_elements(p_officers) officer where officer->>'officer_type' = 'CHAIRMAN' and nullif(trim(officer->>'name'), '') is not null)
     or not exists(select 1 from jsonb_array_elements(p_officers) officer where officer->>'officer_type' = 'SECRETARY' and nullif(trim(officer->>'name'), '') is not null)
     or not exists(select 1 from jsonb_array_elements(p_officers) officer where officer->>'officer_type' = 'TREASURER' and nullif(trim(officer->>'name'), '') is not null) then
    raise exception 'Chairman, Secretary and Treasurer details are required.';
  end if;

  select id into v_society_admin_role_id
  from public.roles where name = 'Society Admin' and is_system_role = true;
  if v_society_admin_role_id is null then raise exception 'The Society Admin system role is missing.'; end if;
  select id into v_default_workflow_id
  from public.approval_workflows
  where society_id is null and workflow_key = 'MEMBER_APPLICATION_3_LEVEL' and is_active
  order by version desc limit 1;

  insert into public.societies(
    name, registration_number, society_type, address, city, state, pin_code,
    email, phone, website, pan, gstin, registered_at, is_active, created_by
  ) values (
    trim(p_name), trim(p_registration_number), trim(p_society_type), trim(p_address),
    trim(p_city), trim(p_state), trim(p_pin_code), lower(trim(p_email)), trim(p_phone),
    nullif(trim(p_website), ''), upper(nullif(trim(p_pan), '')),
    upper(nullif(trim(p_gstin), '')), p_registered_at, true, p_created_by
  ) returning id into v_society_id;

  insert into public.society_settings(
    society_id, default_approval_workflow_id, configuration_completed_at
  ) values (v_society_id, v_default_workflow_id, now());

  insert into public.user_access_assignments(
    user_id, society_id, wing_id, role_id, is_active, created_by
  ) values (p_admin_user_id, v_society_id, null, v_society_admin_role_id, true, p_created_by);

  insert into public.society_officers(
    society_id, officer_type, name, designation, phone, email, is_signatory, display_order
  )
  select v_society_id,
         officer_type,
         trim(name),
         nullif(trim(designation), ''),
         nullif(trim(phone), ''),
         nullif(lower(trim(email)), ''),
         is_signatory,
         row_number() over ()::integer
  from jsonb_to_recordset(p_officers) as officer(
    officer_type text,
    name text,
    designation text,
    phone text,
    email text,
    is_signatory boolean
  );

  return v_society_id;
end;
$$;

revoke all on function public.register_society_with_admin_v2(
  text,text,text,text,text,text,text,text,text,text,text,text,date,uuid,uuid,jsonb
) from public, anon, authenticated;
grant execute on function public.register_society_with_admin_v2(
  text,text,text,text,text,text,text,text,text,text,text,text,date,uuid,uuid,jsonb
) to service_role;
