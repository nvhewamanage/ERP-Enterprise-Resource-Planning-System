import { query } from "@/lib/db";
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "../types/customer";

interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
}

function mapRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const result = await query<CustomerRow>("SELECT * FROM customers ORDER BY created_at DESC");
  return result.rows.map(mapRow);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const result = await query<CustomerRow>("SELECT * FROM customers WHERE id = $1", [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const result = await query<CustomerRow>(
    `INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING *`,
    [input.name, input.email || null]
  );
  return mapRow(result.rows[0]);
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer | null> {
  const existing = await getCustomerById(id);
  if (!existing) return null;

  const merged = { ...existing, ...input };
  const result = await query<CustomerRow>(
    `UPDATE customers SET name = $1, email = $2 WHERE id = $3 RETURNING *`,
    [merged.name, merged.email || null, id]
  );
  return mapRow(result.rows[0]);
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const result = await query("DELETE FROM customers WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}