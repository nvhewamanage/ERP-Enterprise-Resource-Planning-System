import type { PayrollRunStatus } from "../types/payroll-run";

const STYLES: Record<PayrollRunStatus, { dot: string; text: string; bg: string }> = {
  pending: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  paid: { dot: "bg-accent", text: "text-accent", bg: "bg-accent-soft" },
  cancelled: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
};

export function PayrollStatusBadge({ status }: { status: PayrollRunStatus }) {
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