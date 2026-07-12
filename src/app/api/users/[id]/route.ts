import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { updateUserSchema } from "@/modules/users/validations/user.schema";
import { getUserById, updateUser, deleteUser } from "@/modules/users/services/user.service";

type RouteParams = { params: Promise<{ id: string }> };

async function requireUsersManage(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (!session.permissions.includes("users:manage")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requireUsersManage(req);
  if (error) return error;

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requireUsersManage(req);
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await updateUser(id, parsed.data);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireUsersManage(req);
  if (error) return error;

  const { id } = await params;
  if (session!.userId === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const ok = await deleteUser(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}