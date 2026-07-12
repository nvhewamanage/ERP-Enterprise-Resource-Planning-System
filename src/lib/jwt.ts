import { SignJWT, jwtVerify } from "jose";

// Shared JWT helper. Uses `jose` (not `jsonwebtoken`) specifically because
// this needs to run inside `src/middleware.ts`, which executes on the Edge
// runtime — Edge has no access to Node's `crypto` module, which
// `jsonwebtoken` depends on. `jose` works in both places.

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to your .env file.");
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const SESSION_COOKIE = "erp_session";

const ALG = "HS256";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string; // role name, e.g. 'super_admin'
  permissions: string[];
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secretKey);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the session cookie from an incoming API route request.
 * Use this inside `src/app/api/**` handlers to authorize requests —
 * middleware already blocks page navigation, but API routes need their own
 * check since they can be hit directly.
 */
export async function getSession(req: Request): Promise<SessionPayload | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;
  return verifySession(token);
}