import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import type { User, Role, CreateUserInput, UpdateUserInput } from "../types/user";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role_id: string;
  role_name: string;
  role_label: string;
  status: User["status"];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roleId: row.role_id,
    roleName: row.role_name,
    roleLabel: row.role_label,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_USER = `
  SELECT u.id, u.name, u.email, u.role_id, u.status, u.last_login_at, u.created_at, u.updated_at,
         r.name AS role_name, r.label AS role_label
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

export async function listUsers(): Promise<User[]> {
  const result = await query<UserRow>(`${SELECT_USER} ORDER BY u.created_at DESC`);
  return result.rows.map(mapRow);
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query<UserRow>(`${SELECT_USER} WHERE u.id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<UserRow>(`${SELECT_USER} WHERE u.email = $1`, [email]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const result = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role_id, status)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'active'))
     RETURNING id`,
    [input.name, input.email, passwordHash, input.roleId, input.status ?? null]
  );
  const created = await getUserById(result.rows[0].id);
  if (!created) throw new Error("Failed to load newly created user");
  return created;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  const name = input.name ?? existing.name;
  const email = input.email ?? existing.email;
  const roleId = input.roleId ?? existing.roleId;
  const status = input.status ?? existing.status;

  if (input.password) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    await query(
      `UPDATE users SET name = $1, email = $2, role_id = $3, status = $4,
                        password_hash = $5, updated_at = now()
       WHERE id = $6`,
      [name, email, roleId, status, passwordHash, id]
    );
  } else {
    await query(
      `UPDATE users SET name = $1, email = $2, role_id = $3, status = $4, updated_at = now()
       WHERE id = $5`,
      [name, email, roleId, status, id]
    );
  }

  return getUserById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  // Users already have a status column, so "delete" deactivates the
  // account rather than removing the row. Deliberately stays visible in
  // listUsers (not filtered out) so admins can see and reactivate
  // deactivated accounts — unlike the other soft-deleted modules, this
  // isn't meant to disappear from view.
  const result = await query(
    `UPDATE users SET status = 'inactive', updated_at = now() WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listRoles(): Promise<Role[]> {
  const result = await query<Role & { description: string | null }>(
    "SELECT id, name, label, description FROM roles ORDER BY label"
  );
  return result.rows;
}