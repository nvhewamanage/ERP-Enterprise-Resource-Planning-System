-- Add confirmed_at and fulfilled_at columns to sales_orders table
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;
