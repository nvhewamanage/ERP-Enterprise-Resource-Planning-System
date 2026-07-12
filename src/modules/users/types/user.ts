export interface Role {
  id: string;
  name: string;
  label: string;
  description: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  roleLabel: string;
  status: "active" | "inactive";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  status?: User["status"];
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
  password?: string; // only set when resetting a password
};