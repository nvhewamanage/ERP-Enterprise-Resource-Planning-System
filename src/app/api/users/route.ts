import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";
import { createUserSchema } from "@/modules/users/validations/user.schema";
import { listUsers, createUser, getUserByEmail } from "@/modules/users/services/user.service";

async function requireUsersManage(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (!session.permissions.includes("users:manage")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(req: NextRequest) {
  const { error } = await requireUsersManage(req);
  if (error) return error;

  const users = await listUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requireUsersManage(req);
  if (error) return error;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const user = await createUser(parsed.data);
  return NextResponse.json(user, { status: 201 });
}