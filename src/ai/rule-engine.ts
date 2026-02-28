import { prisma } from "@/lib/db";
import {
  STOCK_OVERSTOCK_MULTIPLIER,
  STOCK_CRITICAL_MULTIPLIER,
  EXPIRY_WARNING_MS,
  TRANSACTION_LOOKBACK_MS,
  WASTE_RATIO_THRESHOLD,
} from "@/lib/constants";

interface AlertCandidate {
  type: "LOW_STOCK" | "EXPIRING" | "OVERSTOCK";
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  ingredientId: string;
}

export async function runRuleEngine(ingredientIds?: string[]) {
  const ingredients = await prisma.ingredient.findMany({
    where: ingredientIds ? { id: { in: ingredientIds } } : undefined,
    include: { supplier: true },
  });

  const candidates: AlertCandidate[] = [];

  for (const ing of ingredients) {
    // RULE 1: Critical stock (< 50% of par)
    if (ing.currentStock < ing.parLevel * STOCK_CRITICAL_MULTIPLIER) {
      candidates.push({
        type: "LOW_STOCK",
        severity: "CRITICAL",
        title: `Critical: ${ing.name} stock critically low`,
        message: `${ing.name} is at ${ing.currentStock} ${ing.unit} — below 50% of par level (${ing.parLevel} ${ing.unit}). Reorder immediately.`,
        ingredientId: ing.id,
      });
    }
    // RULE 2: Low stock (< par)
    else if (ing.currentStock < ing.parLevel) {
      candidates.push({
        type: "LOW_STOCK",
        severity: "WARNING",
        title: `Low stock: ${ing.name}`,
        message: `${ing.name} is at ${ing.currentStock} ${ing.unit}, below par level of ${ing.parLevel} ${ing.unit}.`,
        ingredientId: ing.id,
      });
    }

    // RULE 3: Expired
    if (ing.expirationDate && ing.expirationDate < new Date()) {
      candidates.push({
        type: "EXPIRING",
        severity: "CRITICAL",
        title: `Expired: ${ing.name}`,
        message: `${ing.name} expired on ${ing.expirationDate.toLocaleDateString()}. Remove from inventory.`,
        ingredientId: ing.id,
      });
    }
    // RULE 4: Expiring soon (within 3 days)
    else if (
      ing.expirationDate &&
      ing.expirationDate <= new Date(Date.now() + EXPIRY_WARNING_MS)
    ) {
      candidates.push({
        type: "EXPIRING",
        severity: "WARNING",
        title: `Expiring soon: ${ing.name}`,
        message: `${ing.name} expires on ${ing.expirationDate.toLocaleDateString()}.`,
        ingredientId: ing.id,
      });
    }

    // RULE 5: Overstock (> 3x par)
    if (ing.currentStock > ing.parLevel * STOCK_OVERSTOCK_MULTIPLIER) {
      candidates.push({
        type: "OVERSTOCK",
        severity: "INFO",
        title: `Overstock: ${ing.name}`,
        message: `${ing.name} is at ${ing.currentStock} ${ing.unit} — more than 3x par level (${ing.parLevel}).`,
        ingredientId: ing.id,
      });
    }
  }

  // RULE 6: High waste ratio
  const thirtyDaysAgo = new Date(Date.now() - TRANSACTION_LOOKBACK_MS);
  const wasteStats = await prisma.transaction.groupBy({
    by: ["ingredientId", "type"],
    where: {
      ingredientId: ingredientIds ? { in: ingredientIds } : undefined,
      type: { in: ["PURCHASE", "WASTE"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { quantity: true },
  });

  const statsByIngredient = new Map<string, { purchase: number; waste: number }>();
  for (const stat of wasteStats) {
    const current = statsByIngredient.get(stat.ingredientId) ?? {
      purchase: 0,
      waste: 0,
    };
    if (stat.type === "PURCHASE") current.purchase = stat._sum.quantity ?? 0;
    if (stat.type === "WASTE") current.waste = stat._sum.quantity ?? 0;
    statsByIngredient.set(stat.ingredientId, current);
  }

  for (const [ingredientId, stats] of statsByIngredient) {
    if (stats.purchase > 0 && stats.waste / stats.purchase > WASTE_RATIO_THRESHOLD) {
      const ing = ingredients.find((i) => i.id === ingredientId);
      candidates.push({
        type: "LOW_STOCK",
        severity: "WARNING",
        title: `High waste: ${ing?.name ?? "Unknown"}`,
        message: `${Math.round((stats.waste / stats.purchase) * 100)}% of purchased ${ing?.name ?? "ingredient"} was wasted in the last 30 days.`,
        ingredientId,
      });
    }
  }

  // Deduplicate: batch-fetch existing active alerts instead of N+1 sequential queries
  const candidateIngredientIds = [...new Set(candidates.map((c) => c.ingredientId))];

  const existingAlerts = candidateIngredientIds.length > 0
    ? await prisma.alert.findMany({
        where: {
          ingredientId: { in: candidateIngredientIds },
          isRead: false,
          isDismissed: false,
        },
        select: { type: true, ingredientId: true },
      })
    : [];

  const existingSet = new Set(
    existingAlerts.map((a) => `${a.type}:${a.ingredientId}`)
  );

  const newCandidates = candidates.filter(
    (c) => !existingSet.has(`${c.type}:${c.ingredientId}`)
  );

  if (newCandidates.length > 0) {
    await prisma.alert.createMany({ data: newCandidates });
  }

  return newCandidates.length;
}
