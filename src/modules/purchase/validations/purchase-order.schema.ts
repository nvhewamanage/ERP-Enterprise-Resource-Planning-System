import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Invalid product ID"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
        unitPrice: z.coerce.number().min(0, "Unit price must be at least 0"),
      })
    )
    .min(1, "At least one line item is required"),
});

export type CreatePurchaseOrderSchema = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(["draft", "ordered", "received", "cancelled"]),
});

export type UpdatePurchaseOrderStatusSchema = z.infer<typeof updatePurchaseOrderStatusSchema>;

