import type { PayrollRunStatus } from "../types/payroll-run";

const STYLES: Record<PayrollRunStatus, { dot: string; text: string; bg: string }> = {
  pending: { dot: "bg-status-warning", text: "text-status-warning", bg: "bg-status-warning-soft" },
  paid: { dot: "bg-status-success", text: "text-status-success", bg: "bg-status-success-soft" },
  cancelled: { dot: "bg-status-danger", text: "text-status-danger", bg: "bg-status-danger-soft" },
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