import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { updateUserSchema } from "@/modules/users/validations/user.schema";
import { getUserById, updateUser, deleteUser } from "@/modules/users/services/user.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "users:manage");
  if (error) return error;

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(req, "users:manage");
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
  const { error, session } = await requirePermission(req, "users:delete");
  if (error) return error;

  const { id } = await params;
  if (session.userId === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const existing = await getUserById(id);
  const ok = await deleteUser(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing) {
    await recordAudit(session, "user.delete", "user", id, { email: existing.email, role: existing.roleName });
  }

  return new NextResponse(null, { status: 204 });
}