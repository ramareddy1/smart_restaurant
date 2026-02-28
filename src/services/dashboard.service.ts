import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Run all independent queries in parallel — no full-table scans, no N+1
  const [
    ingredientCount,
    lowStockResult,
    inventoryValueResult,
    expiringCount,
    recentTransactions,
    unreadAlerts,
    topExpenses,
    stockLevels,
  ] = await Promise.all([
    // Count all ingredients (lightweight count query)
    prisma.ingredient.count(),

    // Count low-stock using raw SQL for column-to-column comparison
    prisma.$queryRaw<[{ count: number }]>`
      SELECT COUNT(*)::int as count FROM ingredients WHERE current_stock < par_level
    `,

    // Aggregate total inventory value in the database instead of in JS
    prisma.$queryRaw<[{ total: number }]>`
      SELECT COALESCE(SUM(current_stock * cost_per_unit), 0)::float as total FROM ingredients
    `,

    // Count expiring ingredients
    prisma.ingredient.count({
      where: {
        expirationDate: { lte: threeDaysFromNow, gte: now },
      },
    }),

    // Recent transactions with relations
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { ingredient: true, supplier: true },
    }),

    // Unread alerts count
    prisma.alert.count({ where: { isRead: false, isDismissed: false } }),

    // Top expenses with ingredient names in a single query (no N+1)
    prisma.$queryRaw<
      { ingredientId: string; ingredientName: string; totalSpent: number }[]
    >`
      SELECT
        t.ingredient_id as "ingredientId",
        i.name as "ingredientName",
        COALESCE(SUM(t.total_cost), 0)::float as "totalSpent"
      FROM transactions t
      JOIN ingredients i ON i.id = t.ingredient_id
      WHERE t.type = 'PURCHASE' AND t.created_at >= ${thirtyDaysAgo}
      GROUP BY t.ingredient_id, i.name
      ORDER BY "totalSpent" DESC
      LIMIT 5
    `,

    // Stock levels chart — top 10 by par level (targeted query, not all ingredients)
    prisma.ingredient.findMany({
      orderBy: { parLevel: "desc" },
      take: 10,
      select: { name: true, currentStock: true, parLevel: true },
    }),
  ]);

  return {
    stats: {
      ingredientCount,
      lowStockCount: lowStockResult[0]?.count ?? 0,
      expiringCount,
      totalInventoryValue: inventoryValueResult[0]?.total ?? 0,
      unreadAlerts,
    },
    recentTransactions,
    topExpenses,
    stockLevels,
  };
}
