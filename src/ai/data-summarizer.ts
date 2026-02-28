import { prisma } from "@/lib/db";
import { TRANSACTION_LOOKBACK_MS, MAX_AI_CONTEXT_LENGTH } from "@/lib/constants";

export async function buildAnalysisContext(): Promise<string> {
  const thirtyDaysAgo = new Date(Date.now() - TRANSACTION_LOOKBACK_MS);

  // Limit query sizes to control AI context size and cost
  const [ingredients, transactions, menuItems] = await Promise.all([
    prisma.ingredient.findMany({
      include: { supplier: true },
      take: 200,
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: { ingredient: true },
      orderBy: { createdAt: "asc" },
      take: 500,
    }),
    prisma.menuItem.findMany({
      where: { isActive: true },
      include: {
        recipe: {
          include: {
            ingredients: { include: { ingredient: true } },
          },
        },
      },
      take: 100,
    }),
  ]);

  // Build compact text summary
  let context = "=== CURRENT INVENTORY ===\n";
  for (const ing of ingredients) {
    const status = ing.currentStock < ing.parLevel ? "LOW" : "OK";
    const expiry = ing.expirationDate
      ? ` exp:${ing.expirationDate.toISOString().split("T")[0]}`
      : "";
    context += `- ${ing.name}: ${ing.currentStock}/${ing.parLevel} ${ing.unit} [${status}] $${ing.costPerUnit}/${ing.unit}${expiry} (supplier: ${ing.supplier?.name ?? "none"})\n`;
  }

  // Summarize transactions by ingredient
  context += "\n=== TRANSACTIONS (LAST 30 DAYS) ===\n";
  const txSummary = new Map<
    string,
    { purchased: number; used: number; wasted: number; spent: number }
  >();
  for (const tx of transactions) {
    const key = tx.ingredient.name;
    const current = txSummary.get(key) ?? {
      purchased: 0,
      used: 0,
      wasted: 0,
      spent: 0,
    };
    if (tx.type === "PURCHASE") {
      current.purchased += tx.quantity;
      current.spent += tx.totalCost ?? 0;
    }
    if (tx.type === "USAGE") current.used += tx.quantity;
    if (tx.type === "WASTE") current.wasted += tx.quantity;
    txSummary.set(key, current);
  }
  for (const [name, data] of txSummary) {
    const wasteRatio =
      data.purchased > 0
        ? `${Math.round((data.wasted / data.purchased) * 100)}% waste`
        : "no purchases";
    context += `- ${name}: bought=${data.purchased}, used=${data.used}, wasted=${data.wasted} (${wasteRatio}), spent=$${data.spent.toFixed(2)}\n`;
  }

  // Menu profitability
  context += "\n=== MENU PROFITABILITY ===\n";
  for (const item of menuItems) {
    if (item.recipe) {
      const cost = item.recipe.ingredients.reduce(
        (sum, ri) => sum + ri.quantity * ri.ingredient.costPerUnit,
        0
      );
      const margin =
        item.price > 0
          ? ((item.price - cost) / item.price * 100).toFixed(1)
          : "N/A";
      context += `- ${item.name}: price=$${item.price}, cost=$${cost.toFixed(2)}, margin=${margin}%\n`;
    } else {
      context += `- ${item.name}: price=$${item.price}, cost=N/A (no recipe linked)\n`;
    }
  }

  // Cap context size to control AI API token costs
  if (context.length > MAX_AI_CONTEXT_LENGTH) {
    context =
      context.slice(0, MAX_AI_CONTEXT_LENGTH) +
      "\n\n[...context truncated to stay within token limits]";
  }

  return context;
}
