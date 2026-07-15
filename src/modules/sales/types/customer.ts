export interface Customer {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;