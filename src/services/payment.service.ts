import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@generated/prisma";

export async function addPayment(data: {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  tip?: number;
  reference?: string | null;
}) {
  return prisma.payment.create({
    data: {
      orderId: data.orderId,
      method: data.method,
      amount: data.amount,
      tip: data.tip ?? 0,
      reference: data.reference,
    },
  });
}

export async function listPayments(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { paidAt: "desc" },
  });
}

export async function getPaymentSummary(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) return null;

  const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTip = order.payments.reduce((sum, p) => sum + p.tip, 0);
  const remaining = Math.round((order.total - totalPaid) * 100) / 100;

  return {
    orderId: order.id,
    orderTotal: order.total,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalTip: Math.round(totalTip * 100) / 100,
    remaining: remaining > 0 ? remaining : 0,
    isFullyPaid: remaining <= 0,
    paymentCount: order.payments.length,
  };
}
