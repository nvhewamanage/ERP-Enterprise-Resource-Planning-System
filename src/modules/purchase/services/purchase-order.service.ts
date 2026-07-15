import { query, withTransaction } from "@/lib/db";
import type { QueryResult, QueryResultRow } from "pg";
import type {
  PurchaseOrder,
  PurchaseOrderSummary,
  PurchaseOrderStatus,
  CreatePurchaseOrderInput,
} from "../types/purchase-order";

interface PurchaseOrderRow {
  id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  total_amount: string;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
}

interface PurchaseOrderItemRow {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
}

interface PurchaseOrderSummaryRow {
  id: string;
  status: PurchaseOrderStatus;
  total_amount: string;
  ordered_at: string | null;
  received_at: string | null;
  created_at: string;
  supplier_name: string;
  item_count: string | number;
}

async function getPurchaseOrderByIdInTx(
  q: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<R>>,
  id: string
): Promise<PurchaseOrder | null> {
  const poResult = await q<PurchaseOrderRow>(
    "SELECT * FROM purchase_orders WHERE id = $1",
    [id]
  );
  if (poResult.rowCount === 0) return null;
  const po = poResult.rows[0];

  const itemsResult = await q<PurchaseOrderItemRow>(
    `SELECT poi.id, poi.product_id, poi.quantity, poi.unit_price, p.name as product_name, p.sku
     FROM purchase_order_items poi
     JOIN products p ON poi.product_id = p.id
     WHERE poi.purchase_order_id = $1`,
    [id]
  );

  return {
    id: po.id,
    supplierId: po.supplier_id,
    status: po.status,
    totalAmount: Number(po.total_amount),
    orderedAt: po.ordered_at,
    receivedAt: po.received_at,
    createdAt: po.created_at,
    items: itemsResult.rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      quantity: row.quantity,
      unitPrice: Number(row.unit_price),
    })),
  };
}

export async function listPurchaseOrders(): Promise<PurchaseOrderSummary[]> {
  const result = await query<PurchaseOrderSummaryRow>(
    `SELECT 
       po.id,
       po.status,
       po.total_amount,
       po.ordered_at,
       po.received_at,
       po.created_at,
       s.name AS supplier_name,
       COALESCE(count(poi.id), 0)::int AS item_count
     FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
     GROUP BY po.id, s.name
     ORDER BY po.created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    supplierName: row.supplier_name,
    itemCount: Number(row.item_count),
    totalAmount: Number(row.total_amount),
    status: row.status,
    orderedAt: row.ordered_at,
    receivedAt: row.received_at,
    createdAt: row.created_at,
  }));
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  return getPurchaseOrderByIdInTx(query, id);
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  return withTransaction(async (q) => {
    let totalAmount = 0;
    for (const item of input.items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    const poResult = await q<{ id: string }>(
      `INSERT INTO purchase_orders (supplier_id, status, total_amount)
       VALUES ($1, 'draft', $2)
       RETURNING id`,
      [input.supplierId, totalAmount]
    );
    const poId = poResult.rows[0].id;

    for (const item of input.items) {
      await q(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [poId, item.productId, item.quantity, item.unitPrice]
      );
    }

    const order = await getPurchaseOrderByIdInTx(q, poId);
    if (!order) throw new Error("Failed to retrieve created purchase order.");
    return order;
  });
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<PurchaseOrder | null> {
  return withTransaction(async (q) => {
    const poResult = await q<{ status: string }>(
      "SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (poResult.rowCount === 0) return null;
    const currentStatus = poResult.rows[0].status;

    if (currentStatus === status) {
      return getPurchaseOrderByIdInTx(q, id);
    }

    if (currentStatus === "received" || currentStatus === "cancelled") {
      throw new Error(`Cannot change status of a ${currentStatus} purchase order.`);
    }

    if (currentStatus === "draft" && status !== "ordered" && status !== "cancelled") {
      throw new Error(`Invalid status transition from draft to ${status}.`);
    }

    if (currentStatus === "ordered" && status !== "received" && status !== "cancelled") {
      throw new Error(`Invalid status transition from ordered to ${status}.`);
    }

    let orderedAtUpdate = "";
    let receivedAtUpdate = "";

    if (status === "ordered") {
      orderedAtUpdate = ", ordered_at = now()";
    } else if (status === "received") {
      receivedAtUpdate = ", received_at = now()";
      
      const itemsResult = await q<{ product_id: string; quantity: number }>(
        "SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1",
        [id]
      );
      for (const item of itemsResult.rows) {
        await q(
          "UPDATE products SET quantity_on_hand = quantity_on_hand + $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
      }
    }

    await q(
      `UPDATE purchase_orders
       SET status = $1${orderedAtUpdate}${receivedAtUpdate}
       WHERE id = $2`,
      [status, id]
    );

    return getPurchaseOrderByIdInTx(q, id);
  });
}

export async function deletePurchaseOrder(id: string): Promise<boolean> {
  return withTransaction(async (q) => {
    const poResult = await q<{ status: string }>(
      "SELECT status FROM purchase_orders WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (poResult.rowCount === 0) return false;
    if (poResult.rows[0].status !== "draft") {
      throw new Error("Only draft purchase orders can be deleted.");
    }

    const deleteResult = await q("DELETE FROM purchase_orders WHERE id = $1", [id]);
    return (deleteResult.rowCount ?? 0) > 0;
  });
}

