-- Operational decisions are tenant-owned. The Platform Owner retains oversight,
-- configuration and account-recovery powers, but cannot decide society records.

create or replace function public.enforce_society_admin_operational_decision()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_decision boolean := false;
begin
  if auth.uid() is null then return new; end if;

  if tg_table_name='nominations' then
    v_decision := new.status is distinct from old.status
      and new.status in ('APPROVED','REJECTED','CORRECTION_REQUIRED');
  elsif tg_table_name='associate_memberships' then
    v_decision := new.status is distinct from old.status
      and new.status in ('APPROVED','REJECTED','CORRECTION_REQUIRED');
  elsif tg_table_name='contract_renewals' then
    v_decision := new.status is distinct from old.status
      and new.status in ('APPROVED','REJECTED','COMPLETED');
  elsif tg_table_name='society_documents' then
    v_decision := new.status is distinct from old.status
      and new.status in ('VERIFIED','REJECTED','ARCHIVED');
  elsif tg_table_name='vendor_documents' then
    v_decision := new.status is distinct from old.status
      and new.status in ('VERIFIED','REJECTED');
  end if;

  if v_decision and (
    public.is_platform_admin()
    or not public.is_society_wide_admin(new.society_id,auth.uid())
  ) then
    raise exception 'society_admin_operational_decision_required';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_society_admin_operational_decision() from public,anon,authenticated;

drop trigger if exists nominations_society_admin_decision on public.nominations;
create trigger nominations_society_admin_decision before update on public.nominations
for each row execute function public.enforce_society_admin_operational_decision();

drop trigger if exists associates_society_admin_decision on public.associate_memberships;
create trigger associates_society_admin_decision before update on public.associate_memberships
for each row execute function public.enforce_society_admin_operational_decision();

drop trigger if exists renewals_society_admin_decision on public.contract_renewals;
create trigger renewals_society_admin_decision before update on public.contract_renewals
for each row execute function public.enforce_society_admin_operational_decision();

drop trigger if exists society_documents_society_admin_decision on public.society_documents;
create trigger society_documents_society_admin_decision before update on public.society_documents
for each row execute function public.enforce_society_admin_operational_decision();

drop trigger if exists vendor_documents_society_admin_decision on public.vendor_documents;
create trigger vendor_documents_society_admin_decision before update on public.vendor_documents
for each row execute function public.enforce_society_admin_operational_decision();

drop policy if exists "society_documents_review" on public.society_documents;
create policy "society_documents_review" on public.society_documents for update to authenticated
using(not public.is_platform_admin() and public.is_society_wide_admin(society_id,auth.uid()) and public.has_permission(society_id,'document.verify'))
with check(not public.is_platform_admin() and public.is_society_wide_admin(society_id,auth.uid()) and public.has_permission(society_id,'document.verify'));

drop policy if exists "vendor_documents_staff_update" on public.vendor_documents;
create policy "vendor_documents_staff_update" on public.vendor_documents for update to authenticated
using(not public.is_platform_admin() and public.is_society_wide_admin(society_id,auth.uid()) and public.has_permission(society_id,'vendor.verify'))
with check(not public.is_platform_admin() and public.is_society_wide_admin(society_id,auth.uid()) and public.has_permission(society_id,'vendor.verify'));

comment on function public.enforce_society_admin_operational_decision() is
  'Rejects society operational decisions by Platform Owner or by any user who is not an active society-wide Society Admin for the record tenant.';
