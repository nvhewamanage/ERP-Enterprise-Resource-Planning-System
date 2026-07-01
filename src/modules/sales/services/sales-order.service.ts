import { query } from "@/lib/db";

// Repository/service layer for the sales module.
// Follow the same pattern as src/modules/hr/services/employee.service.ts:
// plain SQL against the "sales_orders" table, mapped to camelCase types.

export async function listSalesOrders() {
  const result = await query("SELECT * FROM sales_orders ORDER BY created_at DESC");
  return result.rows;
}
