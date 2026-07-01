import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  hireDate: z.string().optional(), // ISO date string
  status: z.enum(["active", "inactive", "terminated"]).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeSchema = z.infer<typeof updateEmployeeSchema>;
