import { z } from "zod";

// TODO: define real fields for Supplier, matching the suppliers table
export const createSupplierSchema = z.object({
  // e.g. name: z.string().min(1),
});

export const updateSupplierSchema = createSupplierSchema.partial();
