import { prisma } from "@/lib/db";

// ─── Create Receiving (receive goods against a PO) ──────────
// This is the core workflow: receive items → update stock → create PURCHASE transactions
// → update PO item received quantities → update PO status

export async function createReceiving(data: {
  purchaseOrderId: string;
  receivedById: string;
  notes?: string | null;
  items: Array<{
    ingredientId: string;
    quantityReceived: number;
    unitCost: number;
    qualityNotes?: string | null;
  }>;
}) {
  // Validate PO exists and is in a receivable state
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: data.purchaseOrderId },
    include: { items: true },
  });

  if (!po) throw new Error("Purchase order not found");
  if (po.status === "CANCELLED") throw new Error("Cannot receive against a cancelled PO");
  if (po.status === "RECEIVED") throw new Error("This PO is already fully received");
  if (po.status === "DRAFT") throw new Error("PO must be submitted before receiving");

  // Create the receiving record + items in a transaction
  const receiving = await prisma.$transaction(async (tx) => {
    // 1. Create receiving record
    const rec = await tx.receiving.create({
      data: {
        purchaseOrderId: data.purchaseOrderId,
        receivedById: data.receivedById,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            ingredientId: item.ingredientId,
            quantityReceived: item.quantityReceived,
            unitCost: item.unitCost,
            qualityNotes: item.qualityNotes ?? null,
          })),
        },
      },
      include: {
        items: {
          include: { ingredient: { select: { id: true, name: true, unit: true } } },
        },
        receivedBy: { select: { id: true, name: true } },
      },
    });

    // 2. Update ingredient stock + cost for each received item
    for (const item of data.items) {
      await tx.ingredient.update({
        where: { id: item.ingredientId },
        data: {
          currentStock: { increment: item.quantityReceived },
          costPerUnit: item.unitCost, // Update to latest received cost
        },
      });
    }

    // 3. Create PURCHASE transactions for each item (for financial tracking)
    await tx.transaction.createMany({
      data: data.items.map((item) => ({
        type: "PURCHASE" as const,
        ingredientId: item.ingredientId,
        quantity: item.quantityReceived,
        unitCost: item.unitCost,
        totalCost: item.quantityReceived * item.unitCost,
        supplierId: po.supplierId,
        notes: `Received against ${po.orderNumber}`,
      })),
    });

    // 4. Update PO item received quantities
    for (const item of data.items) {
      const poItem = po.items.find((i) => i.ingredientId === item.ingredientId);
      if (poItem) {
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: {
            quantityReceived: { increment: item.quantityReceived },
          },
        });
      }
    }

    // 5. Recalculate PO status based on received quantities
    const updatedPOItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: po.id },
    });

    const allFullyReceived = updatedPOItems.every(
      (i) => i.quantityReceived >= i.quantityOrdered
    );
    const someReceived = updatedPOItems.some((i) => i.quantityReceived > 0);

    const newStatus = allFullyReceived
      ? "RECEIVED"
      : someReceived
        ? "PARTIALLY_RECEIVED"
        : po.status;

    if (newStatus !== po.status) {
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus },
      });
    }

    return rec;
  });

  return receiving;
}

// ─── List receivings for a PO ───────────────────────────────

export async function listReceivings(purchaseOrderId: string) {
  return prisma.receiving.findMany({
    where: { purchaseOrderId },
    include: {
      receivedBy: { select: { id: true, name: true } },
      items: {
        include: { ingredient: { select: { id: true, name: true, unit: true } } },
      },
    },
    orderBy: { receivedAt: "desc" },
  });
}

// ─── Recent receivings (for dashboard) ──────────────────────

export async function getRecentReceivings(limit = 5) {
  return prisma.receiving.findMany({
    include: {
      purchaseOrder: {
        select: { orderNumber: true, supplier: { select: { name: true } } },
      },
      receivedBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: limit,
  });
}
