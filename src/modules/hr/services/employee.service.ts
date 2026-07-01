import { query } from "@/lib/db";
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from "../types/employee";

// Maps a snake_case DB row to the camelCase Employee type used in the app.
function mapRow(row: any): Employee {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    jobTitle: row.job_title,
    department: row.department,
    hireDate: row.hire_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const result = await query("SELECT * FROM employees ORDER BY created_at DESC");
  return result.rows.map(mapRow);
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const result = await query("SELECT * FROM employees WHERE id = $1", [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const result = await query(
    `INSERT INTO employees (first_name, last_name, email, job_title, department, hire_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'))
     RETURNING *`,
    [input.firstName, input.lastName, input.email, input.jobTitle, input.department, input.hireDate, input.status]
  );
  return mapRow(result.rows[0]);
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<Employee | null> {
  const existing = await getEmployeeById(id);
  if (!existing) return null;

  const merged = { ...existing, ...input };
  const result = await query(
    `UPDATE employees
     SET first_name = $1, last_name = $2, email = $3, job_title = $4,
         department = $5, hire_date = $6, status = $7, updated_at = now()
     WHERE id = $8
     RETURNING *`,
    [merged.firstName, merged.lastName, merged.email, merged.jobTitle, merged.department, merged.hireDate, merged.status, id]
  );
  return mapRow(result.rows[0]);
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const result = await query("DELETE FROM employees WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
