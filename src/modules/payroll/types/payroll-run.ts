export type PayrollRunStatus = "pending" | "paid" | "cancelled";

export interface PayrollRun {
  id: string;
  employeeId: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: PayrollRunStatus;
  createdAt: string;
}

export interface CreatePayrollRunInput {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  grossPay: number;
  deductions?: number;
}