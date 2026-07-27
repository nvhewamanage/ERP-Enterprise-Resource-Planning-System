import { query, withTransaction } from "@/lib/db";
import type {
  SalesOrder,
  SalesOrderSummary,
  SalesOrderItem,
  SalesOrderStatus,
  CreateSalesOrderInput,
} from "../types/sales-order";

interface SOHeaderRow {
  id: string;
  customer_id: string;
  customer_name: string;
  status: SalesOrderStatus;
  total_amount: string; // NUMERIC comes back as string from pg
  confirmed_at: string | null;
  fulfilled_at: string | null;
  created_at: string;
}

interface SOItemRow {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
}

function mapItem(row: SOItemRow): SalesOrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
  };
}

function mapHeader(row: SOHeaderRow): Omit<SalesOrder, "items"> {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    status: row.status,
    totalAmount: Number(row.total_amount),
    confirmedAt: row.confirmed_at,
    fulfilledAt: row.fulfilled_at,
    createdAt: row.created_at,
  };
}

const SELECT_HEADER = `
  SELECT so.id, so.customer_id, so.status, so.total_amount, so.confirmed_at, so.fulfilled_at, so.created_at,
         c.name AS customer_name
  FROM sales_orders so
  JOIN customers c ON c.id = so.customer_id
  WHERE so.deleted_at IS NULL
`;

export async function listSalesOrders(): Promise<SalesOrderSummary[]> {
  const result = await query<SOHeaderRow & { item_count: string }>(
    `SELECT so.id, so.customer_id, so.status, so.total_amount, so.confirmed_at, so.fulfilled_at, so.created_at,
            c.name AS customer_name, COUNT(soi.id) AS item_count
     FROM sales_orders so
     JOIN customers c ON c.id = so.customer_id
     LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
     WHERE so.deleted_at IS NULL
     GROUP BY so.id, c.name
     ORDER BY so.created_at DESC`
  );
  return result.rows.map((row) => ({ ...mapHeader(row), itemCount: Number(row.item_count) }));
}

async function getItemsForOrder(orderId: string): Promise<SalesOrderItem[]> {
  const result = await query<SOItemRow>(
    `SELECT soi.id, soi.product_id, soi.quantity, soi.unit_price, p.name AS product_name, p.sku
     FROM sales_order_items soi
     JOIN products p ON p.id = soi.product_id
     WHERE soi.sales_order_id = $1
     ORDER BY soi.id`,
    [orderId]
  );
  return result.rows.map(mapItem);
}

export async function getSalesOrderById(id: string): Promise<SalesOrder | null> {
  const result = await query<SOHeaderRow>(`${SELECT_HEADER} AND so.id = $1`, [id]);
  if (!result.rows[0]) return null;

  const items = await getItemsForOrder(id);
  return { ...mapHeader(result.rows[0]), items };
}

/**
 * Creates a sales order and its line items atomically, same shape as
 * createPurchaseOrder — if any insert fails, the whole thing rolls back.
 */
export async function createSalesOrder(input: CreateSalesOrderInput): Promise<SalesOrder> {
  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const orderId = await withTransaction(async (q) => {
    const headerResult = await q<{ id: string }>(
      `INSERT INTO sales_orders (customer_id, status, total_amount)
       VALUES ($1, 'draft', $2)
       RETURNING id`,
      [input.customerId, totalAmount]
    );
    const id = headerResult.rows[0].id;

    for (const item of input.items) {
      await q(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [id, item.productId, item.quantity, item.unitPrice]
      );
    }

    return id;
  });

  const created = await getSalesOrderById(orderId);
  if (!created) throw new Error("Failed to load newly created sales order");
  return created;
}

const VALID_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

/**
 * Advances a sales order's status. Moving to "fulfilled" also debits the
 * ordered quantities from each product's stock — the mirror image of
 * updatePurchaseOrderStatus crediting stock on receipt. Fails the whole
 * transition if any line item doesn't have enough stock on hand, so we
 * never let quantity_on_hand go negative.
 */
export async function updateSalesOrderStatus(
  id: string,
  nextStatus: SalesOrderStatus
): Promise<SalesOrder | null> {
  const existing = await getSalesOrderById(id);
  if (!existing) return null;

  if (!VALID_TRANSITIONS[existing.status].includes(nextStatus)) {
    throw new Error(`Can't move a ${existing.status} order to ${nextStatus}`);
  }

  await withTransaction(async (q) => {
    if (nextStatus === "confirmed") {
      await q(`UPDATE sales_orders SET status = 'confirmed', confirmed_at = now() WHERE id = $1`, [id]);
    } else if (nextStatus === "fulfilled") {
      for (const item of existing.items) {
        const stockResult = await q<{ quantity_on_hand: number; name: string }>(
          `SELECT quantity_on_hand, name FROM products WHERE id = $1 FOR UPDATE`,
          [item.productId]
        );
        const product = stockResult.rows[0];
        if (!product || product.quantity_on_hand < item.quantity) {
          throw new Error(
            `Not enough stock for "${product?.name ?? item.productName}" — ` +
              `have ${product?.quantity_on_hand ?? 0}, need ${item.quantity}`
          );
        }
      }
      await q(`UPDATE sales_orders SET status = 'fulfilled', fulfilled_at = now() WHERE id = $1`, [id]);
      for (const item of existing.items) {
        await q(`UPDATE products SET quantity_on_hand = quantity_on_hand - $1, updated_at = now() WHERE id = $2`, [
          item.quantity,
          item.productId,
        ]);
      }
    } else if (nextStatus === "cancelled") {
      await q(`UPDATE sales_orders SET status = 'cancelled' WHERE id = $1`, [id]);
    }
  });

  return getSalesOrderById(id);
}

export async function deleteSalesOrder(id: string): Promise<boolean> {
  const existing = await getSalesOrderById(id);
  if (!existing) return false;
  if (existing.status !== "draft") {
    throw new Error("Only draft sales orders can be deleted — cancel it instead");
  }
  const result = await query("UPDATE sales_orders SET deleted_at = now() WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}