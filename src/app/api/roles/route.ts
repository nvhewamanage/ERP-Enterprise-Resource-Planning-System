import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { listRoles } from "@/modules/users/services/user.service";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!session.permissions.includes("users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roles = await listRoles();
  return NextResponse.json(roles);
}