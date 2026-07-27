-- Phase 1 (Delete Workflow Overhaul): soft-delete schema.
--
-- Adds deleted_at to the tables that currently hard-DELETE with no way to
-- recover the row or keep it for audit/compliance history. Phase 2 will
-- repoint each module's deleteX() service function to set this column
-- instead of issuing DELETE FROM, and update list/get queries to filter
-- WHERE deleted_at IS NULL.
--
-- Deliberately NOT touched here:
--   - users / employees: already have a `status` column (active/inactive,
--     active/terminated) that serves the same purpose. Phase 2 repoints
--     their deleteX() to flip status instead of adding a redundant column.
--   - ledger_entries: no DELETE route exists for it today — finance is
--     already append-only, which matches the "never hard-delete posted
--     transactions" rule, so there's nothing to soft-delete yet.
--
-- Who deleted a row and when is already captured by audit_logs (actor +
-- timestamp) on the delete action, so no deleted_by column is added here
-- to avoid duplicating that.

ALTER TABLE payroll_runs   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE suppliers      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customers      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sales_orders   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial indexes: every list/get query will filter on "not deleted", so
-- index that specific case rather than the column in general.
CREATE INDEX IF NOT EXISTS idx_payroll_runs_active    ON payroll_runs (id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_active        ON products (id)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_active       ON suppliers (id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_active       ON customers (id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_orders_active    ON sales_orders (id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_active ON purchase_orders (id) WHERE deleted_at IS NULL;
