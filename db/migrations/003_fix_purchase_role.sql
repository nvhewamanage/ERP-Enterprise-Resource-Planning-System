-- Phase 2 fix: purchase:manage was seeded onto the `supplier` role in
-- 002_auth_roles_users.sql. That's backwards — `supplier` represents an
-- external vendor, not an internal buyer, so it shouldn't be able to
-- create/cancel purchase orders for any supplier in the system.
-- Procurement naturally belongs with Inventory Management (they're the
-- ones deciding what needs restocking), so move it there instead.

DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'supplier')
  AND permission_id = (SELECT id FROM permissions WHERE name = 'purchase:manage');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'inventory_manager' AND p.name = 'purchase:manage'
ON CONFLICT DO NOTHING;
