import { prisma } from "@/lib/db";

export async function listTransactions(params: {
  type?: string;
  ingredientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const { type, ingredientId, startDate, endDate, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (ingredientId) where.ingredientId = ingredientId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { ingredient: true, supplier: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createTransaction(data: {
  type: "PURCHASE" | "USAGE" | "WASTE" | "ADJUSTMENT";
  ingredientId: string;
  quantity: number;
  unitCost?: number | null;
  supplierId?: string | null;
  notes?: string | null;
}) {
  const totalCost =
    data.unitCost != null ? data.quantity * data.unitCost : null;

  return prisma.$transaction(async (tx) => {
    // 1. Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        type: data.type,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
        unitCost: data.unitCost ?? null,
        totalCost,
        supplierId: data.supplierId ?? null,
        notes: data.notes ?? null,
      },
      include: { ingredient: true, supplier: true },
    });

    // 2. Update ingredient stock
    const stockDelta =
      data.type === "PURCHASE"
        ? data.quantity
        : data.type === "ADJUSTMENT"
        ? data.quantity
        : -data.quantity; // USAGE and WASTE reduce stock

    const updateData: Record<string, unknown> = {
      currentStock: { increment: stockDelta },
    };

    // Update cost per unit on purchase
    if (data.type === "PURCHASE" && data.unitCost != null) {
      updateData.costPerUnit = data.unitCost;
    }

    await tx.ingredient.update({
      where: { id: data.ingredientId },
      data: updateData,
    });

    return transaction;
  });
}
