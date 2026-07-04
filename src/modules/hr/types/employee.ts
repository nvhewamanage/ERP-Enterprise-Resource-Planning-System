export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  department: string | null;
  hireDate: string | null;
  status: "active" | "inactive" | "terminated";
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  hireDate?: string;
  status?: Employee["status"];
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;
