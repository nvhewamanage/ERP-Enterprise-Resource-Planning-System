import { query } from "@/lib/db";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "../types/supplier";

interface SupplierRow {
  id: string;
  name: string;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

function mapRow(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactEmail: row.contact_email,
    phone: row.phone,
    address: row.address,
    createdAt: row.created_at,
  };
}

export async function listSuppliers(): Promise<Supplier[]> {
  const result = await query<SupplierRow>("SELECT * FROM suppliers ORDER BY created_at DESC");
  return result.rows.map(mapRow);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const result = await query<SupplierRow>("SELECT * FROM suppliers WHERE id = $1", [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const result = await query<SupplierRow>(
    `INSERT INTO suppliers (name, contact_email, phone, address)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      input.name,
      input.contactEmail ?? null,
      input.phone ?? null,
      input.address ?? null,
    ]
  );
  return mapRow(result.rows[0]);
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<Supplier | null> {
  const existing = await getSupplierById(id);
  if (!existing) return null;

  const merged = { ...existing, ...input };
  const result = await query<SupplierRow>(
    `UPDATE suppliers
     SET name = $1, contact_email = $2, phone = $3, address = $4
     WHERE id = $5
     RETURNING *`,
    [merged.name, merged.contactEmail || null, merged.phone, merged.address, id]
  );
  return mapRow(result.rows[0]);
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const result = await query("DELETE FROM suppliers WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}