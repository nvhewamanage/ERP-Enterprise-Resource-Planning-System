import { query } from "@/lib/db";

// Repository/service layer for the purchase module.
// Follow the same pattern as src/modules/hr/services/employee.service.ts:
// plain SQL against the "purchase_orders" table, mapped to camelCase types.

export async function listPurchaseOrders() {
  const result = await query("SELECT * FROM purchase_orders ORDER BY created_at DESC");
  return result.rows;
}
