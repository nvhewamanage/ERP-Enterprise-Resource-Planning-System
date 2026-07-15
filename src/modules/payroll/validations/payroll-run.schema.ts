import { z } from "zod";

export const createPayrollRunSchema = z
  .object({
    employeeId: z.string().uuid("Select an employee"),
    periodStart: z.string().min(1, "Start date is required"),
    periodEnd: z.string().min(1, "End date is required"),
    grossPay: z.coerce.number().nonnegative("Gross pay can't be negative"),
    deductions: z.coerce.number().nonnegative("Deductions can't be negative").optional(),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: "End date must be on or after the start date",
    path: ["periodEnd"],
  })
  .refine((data) => (data.deductions ?? 0) <= data.grossPay, {
    message: "Deductions can't exceed gross pay",
    path: ["deductions"],
  });

export const updatePayrollRunStatusSchema = z.object({
  status: z.enum(["paid", "cancelled"]),
});

export type CreatePayrollRunSchema = z.infer<typeof createPayrollRunSchema>;
export type UpdatePayrollRunStatusSchema = z.infer<typeof updatePayrollRunStatusSchema>;