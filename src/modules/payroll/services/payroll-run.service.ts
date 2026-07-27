import { query } from "@/lib/db";
import type { PayrollRun, PayrollRunStatus, CreatePayrollRunInput } from "../types/payroll-run";

interface PayrollRunRow {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  gross_pay: string; // NUMERIC comes back as string from pg
  deductions: string;
  net_pay: string;
  status: PayrollRunStatus;
  created_at: string;
}

function mapRow(row: PayrollRunRow): PayrollRun {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    grossPay: Number(row.gross_pay),
    deductions: Number(row.deductions),
    netPay: Number(row.net_pay),
    status: row.status,
    createdAt: row.created_at,
  };
}

const SELECT = `
  SELECT pr.id, pr.employee_id, pr.period_start, pr.period_end, pr.gross_pay,
         pr.deductions, pr.net_pay, pr.status, pr.created_at,
         e.first_name || ' ' || e.last_name AS employee_name
  FROM payroll_runs pr
  JOIN employees e ON e.id = pr.employee_id
  WHERE pr.deleted_at IS NULL
`;

export async function listPayrollRuns(): Promise<PayrollRun[]> {
  const result = await query<PayrollRunRow>(`${SELECT} ORDER BY pr.period_start DESC, pr.created_at DESC`);
  return result.rows.map(mapRow);
}

export async function getPayrollRunById(id: string): Promise<PayrollRun | null> {
  const result = await query<PayrollRunRow>(`${SELECT} AND pr.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createPayrollRun(input: CreatePayrollRunInput): Promise<PayrollRun> {
  const deductions = input.deductions ?? 0;
  const netPay = input.grossPay - deductions;

  const result = await query<{ id: string }>(
    `INSERT INTO payroll_runs (employee_id, period_start, period_end, gross_pay, deductions, net_pay, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING id`,
    [input.employeeId, input.periodStart, input.periodEnd, input.grossPay, deductions, netPay]
  );

  const created = await getPayrollRunById(result.rows[0].id);
  if (!created) throw new Error("Failed to load newly created payroll run");
  return created;
}

const VALID_TRANSITIONS: Record<PayrollRunStatus, PayrollRunStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

export async function updatePayrollRunStatus(
  id: string,
  nextStatus: PayrollRunStatus
): Promise<PayrollRun | null> {
  const existing = await getPayrollRunById(id);
  if (!existing) return null;

  if (!VALID_TRANSITIONS[existing.status].includes(nextStatus)) {
    throw new Error(`Can't move a ${existing.status} payroll run to ${nextStatus}`);
  }

  await query(`UPDATE payroll_runs SET status = $1 WHERE id = $2`, [nextStatus, id]);
  return getPayrollRunById(id);
}

export async function deletePayrollRun(id: string): Promise<boolean> {
  const existing = await getPayrollRunById(id);
  if (!existing) return false;
  if (existing.status !== "pending") {
    throw new Error("Only pending payroll runs can be deleted — cancel it instead");
  }
  const result = await query("UPDATE payroll_runs SET deleted_at = now() WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}