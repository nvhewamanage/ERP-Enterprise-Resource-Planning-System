import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { recordAudit } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";
import { createUserSchema } from "@/modules/users/validations/user.schema";
import { listUsers, createUser, getUserByEmail } from "@/modules/users/services/user.service";

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "users:manage");
  if (error) return error;

  const users = await listUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, "users:manage");
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

  await recordAudit(session, "user.create", "user", user.id, { email: user.email, role: user.roleName });
  await sendWelcomeEmail(user);

  return NextResponse.json(user, { status: 201 });
}