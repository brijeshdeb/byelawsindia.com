delete from public.role_permissions rp using public.roles r,public.permissions p
where rp.role_id=r.id and rp.permission_id=p.id and r.name in ('Society Admin','Wing Admin') and p.code='vendor.portal';
