import { prisma } from "@/lib/db";
import type { TableStatus } from "@generated/prisma";

export async function listTables(restaurantId?: string) {
  const where: Record<string, unknown> = {};
  if (restaurantId) where.restaurantId = restaurantId;

  return prisma.table.findMany({
    where,
    include: {
      orders: {
        where: {
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
        select: { id: true, orderNumber: true, status: true, guestCount: true },
      },
    },
    orderBy: { number: "asc" },
  });
}

export async function getTable(id: string) {
  return prisma.table.findUnique({
    where: { id },
    include: {
      orders: {
        where: {
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
        include: {
          items: { include: { menuItem: true } },
          server: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createTable(data: {
  number: number;
  name?: string | null;
  seats: number;
  restaurantId: string;
}) {
  return prisma.table.create({ data });
}

export async function updateTable(
  id: string,
  data: {
    number?: number;
    name?: string | null;
    seats?: number;
    status?: TableStatus;
  }
) {
  return prisma.table.update({ where: { id }, data });
}

export async function deleteTable(id: string) {
  return prisma.table.delete({ where: { id } });
}

export async function updateTableStatus(id: string, status: TableStatus) {
  return prisma.table.update({ where: { id }, data: { status } });
}
