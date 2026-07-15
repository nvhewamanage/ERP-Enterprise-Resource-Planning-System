export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface CreateSupplierInput {
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;