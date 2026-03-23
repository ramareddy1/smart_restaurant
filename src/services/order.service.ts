import { prisma } from "@/lib/db";
import type { OrderItemStatus } from "@generated/prisma";

// ─── Order Number Generation ────────────────────────

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const count = await prisma.order.count({
    where: {
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  return `ORD-${datePrefix}-${String(count + 1).padStart(3, "0")}`;
}

// ─── List Orders ────────────────────────────────────

export async function listOrders(params: {
  status?: string;
  tableId?: string;
  serverId?: string;
  date?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status, tableId, serverId, date, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = {};
  if (status) {
    if (status === "ACTIVE") {
      where.status = { notIn: ["CLOSED", "CANCELLED"] };
    } else {
      where.status = status;
    }
  }
  if (tableId) where.tableId = tableId;
  if (serverId) where.serverId = serverId;
  if (date) {
    const d = new Date(date);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    where.createdAt = { gte: startOfDay, lt: endOfDay };
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        table: { select: { id: true, number: true, name: true } },
        server: { select: { id: true, name: true } },
        items: {
          include: { menuItem: { select: { id: true, name: true } } },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

// ─── Get Single Order ───────────────────────────────

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      server: { select: { id: true, name: true, role: true } },
      items: {
        include: { menuItem: true },
        orderBy: { createdAt: "asc" },
      },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

// ─── Create Order ───────────────────────────────────

export async function createOrder(data: {
  tableId: string;
  serverId: string;
  guestCount?: number;
  notes?: string | null;
  items?: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string | null;
  }>;
}) {
  const orderNumber = await generateOrderNumber();

  // Look up prices for items
  let itemsToCreate: Array<{
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    specialInstructions?: string | null;
  }> = [];

  if (data.items && data.items.length > 0) {
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, price: true },
    });
    const priceMap = Object.fromEntries(menuItems.map((mi) => [mi.id, mi.price]));

    itemsToCreate = data.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: priceMap[item.menuItemId] ?? 0,
      specialInstructions: item.specialInstructions,
    }));
  }

  const subtotal = itemsToCreate.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * 0.085 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        tableId: data.tableId,
        serverId: data.serverId,
        guestCount: data.guestCount ?? 1,
        notes: data.notes,
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        total,
        items: {
          create: itemsToCreate.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            specialInstructions: item.specialInstructions,
          })),
        },
      },
      include: {
        table: true,
        server: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    // Set table to OCCUPIED
    await tx.table.update({
      where: { id: data.tableId },
      data: { status: "OCCUPIED" },
    });

    return order;
  });
}

// ─── Update Order ───────────────────────────────────

export async function updateOrder(
  id: string,
  data: { guestCount?: number; notes?: string | null }
) {
  return prisma.order.update({
    where: { id },
    data,
    include: {
      table: true,
      server: { select: { id: true, name: true } },
      items: { include: { menuItem: true } },
    },
  });
}

// ─── Add Items to Order ─────────────────────────────

export async function addOrderItems(
  orderId: string,
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string | null;
  }>
) {
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, price: true },
  });
  const priceMap = Object.fromEntries(menuItems.map((mi) => [mi.id, mi.price]));

  return prisma.$transaction(async (tx) => {
    // Create new items
    await tx.orderItem.createMany({
      data: items.map((item) => ({
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: priceMap[item.menuItemId] ?? 0,
        specialInstructions: item.specialInstructions,
      })),
    });

    // Recalculate totals
    const allItems = await tx.orderItem.findMany({
      where: { orderId, status: { not: "CANCELLED" } },
    });
    const subtotal = allItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const tax = Math.round(subtotal * 0.085 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return tx.order.update({
      where: { id: orderId },
      data: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax,
        total,
      },
      include: {
        table: true,
        server: { select: { id: true, name: true } },
        items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
      },
    });
  });
}

// ─── Send to Kitchen ────────────────────────────────

export async function sendToKitchen(orderId: string) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // Update all PENDING items to PREPARING
    await tx.orderItem.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "PREPARING", sentToKitchenAt: now },
    });

    // Update order status
    return tx.order.update({
      where: { id: orderId },
      data: { status: "PREPARING" },
      include: {
        table: true,
        server: { select: { id: true, name: true } },
        items: { include: { menuItem: true }, orderBy: { createdAt: "asc" } },
      },
    });
  });
}

// ─── Update Order Item Status ───────────────────────

export async function updateOrderItemStatus(
  itemId: string,
  status: OrderItemStatus
) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = { status };
    if (status === "READY") updateData.readyAt = now;
    if (status === "PREPARING") updateData.sentToKitchenAt = now;

    const item = await tx.orderItem.update({
      where: { id: itemId },
      data: updateData,
      include: { order: true },
    });

    // Check if all items in the order are READY
    const orderItems = await tx.orderItem.findMany({
      where: { orderId: item.orderId, status: { not: "CANCELLED" } },
    });

    const allReady = orderItems.every((oi) => oi.status === "READY" || oi.status === "SERVED");

    if (allReady && orderItems.length > 0) {
      await tx.order.update({
        where: { id: item.orderId },
        data: { status: "READY" },
      });
    }

    return item;
  });
}

// ─── Close Order ────────────────────────────────────

export async function closeOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: "CLOSED", closedAt: new Date() },
      include: { table: true },
    });

    // Check if table has any other active orders
    const activeOrders = await tx.order.count({
      where: {
        tableId: order.tableId,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
    });

    if (activeOrders === 0) {
      await tx.table.update({
        where: { id: order.tableId },
        data: { status: "CLEANING" },
      });
    }

    return order;
  });
}

// ─── Cancel Order ───────────────────────────────────

export async function cancelOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    // Cancel all non-served items
    await tx.orderItem.updateMany({
      where: { orderId, status: { notIn: ["SERVED", "CANCELLED"] } },
      data: { status: "CANCELLED" },
    });

    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
      include: { table: true },
    });

    // Free up table if no active orders
    const activeOrders = await tx.order.count({
      where: {
        tableId: order.tableId,
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
    });

    if (activeOrders === 0) {
      await tx.table.update({
        where: { id: order.tableId },
        data: { status: "AVAILABLE" },
      });
    }

    return order;
  });
}

// ─── Get Order Bill ─────────────────────────────────

export async function getOrderBill(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { status: { not: "CANCELLED" } },
        include: { menuItem: { select: { name: true } } },
      },
      payments: true,
    },
  });

  if (!order) return null;

  const subtotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const tax = Math.round(subtotal * 0.085 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTip = order.payments.reduce((sum, p) => sum + p.tip, 0);
  const remaining = Math.round((total - totalPaid) * 100) / 100;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    items: order.items.map((i) => ({
      name: i.menuItem.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
    })),
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: 0.085,
    tax,
    total,
    payments: order.payments,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalTip: Math.round(totalTip * 100) / 100,
    remaining: remaining > 0 ? remaining : 0,
    isFullyPaid: remaining <= 0,
  };
}
