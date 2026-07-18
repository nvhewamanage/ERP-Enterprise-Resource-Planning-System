-- Phase 4: Enterprise Features
-- Audit Logs, Notifications, and File Uploads all need a table plus a
-- permission. New permissions must be explicitly granted here — the
-- CROSS JOIN in 002_auth_roles_users.sql that gave super_admin "everything"
-- only matched the permissions that existed at the time that migration
-- ran, since migrations only ever run once.

-- ===== AUDIT LOGS =====
-- Append-only trail of who did what. actor_user_id is nullable so a
-- record can survive the user account itself being deleted later —
-- losing the audit trail because the actor was removed would defeat
-- the point of auditing.
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL, -- snapshot at time of action, survives actor deletion
    action TEXT NOT NULL,     -- e.g. 'user.create', 'purchase_order.status_change'
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- ===== NOTIFICATIONS =====
-- user_id NULL means "broadcast to everyone" (e.g. a low-stock alert isn't
-- addressed to one specific inventory manager).
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);

-- ===== FILE ATTACHMENTS =====
-- Generic attachment table so any module can attach files to any record
-- (entity_type + entity_id) without a dedicated table per module.
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments (entity_type, entity_id);

-- ===== NEW PERMISSIONS =====
INSERT INTO permissions (name, description) VALUES
    ('reports:view',   'View cross-module reports and charts'),
    ('audit:view',     'View the audit log'),
    ('settings:manage','Access admin settings, including backups')
ON CONFLICT (name) DO NOTHING;

-- super_admin gets the new permissions too (see note above)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
  AND p.name IN ('reports:view', 'audit:view', 'settings:manage')
ON CONFLICT DO NOTHING;

-- Finance manager also gets reporting access — reports are mostly
-- financial/operational KPIs, and audit:view / settings:manage stay
-- super_admin-only since they're security-sensitive.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'finance_manager' AND p.name = 'reports:view'
ON CONFLICT DO NOTHING;
