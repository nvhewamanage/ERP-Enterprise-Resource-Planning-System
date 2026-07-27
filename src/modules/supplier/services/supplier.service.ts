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
  const result = await query<SupplierRow>(
    "SELECT * FROM suppliers WHERE deleted_at IS NULL ORDER BY created_at DESC"
  );
  return result.rows.map(mapRow);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const result = await query<SupplierRow>(
    "SELECT * FROM suppliers WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
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
  const existing = await getSupplierById(id);
  if (!existing) return false;

  // Soft delete no longer triggers the suppliers -> purchase_orders FK
  // RESTRICT (the row is never actually removed), so this check has to
  // be explicit now. Only active purchase orders block deletion — one
  // that was itself soft-deleted shouldn't hold a supplier hostage.
  const linked = await query(
    "SELECT 1 FROM purchase_orders WHERE supplier_id = $1 AND deleted_at IS NULL LIMIT 1",
    [id]
  );
  if ((linked.rowCount ?? 0) > 0) {
    throw new Error("This supplier has existing purchase orders and can't be deleted.");
  }

  const result = await query("UPDATE suppliers SET deleted_at = now() WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}