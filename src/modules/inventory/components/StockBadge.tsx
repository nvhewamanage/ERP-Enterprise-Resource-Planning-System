import type { Product } from "../types/product";

export function StockBadge({ product }: { product: Product }) {
  const low = product.quantityOnHand <= product.reorderLevel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
        low ? "bg-rose-50 text-rose-700" : "bg-accent-soft text-accent"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${low ? "bg-rose-500" : "bg-accent"}`} />
      {low ? "Reorder" : "In stock"}
    </span>
  );
}
