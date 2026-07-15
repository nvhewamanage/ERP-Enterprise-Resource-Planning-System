"use client";

import { useEffect, useState } from "react";
import type { SalesOrderSummary, SalesOrderStatus } from "@/modules/sales/types/sales-order";
import type { Customer } from "@/modules/sales/types/customer";
import type { Product } from "@/modules/inventory/types/product";
import { SalesOrderTable } from "@/modules/sales/components/SalesOrderTable";
import { SalesOrderForm } from "@/modules/sales/components/SalesOrderForm";
import { CustomerTable } from "@/modules/sales/components/CustomerTable";
import { CustomerForm } from "@/modules/sales/components/CustomerForm";

type Tab = "orders" | "customers";

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>("orders");

  const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        fetch("/api/sales-orders"),
        fetch("/api/customers"),
        fetch("/api/inventory/products"),
      ]);
      if (!ordersRes.ok || !customersRes.ok || !productsRes.ok) throw new Error("Request failed");
      setOrders(await ordersRes.json());
      setCustomers(await customersRes.json());
      setProducts(await productsRes.json());
    } catch {
      setError("Couldn't load sales data. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadAll();
  }, []);

  async function handleStatusChange(id: string, status: SalesOrderStatus) {
    const res = await fetch(`/api/sales-orders/${id}`, {
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

  async function handleDeleteOrder(id: string) {
    if (!confirm("Delete this draft order? This can't be undone.")) return;
    const res = await fetch(`/api/sales-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't delete this order.");
    }
  }

  async function handleDeleteCustomer(id: string) {
    if (!confirm("Delete this customer? This can't be undone.")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't delete this customer.");
    }
  }

  const tabButtonClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-accent-soft text-accent" : "text-zinc-500 hover:bg-zinc-100"
    }`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Sales</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {tab === "orders" ? "Sales Orders" : "Customers"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading
              ? "Loading…"
              : tab === "orders"
                ? `${orders.length} ${orders.length === 1 ? "order" : "orders"}`
                : `${customers.length} ${customers.length === 1 ? "customer" : "customers"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : tab === "orders" ? "New sales order" : "Add customer"}
        </button>
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-lg border border-zinc-200 bg-white p-1">
        <button
          className={tabButtonClass(tab === "orders")}
          onClick={() => {
            setTab("orders");
            setShowForm(false);
          }}
        >
          Orders
        </button>
        <button
          className={tabButtonClass(tab === "customers")}
          onClick={() => {
            setTab("customers");
            setShowForm(false);
          }}
        >
          Customers
        </button>
      </div>

      {showForm && tab === "orders" && (
        <div className="mb-8">
          {customers.length === 0 || products.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add at least one customer and one product before creating a sales order.
            </div>
          ) : (
            <SalesOrderForm
              customers={customers}
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

      {showForm && tab === "customers" && (
        <div className="mb-8">
          <CustomerForm
            onCreated={() => {
              setShowForm(false);
              loadAll();
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
          Fetching…
        </div>
      ) : error ? null : tab === "orders" ? (
        <SalesOrderTable orders={orders} onStatusChange={handleStatusChange} onDelete={handleDeleteOrder} />
      ) : (
        <CustomerTable customers={customers} onDelete={handleDeleteCustomer} />
      )}
    </div>
  );
}