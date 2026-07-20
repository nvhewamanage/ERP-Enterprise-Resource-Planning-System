"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import {
  Users2,
  ShoppingCart,
  Truck,
  TrendingUp,
  TrendingDown,
  UserPlus,
  PackagePlus,
  FileBarChart,
  ClipboardPlus,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useAuthStore } from "@/store/auth.store";

interface KpiValue {
  amount: number;
  deltaPct: number | null;
}

interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

interface AuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  createdAt: string;
}

interface DashboardSummary {
  totalEmployees: KpiValue;
  totalSales: KpiValue;
  totalPurchases: KpiValue;
  netProfit: KpiValue;
  salesTrend: { day: string; amount: number }[];
  topProducts: TopProduct[];
  recentActivity: AuditLogEntry[];
}

const PIE_COLORS = ["#4f6ef7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

function DeniedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("denied") !== "1") return null;
  return (
    <div className="mb-4 rounded-lg bg-status-warning-soft px-4 py-3 text-sm text-status-warning">
      You don&apos;t have access to that section.
    </div>
  );
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const isUp = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isUp ? "text-status-success" : "text-status-danger"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct).toFixed(1)}% this month
    </span>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  delta?: number | null;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-2">
          <Delta pct={delta} />
        </div>
      )}
    </div>
  );
}

function dayLabel(value: unknown) {
  if (typeof value !== "string") return String(value ?? "");
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

function timeAgo(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function activityLabel(entry: AuditLogEntry) {
  const verbs: Record<string, string> = {
    "user.create": "created a user",
    "user.delete": "deleted a user",
    "purchase_order.status_change": "updated a purchase order",
    "purchase_order.delete": "deleted a purchase order",
    "sales_order.status_change": "updated a sales order",
    "sales_order.delete": "deleted a sales order",
    "payroll_run.status_change": "updated a payroll run",
    "payroll_run.delete": "deleted a payroll run",
  };
  return verbs[entry.action] ?? entry.action.replace(/_/g, " ").replace(".", " ");
}

const QUICK_LINKS = [
  { href: "/dashboard/users", label: "Add user", icon: UserPlus, permission: "users:manage" },
  { href: "/dashboard/purchase", label: "New purchase order", icon: ClipboardPlus, permission: "purchase:manage" },
  { href: "/dashboard/inventory", label: "Add item", icon: PackagePlus, permission: "inventory:manage" },
  { href: "/dashboard/reports", label: "Generate report", icon: FileBarChart, permission: "reports:view" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) throw new Error("Request failed");
        setSummary(await res.json());
      } catch {
        setError("Couldn't load your dashboard. Is the app connected to Postgres?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const permissions = user?.permissions ?? [];
  const visibleQuickLinks = QUICK_LINKS.filter((l) => permissions.includes(l.permission));

  return (
    <div className="mx-auto max-w-6xl">
      <Suspense fallback={null}>
        <DeniedBanner />
      </Suspense>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s what&apos;s happening with your business today.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-status-danger/20 bg-status-danger-soft px-4 py-3 text-sm text-status-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg border border-card-border p-8 text-sm text-zinc-400">
          Loading your dashboard…
        </div>
      ) : error || !summary ? null : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Employees"
              value={summary.totalEmployees.amount.toLocaleString()}
              icon={Users2}
              iconBg="bg-accent-soft"
              iconColor="text-accent"
            />
            <StatCard
              label="Sales this month"
              value={`Rs. ${summary.totalSales.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              delta={summary.totalSales.deltaPct}
              icon={ShoppingCart}
              iconBg="bg-status-success-soft"
              iconColor="text-status-success"
            />
            <StatCard
              label="Purchases this month"
              value={`Rs. ${summary.totalPurchases.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              delta={summary.totalPurchases.deltaPct}
              icon={Truck}
              iconBg="bg-status-warning-soft"
              iconColor="text-status-warning"
            />
            <StatCard
              label="Net Profit"
              value={`Rs. ${summary.netProfit.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              delta={summary.netProfit.deltaPct}
              icon={TrendingUp}
              iconBg="bg-status-danger-soft"
              iconColor="text-status-danger"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card-bg p-4 lg:col-span-2">
              <p className="mb-3 text-sm font-medium text-zinc-700">Sales overview — last 7 days</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.salesTrend}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tickFormatter={dayLabel} fontSize={12} />
                    <YAxis fontSize={12} width={40} />
                    <Tooltip
                      labelFormatter={dayLabel}
                      formatter={(value: unknown) => [`Rs. ${Number(value || 0).toFixed(2)}`, "Sales"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-accent)"
                      strokeWidth={2}
                      fill="url(#salesFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card-bg p-4">
              <p className="mb-3 text-sm font-medium text-zinc-700">Top products</p>
              {summary.topProducts.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-center text-sm text-zinc-400">
                  No fulfilled sales yet.
                </div>
              ) : (
                <>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.topProducts}
                          dataKey="revenue"
                          nameKey="name"
                          innerRadius={32}
                          outerRadius={56}
                          paddingAngle={2}
                        >
                          {summary.topProducts.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: unknown) => [`Rs. ${Number(value || 0).toFixed(2)}`, "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {summary.topProducts.map((p, i) => (
                      <li key={p.productId} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-zinc-600">{p.name}</span>
                        <span className="ml-auto shrink-0 font-mono text-zinc-400">Rs. {p.revenue.toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card-bg p-4 lg:col-span-2">
              <p className="mb-3 text-sm font-medium text-zinc-700">Recent activity</p>
              {summary.recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-400">Nothing recorded yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-zinc-100">
                  {summary.recentActivity.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <span className="text-zinc-700">
                        <span className="font-medium text-foreground">{entry.actorName}</span>{" "}
                        {activityLabel(entry)}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-400">{timeAgo(entry.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-card-border bg-card-bg p-4">
              <p className="mb-3 text-sm font-medium text-zinc-700">Quick links</p>
              {visibleQuickLinks.length === 0 ? (
                <p className="text-sm text-zinc-400">No quick actions available for your role.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {visibleQuickLinks.map((link) => (
                    <li key={link.href}>
                      <button
                        onClick={() => router.push(link.href)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-accent-soft hover:text-accent"
                      >
                        <link.icon size={16} />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}