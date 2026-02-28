import { prisma } from "@/lib/db";

export async function listAlerts(params: {
  type?: string;
  severity?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { type, severity, unreadOnly, page = 1, pageSize = 50 } = params;

  const where: Record<string, unknown> = { isDismissed: false };
  if (type) where.type = type;
  if (severity) where.severity = severity;
  if (unreadOnly) where.isRead = false;

  const [items, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: { ingredient: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.alert.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function markAlertRead(id: string) {
  return prisma.alert.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAlertDismissed(id: string) {
  return prisma.alert.update({
    where: { id },
    data: { isDismissed: true },
  });
}

export async function getUnreadCount() {
  return prisma.alert.count({ where: { isRead: false, isDismissed: false } });
}
