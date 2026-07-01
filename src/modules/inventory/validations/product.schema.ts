import { z } from "zod";

// TODO: define real fields for Product, matching the products table
export const createProductSchema = z.object({
  // e.g. name: z.string().min(1),
});

export const updateProductSchema = createProductSchema.partial();
