import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const [
      lowStockCount,
      pendingPOs,
      todayWaste,
      weekWaste,
      expiringCount,
      recentReceivings,
      poStats,
    ] = await Promise.all([
      // Ingredients below par level
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM ingredients
        WHERE current_stock < par_level
      `.then((r) => Number(r[0].count)),

      // POs in SUBMITTED or PARTIALLY_RECEIVED
      prisma.purchaseOrder.count({
        where: { status: { in: ["SUBMITTED", "PARTIALLY_RECEIVED"] } },
      }),

      // Today's waste cost
      prisma.transaction
        .aggregate({
          where: { type: "WASTE", createdAt: { gte: todayStart } },
          _sum: { totalCost: true },
          _count: true,
        })
        .then((r) => ({
          cost: r._sum.totalCost ?? 0,
          count: r._count,
        })),

      // Week waste cost
      prisma.transaction
        .aggregate({
          where: { type: "WASTE", createdAt: { gte: weekAgo } },
          _sum: { totalCost: true },
          _count: true,
        })
        .then((r) => ({
          cost: r._sum.totalCost ?? 0,
          count: r._count,
        })),

      // Ingredients expiring within 3 days
      prisma.ingredient.count({
        where: {
          expirationDate: {
            lte: new Date(now.getTime() + 3 * 86400000),
            gte: now,
          },
        },
      }),

      // Recent receivings (last 5)
      prisma.receiving.findMany({
        include: {
          purchaseOrder: {
            select: { orderNumber: true, supplier: { select: { name: true } } },
          },
          receivedBy: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { receivedAt: "desc" },
        take: 5,
      }),

      // PO summary by status
      prisma.purchaseOrder.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return NextResponse.json({
      lowStockCount,
      pendingPOs,
      todayWaste,
      weekWaste,
      expiringCount,
      recentReceivings,
      poStats: Object.fromEntries(
        poStats.map((s) => [s.status, s._count])
      ),
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch kitchen dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch kitchen dashboard" }, { status: 500 });
  }
}
