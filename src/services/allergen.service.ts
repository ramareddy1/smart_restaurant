import { prisma } from "@/lib/db";

export async function listAllergens() {
  return prisma.allergen.findMany({ orderBy: { name: "asc" } });
}

export async function getIngredientAllergens(ingredientId: string) {
  const links = await prisma.ingredientAllergen.findMany({
    where: { ingredientId },
    include: { allergen: true },
  });
  return links.map((l) => l.allergen);
}

export async function setIngredientAllergens(
  ingredientId: string,
  allergenIds: string[]
) {
  return prisma.$transaction(async (tx) => {
    // Remove all existing links
    await tx.ingredientAllergen.deleteMany({ where: { ingredientId } });

    // Create new links
    if (allergenIds.length > 0) {
      await tx.ingredientAllergen.createMany({
        data: allergenIds.map((allergenId) => ({
          ingredientId,
          allergenId,
        })),
      });
    }

    // Return updated allergens
    const links = await tx.ingredientAllergen.findMany({
      where: { ingredientId },
      include: { allergen: true },
    });
    return links.map((l) => l.allergen);
  });
}

/**
 * Auto-compute allergens for a menu item by traversing:
 * MenuItem → Recipe → RecipeIngredients → Ingredients → Allergens
 */
export async function getMenuItemAllergens(menuItemId: string) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: {
      recipe: {
        select: {
          ingredients: {
            select: {
              ingredient: {
                select: {
                  allergens: {
                    select: {
                      allergen: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!menuItem?.recipe) return [];

  // Deduplicate allergens by ID
  const allergenMap = new Map<string, { id: string; name: string }>();
  for (const ri of menuItem.recipe.ingredients) {
    for (const ia of ri.ingredient.allergens) {
      allergenMap.set(ia.allergen.id, ia.allergen);
    }
  }

  return Array.from(allergenMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
