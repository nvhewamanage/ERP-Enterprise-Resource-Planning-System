import { query } from "@/lib/db";

// Repository/service layer for the inventory module.
// Follow the same pattern as src/modules/hr/services/employee.service.ts:
// plain SQL against the "products" table, mapped to camelCase types.

export async function listProducts() {
  const result = await query("SELECT * FROM products ORDER BY created_at DESC");
  return result.rows;
}
