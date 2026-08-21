-- Follow-up from Supabase performance advisor: cover every foreign key used
-- by the release foundation and avoid overlapping SELECT policies.

create index approval_instances_submitted_by_idx on public.approval_instances(submitted_by);
create index approval_steps_permission_code_idx on public.approval_workflow_steps(permission_code);
create index approval_workflows_created_by_idx on public.approval_workflows(created_by);
create index approval_workflows_updated_by_idx on public.approval_workflows(updated_by);
create index content_templates_created_by_idx on public.content_templates(created_by);
create index content_templates_updated_by_idx on public.content_templates(updated_by);
create index generated_documents_generated_by_idx on public.generated_documents(generated_by);
create index master_data_created_by_idx on public.master_data_items(created_by);
create index master_data_updated_by_idx on public.master_data_items(updated_by);
create index service_requests_created_by_idx on public.service_requests(created_by);
create index service_requests_updated_by_idx on public.service_requests(updated_by);

drop policy "master_data_manage" on public.master_data_items;
create policy "master_data_insert" on public.master_data_items for insert to authenticated
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.master_data'))));
create policy "master_data_update" on public.master_data_items for update to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.master_data'))))
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.master_data'))));
create policy "master_data_delete" on public.master_data_items for delete to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.master_data'))));

drop policy "content_templates_manage" on public.content_templates;
create policy "content_templates_insert" on public.content_templates for insert to authenticated
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));
create policy "content_templates_update" on public.content_templates for update to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))))
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));
create policy "content_templates_delete" on public.content_templates for delete to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));

drop policy "approval_workflows_manage" on public.approval_workflows;
create policy "approval_workflows_insert" on public.approval_workflows for insert to authenticated
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));
create policy "approval_workflows_update" on public.approval_workflows for update to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))))
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));
create policy "approval_workflows_delete" on public.approval_workflows for delete to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));

drop policy "approval_steps_manage" on public.approval_workflow_steps;
create policy "approval_steps_insert" on public.approval_workflow_steps for insert to authenticated
  with check (exists (select 1 from public.approval_workflows w where w.id = workflow_id and ((select public.is_platform_admin()) or (w.society_id is not null and (select public.has_permission(w.society_id, 'admin.templates'))))));
create policy "approval_steps_update" on public.approval_workflow_steps for update to authenticated
  using (exists (select 1 from public.approval_workflows w where w.id = workflow_id and ((select public.is_platform_admin()) or (w.society_id is not null and (select public.has_permission(w.society_id, 'admin.templates'))))))
  with check (exists (select 1 from public.approval_workflows w where w.id = workflow_id and ((select public.is_platform_admin()) or (w.society_id is not null and (select public.has_permission(w.society_id, 'admin.templates'))))));
create policy "approval_steps_delete" on public.approval_workflow_steps for delete to authenticated
  using (exists (select 1 from public.approval_workflows w where w.id = workflow_id and ((select public.is_platform_admin()) or (w.society_id is not null and (select public.has_permission(w.society_id, 'admin.templates'))))));
