import type { Supplier } from "../types/supplier";

export function SupplierTable({
  suppliers,
  onDelete,
}: {
  suppliers: Supplier[];
  onDelete: (id: string) => void;
}) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No suppliers yet</p>
        <p className="mt-1 text-sm text-zinc-500">Add the first supplier to start creating purchase orders.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Contact email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Address</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">{s.contactEmail ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-700">{s.phone ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-700">{s.address ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(s.id)}
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}