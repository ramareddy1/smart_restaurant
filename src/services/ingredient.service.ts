import { prisma } from "@/lib/db";
import type { Prisma } from "@generated/prisma";

export async function listIngredients(params: {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { search, category, lowStockOnly, page = 1, pageSize = 50 } = params;

  const where: Prisma.IngredientWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }

  // Use raw SQL for low-stock filter since Prisma can't compare two columns directly.
  // This ensures correct pagination (filter BEFORE paginating, not after).
  if (lowStockOnly) {
    where.AND = [
      ...(Array.isArray((where as Record<string, unknown>).AND)
        ? (where.AND as Prisma.IngredientWhereInput[])
        : []),
      {
        // Use Prisma's raw filter for column-to-column comparison
        currentStock: { not: undefined },
      },
    ];
  }

  // Build the base conditions for both queries
  const baseWhere = { ...where };

  if (lowStockOnly) {
    // Use raw SQL for the column-to-column comparison
    const searchCondition = search
      ? `AND name ILIKE '%' || $1 || '%'`
      : "";
    const categoryCondition = category ? `AND category = $2` : "";
    const baseQuery = `FROM ingredients WHERE current_stock < par_level ${searchCondition} ${categoryCondition}`;

    // Build params array dynamically
    const queryParams: (string | number)[] = [];
    if (search) queryParams.push(search);
    if (category) queryParams.push(category);

    const countQuery = `SELECT COUNT(*)::int as count ${baseQuery}`;
    const dataQuery = `SELECT * ${baseQuery} ORDER BY name ASC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    type CountResult = { count: number };
    type IngredientRow = {
      id: string;
      name: string;
      category: string;
      unit: string;
      current_stock: number;
      par_level: number;
      cost_per_unit: number;
      expiration_date: Date | null;
      supplier_id: string | null;
      created_at: Date;
      updated_at: Date;
    };

    const [countResult, rawItems] = await Promise.all([
      prisma.$queryRawUnsafe<CountResult[]>(countQuery, ...queryParams),
      prisma.$queryRawUnsafe<IngredientRow[]>(dataQuery, ...queryParams),
    ]);

    const total = countResult[0]?.count ?? 0;

    // Map raw results to match Prisma's camelCase format and include supplier
    const ingredientIds = rawItems.map((i) => i.id);
    const ingredientsWithSupplier = ingredientIds.length > 0
      ? await prisma.ingredient.findMany({
          where: { id: { in: ingredientIds } },
          include: {
            supplier: true,
            allergens: { include: { allergen: true } },
          },
          orderBy: { name: "asc" },
        })
      : [];

    return {
      items: ingredientsWithSupplier,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  const [items, total] = await Promise.all([
    prisma.ingredient.findMany({
      where: baseWhere,
      include: {
        supplier: true,
        allergens: { include: { allergen: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ingredient.count({ where: baseWhere }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getIngredient(id: string) {
  return prisma.ingredient.findUnique({
    where: { id },
    include: {
      supplier: true,
      recipeIngredients: { include: { recipe: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function createIngredient(
  data: Omit<Prisma.IngredientCreateInput, "supplier"> & {
    supplierId?: string | null;
  }
) {
  const { supplierId, ...rest } = data;
  return prisma.ingredient.create({
    data: {
      ...rest,
      ...(supplierId ? { supplier: { connect: { id: supplierId } } } : {}),
    },
    include: { supplier: true },
  });
}

export async function updateIngredient(
  id: string,
  data: Omit<Prisma.IngredientUpdateInput, "supplier"> & {
    supplierId?: string | null;
  }
) {
  const { supplierId, ...rest } = data;
  return prisma.ingredient.update({
    where: { id },
    data: {
      ...rest,
      supplier: supplierId
        ? { connect: { id: supplierId } }
        : { disconnect: true },
    },
    include: { supplier: true },
  });
}

export async function deleteIngredient(id: string) {
  return prisma.ingredient.delete({ where: { id } });
}

export async function getAllIngredients() {
  return prisma.ingredient.findMany({
    orderBy: { name: "asc" },
    include: { supplier: true },
  });
}
