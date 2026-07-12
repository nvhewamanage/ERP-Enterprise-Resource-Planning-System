"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/rbac";
import { useAuthStore } from "@/store/auth.store";

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];

  const visibleItems = NAV_ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-black/[.08] bg-white dark:border-white/[.1] dark:bg-zinc-950">
      <div className="px-5 py-5 text-lg font-semibold text-foreground">ERP</div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}