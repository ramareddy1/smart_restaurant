import { prisma } from "@/lib/db";
import type { Prisma, UserRole } from "@generated/prisma";

export async function listStaff(params: {
  restaurantId: string;
  search?: string;
  role?: UserRole;
  activeOnly?: boolean;
}) {
  const { restaurantId, search, role, activeOnly = true } = params;

  const where: Prisma.UserWhereInput = { restaurantId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (activeOnly) {
    where.isActive = true;
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        pin: false, // never expose PINs
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function getStaffMember(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      restaurantId: true,
    },
  });
}

export async function createStaffMember(data: {
  email: string;
  name: string;
  role: UserRole;
  pin?: string | null;
  restaurantId: string;
}) {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      pin: data.pin ?? null,
      restaurantId: data.restaurantId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function updateStaffMember(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: UserRole;
    pin?: string | null;
    isActive?: boolean;
  }
) {
  // If email is changing, check for duplicates
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id } },
    });
    if (existing) {
      throw new Error("A user with this email already exists");
    }
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function deactivateStaffMember(id: string) {
  // Also delete all active sessions
  await prisma.session.deleteMany({ where: { userId: id } });

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}
