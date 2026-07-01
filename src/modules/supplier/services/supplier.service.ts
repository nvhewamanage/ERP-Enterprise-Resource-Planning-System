import { query } from "@/lib/db";

// Repository/service layer for the supplier module.
// Follow the same pattern as src/modules/hr/services/employee.service.ts:
// plain SQL against the "suppliers" table, mapped to camelCase types.

export async function listSuppliers() {
  const result = await query("SELECT * FROM suppliers ORDER BY created_at DESC");
  return result.rows;
}
