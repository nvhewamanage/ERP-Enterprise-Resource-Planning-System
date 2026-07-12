export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string; // role name, e.g. 'super_admin'
  roleLabel: string; // e.g. 'Super Admin'
  permissions: string[];
  status: "active" | "inactive";
}

export interface LoginInput {
  email: string;
  password: string;
}