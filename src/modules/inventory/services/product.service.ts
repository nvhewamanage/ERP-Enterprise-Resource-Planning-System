import { query } from "@/lib/db";
import type { Product, CreateProductInput, UpdateProductInput } from "../types/product";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: string; // NUMERIC comes back as string from pg
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    quantityOnHand: row.quantity_on_hand,
    reorderLevel: row.reorder_level,
    unitCost: Number(row.unit_cost),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(): Promise<Product[]> {
  const result = await query<ProductRow>("SELECT * FROM products ORDER BY created_at DESC");
  return result.rows.map(mapRow);
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await query<ProductRow>("SELECT * FROM products WHERE id = $1", [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const result = await query<ProductRow>("SELECT * FROM products WHERE sku = $1", [sku]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const result = await query<ProductRow>(
    `INSERT INTO products (sku, name, quantity_on_hand, reorder_level, unit_cost)
     VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 0), COALESCE($5, 0))
     RETURNING *`,
    [input.sku, input.name, input.quantityOnHand ?? null, input.reorderLevel ?? null, input.unitCost ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const merged = { ...existing, ...input };
  const result = await query<ProductRow>(
    `UPDATE products
     SET sku = $1, name = $2, quantity_on_hand = $3, reorder_level = $4, unit_cost = $5, updated_at = now()
     WHERE id = $6
     RETURNING *`,
    [merged.sku, merged.name, merged.quantityOnHand, merged.reorderLevel, merged.unitCost, id]
  );
  return mapRow(result.rows[0]);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await query("DELETE FROM products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
