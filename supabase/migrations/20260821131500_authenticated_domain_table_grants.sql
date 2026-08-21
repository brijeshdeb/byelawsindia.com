-- Domain tables were created after the original authenticated-role grant
-- migration. Grant table privileges now, while keeping row access constrained
-- by permission-aware RLS policies.

grant select, insert, update on table
  public.members,
  public.member_applications,
  public.society_documents,
  public.vendors,
  public.maintenance_complaints,
  public.maintenance_work_orders,
  public.rfqs,
  public.procurement_work_orders,
  public.contracts,
  public.finance_dues
to authenticated;

-- Payment writes remain RPC-only so maker/checker and idempotency rules cannot
-- be bypassed with a direct PostgREST insert.
grant select on table public.finance_payments to authenticated;
revoke insert, update, delete on table public.finance_payments from authenticated;

drop policy if exists members_select on public.members;
drop policy if exists members_insert on public.members;
drop policy if exists members_update on public.members;
create policy members_select on public.members for select to authenticated
  using ((select public.has_permission(society_id, 'member.read')));
create policy members_insert on public.members for insert to authenticated
  with check ((select public.has_permission(society_id, 'member.create')));
create policy members_update on public.members for update to authenticated
  using ((select public.has_permission(society_id, 'member.update')) or (select public.has_permission(society_id, 'member.archive')))
  with check ((select public.has_permission(society_id, 'member.update')) or (select public.has_permission(society_id, 'member.archive')));

drop policy if exists member_applications_select on public.member_applications;
drop policy if exists member_applications_insert on public.member_applications;
drop policy if exists member_applications_update on public.member_applications;
create policy member_applications_select on public.member_applications for select to authenticated
  using ((select public.has_permission(society_id, 'application.read')));
create policy member_applications_insert on public.member_applications for insert to authenticated
  with check ((select public.has_permission(society_id, 'application.create')));
create policy member_applications_update on public.member_applications for update to authenticated
  using (
    (select public.has_permission(society_id, 'application.submit')) or
    (select public.has_permission(society_id, 'application.verify')) or
    (select public.has_permission(society_id, 'application.approve.level1')) or
    (select public.has_permission(society_id, 'application.approve.level2')) or
    (select public.has_permission(society_id, 'application.approve.final'))
  )
  with check (
    (select public.has_permission(society_id, 'application.submit')) or
    (select public.has_permission(society_id, 'application.verify')) or
    (select public.has_permission(society_id, 'application.approve.level1')) or
    (select public.has_permission(society_id, 'application.approve.level2')) or
    (select public.has_permission(society_id, 'application.approve.final'))
  );

drop policy if exists society_documents_select on public.society_documents;
drop policy if exists society_documents_insert on public.society_documents;
drop policy if exists society_documents_update on public.society_documents;
create policy society_documents_select on public.society_documents for select to authenticated
  using ((select public.has_permission(society_id, 'document.read')));
create policy society_documents_insert on public.society_documents for insert to authenticated
  with check ((select public.has_permission(society_id, 'document.upload')));
create policy society_documents_update on public.society_documents for update to authenticated
  using (
    (select public.has_permission(society_id, 'document.verify')) or
    (select public.has_permission(society_id, 'document.replace')) or
    (select public.has_permission(society_id, 'document.archive'))
  )
  with check (
    (select public.has_permission(society_id, 'document.verify')) or
    (select public.has_permission(society_id, 'document.replace')) or
    (select public.has_permission(society_id, 'document.archive'))
  );

drop policy if exists vendors_select on public.vendors;
drop policy if exists vendors_insert on public.vendors;
drop policy if exists vendors_update on public.vendors;
create policy vendors_select on public.vendors for select to authenticated
  using ((select public.has_permission(society_id, 'vendor.read')));
create policy vendors_insert on public.vendors for insert to authenticated
  with check ((select public.has_permission(society_id, 'vendor.create')));
create policy vendors_update on public.vendors for update to authenticated
  using ((select public.has_permission(society_id, 'vendor.update')) or (select public.has_permission(society_id, 'vendor.verify')))
  with check ((select public.has_permission(society_id, 'vendor.update')) or (select public.has_permission(society_id, 'vendor.verify')));

drop policy if exists maintenance_complaints_select on public.maintenance_complaints;
drop policy if exists maintenance_complaints_insert on public.maintenance_complaints;
drop policy if exists maintenance_complaints_update on public.maintenance_complaints;
create policy maintenance_complaints_select on public.maintenance_complaints for select to authenticated
  using ((select public.has_permission(society_id, 'maintenance.view')));
create policy maintenance_complaints_insert on public.maintenance_complaints for insert to authenticated
  with check ((select public.has_permission(society_id, 'maintenance.manage')));
create policy maintenance_complaints_update on public.maintenance_complaints for update to authenticated
  using ((select public.has_permission(society_id, 'maintenance.manage')))
  with check ((select public.has_permission(society_id, 'maintenance.manage')));

drop policy if exists maintenance_work_orders_select on public.maintenance_work_orders;
drop policy if exists maintenance_work_orders_insert on public.maintenance_work_orders;
drop policy if exists maintenance_work_orders_update on public.maintenance_work_orders;
create policy maintenance_work_orders_select on public.maintenance_work_orders for select to authenticated
  using ((select public.has_permission(society_id, 'maintenance.view')));
create policy maintenance_work_orders_insert on public.maintenance_work_orders for insert to authenticated
  with check ((select public.has_permission(society_id, 'maintenance.manage')));
create policy maintenance_work_orders_update on public.maintenance_work_orders for update to authenticated
  using ((select public.has_permission(society_id, 'maintenance.manage')))
  with check ((select public.has_permission(society_id, 'maintenance.manage')));

drop policy if exists rfqs_select on public.rfqs;
drop policy if exists rfqs_insert on public.rfqs;
drop policy if exists rfqs_update on public.rfqs;
create policy rfqs_select on public.rfqs for select to authenticated
  using ((select public.has_permission(society_id, 'rfq.read')));
create policy rfqs_insert on public.rfqs for insert to authenticated
  with check ((select public.has_permission(society_id, 'rfq.create')));
create policy rfqs_update on public.rfqs for update to authenticated
  using (
    (select public.has_permission(society_id, 'rfq.create')) or
    (select public.has_permission(society_id, 'rfq.publish')) or
    (select public.has_permission(society_id, 'rfq.approve'))
  )
  with check (
    (select public.has_permission(society_id, 'rfq.create')) or
    (select public.has_permission(society_id, 'rfq.publish')) or
    (select public.has_permission(society_id, 'rfq.approve'))
  );

drop policy if exists procurement_work_orders_select on public.procurement_work_orders;
drop policy if exists procurement_work_orders_insert on public.procurement_work_orders;
drop policy if exists procurement_work_orders_update on public.procurement_work_orders;
create policy procurement_work_orders_select on public.procurement_work_orders for select to authenticated
  using ((select public.has_permission(society_id, 'rfq.read')) or (select public.has_permission(society_id, 'work_order.create')) or (select public.has_permission(society_id, 'work_order.approve')));
create policy procurement_work_orders_insert on public.procurement_work_orders for insert to authenticated
  with check ((select public.has_permission(society_id, 'work_order.create')));
create policy procurement_work_orders_update on public.procurement_work_orders for update to authenticated
  using ((select public.has_permission(society_id, 'work_order.create')) or (select public.has_permission(society_id, 'work_order.approve')))
  with check ((select public.has_permission(society_id, 'work_order.create')) or (select public.has_permission(society_id, 'work_order.approve')));

drop policy if exists contracts_select on public.contracts;
drop policy if exists contracts_insert on public.contracts;
drop policy if exists contracts_update on public.contracts;
create policy contracts_select on public.contracts for select to authenticated
  using ((select public.has_permission(society_id, 'contract.read')));
create policy contracts_insert on public.contracts for insert to authenticated
  with check ((select public.has_permission(society_id, 'contract.create')));
create policy contracts_update on public.contracts for update to authenticated
  using (
    (select public.has_permission(society_id, 'contract.update')) or
    (select public.has_permission(society_id, 'contract.approve')) or
    (select public.has_permission(society_id, 'contract.renew')) or
    (select public.has_permission(society_id, 'contract.terminate')) or
    (select public.has_permission(society_id, 'contract.renewal.manage'))
  )
  with check (
    (select public.has_permission(society_id, 'contract.update')) or
    (select public.has_permission(society_id, 'contract.approve')) or
    (select public.has_permission(society_id, 'contract.renew')) or
    (select public.has_permission(society_id, 'contract.terminate')) or
    (select public.has_permission(society_id, 'contract.renewal.manage'))
  );

drop policy if exists finance_dues_select on public.finance_dues;
drop policy if exists finance_dues_insert on public.finance_dues;
drop policy if exists finance_dues_update on public.finance_dues;
create policy finance_dues_select on public.finance_dues for select to authenticated
  using ((select public.has_permission(society_id, 'finance.view')));
create policy finance_dues_insert on public.finance_dues for insert to authenticated
  with check ((select public.has_permission(society_id, 'finance.dues.manage')));
create policy finance_dues_update on public.finance_dues for update to authenticated
  using ((select public.has_permission(society_id, 'finance.dues.manage')))
  with check ((select public.has_permission(society_id, 'finance.dues.manage')));

drop policy if exists finance_payments_select on public.finance_payments;
drop policy if exists finance_payments_insert on public.finance_payments;
create policy finance_payments_select on public.finance_payments for select to authenticated
  using ((select public.has_permission(society_id, 'finance.view')));
