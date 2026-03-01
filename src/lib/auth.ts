import { cookies } from "next/headers";
import { validateSession } from "@/services/auth.service";
import type { UserRole } from "@generated/prisma";

export const SESSION_COOKIE = "erp_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function requireUser(...allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not authenticated", 401);
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
