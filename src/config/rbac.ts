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
  { prefix: "/dashboard/reports", permission: "reports:view" },
  { prefix: "/dashboard/audit", permission: "audit:view" },
  { prefix: "/dashboard/settings", permission: "settings:manage" },
  // Anything else under /dashboard (the overview page, notifications, etc.)
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
  { href: "/dashboard/reports", label: "Reports", permission: "reports:view" },
  { href: "/dashboard/audit", label: "Audit Log", permission: "audit:view" },
  { href: "/dashboard/settings", label: "Settings", permission: "settings:manage" },
];

// Maps an attachment's entityType to the permission required to view/upload/
// delete files attached to that kind of record. Used by the generic
// file-attachments API (src/app/api/attachments) so every module can reuse
// the same upload endpoint without its own bespoke permission check.
export const ATTACHMENT_ENTITY_PERMISSIONS: Record<string, string> = {
  purchase_order: "purchase:manage",
  sales_order: "sales:manage",
  employee: "hr:manage",
  supplier: "supplier:manage",
  product: "inventory:manage",
};