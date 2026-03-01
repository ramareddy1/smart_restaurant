import { prisma } from "@/lib/db";
import type { PurchaseOrderStatus, Prisma } from "@generated/prisma";

// ─── Auto-generate order numbers ────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

  const latest = await prisma.purchaseOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const seq = latest
    ? parseInt(latest.orderNumber.split("-").pop() ?? "0", 10) + 1
    : 1;

  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

// ─── List POs ───────────────────────────────────────────────

export async function listPurchaseOrders(params: {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  page?: number;
  pageSize?: number;
}) {
  const { supplierId, status, page = 1, pageSize = 25 } = params;

  const where: Prisma.PurchaseOrderWhereInput = {};
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: { ingredient: { select: { id: true, name: true, unit: true } } },
        },
        _count: { select: { receivings: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { items, total };
}

// ─── Get single PO ─────────────────────────────────────────

export async function getPurchaseOrder(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: { select: { id: true, name: true } },
      items: {
        include: { ingredient: { select: { id: true, name: true, unit: true, currentStock: true, parLevel: true } } },
      },
      receivings: {
        include: {
          receivedBy: { select: { id: true, name: true } },
          items: {
            include: { ingredient: { select: { id: true, name: true, unit: true } } },
          },
        },
        orderBy: { receivedAt: "desc" },
      },
    },
  });
}

// ─── Create PO ──────────────────────────────────────────────

export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDate?: string | null;
  notes?: string | null;
  createdById: string;
  items: Array<{
    ingredientId: string;
    quantityOrdered: number;
    unitCost: number;
  }>;
}) {
  const orderNumber = await generateOrderNumber();

  const totalCost = data.items.reduce(
    (sum, item) => sum + item.quantityOrdered * item.unitCost,
    0
  );

  return prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId: data.supplierId,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes ?? null,
      createdById: data.createdById,
      totalCost,
      items: {
        create: data.items.map((item) => ({
          ingredientId: item.ingredientId,
          quantityOrdered: item.quantityOrdered,
          unitCost: item.unitCost,
        })),
      },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: { ingredient: { select: { id: true, name: true, unit: true } } },
      },
    },
  });
}

// ─── Update PO (only DRAFT orders) ─────────────────────────

export async function updatePurchaseOrder(
  id: string,
  data: {
    supplierId?: string;
    expectedDate?: string | null;
    notes?: string | null;
    items?: Array<{
      ingredientId: string;
      quantityOrdered: number;
      unitCost: number;
    }>;
  }
) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existing) throw new Error("Purchase order not found");
  if (existing.status !== "DRAFT") {
    throw new Error("Only DRAFT orders can be edited");
  }

  const updateData: Prisma.PurchaseOrderUpdateInput = {};

  if (data.supplierId) updateData.supplier = { connect: { id: data.supplierId } };
  if (data.expectedDate !== undefined) {
    updateData.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;
  }
  if (data.notes !== undefined) updateData.notes = data.notes;

  // If items are provided, replace all line items
  if (data.items) {
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

    const totalCost = data.items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.unitCost,
      0
    );
    updateData.totalCost = totalCost;

    updateData.items = {
      create: data.items.map((item) => ({
        ingredientId: item.ingredientId,
        quantityOrdered: item.quantityOrdered,
        unitCost: item.unitCost,
      })),
    };
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: { ingredient: { select: { id: true, name: true, unit: true } } },
      },
    },
  });
}

// ─── Submit PO ──────────────────────────────────────────────

export async function submitPurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { status: true, items: true },
  });

  if (!po) throw new Error("Purchase order not found");
  if (po.status !== "DRAFT") throw new Error("Only DRAFT orders can be submitted");
  if (po.items.length === 0) throw new Error("Cannot submit an empty purchase order");

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "SUBMITTED" },
  });
}

// ─── Cancel PO ──────────────────────────────────────────────

export async function cancelPurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!po) throw new Error("Purchase order not found");
  if (po.status === "RECEIVED" || po.status === "CANCELLED") {
    throw new Error(`Cannot cancel a ${po.status} order`);
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

// ─── Get low-stock ingredients for PO auto-populate ─────────

export async function getLowStockIngredients(supplierId?: string) {
  const where: Prisma.IngredientWhereInput = {};
  if (supplierId) where.supplierId = supplierId;

  const ingredients = await prisma.ingredient.findMany({
    where,
    select: {
      id: true,
      name: true,
      unit: true,
      currentStock: true,
      parLevel: true,
      costPerUnit: true,
      supplierId: true,
      supplier: { select: { id: true, name: true } },
    },
  });

  // Return only ingredients where currentStock < parLevel
  return ingredients
    .filter((i) => i.currentStock < i.parLevel)
    .map((i) => ({
      ...i,
      deficit: i.parLevel - i.currentStock,
      suggestedOrder: Math.ceil((i.parLevel - i.currentStock) * 1.2), // 20% buffer
    }));
}
