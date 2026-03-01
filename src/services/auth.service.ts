import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function login(email: string, pin?: string | null) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return null;
  }

  // If user has a PIN set, verify it
  if (user.pin && pin !== user.pin) {
    return null;
  }

  // Create session
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: { userId: user.id, token, expiresAt },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user, token: session.token, expiresAt: session.expiresAt };
}

export async function loginWithPin(pin: string, restaurantId: string) {
  const user = await prisma.user.findFirst({
    where: { pin, restaurantId, isActive: true },
  });
  if (!user) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: { userId: user.id, token, expiresAt },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user, token: session.token, expiresAt: session.expiresAt };
}

export async function validateSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { restaurant: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function logout(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function cleanExpiredSessions() {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
