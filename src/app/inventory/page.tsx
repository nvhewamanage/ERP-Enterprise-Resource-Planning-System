"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/modules/inventory/types/product";
import { ProductTable } from "@/modules/inventory/components/ProductTable";
import { ProductForm } from "@/modules/inventory/components/ProductForm";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/products");
      if (!res.ok) throw new Error("Request failed");
      const data: Product[] = await res.json();
      setProducts(data);
    } catch {
      setError("Couldn't load products. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadProducts();
  }, []);

  const lowStockCount = products.filter((p) => p.quantityOnHand <= p.reorderLevel).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Inventory module</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading
              ? "Loading stock…"
              : `${products.length} ${products.length === 1 ? "SKU" : "SKUs"}${
                  lowStockCount > 0 ? ` · ${lowStockCount} at or below reorder level` : ""
                }`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "Add product"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ProductForm
            onCreated={() => {
              setShowForm(false);
              loadProducts();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400">
          Fetching products…
        </div>
      ) : (
        !error && <ProductTable products={products} />
      )}
    </div>
  );
}
