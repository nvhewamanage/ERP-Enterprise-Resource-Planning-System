"use client";

import { useEffect, useState } from "react";
import type { PayrollRun, PayrollRunStatus } from "@/modules/payroll/types/payroll-run";
import type { Employee } from "@/modules/hr/types/employee";
import { PayrollTable } from "@/modules/payroll/components/PayrollTable";
import { PayrollForm } from "@/modules/payroll/components/PayrollForm";

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [runsRes, employeesRes] = await Promise.all([fetch("/api/payroll"), fetch("/api/hr/employees")]);
      if (!runsRes.ok || !employeesRes.ok) throw new Error("Request failed");
      setRuns(await runsRes.json());
      setEmployees(await employeesRes.json());
    } catch {
      setError("Couldn't load payroll data. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadAll();
  }, []);

  async function handleStatusChange(id: string, status: PayrollRunStatus) {
    const res = await fetch(`/api/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadAll();
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't update this payroll run.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pending payroll run? This can't be undone.")) return;
    const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRuns((prev) => prev.filter((r) => r.id !== id));
    } else {
      const body = await res.json().catch(() => null);
      alert(body?.error ?? "Couldn't delete this payroll run.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">HR</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Payroll</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading payroll runs…" : `${runs.length} ${runs.length === 1 ? "run" : "runs"}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "New payroll run"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          {employees.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add at least one employee before running payroll.
            </div>
          ) : (
            <PayrollForm
              employees={employees}
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
          Fetching payroll runs…
        </div>
      ) : (
        !error && <PayrollTable runs={runs} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
    </div>
  );
}