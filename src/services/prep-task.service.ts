import { prisma } from "@/lib/db";
import type { PrepTaskStatus } from "../../generated/prisma/client";

export async function listPrepTasks(params: {
  date?: string;
  status?: string;
  assignedToId?: string;
}) {
  const { date, status, assignedToId } = params;

  const where: Record<string, unknown> = {};

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.scheduledFor = { gte: start, lte: end };
  }

  if (status) {
    where.status = status as PrepTaskStatus;
  }

  if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  return prisma.prepTask.findMany({
    where,
    include: {
      recipe: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPrepTask(id: string) {
  return prisma.prepTask.findUnique({
    where: { id },
    include: {
      recipe: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function createPrepTask(data: {
  name: string;
  recipeId?: string | null;
  assignedToId?: string | null;
  scheduledFor: string;
  estimatedMin?: number | null;
  notes?: string | null;
}) {
  return prisma.prepTask.create({
    data: {
      name: data.name,
      recipeId: data.recipeId ?? null,
      assignedToId: data.assignedToId ?? null,
      scheduledFor: new Date(data.scheduledFor),
      estimatedMin: data.estimatedMin ?? null,
      notes: data.notes ?? null,
    },
    include: {
      recipe: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function updatePrepTask(
  id: string,
  data: {
    name?: string;
    recipeId?: string | null;
    assignedToId?: string | null;
    scheduledFor?: string;
    estimatedMin?: number | null;
    status?: string;
    notes?: string | null;
  }
) {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.recipeId !== undefined) updateData.recipeId = data.recipeId;
  if (data.assignedToId !== undefined)
    updateData.assignedToId = data.assignedToId;
  if (data.scheduledFor !== undefined)
    updateData.scheduledFor = new Date(data.scheduledFor);
  if (data.estimatedMin !== undefined)
    updateData.estimatedMin = data.estimatedMin;
  if (data.notes !== undefined) updateData.notes = data.notes;

  if (data.status !== undefined) {
    updateData.status = data.status as PrepTaskStatus;
    // Auto-set completedAt when marking as COMPLETED
    if (data.status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  return prisma.prepTask.update({
    where: { id },
    data: updateData,
    include: {
      recipe: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function deletePrepTask(id: string) {
  return prisma.prepTask.delete({ where: { id } });
}
