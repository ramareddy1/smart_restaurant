import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    allIngredients,
    expiringCount,
    recentTransactions,
    unreadAlerts,
    topExpenses,
  ] = await Promise.all([
    prisma.ingredient.findMany(),
    prisma.ingredient.count({
      where: {
        expirationDate: { lte: threeDaysFromNow, gte: now },
      },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { ingredient: true, supplier: true },
    }),
    prisma.alert.count({ where: { isRead: false, isDismissed: false } }),
    prisma.transaction.groupBy({
      by: ["ingredientId"],
      where: {
        type: "PURCHASE",
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: "desc" } },
      take: 5,
    }),
  ]);

  // Calculate stats from all ingredients
  const ingredientCount = allIngredients.length;
  const lowStockCount = allIngredients.filter(
    (i) => i.currentStock < i.parLevel
  ).length;
  const totalInventoryValue = allIngredients.reduce(
    (sum, i) => sum + i.currentStock * i.costPerUnit,
    0
  );

  // Get ingredient names for top expenses
  const expenseIngredientIds = topExpenses.map((e) => e.ingredientId);
  const expenseIngredients = await prisma.ingredient.findMany({
    where: { id: { in: expenseIngredientIds } },
    select: { id: true, name: true },
  });

  const topExpensesWithNames = topExpenses.map((e) => ({
    ingredientId: e.ingredientId,
    ingredientName:
      expenseIngredients.find((i) => i.id === e.ingredientId)?.name ?? "Unknown",
    totalSpent: e._sum.totalCost ?? 0,
  }));

  // Stock levels for chart (top 10 by parLevel)
  const stockLevels = allIngredients
    .sort((a, b) => b.parLevel - a.parLevel)
    .slice(0, 10)
    .map((i) => ({
      name: i.name,
      currentStock: i.currentStock,
      parLevel: i.parLevel,
    }));

  return {
    stats: {
      ingredientCount,
      lowStockCount,
      expiringCount,
      totalInventoryValue,
      unreadAlerts,
    },
    recentTransactions,
    topExpenses: topExpensesWithNames,
    stockLevels,
  };
}
