import { prisma } from "@/lib/db";

export async function getServerDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const [
    activeOrders,
    tablesOccupied,
    totalTables,
    todayClosedOrders,
    todayRevenue,
    statusBreakdown,
  ] = await Promise.all([
    // Active orders count
    prisma.order.count({
      where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
    }),

    // Occupied tables
    prisma.table.count({
      where: { status: "OCCUPIED" },
    }),

    // Total tables
    prisma.table.count(),

    // Today's closed orders
    prisma.order.count({
      where: {
        status: "CLOSED",
        closedAt: { gte: startOfDay, lt: endOfDay },
      },
    }),

    // Today's revenue
    prisma.order.aggregate({
      where: {
        status: "CLOSED",
        closedAt: { gte: startOfDay, lt: endOfDay },
      },
      _sum: { total: true },
    }),

    // Status breakdown for active orders
    prisma.order.groupBy({
      by: ["status"],
      where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
      _count: true,
    }),
  ]);

  // Calculate average order time for today's closed orders
  const closedOrders = await prisma.order.findMany({
    where: {
      status: "CLOSED",
      closedAt: { gte: startOfDay, lt: endOfDay },
    },
    select: { createdAt: true, closedAt: true },
  });

  const avgOrderTimeMin =
    closedOrders.length > 0
      ? closedOrders.reduce((sum, o) => {
          const diff = (o.closedAt!.getTime() - o.createdAt.getTime()) / 60000;
          return sum + diff;
        }, 0) / closedOrders.length
      : 0;

  return {
    activeOrders,
    tablesOccupied,
    totalTables,
    todayClosedOrders,
    todayRevenue: todayRevenue._sum.total ?? 0,
    avgOrderTimeMin: Math.round(avgOrderTimeMin),
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count,
    })),
  };
}
