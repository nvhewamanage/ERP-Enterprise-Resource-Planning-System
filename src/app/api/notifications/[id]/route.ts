import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { markRead } from "@/modules/notifications/services/notification.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  await markRead(id);
  return NextResponse.json({ ok: true });
}