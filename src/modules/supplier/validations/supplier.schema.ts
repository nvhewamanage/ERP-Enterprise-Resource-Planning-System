import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactEmail: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable().or(z.literal("")),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierSchema = z.infer<typeof updateSupplierSchema>;