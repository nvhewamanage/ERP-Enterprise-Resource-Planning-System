"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface MonthlyAmount {
  month: string;
  amount: number;
}

interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

interface ReportsSummary {
  salesRevenueByMonth: MonthlyAmount[];
  purchaseSpendByMonth: MonthlyAmount[];
  payrollCostByMonth: MonthlyAmount[];
  topProducts: TopProduct[];
}

function monthLabel(value: unknown) {
  if (typeof value !== "string") return "";
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-zinc-700">{title}</p>
      <div className="h-64">{children}</div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-zinc-400">{message}</div>;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Request failed");
        setSummary(await res.json());
      } catch {
        setError("Couldn't load reports. Is the app connected to Postgres?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Insights</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">Last 6 months, across Sales, Purchasing, and Payroll.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-zinc-200 p-8 text-sm text-zinc-400">
          Fetching reports…
        </div>
      ) : error || !summary ? null : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ChartCard title="Sales revenue by month">
            {summary.salesRevenueByMonth.length === 0 ? (
              <EmptyChart message="No fulfilled sales orders yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.salesRevenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-accent-soft)" />
                  <XAxis dataKey="month" tickFormatter={monthLabel} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={monthLabel}
                    formatter={(value: unknown) => [typeof value === "number" ? `Rs. ${value.toFixed(2)}` : String(value), "Revenue"]}
                  />
                  <Bar dataKey="amount" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Purchase spend by month">
            {summary.purchaseSpendByMonth.length === 0 ? (
              <EmptyChart message="No received purchase orders yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.purchaseSpendByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-accent-soft)" />
                  <XAxis dataKey="month" tickFormatter={monthLabel} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={monthLabel}
                    formatter={(value: unknown) => [typeof value === "number" ? `Rs. ${value.toFixed(2)}` : String(value), "Spend"]}
                  />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Payroll cost by month">
            {summary.payrollCostByMonth.length === 0 ? (
              <EmptyChart message="No paid payroll runs yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.payrollCostByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-accent-soft)" />
                  <XAxis dataKey="month" tickFormatter={monthLabel} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={monthLabel}
                    formatter={(value: unknown) => [typeof value === "number" ? `Rs. ${value.toFixed(2)}` : String(value), "Net pay"]}
                  />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-accent)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-zinc-700">Top products by revenue</p>
            {summary.topProducts.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-zinc-400">
                No fulfilled sales orders yet.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">Units sold</th>
                    <th className="pb-2 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {summary.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td className="py-2">
                        <p className="font-medium text-zinc-900">{p.name}</p>
                        <p className="font-mono text-xs text-zinc-400">{p.sku}</p>
                      </td>
                      <td className="py-2 text-zinc-700">{p.unitsSold}</td>
                      <td className="py-2 font-mono text-zinc-900">Rs. {p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}