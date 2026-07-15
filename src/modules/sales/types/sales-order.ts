export type SalesOrderStatus = "draft" | "confirmed" | "fulfilled" | "cancelled";

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  status: SalesOrderStatus;
  totalAmount: number;
  confirmedAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  items: SalesOrderItem[];
}

// Summary shape used for the list view — omits line items to keep the
// list query cheap; fetch a single order by id to get `items`.
export type SalesOrderSummary = Omit<SalesOrder, "items"> & { itemCount: number };

export interface CreateSalesOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalesOrderInput {
  customerId: string;
  items: CreateSalesOrderItemInput[];
}