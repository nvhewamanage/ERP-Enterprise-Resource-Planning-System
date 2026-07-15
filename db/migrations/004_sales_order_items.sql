-- Phase 3: sales_orders had no line-items table, unlike purchase_orders.
-- Mirrors purchase_order_items exactly, so the Sales Order service can
-- follow the same pattern as the Purchase Order service.

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL
);
