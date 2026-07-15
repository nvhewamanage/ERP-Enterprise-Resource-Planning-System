import { z } from "zod";

const salesOrderItemSchema = z.object({
  productId: z.string().uuid("Select a product"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.coerce.number().nonnegative("Unit price can't be negative"),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid("Select a customer"),
  items: z.array(salesOrderItemSchema).min(1, "Add at least one line item"),
});

export const updateSalesOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "fulfilled", "cancelled"]),
});

export type CreateSalesOrderSchema = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderStatusSchema = z.infer<typeof updateSalesOrderStatusSchema>;