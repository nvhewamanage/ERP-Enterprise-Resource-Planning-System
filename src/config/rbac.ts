// Maps each dashboard section to the permission required to view it.
// Checked in src/middleware.ts against the permissions embedded in the
// user's JWT (see src/modules/auth/services/auth.service.ts).
//
// Order matters: first matching prefix wins, so keep more specific
// prefixes above their parents if that's ever needed.
export const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: "/dashboard/users", permission: "users:manage" },
  { prefix: "/dashboard/hr", permission: "hr:manage" },
  { prefix: "/dashboard/payroll", permission: "payroll:manage" },
  { prefix: "/dashboard/inventory", permission: "inventory:manage" },
  { prefix: "/dashboard/sales", permission: "sales:manage" },
  { prefix: "/dashboard/purchase", permission: "purchase:manage" },
  { prefix: "/dashboard/finance", permission: "finance:manage" },
  { prefix: "/dashboard/suppliers", permission: "supplier:manage" },
  // Anything else under /dashboard (the overview page, /settings, etc.)
  // just needs a valid session with dashboard access.
  { prefix: "/dashboard", permission: "dashboard:view" },
];

export function permissionForPath(pathname: string): string | null {
  const match = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  return match?.permission ?? null;
}

// Sidebar nav items, gated by the same permission names.
export const NAV_ITEMS: { href: string; label: string; permission: string }[] = [
  { href: "/dashboard", label: "Overview", permission: "dashboard:view" },
  { href: "/dashboard/users", label: "Users", permission: "users:manage" },
  { href: "/dashboard/hr", label: "HR", permission: "hr:manage" },
  { href: "/dashboard/payroll", label: "Payroll", permission: "payroll:manage" },
  { href: "/dashboard/inventory", label: "Inventory", permission: "inventory:manage" },
  { href: "/dashboard/sales", label: "Sales", permission: "sales:manage" },
  { href: "/dashboard/purchase", label: "Purchase Orders", permission: "purchase:manage" },
  { href: "/dashboard/finance", label: "Finance", permission: "finance:manage" },
  { href: "/dashboard/suppliers", label: "Suppliers", permission: "supplier:manage" },
];