import { prisma } from "@/lib/db";

export async function listSuppliers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { search, page = 1, pageSize = 50 } = params;
  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { ingredients: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: { ingredients: true },
  });
}

export async function createSupplier(data: {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
}) {
  return prisma.supplier.create({ data });
}

export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    notes?: string | null;
  }
) {
  return prisma.supplier.update({ where: { id }, data });
}

export async function deleteSupplier(id: string) {
  return prisma.supplier.delete({ where: { id } });
}

export async function getAllSuppliers() {
  return prisma.supplier.findMany({ orderBy: { name: "asc" } });
}
