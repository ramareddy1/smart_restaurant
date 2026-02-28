import { prisma } from "@/lib/db";

export async function listMenus(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, page = 1, pageSize = 50 } = params;
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [items, total] = await Promise.all([
    prisma.menu.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.menu.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getMenu(id: string) {
  return prisma.menu.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              recipe: { include: { ingredients: { include: { ingredient: true } } } },
            },
          },
        },
      },
    },
  });
}

export async function createMenu(data: {
  name: string;
  description?: string | null;
  isActive?: boolean;
  menuItemIds?: string[];
}) {
  const { menuItemIds, ...menuData } = data;

  return prisma.menu.create({
    data: {
      ...menuData,
      items: menuItemIds?.length
        ? { create: menuItemIds.map((id) => ({ menuItemId: id })) }
        : undefined,
    },
    include: { items: { include: { menuItem: true } } },
  });
}

export async function updateMenu(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    menuItemIds?: string[];
  }
) {
  const { menuItemIds, ...menuData } = data;

  return prisma.$transaction(async (tx) => {
    if (menuItemIds !== undefined) {
      await tx.menuMenuItem.deleteMany({ where: { menuId: id } });
    }

    return tx.menu.update({
      where: { id },
      data: {
        ...menuData,
        ...(menuItemIds !== undefined
          ? {
              items: {
                create: menuItemIds.map((itemId) => ({ menuItemId: itemId })),
              },
            }
          : {}),
      },
      include: { items: { include: { menuItem: true } } },
    });
  });
}

export async function deleteMenu(id: string) {
  return prisma.menu.delete({ where: { id } });
}
