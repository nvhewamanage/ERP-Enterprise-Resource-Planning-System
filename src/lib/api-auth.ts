import { NextResponse } from "next/server";
import { getSession } from "./jwt";
import type { SessionPayload } from "./jwt";

interface Allowed {
  session: SessionPayload;
  error?: undefined;
}
interface Denied {
  session?: undefined;
  error: NextResponse;
}

/**
 * Verifies the session cookie AND that the caller holds `permission` — or,
 * if given an array, at least one of them. The array form exists for
 * cross-module read access: e.g. the Purchase Orders form needs to look up
 * suppliers and products to populate its dropdowns, so those GET routes
 * accept `purchase:manage` as an alternative to their own module's
 * permission, without loosening who can create/edit/delete that data.
 *
 * Proxy (src/proxy.ts) already blocks page navigation without a session,
 * but it only performs an "optimistic" check — Next.js's own guidance is
 * that real authorization must happen at the API/data layer, since API
 * routes can be hit directly regardless of what page loaded. Every
 * module's route handlers should call this first.
 *
 * Usage:
 *   const { session, error } = await requirePermission(req, "hr:manage");
 *   const { session, error } = await requirePermission(req, ["inventory:manage", "purchase:manage"]);
 *   if (error) return error;
 */
export async function requirePermission(
  req: Request,
  permission: string | string[]
): Promise<Allowed | Denied> {
  const session = await getSession(req);
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  const required = Array.isArray(permission) ? permission : [permission];
  const hasAccess = required.some((p) => session.permissions.includes(p));
  if (!hasAccess) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}