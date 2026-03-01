import { prisma } from "@/lib/db";

export interface MenuEngineeringItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  recipeName: string | null;
  recipeCost: number;
  foodCostPct: number;
  profitMargin: number;
  classification: "Star" | "Plow Horse" | "Puzzle" | "Dog";
}

/**
 * Compute recipe cost from its ingredients
 */
function computeCostFromIngredients(
  ingredients: Array<{
    quantity: number;
    unit: string;
    ingredient: { costPerUnit: number; unit: string };
  }>
): number {
  let total = 0;
  for (const ri of ingredients) {
    // Simple cost: quantity * costPerUnit
    // If units match, direct multiply. Otherwise best-effort (same unit assumed).
    total += ri.quantity * ri.ingredient.costPerUnit;
  }
  return total;
}

/**
 * BCG Matrix classification for menu items:
 * - Star: Low food cost %, high popularity (appears on many menus)
 * - Plow Horse: High food cost %, high popularity
 * - Puzzle: Low food cost %, low popularity
 * - Dog: High food cost %, low popularity
 *
 * We use average food cost % as the horizontal divider
 * and whether the item appears on active menus as the vertical divider.
 */
export async function getMenuEngineeringData(): Promise<MenuEngineeringItem[]> {
  // Fetch active menu items with recipe details and menu presence
  const menuItems = await prisma.menuItem.findMany({
    where: { isActive: true },
    include: {
      recipe: {
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
      },
      menus: {
        include: {
          menu: { select: { isActive: true } },
        },
      },
    },
  });

  // Calculate costs and margins
  const items: MenuEngineeringItem[] = menuItems.map((mi) => {
    const recipeCost = mi.recipe
      ? computeCostFromIngredients(mi.recipe.ingredients) /
        (mi.recipe.yieldQuantity || 1)
      : 0;

    const foodCostPct = mi.price > 0 ? (recipeCost / mi.price) * 100 : 0;
    const profitMargin = mi.price - recipeCost;

    return {
      id: mi.id,
      name: mi.name,
      price: mi.price,
      category: mi.category,
      recipeName: mi.recipe?.name ?? null,
      recipeCost: Math.round(recipeCost * 100) / 100,
      foodCostPct: Math.round(foodCostPct * 10) / 10,
      profitMargin: Math.round(profitMargin * 100) / 100,
      classification: "Star" as const, // will be classified below
    };
  });

  if (items.length === 0) return [];

  // Calculate averages for classification
  const avgFoodCostPct =
    items.reduce((sum, i) => sum + i.foodCostPct, 0) / items.length;

  // Count menu appearances for each item (popularity proxy)
  const menuPresence = new Map<string, number>();
  for (const mi of menuItems) {
    const activeMenuCount = mi.menus.filter((m) => m.menu.isActive).length;
    menuPresence.set(mi.id, activeMenuCount);
  }
  const avgMenuPresence =
    Array.from(menuPresence.values()).reduce((s, v) => s + v, 0) /
    menuPresence.size;

  // Classify using BCG matrix
  for (const item of items) {
    const isLowCost = item.foodCostPct <= avgFoodCostPct;
    const isPopular = (menuPresence.get(item.id) ?? 0) >= avgMenuPresence;

    if (isLowCost && isPopular) {
      item.classification = "Star";
    } else if (!isLowCost && isPopular) {
      item.classification = "Plow Horse";
    } else if (isLowCost && !isPopular) {
      item.classification = "Puzzle";
    } else {
      item.classification = "Dog";
    }
  }

  return items.sort((a, b) => a.foodCostPct - b.foodCostPct);
}
