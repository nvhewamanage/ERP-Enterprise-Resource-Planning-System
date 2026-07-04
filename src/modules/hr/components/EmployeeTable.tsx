import type { Employee } from "../types/employee";
import { StatusBadge } from "./StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EmployeeTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No employees yet</p>
        <p className="mt-1 text-sm text-zinc-500">Add the first record to start building the roster.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Job title</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Hired</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 font-medium text-zinc-900">
                {e.firstName} {e.lastName}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">{e.email}</td>
              <td className="px-4 py-3 text-zinc-700">{e.jobTitle ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-700">{e.department ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-500">{formatDate(e.hireDate)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={e.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
