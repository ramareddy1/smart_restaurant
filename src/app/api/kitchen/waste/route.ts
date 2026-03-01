import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { WasteReason } from "@generated/prisma";

// GET — waste transactions with stats
export async function GET(request: NextRequest) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER", "HEAD_CHEF");
    const { searchParams } = new URL(request.url);

    const days = Number(searchParams.get("days") ?? 30);
    const since = new Date(Date.now() - days * 86400000);

    const wasteTransactions = await prisma.transaction.findMany({
      where: { type: "WASTE", createdAt: { gte: since } },
      include: {
        ingredient: { select: { id: true, name: true, unit: true, costPerUnit: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const totalWasteCost = wasteTransactions.reduce(
      (sum, t) => sum + (t.totalCost ?? t.quantity * (t.ingredient.costPerUnit ?? 0)),
      0
    );

    // Group by reason
    const byReason: Record<string, { count: number; cost: number }> = {};
    for (const t of wasteTransactions) {
      const reason = t.wasteReason ?? "UNSPECIFIED";
      if (!byReason[reason]) byReason[reason] = { count: 0, cost: 0 };
      byReason[reason].count++;
      byReason[reason].cost += t.totalCost ?? t.quantity * (t.ingredient.costPerUnit ?? 0);
    }

    // Group by day for charts
    const byDay: Record<string, number> = {};
    for (const t of wasteTransactions) {
      const day = t.createdAt.toISOString().split("T")[0];
      byDay[day] = (byDay[day] ?? 0) + (t.totalCost ?? t.quantity * (t.ingredient.costPerUnit ?? 0));
    }

    // Top wasted ingredients
    const byIngredient: Record<string, { name: string; count: number; cost: number }> = {};
    for (const t of wasteTransactions) {
      const key = t.ingredientId;
      if (!byIngredient[key]) byIngredient[key] = { name: t.ingredient.name, count: 0, cost: 0 };
      byIngredient[key].count++;
      byIngredient[key].cost += t.totalCost ?? t.quantity * (t.ingredient.costPerUnit ?? 0);
    }
    const topWasted = Object.entries(byIngredient)
      .sort(([, a], [, b]) => b.cost - a.cost)
      .slice(0, 10)
      .map(([id, data]) => ({ ingredientId: id, ...data }));

    return NextResponse.json({
      items: wasteTransactions,
      stats: {
        totalWasteCost: Math.round(totalWasteCost * 100) / 100,
        totalCount: wasteTransactions.length,
        byReason,
        byDay,
        topWasted,
        periodDays: days,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch waste data:", error);
    return NextResponse.json({ error: "Failed to fetch waste data" }, { status: 500 });
  }
}

// POST — record waste
export async function POST(request: NextRequest) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER", "HEAD_CHEF");
    const body = await request.json();

    if (!body.ingredientId || !body.quantity) {
      return NextResponse.json(
        { error: "Ingredient and quantity are required" },
        { status: 400 }
      );
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: body.ingredientId },
      select: { costPerUnit: true, currentStock: true },
    });

    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    const unitCost = body.unitCost ?? ingredient.costPerUnit;
    const totalCost = body.quantity * unitCost;

    const transaction = await prisma.transaction.create({
      data: {
        type: "WASTE",
        ingredientId: body.ingredientId,
        quantity: body.quantity,
        unitCost,
        totalCost,
        wasteReason: (body.wasteReason as WasteReason) ?? null,
        notes: body.notes ?? null,
      },
    });

    // Decrement stock
    await prisma.ingredient.update({
      where: { id: body.ingredientId },
      data: { currentStock: { decrement: body.quantity } },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to record waste:", error);
    return NextResponse.json({ error: "Failed to record waste" }, { status: 500 });
  }
}
