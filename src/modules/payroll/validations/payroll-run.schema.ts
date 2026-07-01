import { z } from "zod";

// TODO: define real fields for PayrollRun, matching the payroll_runs table
export const createPayrollRunSchema = z.object({
  // e.g. name: z.string().min(1),
});

export const updatePayrollRunSchema = createPayrollRunSchema.partial();
