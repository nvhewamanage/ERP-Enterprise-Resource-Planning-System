import { z } from "zod";

// TODO: define real fields for PurchaseOrder, matching the purchase_orders table
export const createPurchaseOrderSchema = z.object({
  // e.g. name: z.string().min(1),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();
