-- Phase 3: payroll:manage was seeded as a permission in 002 but never
-- assigned to any role except super_admin. Payroll processing is
-- conventionally handled by HR, so grant it to hr_manager.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'hr_manager' AND p.name = 'payroll:manage'
ON CONFLICT DO NOTHING;
