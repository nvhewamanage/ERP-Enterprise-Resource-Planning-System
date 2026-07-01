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

export type CreateEmployeeInput = Omit<Employee, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: Employee["status"];
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;
