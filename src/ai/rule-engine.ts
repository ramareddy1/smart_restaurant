import { prisma } from "@/lib/db";

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
    if (ing.currentStock < ing.parLevel * 0.5) {
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
      ing.expirationDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
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
    if (ing.currentStock > ing.parLevel * 3) {
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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
    if (stats.purchase > 0 && stats.waste / stats.purchase > 0.2) {
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

  // Deduplicate: don't create alert if identical active one exists
  let created = 0;
  for (const candidate of candidates) {
    const existing = await prisma.alert.findFirst({
      where: {
        type: candidate.type,
        ingredientId: candidate.ingredientId,
        isRead: false,
        isDismissed: false,
      },
    });
    if (!existing) {
      await prisma.alert.create({ data: candidate });
      created++;
    }
  }

  return created;
}
