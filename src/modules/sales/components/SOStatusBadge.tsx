import type { SalesOrderStatus } from "../types/sales-order";

const STYLES: Record<SalesOrderStatus, { dot: string; text: string; bg: string }> = {
  draft: { dot: "bg-zinc-400", text: "text-zinc-600", bg: "bg-zinc-100" },
  confirmed: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  fulfilled: { dot: "bg-accent", text: "text-accent", bg: "bg-accent-soft" },
  cancelled: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
};

export function SOStatusBadge({ status }: { status: SalesOrderStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}