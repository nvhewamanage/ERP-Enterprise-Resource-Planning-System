import { query } from "@/lib/db";

export interface MonthlyAmount {
  month: string; // 'YYYY-MM'
  amount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

const MONTHS_BACK = 6;

/** Revenue from fulfilled sales orders, by month, oldest to newest. */
export async function salesRevenueByMonth(): Promise<MonthlyAmount[]> {
  const result = await query<{ month: string; amount: string }>(
    `SELECT to_char(date_trunc('month', fulfilled_at), 'YYYY-MM') AS month,
            SUM(total_amount) AS amount
     FROM sales_orders
     WHERE status = 'fulfilled'
       AND fulfilled_at >= date_trunc('month', now()) - interval '${MONTHS_BACK - 1} months'
     GROUP BY 1
     ORDER BY 1`
  );
  return result.rows.map((r) => ({ month: r.month, amount: Number(r.amount) }));
}

/** Spend on received purchase orders, by month, oldest to newest. */
export async function purchaseSpendByMonth(): Promise<MonthlyAmount[]> {
  const result = await query<{ month: string; amount: string }>(
    `SELECT to_char(date_trunc('month', received_at), 'YYYY-MM') AS month,
            SUM(total_amount) AS amount
     FROM purchase_orders
     WHERE status = 'received'
       AND received_at >= date_trunc('month', now()) - interval '${MONTHS_BACK - 1} months'
     GROUP BY 1
     ORDER BY 1`
  );
  return result.rows.map((r) => ({ month: r.month, amount: Number(r.amount) }));
}

/** Net payroll cost for paid runs, by month (using period_start), oldest to newest. */
export async function payrollCostByMonth(): Promise<MonthlyAmount[]> {
  const result = await query<{ month: string; amount: string }>(
    `SELECT to_char(date_trunc('month', period_start), 'YYYY-MM') AS month,
            SUM(net_pay) AS amount
     FROM payroll_runs
     WHERE status = 'paid'
       AND period_start >= date_trunc('month', now()) - interval '${MONTHS_BACK - 1} months'
     GROUP BY 1
     ORDER BY 1`
  );
  return result.rows.map((r) => ({ month: r.month, amount: Number(r.amount) }));
}

/** Best-selling products by revenue, across fulfilled sales orders. */
export async function topProductsByRevenue(limit = 5): Promise<TopProduct[]> {
  const result = await query<{
    product_id: string;
    name: string;
    sku: string;
    units_sold: string;
    revenue: string;
  }>(
    `SELECT p.id AS product_id, p.name, p.sku,
            SUM(soi.quantity) AS units_sold,
            SUM(soi.quantity * soi.unit_price) AS revenue
     FROM sales_order_items soi
     JOIN sales_orders so ON so.id = soi.sales_order_id
     JOIN products p ON p.id = soi.product_id
     WHERE so.status = 'fulfilled'
     GROUP BY p.id, p.name, p.sku
     ORDER BY revenue DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    sku: r.sku,
    unitsSold: Number(r.units_sold),
    revenue: Number(r.revenue),
  }));
}

export interface ReportsSummary {
  salesRevenueByMonth: MonthlyAmount[];
  purchaseSpendByMonth: MonthlyAmount[];
  payrollCostByMonth: MonthlyAmount[];
  topProducts: TopProduct[];
}

export async function getReportsSummary(): Promise<ReportsSummary> {
  const [sales, purchases, payroll, topProducts] = await Promise.all([
    salesRevenueByMonth(),
    purchaseSpendByMonth(),
    payrollCostByMonth(),
    topProductsByRevenue(),
  ]);
  return {
    salesRevenueByMonth: sales,
    purchaseSpendByMonth: purchases,
    payrollCostByMonth: payroll,
    topProducts,
  };
}