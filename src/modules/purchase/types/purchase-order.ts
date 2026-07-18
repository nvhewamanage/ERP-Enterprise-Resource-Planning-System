export type PurchaseOrderStatus = "draft" | "ordered" | "received" | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderSummary {
  id: string;
  supplierName: string;
  itemCount: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  orderedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface CreatePurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  items: CreatePurchaseOrderItemInput[];
}

