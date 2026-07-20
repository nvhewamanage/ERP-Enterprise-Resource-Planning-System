import { query } from "@/lib/db";
import { topProductsByRevenue, type TopProduct } from "@/modules/reports/services/report.service";
import { listAuditLogs, type AuditLogEntry } from "@/lib/audit";

export interface KpiValue {
  amount: number;
  deltaPct: number | null; // null when there's no data for the prior period to compare against
}

export interface DashboardSummary {
  totalEmployees: KpiValue;
  totalSales: KpiValue;
  totalPurchases: KpiValue;
  netProfit: KpiValue;
  salesTrend: { day: string; amount: number }[]; // last 7 days
  topProducts: TopProduct[];
  recentActivity: AuditLogEntry[];
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // no baseline to compare against
  return ((current - previous) / previous) * 100;
}

async function totalEmployeesKpi(): Promise<KpiValue> {
  const result = await query<{ count: string }>("SELECT COUNT(*) FROM employees WHERE status = 'active'");
  // Headcount doesn't have a natural "prior period" comparison the way revenue does.
  return { amount: Number(result.rows[0].count), deltaPct: null };
}

async function monthlyTotal(
  table: "sales_orders" | "purchase_orders",
  statusValue: string,
  dateColumn: string
): Promise<KpiValue> {
  const result = await query<{ current: string | null; previous: string | null }>(
    `SELECT
       SUM(total_amount) FILTER (WHERE ${dateColumn} >= date_trunc('month', now())) AS current,
       SUM(total_amount) FILTER (
         WHERE ${dateColumn} >= date_trunc('month', now()) - interval '1 month'
           AND ${dateColumn} < date_trunc('month', now())
       ) AS previous
     FROM ${table}
     WHERE status = $1`,
    [statusValue]
  );
  const current = Number(result.rows[0].current ?? 0);
  const previous = Number(result.rows[0].previous ?? 0);
  return { amount: current, deltaPct: pctChange(current, previous) };
}

async function netProfitKpi(): Promise<KpiValue> {
  const [sales, purchases, payroll] = await Promise.all([
    monthlyTotal("sales_orders", "fulfilled", "fulfilled_at"),
    monthlyTotal("purchase_orders", "received", "received_at"),
    query<{ current: string | null; previous: string | null }>(
      `SELECT
         SUM(net_pay) FILTER (WHERE period_start >= date_trunc('month', now())) AS current,
         SUM(net_pay) FILTER (
           WHERE period_start >= date_trunc('month', now()) - interval '1 month'
             AND period_start < date_trunc('month', now())
         ) AS previous
       FROM payroll_runs
       WHERE status = 'paid'`
    ),
  ]);

  const payrollCurrent = Number(payroll.rows[0].current ?? 0);
  const payrollPrevious = Number(payroll.rows[0].previous ?? 0);

  const current = sales.amount - purchases.amount - payrollCurrent;
  const previousSales = sales.deltaPct === null ? sales.amount : sales.amount / (1 + sales.deltaPct / 100);
  // Approximate prior-period profit from each component's own prior value where available.
  const previous =
    (sales.deltaPct === null ? sales.amount : previousSales) -
    (purchases.deltaPct === null ? purchases.amount : purchases.amount / (1 + purchases.deltaPct / 100)) -
    payrollPrevious;

  return { amount: current, deltaPct: pctChange(current, previous) };
}

async function salesTrendLast7Days(): Promise<{ day: string; amount: number }[]> {
  const result = await query<{ day: string; amount: string }>(
    `SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(SUM(so.total_amount), 0) AS amount
     FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') AS d(day)
     LEFT JOIN sales_orders so
       ON so.status = 'fulfilled' AND date_trunc('day', so.fulfilled_at) = d.day
     GROUP BY d.day
     ORDER BY d.day`
  );
  return result.rows.map((r) => ({ day: r.day, amount: Number(r.amount) }));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [totalEmployees, totalSales, totalPurchases, netProfit, salesTrend, topProducts, recentActivity] =
    await Promise.all([
      totalEmployeesKpi(),
      monthlyTotal("sales_orders", "fulfilled", "fulfilled_at"),
      monthlyTotal("purchase_orders", "received", "received_at"),
      netProfitKpi(),
      salesTrendLast7Days(),
      topProductsByRevenue(5),
      listAuditLogs(5),
    ]);

  return { totalEmployees, totalSales, totalPurchases, netProfit, salesTrend, topProducts, recentActivity };
}