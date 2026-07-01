import { z } from "zod";

// TODO: define real fields for SalesOrder, matching the sales_orders table
export const createSalesOrderSchema = z.object({
  // e.g. name: z.string().min(1),
});

export const updateSalesOrderSchema = createSalesOrderSchema.partial();
