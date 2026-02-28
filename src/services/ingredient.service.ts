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

  const [items, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      include: { supplier: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ingredient.count({ where }),
  ]);

  // Filter low stock in JS since Prisma can't compare two columns directly
  const filteredItems = lowStockOnly
    ? items.filter((i) => i.currentStock < i.parLevel)
    : items;

  return {
    items: filteredItems,
    total: lowStockOnly ? filteredItems.length : total,
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
