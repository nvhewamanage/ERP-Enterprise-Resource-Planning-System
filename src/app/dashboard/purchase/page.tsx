"use client";

import { useEffect, useState } from "react";
import type { PurchaseOrderSummary, PurchaseOrderStatus } from "@/modules/purchase/types/purchase-order";
import type { Supplier } from "@/modules/supplier/types/supplier";
import type { Product } from "@/modules/inventory/types/product";
import { PurchaseOrderTable } from "@/modules/purchase/components/PurchaseOrderTable";
import { PurchaseOrderForm } from "@/modules/purchase/components/PurchaseOrderForm";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderSummary[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        fetch("/api/purchase-orders"),
        fetch("/api/suppliers"),
        fetch("/api/inventory/products"),
      ]);
      if (!ordersRes.ok || !suppliersRes.ok || !productsRes.ok) throw new Error("Request failed");
      setOrders(await ordersRes.json());
      setSuppliers(await suppliersRes.json());
      setProducts(await productsRes.json());
    } catch {
      setError("Couldn't load purchase orders. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadAll();
  }, []);

  async function handleStatusChange(id: string, status: PurchaseOrderStatus) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadAll();
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't update this order.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this draft order? This can't be undone.")) return;
    const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't delete this order.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Procurement</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading purchase orders…" : `${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "New purchase order"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          {suppliers.length === 0 || products.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add at least one supplier and one product before creating a purchase order.
            </div>
          ) : (
            <PurchaseOrderForm
              suppliers={suppliers}
              products={products}
              onCreated={() => {
                setShowForm(false);
                loadAll();
              }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400">
          Fetching purchase orders…
        </div>
      ) : (
        !error && <PurchaseOrderTable orders={orders} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
    </div>
  );
}