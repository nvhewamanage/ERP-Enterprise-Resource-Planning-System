import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/modules/auth/validations/auth.schema";
import { verifyCredentials, touchLastLogin } from "@/modules/auth/services/auth.service";
import { signSession, SESSION_COOKIE } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await verifyCredentials(parsed.data);
  if (!user) {
    // Deliberately generic — don't reveal whether the email exists.
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  });

  await touchLastLogin(user.id);

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    permissions: user.permissions,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours, matches JWT_EXPIRES_IN default
  });

  return response;
}