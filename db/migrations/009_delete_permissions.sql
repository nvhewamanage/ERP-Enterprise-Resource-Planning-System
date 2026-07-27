-- Phase 3 (Delete Workflow Overhaul): narrower permissions for destructive
-- actions on the highest-risk modules.
--
-- Today, deleting a user/employee/payroll run/finance record requires only
-- the same `<module>:manage` permission as creating or editing one. That's
-- fine for low-risk modules (products, suppliers, customers, sales/purchase
-- orders already have solid guards: soft delete, draft/pending-only, FK
-- reference checks — see 008_soft_delete.sql and the Phase 2 service
-- changes). It's not fine for deactivating a user, terminating an
-- employee, deleting a payroll run, or touching a finance record — those
-- should require a permission *narrower* than "manage this module day to
-- day", not the same one.
--
-- This migration only adds the new permissions and grants them to
-- super_admin (following the same pattern as 007_phase4_enterprise.sql —
-- the super_admin CROSS JOIN in 002 only matched permissions that existed
-- when it ran). Deliberately NOT granted to hr_manager or finance_manager:
-- they keep `hr:manage` / `payroll:manage` / `finance:manage` for
-- day-to-day create/edit work, but delete on these four modules becomes
-- super_admin-only. See src/app/api/*/[id]/route.ts DELETE handlers for
-- where these are enforced.
--
-- Note: permission changes only take effect on next login, since a user's
-- permissions are baked into their JWT at sign-in (src/modules/auth/...).

INSERT INTO permissions (name, description) VALUES
    ('users:delete',   'Deactivate user accounts'),
    ('hr:delete',      'Terminate employee records'),
    ('payroll:delete', 'Delete pending payroll runs'),
    ('finance:delete', 'Delete finance records (rarely allowed — none of the UI exposes this yet)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
  AND p.name IN ('users:delete', 'hr:delete', 'payroll:delete', 'finance:delete')
ON CONFLICT DO NOTHING;
