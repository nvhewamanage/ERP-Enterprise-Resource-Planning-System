"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Wallet,
  Boxes,
  ShoppingCart,
  Truck,
  Landmark,
  Building2,
  BarChart3,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/config/rbac";
import { useAuthStore } from "@/store/auth.store";

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/users": Users,
  "/dashboard/hr": Briefcase,
  "/dashboard/payroll": Wallet,
  "/dashboard/inventory": Boxes,
  "/dashboard/sales": ShoppingCart,
  "/dashboard/purchase": Truck,
  "/dashboard/finance": Landmark,
  "/dashboard/suppliers": Building2,
  "/dashboard/reports": BarChart3,
  "/dashboard/audit": ShieldCheck,
  "/dashboard/settings": Settings,
};

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];

  const visibleItems = NAV_ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar-bg">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
          E
        </div>
        <span className="text-sm font-semibold text-sidebar-text-active">ERP System</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = ICONS[item.href] ?? LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-bg-active text-sidebar-text-active"
                  : "text-sidebar-text hover:bg-sidebar-bg-active/60 hover:text-sidebar-text-active"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="flex items-center gap-2.5 border-t border-white/[.06] px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-text-active">{user.name}</p>
            <p className="truncate text-xs text-sidebar-text capitalize">{user.role.replace("_", " ")}</p>
          </div>
        </div>
      )}
    </aside>
  );
}