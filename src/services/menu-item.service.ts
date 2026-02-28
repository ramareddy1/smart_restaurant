import { prisma } from "@/lib/db";

export async function listMenuItems(params: {
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
    prisma.menuItem.findMany({
      where,
      include: {
        recipe: { include: { ingredients: { include: { ingredient: true } } } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.menuItem.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getMenuItem(id: string) {
  return prisma.menuItem.findUnique({
    where: { id },
    include: {
      recipe: { include: { ingredients: { include: { ingredient: true } } } },
      menus: { include: { menu: true } },
    },
  });
}

export async function createMenuItem(data: {
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  recipeId?: string | null;
  isActive?: boolean;
}) {
  return prisma.menuItem.create({
    data,
    include: { recipe: true },
  });
}

export async function updateMenuItem(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    category?: string | null;
    recipeId?: string | null;
    isActive?: boolean;
  }
) {
  return prisma.menuItem.update({
    where: { id },
    data,
    include: { recipe: true },
  });
}

export async function deleteMenuItem(id: string) {
  return prisma.menuItem.delete({ where: { id } });
}
