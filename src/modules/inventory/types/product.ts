export interface Product {
  id: string;
  sku: string;
  name: string;
  quantityOnHand: number;
  reorderLevel: number;
  unitCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  quantityOnHand?: number;
  reorderLevel?: number;
  unitCost?: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;
