import { query } from "@/lib/db";

// Repository/service layer for the finance module.
// Follow the same pattern as src/modules/hr/services/employee.service.ts:
// plain SQL against the "ledger_entries" table, mapped to camelCase types.

export async function listLedgerEntrys() {
  const result = await query("SELECT * FROM ledger_entries ORDER BY created_at DESC");
  return result.rows;
}
