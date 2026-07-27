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
  const result = await query<CustomerRow>(
    "SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY created_at DESC"
  );
  return result.rows.map(mapRow);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const result = await query<CustomerRow>(
    "SELECT * FROM customers WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
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
  const existing = await getCustomerById(id);
  if (!existing) return false;

  const linked = await query(
    "SELECT 1 FROM sales_orders WHERE customer_id = $1 AND deleted_at IS NULL LIMIT 1",
    [id]
  );
  if ((linked.rowCount ?? 0) > 0) {
    throw new Error("This customer has existing sales orders and can't be deleted.");
  }

  const result = await query("UPDATE customers SET deleted_at = now() WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}