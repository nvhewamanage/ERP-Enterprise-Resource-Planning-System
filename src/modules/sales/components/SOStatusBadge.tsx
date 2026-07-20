import type { SalesOrderStatus } from "../types/sales-order";

const STYLES: Record<SalesOrderStatus, { dot: string; text: string; bg: string }> = {
  draft: { dot: "bg-status-neutral", text: "text-status-neutral", bg: "bg-status-neutral-soft" },
  confirmed: { dot: "bg-status-warning", text: "text-status-warning", bg: "bg-status-warning-soft" },
  fulfilled: { dot: "bg-status-success", text: "text-status-success", bg: "bg-status-success-soft" },
  cancelled: { dot: "bg-status-danger", text: "text-status-danger", bg: "bg-status-danger-soft" },
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