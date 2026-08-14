-- Migration 004: Roles, permissions, and the role-permission mapping.
--
-- Permission codes must exactly match the PERMISSIONS const in src/types/index.ts.
-- Any mismatch silently breaks authorization — the code will check for a code
-- that doesn't exist in the DB and always return false.
--
-- Roles are NOT society-scoped at the definition level — they are global templates.
-- A role is ASSIGNED to a user for a specific society (and optionally wing) via
-- user_access_assignments. This lets us define "Society Admin" once and assign it
-- across all societies without duplicating the permission set.

-- ── roles ─────────────────────────────────────────────────────────────────────

create table public.roles (
  id              uuid        not null default gen_random_uuid(),
  name            text        not null,
  description     text,
  is_system_role  boolean     not null default false,
  metadata        jsonb       not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint roles_pkey primary key (id),
  constraint roles_name_unique unique (name)
);

comment on table  public.roles is
  'Role definitions. Roles are global templates; they are scoped to a society
   when assigned via user_access_assignments.';
comment on column public.roles.is_system_role is
  'System roles cannot be deleted or renamed by society admins.';

create trigger trg_roles_updated_at
  before update on public.roles
  for each row execute procedure public.set_updated_at();

-- ── permissions ───────────────────────────────────────────────────────────────

create table public.permissions (
  id                    uuid        not null default gen_random_uuid(),
  code                  text        not null, -- Must match PERMISSIONS const
  name                  text        not null,
  description           text,
  module                text        not null, -- Logical grouping: "members", "procurement", etc.
  is_system_permission  boolean     not null default true,
  created_at            timestamptz not null default now(),

  constraint permissions_pkey primary key (id),
  constraint permissions_code_unique unique (code)
);

comment on table  public.permissions is
  'All authorization permission codes. The code column MUST match the PERMISSIONS
   const in src/types/index.ts exactly. Codes are never updated after creation —
   changing a code breaks all existing role_permissions and authorization checks.';
comment on column public.permissions.code is
  'Dot-separated permission code. Matches PERMISSIONS.* values in TypeScript.';

create index permissions_module_idx on public.permissions (module);

-- ── role_permissions ──────────────────────────────────────────────────────────

create table public.role_permissions (
  id            uuid        not null default gen_random_uuid(),
  role_id       uuid        not null references public.roles (id) on delete cascade,
  permission_id uuid        not null references public.permissions (id) on delete cascade,
  created_at    timestamptz not null default now(),

  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_permission_unique unique (role_id, permission_id)
);

comment on table public.role_permissions is
  'Many-to-many mapping of roles to permissions.';

create index role_permissions_role_id_idx       on public.role_permissions (role_id);
create index role_permissions_permission_id_idx  on public.role_permissions (permission_id);

-- ── Seed: permission codes ────────────────────────────────────────────────────
--
-- These codes are the source of truth. They must match src/types/index.ts.
-- Insert order: modules grouped for readability.

insert into public.permissions (code, name, description, module) values
  -- Society
  ('society.read',            'View Society',             'View society profile and basic info',            'society'),
  ('society.update',          'Edit Society',             'Edit society profile and contact details',       'society'),
  ('admin.settings',          'Manage Settings',          'Configure society settings and preferences',     'society'),
  -- Wings
  ('wing.read',               'View Wings',               'View wing list and wing details',                'wings'),
  ('wing.manage',             'Manage Wings',             'Create, edit, deactivate wings',                 'wings'),
  -- Members
  ('member.read',             'View Members',             'View member list and profiles',                  'members'),
  ('member.create',           'Create Member',            'Create new member records',                     'members'),
  ('member.update',           'Edit Member',              'Edit existing member records',                   'members'),
  ('member.archive',          'Archive Member',           'Archive / deactivate member records',            'members'),
  -- Applications
  ('application.read',        'View Applications',        'View application list and details',              'applications'),
  ('application.create',      'Create Application',       'Submit a new membership application',            'applications'),
  ('application.submit',      'Submit Application',       'Submit application for processing',              'applications'),
  ('application.verify',      'Verify Application',       'Verify application documents',                   'applications'),
  ('application.approve.level1', 'Approve (Level 1)',     'First-level approval in the workflow',           'applications'),
  ('application.approve.level2', 'Approve (Level 2)',     'Second-level approval in the workflow',          'applications'),
  ('application.approve.final',  'Final Approval',        'Final approval that registers the member',       'applications'),
  -- Documents
  ('document.read',           'View Documents',           'View documents in the repository',               'documents'),
  ('document.upload',         'Upload Document',          'Upload new documents',                           'documents'),
  ('document.verify',         'Verify Document',          'Mark documents as verified',                     'documents'),
  ('document.replace',        'Replace Document',         'Upload new version of an existing document',     'documents'),
  ('document.archive',        'Archive Document',         'Archive documents',                              'documents'),
  -- Nominations
  ('nomination.read',         'View Nominations',         'View nominations',                               'nominations'),
  ('nomination.manage',       'Manage Nominations',       'Create and process nominations',                 'nominations'),
  -- Associate members
  ('associate_member.read',   'View Associates',          'View associate member records',                  'associates'),
  ('associate_member.manage', 'Manage Associates',        'Create and edit associate member records',       'associates'),
  -- Service requests
  ('service_request.read',    'View Service Requests',    'View service requests',                          'services'),
  ('service_request.create',  'Create Service Request',   'Submit a service request',                      'services'),
  ('service_request.process', 'Process Service Request',  'Accept, assign, update service requests',       'services'),
  ('service_request.approve', 'Approve Service Request',  'Approve service request completion',             'services'),
  -- Maintenance
  ('maintenance.view',        'View Maintenance',         'View complaints and work orders',                'maintenance'),
  ('maintenance.manage',      'Manage Maintenance',       'Create and manage work orders',                  'maintenance'),
  -- Finance
  ('finance.view',            'View Finance',             'View maintenance dues and payment history',      'finance'),
  ('finance.manage',          'Manage Finance',           'Create demands, record payments',                'finance'),
  -- Vendors
  ('vendor.read',             'View Vendors',             'View vendor registry',                           'vendors'),
  ('vendor.create',           'Create Vendor',            'Register new vendors',                           'vendors'),
  ('vendor.update',           'Edit Vendor',              'Edit vendor profiles',                           'vendors'),
  ('vendor.verify',           'Verify Vendor',            'Mark vendors as verified',                       'vendors'),
  ('vendor.manage',           'Manage Vendors',           'Full vendor management including blacklisting',  'vendors'),
  -- RFQ
  ('rfq.read',                'View RFQs',                'View RFQ list and details',                      'procurement'),
  ('rfq.create',              'Create RFQ',               'Create new RFQs',                                'procurement'),
  ('rfq.publish',             'Publish RFQ',              'Publish RFQ to invite vendor quotations',        'procurement'),
  ('rfq.evaluate',            'Evaluate RFQ',             'Evaluate and compare quotations',                'procurement'),
  ('rfq.approve',             'Approve RFQ',              'Approve vendor selection recommendation',        'procurement'),
  -- Quotations
  ('quotation.read',          'View Quotations',          'View sealed quotations (after unsealing)',       'procurement'),
  ('quotation.evaluate',      'Evaluate Quotation',       'Score and compare quotations',                   'procurement'),
  ('quotation.compare',       'Compare Quotations',       'Generate side-by-side comparison',               'procurement'),
  -- Vendor selection
  ('vendor_selection.recommend', 'Recommend Vendor',      'Recommend a vendor for selection',               'procurement'),
  ('vendor_selection.approve',   'Approve Vendor',        'Approve final vendor selection',                 'procurement'),
  -- Work orders
  ('work_order.create',       'Create Work Order',        'Issue a work order to a vendor',                 'procurement'),
  ('work_order.approve',      'Approve Work Order',       'Approve a work order for issuance',              'procurement'),
  -- Contracts
  ('contract.read',           'View Contracts',           'View contract list and details',                 'contracts'),
  ('contract.create',         'Create Contract',          'Draft new contracts',                            'contracts'),
  ('contract.update',         'Edit Contract',            'Edit contract details before approval',          'contracts'),
  ('contract.approve',        'Approve Contract',         'Approve contracts for execution',                'contracts'),
  ('contract.renew',          'Renew Contract',           'Initiate contract renewal',                      'contracts'),
  ('contract.terminate',      'Terminate Contract',       'Terminate a contract',                           'contracts'),
  -- Reports
  ('report.view',             'View Reports',             'Access the reports module',                      'reports'),
  ('report.member',           'Member Reports',           'Generate member and unit reports',               'reports'),
  ('report.vendor',           'Vendor Reports',           'Generate vendor and procurement reports',        'reports'),
  ('report.contract',         'Contract Reports',         'Generate contract and renewal reports',          'reports'),
  ('report.procurement',      'Procurement Reports',      'Generate RFQ and work order reports',            'reports'),
  ('report.audit',            'Audit Reports',            'Generate audit and activity reports',            'reports'),
  ('audit.log.view',          'View Audit Log',           'View the full audit trail',                      'reports'),
  ('audit.read',              'Read Audit',               'Programmatic audit access',                      'reports'),
  -- Administration
  ('admin.users',             'Manage Users',             'Create, edit, deactivate user accounts',         'admin'),
  ('admin.roles',             'Manage Roles',             'Create and edit roles',                          'admin'),
  ('admin.permissions',       'Manage Permissions',       'View and assign permissions to roles',           'admin'),
  ('admin.master_data',       'Manage Master Data',       'Edit lookup tables and reference data',          'admin'),
  ('admin.templates',         'Manage Templates',         'Edit letter, notice, and email templates',       'admin')
on conflict (code) do nothing;

-- ── Seed: system roles ────────────────────────────────────────────────────────

insert into public.roles (name, description, is_system_role) values
  ('Society Admin',        'Full access to all society functions',                        true),
  ('Wing Admin',           'Full access to a specific wing',                              true),
  ('Application Officer',  'Processes member applications (Level 1 approver)',            true),
  ('Application Authority','Second-level approver in the application workflow',           true),
  ('Final Authority',      'Final approver — registers the member',                       true),
  ('Documents Officer',    'Manages the document repository',                             true),
  ('Procurement Officer',  'Creates RFQs and manages vendor quotations',                  true),
  ('Procurement Authority','Approves vendor selection and issues work orders',             true),
  ('Finance Officer',      'Manages maintenance dues and payment records',                 true),
  ('Report Viewer',        'Read-only access to reports and dashboards',                   true),
  ('Member (Read-only)',   'Self-service access: own records and submitted applications',  true)
on conflict (name) do nothing;

-- ── Seed: role_permissions — Society Admin gets everything ────────────────────

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Society Admin'
on conflict (role_id, permission_id) do nothing;

-- Wing Admin gets all permissions except cross-society administration
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Wing Admin'
  and  p.code not in ('admin.users', 'admin.roles', 'admin.permissions')
on conflict (role_id, permission_id) do nothing;

-- Application Officer: create/verify applications + view members/documents
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Application Officer'
  and  p.code in (
         'application.read', 'application.verify', 'application.approve.level1',
         'member.read', 'document.read', 'document.upload', 'document.verify',
         'report.view', 'report.member'
       )
on conflict (role_id, permission_id) do nothing;

-- Application Authority: Level 2 approvals
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Application Authority'
  and  p.code in (
         'application.read', 'application.approve.level2',
         'member.read', 'document.read',
         'report.view', 'report.member'
       )
on conflict (role_id, permission_id) do nothing;

-- Final Authority: final approval
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Final Authority'
  and  p.code in (
         'application.read', 'application.approve.final',
         'member.read', 'document.read', 'member.create',
         'report.view', 'report.member'
       )
on conflict (role_id, permission_id) do nothing;

-- Procurement Officer: full procurement workflow up to evaluation
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Procurement Officer'
  and  p.code in (
         'rfq.read', 'rfq.create', 'rfq.publish', 'rfq.evaluate',
         'quotation.read', 'quotation.evaluate', 'quotation.compare',
         'vendor.read', 'vendor_selection.recommend',
         'contract.read', 'contract.create',
         'report.view', 'report.procurement', 'report.contract'
       )
on conflict (role_id, permission_id) do nothing;

-- Procurement Authority: approve selections, issue work orders
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Procurement Authority'
  and  p.code in (
         'rfq.read', 'rfq.approve',
         'quotation.read', 'vendor_selection.approve',
         'work_order.create', 'work_order.approve',
         'contract.read', 'contract.approve', 'contract.renew',
         'vendor.read',
         'report.view', 'report.procurement', 'report.contract'
       )
on conflict (role_id, permission_id) do nothing;

-- Finance Officer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Finance Officer'
  and  p.code in (
         'finance.view', 'finance.manage',
         'member.read',
         'report.view', 'report.member'
       )
on conflict (role_id, permission_id) do nothing;

-- Report Viewer: read-only across all reports
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Report Viewer'
  and  p.module = 'reports'
on conflict (role_id, permission_id) do nothing;

-- Member (Read-only): self-service access only
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from   public.roles r
cross  join public.permissions p
where  r.name = 'Member (Read-only)'
  and  p.code in (
         'application.read', 'application.create', 'application.submit',
         'document.read',
         'member.read',
         'service_request.read', 'service_request.create',
         'maintenance.view'
       )
on conflict (role_id, permission_id) do nothing;
