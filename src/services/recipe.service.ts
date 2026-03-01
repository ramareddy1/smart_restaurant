import { prisma } from "@/lib/db";

export async function listRecipes(params: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, category, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: {
        ingredients: { include: { ingredient: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.recipe.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getRecipe(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { include: { ingredient: true } },
      menuItems: true,
    },
  });
}

export async function createRecipe(data: {
  name: string;
  description?: string | null;
  category?: string | null;
  yieldQuantity?: number;
  yieldUnit?: string;
  instructions?: string | null;
  prepTimeMin?: number | null;
  cookTimeMin?: number | null;
  difficultyLevel?: string | null;
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string }>;
}) {
  const { ingredients, ...recipeData } = data;

  return prisma.recipe.create({
    data: {
      ...recipeData,
      ingredients: {
        create: ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });
}

export async function updateRecipe(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    category?: string | null;
    yieldQuantity?: number;
    yieldUnit?: string;
    instructions?: string | null;
    prepTimeMin?: number | null;
    cookTimeMin?: number | null;
    difficultyLevel?: string | null;
    ingredients?: Array<{ ingredientId: string; quantity: number; unit: string }>;
  }
) {
  const { ingredients, ...recipeData } = data;

  return prisma.$transaction(async (tx) => {
    if (ingredients) {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    }

    return tx.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        ...(ingredients
          ? {
              ingredients: {
                create: ingredients.map((ing) => ({
                  ingredientId: ing.ingredientId,
                  quantity: ing.quantity,
                  unit: ing.unit,
                })),
              },
            }
          : {}),
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
  });
}

export async function deleteRecipe(id: string) {
  return prisma.recipe.delete({ where: { id } });
}

// ─── Recipe Cost Calculation ─────────────────────

export interface RecipeCostLineItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  lineCost: number;
}

export interface RecipeCostResult {
  recipeId: string;
  recipeName: string;
  yieldQuantity: number;
  yieldUnit: string;
  totalCost: number;
  costPerServing: number;
  lineItems: RecipeCostLineItem[];
}

export async function computeRecipeCost(
  recipeId: string
): Promise<RecipeCostResult | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: { ingredient: true },
      },
    },
  });

  if (!recipe) return null;

  const lineItems: RecipeCostLineItem[] = recipe.ingredients.map((ri) => {
    const lineCost = ri.quantity * ri.ingredient.costPerUnit;
    return {
      ingredientId: ri.ingredient.id,
      ingredientName: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
      costPerUnit: ri.ingredient.costPerUnit,
      lineCost: Math.round(lineCost * 100) / 100,
    };
  });

  const totalCost = lineItems.reduce((sum, li) => sum + li.lineCost, 0);
  const costPerServing =
    recipe.yieldQuantity > 0 ? totalCost / recipe.yieldQuantity : totalCost;

  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    yieldQuantity: recipe.yieldQuantity,
    yieldUnit: recipe.yieldUnit,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerServing: Math.round(costPerServing * 100) / 100,
    lineItems,
  };
}
