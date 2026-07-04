"use client";

import { useEffect, useState } from "react";
import type { Employee } from "@/modules/hr/types/employee";
import { EmployeeTable } from "@/modules/hr/components/EmployeeTable";
import { EmployeeForm } from "@/modules/hr/components/EmployeeForm";

export default function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/employees");
      if (!res.ok) throw new Error("Request failed");
      const data: Employee[] = await res.json();
      setEmployees(data);
    } catch {
      setError("Couldn't load employees. Is the app connected to Postgres?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial fetch on mount. Re-fetching after a create goes through
    // loadEmployees() called directly from the form's onCreated callback,
    // not from this effect, so this only ever runs once.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    loadEmployees();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">HR module</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Employees</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? "Loading roster…" : `${employees.length} ${employees.length === 1 ? "record" : "records"} on file`}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "Close" : "Add employee"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <EmployeeForm
            onCreated={() => {
              setShowForm(false);
              loadEmployees();
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
          Fetching employees…
        </div>
      ) : (
        !error && <EmployeeTable employees={employees} />
      )}
    </div>
  );
}
