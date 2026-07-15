import type { PayrollRun, PayrollRunStatus } from "../types/payroll-run";
import { PayrollStatusBadge } from "./PayrollStatusBadge";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function PayrollTable({
  runs,
  onStatusChange,
  onDelete,
}: {
  runs: PayrollRun[];
  onStatusChange: (id: string, status: PayrollRunStatus) => void;
  onDelete: (id: string) => void;
}) {
  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No payroll runs yet</p>
        <p className="mt-1 text-sm text-zinc-500">Create one to start paying an employee for a period.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Gross</th>
            <th className="px-4 py-3 font-medium">Deductions</th>
            <th className="px-4 py-3 font-medium">Net</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {runs.map((r) => (
            <tr key={r.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 font-medium text-zinc-900">{r.employeeName}</td>
              <td className="px-4 py-3 text-xs text-zinc-600">
                {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
              </td>
              <td className="px-4 py-3 font-mono text-zinc-700">${r.grossPay.toFixed(2)}</td>
              <td className="px-4 py-3 font-mono text-zinc-700">${r.deductions.toFixed(2)}</td>
              <td className="px-4 py-3 font-mono font-medium text-zinc-900">${r.netPay.toFixed(2)}</td>
              <td className="px-4 py-3"><PayrollStatusBadge status={r.status} /></td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-3">
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => onStatusChange(r.id, "paid")}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Mark paid
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}