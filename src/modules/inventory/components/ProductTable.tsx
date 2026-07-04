import type { Product } from "../types/product";
import { StockBadge } from "./StockBadge";

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">No products yet</p>
        <p className="mt-1 text-sm text-zinc-500">Add the first SKU to start tracking stock.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium text-right">On hand</th>
            <th className="px-4 py-3 font-medium text-right">Reorder at</th>
            <th className="px-4 py-3 font-medium text-right">Unit cost</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.sku}</td>
              <td className="px-4 py-3 font-medium text-zinc-900">{p.name}</td>
              <td className="px-4 py-3 text-right font-mono text-zinc-700">{p.quantityOnHand}</td>
              <td className="px-4 py-3 text-right font-mono text-zinc-500">{p.reorderLevel}</td>
              <td className="px-4 py-3 text-right font-mono text-zinc-700">{formatCurrency(p.unitCost)}</td>
              <td className="px-4 py-3">
                <StockBadge product={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
