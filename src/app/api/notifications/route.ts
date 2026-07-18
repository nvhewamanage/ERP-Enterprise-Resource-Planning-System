import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { listForUser, countUnreadForUser, markAllReadForUser } from "@/modules/notifications/services/notification.service";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    listForUser(session.userId),
    countUnreadForUser(session.userId),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

// Marks every notification visible to this user (personal + broadcast) as read.
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await markAllReadForUser(session.userId);
  return NextResponse.json({ ok: true });
}