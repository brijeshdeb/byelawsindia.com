-- Remove implicit PUBLIC execution from application security helpers. RLS and
-- authenticated RPC entry points retain explicit least-privilege grants.
revoke execute on function public.can_access_society(uuid) from public,anon;
revoke execute on function public.can_access_wing(uuid,uuid) from public,anon;
revoke execute on function public.has_permission(uuid,text,uuid) from public,anon;
revoke execute on function public.is_platform_admin() from public,anon;
revoke execute on function public.get_next_sequence(uuid,text,integer,text) from public,anon;
revoke execute on function public.user_has_society_access(uuid) from public,anon;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.set_updated_at() from public,anon,authenticated;
revoke execute on function public.validate_assignment_wing() from public,anon,authenticated;
revoke execute on function public.validate_unit_society() from public,anon,authenticated;
grant execute on function public.user_has_society_access(uuid) to authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

alter function public.can_access_society(uuid) set search_path=public,pg_temp;
alter function public.can_access_wing(uuid,uuid) set search_path=public,pg_temp;
alter function public.has_permission(uuid,text,uuid) set search_path=public,pg_temp;
alter function public.is_platform_admin() set search_path=public,pg_temp;
alter function public.get_next_sequence(uuid,text,integer,text) set search_path=public,pg_temp;
alter function public.user_has_society_access(uuid) set search_path=public,pg_temp;
alter function public.handle_new_user() set search_path=public,pg_temp;
alter function public.set_updated_at() set search_path=public,pg_temp;
alter function public.validate_assignment_wing() set search_path=public,pg_temp;
alter function public.validate_unit_society() set search_path=public,pg_temp;
drop function if exists public.record_payment(uuid,uuid,numeric,text,date,text,text,uuid);

-- Split FOR ALL policies so their SELECT branches do not overlap dedicated
-- read policies and so every mutation has an explicit permission boundary.
drop policy if exists "rfq_invitations_staff_manage" on public.rfq_invitations;
create policy "rfq_invitations_staff_insert" on public.rfq_invitations for insert to authenticated with check(public.has_permission(society_id,'rfq.publish'));
create policy "rfq_invitations_staff_update" on public.rfq_invitations for update to authenticated using(public.has_permission(society_id,'rfq.publish')) with check(public.has_permission(society_id,'rfq.publish'));
create policy "rfq_invitations_staff_delete" on public.rfq_invitations for delete to authenticated using(public.has_permission(society_id,'rfq.publish'));

drop policy if exists "quotation_items_vendor_manage" on public.quotation_items;
create policy "quotation_items_vendor_insert" on public.quotation_items for insert to authenticated with check(exists(select 1 from public.quotations q where q.id=quotation_id and q.status='DRAFT' and public.can_access_vendor(q.society_id,q.vendor_id)));
create policy "quotation_items_vendor_update" on public.quotation_items for update to authenticated using(exists(select 1 from public.quotations q where q.id=quotation_id and q.status='DRAFT' and public.can_access_vendor(q.society_id,q.vendor_id))) with check(exists(select 1 from public.quotations q where q.id=quotation_id and q.status='DRAFT' and public.can_access_vendor(q.society_id,q.vendor_id)));
create policy "quotation_items_vendor_delete" on public.quotation_items for delete to authenticated using(exists(select 1 from public.quotations q where q.id=quotation_id and q.status='DRAFT' and public.can_access_vendor(q.society_id,q.vendor_id)));

drop policy if exists "quotation_evaluations_manage" on public.quotation_evaluations;
create policy "quotation_evaluations_insert" on public.quotation_evaluations for insert to authenticated with check(public.has_permission(society_id,'quotation.evaluate'));
create policy "quotation_evaluations_update" on public.quotation_evaluations for update to authenticated using(public.has_permission(society_id,'quotation.evaluate')) with check(public.has_permission(society_id,'quotation.evaluate'));
create policy "quotation_evaluations_delete" on public.quotation_evaluations for delete to authenticated using(public.has_permission(society_id,'quotation.evaluate'));

drop policy if exists "vendor_selections_manage" on public.vendor_selections;
create policy "vendor_selections_insert" on public.vendor_selections for insert to authenticated with check(public.has_permission(society_id,'vendor_selection.recommend'));
create policy "vendor_selections_update" on public.vendor_selections for update to authenticated using(public.has_permission(society_id,'vendor_selection.recommend') or public.has_permission(society_id,'vendor_selection.approve')) with check(public.has_permission(society_id,'vendor_selection.recommend') or public.has_permission(society_id,'vendor_selection.approve'));
create policy "vendor_selections_delete" on public.vendor_selections for delete to authenticated using(public.has_permission(society_id,'vendor_selection.approve'));

drop policy if exists "performance_manage" on public.vendor_performance_reviews;
create policy "performance_insert" on public.vendor_performance_reviews for insert to authenticated with check(public.has_permission(society_id,'vendor.performance.manage'));
create policy "performance_update" on public.vendor_performance_reviews for update to authenticated using(public.has_permission(society_id,'vendor.performance.manage')) with check(public.has_permission(society_id,'vendor.performance.manage'));
create policy "performance_delete" on public.vendor_performance_reviews for delete to authenticated using(public.has_permission(society_id,'vendor.performance.manage'));

drop policy if exists "renewals_staff_manage" on public.contract_renewals;
create policy "renewals_staff_insert" on public.contract_renewals for insert to authenticated with check(public.has_permission(society_id,'contract.renewal.manage'));
create policy "renewals_staff_update" on public.contract_renewals for update to authenticated using(public.has_permission(society_id,'contract.renewal.manage')) with check(public.has_permission(society_id,'contract.renewal.manage'));
