import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import type { AuthUser, LoginInput } from "../types/auth";

interface UserWithRoleRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  status: AuthUser["status"];
  role_name: string;
  role_label: string;
}

async function getUserWithRoleByEmail(email: string): Promise<UserWithRoleRow | null> {
  const result = await query<UserWithRoleRow>(
    `SELECT u.id, u.name, u.email, u.password_hash, u.status,
            r.name AS role_name, r.label AS role_label
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] ?? null;
}

async function getPermissionsForRole(roleName: string): Promise<string[]> {
  const result = await query<{ name: string }>(
    `SELECT p.name FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN roles r ON r.id = rp.role_id
     WHERE r.name = $1`,
    [roleName]
  );
  return result.rows.map((r) => r.name);
}

/**
 * Verifies email/password against the DB. Returns the authenticated user
 * (with role + permissions) on success, or null on any failure — invalid
 * email, wrong password, and inactive accounts all return null so the
 * login endpoint can respond with one generic "invalid credentials" error
 * (never reveal which part was wrong).
 */
export async function verifyCredentials(input: LoginInput): Promise<AuthUser | null> {
  const row = await getUserWithRoleByEmail(input.email);
  if (!row) return null;
  if (row.status !== "active") return null;

  const passwordMatches = await bcrypt.compare(input.password, row.password_hash);
  if (!passwordMatches) return null;

  const permissions = await getPermissionsForRole(row.role_name);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role_name,
    roleLabel: row.role_label,
    permissions,
    status: row.status,
  };
}

export async function touchLastLogin(userId: string): Promise<void> {
  await query("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]);
}