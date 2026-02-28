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
