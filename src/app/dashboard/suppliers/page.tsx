"use client";

import { useEffect, useState } from "react";
import type { Supplier } from "@/modules/supplier/types/supplier";
import { SupplierTable } from "@/modules/supplier/components/SupplierTable";
import { SupplierForm } from "@/modules/supplier/components/SupplierForm";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadSuppliers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Request failed");
      const data: Supplier[] = await res.json();
      setSuppliers(data);
    } catch {
      setError("Couldn't load suppliers. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadSuppliers();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier? This can't be undone.")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't delete this supplier.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Supplier module</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Suppliers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading suppliers…" : `${suppliers.length} ${suppliers.length === 1 ? "supplier" : "suppliers"} on file`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "Add supplier"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <SupplierForm
            onCreated={() => {
              setShowForm(false);
              loadSuppliers();
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
          Fetching suppliers…
        </div>
      ) : (
        !error && <SupplierTable suppliers={suppliers} onDelete={handleDelete} />
      )}
    </div>
  );
}