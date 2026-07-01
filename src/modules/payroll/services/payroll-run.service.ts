import { query } from "@/lib/db";

// Repository/service layer for the payroll module.
// Follow the same pattern as src/modules/hr/services/employee.service.ts:
// plain SQL against the "payroll_runs" table, mapped to camelCase types.

export async function listPayrollRuns() {
  const result = await query("SELECT * FROM payroll_runs ORDER BY created_at DESC");
  return result.rows;
}
