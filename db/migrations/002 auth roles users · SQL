-- Phase 1: Authentication, Role Management, User Management
-- Adds roles/permissions (RBAC) and users tables, seeds the standard ERP roles.

-- ===== ROLES =====
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,          -- e.g. 'super_admin', 'hr_manager'
    label TEXT NOT NULL,                -- e.g. 'Super Admin', 'HR Manager'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== PERMISSIONS =====
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,          -- e.g. 'users:manage', 'hr:manage'
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'active', -- active | inactive
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== SEED: standard roles =====
INSERT INTO roles (name, label, description) VALUES
    ('super_admin',        'Super Admin',        'Full access to every module'),
    ('hr_manager',         'HR Manager',         'Manages employees and HR records'),
    ('inventory_manager',  'Inventory Manager',  'Manages products and stock'),
    ('finance_manager',    'Finance Manager',    'Manages invoices and ledger'),
    ('sales_manager',      'Sales Manager',      'Manages sales orders and customers'),
    ('employee',           'Employee',           'Basic access to personal dashboard'),
    ('supplier',           'Supplier',           'Limited access to purchase orders')
ON CONFLICT (name) DO NOTHING;

-- ===== SEED: permissions (one per module, plus core ones) =====
INSERT INTO permissions (name, description) VALUES
    ('dashboard:view',  'View the dashboard'),
    ('users:manage',    'Create, edit, deactivate users'),
    ('roles:manage',    'View and assign roles'),
    ('hr:manage',       'Manage HR / employee records'),
    ('payroll:manage',  'Manage payroll runs'),
    ('inventory:manage','Manage products and stock'),
    ('sales:manage',    'Manage sales orders'),
    ('purchase:manage', 'Manage purchase orders'),
    ('finance:manage',  'Manage invoices and ledger'),
    ('supplier:manage', 'Manage supplier records')
ON CONFLICT (name) DO NOTHING;

-- ===== SEED: role -> permission mapping =====
-- super_admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- everyone with a dashboard role can at least view the dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE p.name = 'dashboard:view' AND r.name <> 'super_admin'
ON CONFLICT DO NOTHING;

-- module-specific managers
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE (r.name = 'hr_manager' AND p.name = 'hr:manage')
   OR (r.name = 'inventory_manager' AND p.name = 'inventory:manage')
   OR (r.name = 'finance_manager' AND p.name = 'finance:manage')
   OR (r.name = 'sales_manager' AND p.name = 'sales:manage')
   OR (r.name = 'supplier' AND p.name = 'purchase:manage')
ON CONFLICT DO NOTHING;

-- ===== SEED: default super admin login =====
-- Email: admin@erp.local   Password: ChangeMe123!
-- bcrypt hash below is for "ChangeMe123!" (cost 10) — CHANGE THIS PASSWORD after first login.
INSERT INTO users (name, email, password_hash, role_id, status)
SELECT 'System Administrator', 'admin@erp.local',
       '$2b$10$XerOddWgaykdVEixoD5LS.plDgdGPwzeEo/lf235ZRkNmd/cKBsnG',
       r.id, 'active'
FROM roles r WHERE r.name = 'super_admin'
ON CONFLICT (email) DO NOTHING;