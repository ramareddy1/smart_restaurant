import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// GET — usage velocity per ingredient (average usage per day over a given period)
export async function GET(request: NextRequest) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER", "HEAD_CHEF");
    const { searchParams } = new URL(request.url);

    const days = Number(searchParams.get("days") ?? 30);
    const since = new Date(Date.now() - days * 86400000);

    // Get all USAGE transactions in the period
    const usageTransactions = await prisma.transaction.findMany({
      where: {
        type: "USAGE",
        createdAt: { gte: since },
      },
      select: {
        ingredientId: true,
        quantity: true,
      },
    });

    // Aggregate usage per ingredient
    const usageMap: Record<string, number> = {};
    for (const t of usageTransactions) {
      usageMap[t.ingredientId] = (usageMap[t.ingredientId] ?? 0) + t.quantity;
    }

    // Get ingredient details
    const ingredients = await prisma.ingredient.findMany({
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

    const velocity = ingredients.map((ing) => {
      const totalUsage = usageMap[ing.id] ?? 0;
      const usagePerDay = totalUsage / days;
      const daysOfStockLeft = usagePerDay > 0 ? ing.currentStock / usagePerDay : null;

      return {
        ingredientId: ing.id,
        name: ing.name,
        unit: ing.unit,
        currentStock: ing.currentStock,
        parLevel: ing.parLevel,
        costPerUnit: ing.costPerUnit,
        supplierId: ing.supplierId,
        supplierName: ing.supplier?.name ?? null,
        totalUsage: Math.round(totalUsage * 100) / 100,
        usagePerDay: Math.round(usagePerDay * 100) / 100,
        daysOfStockLeft: daysOfStockLeft !== null ? Math.round(daysOfStockLeft * 10) / 10 : null,
        periodDays: days,
      };
    });

    // Sort by usage per day (highest first)
    velocity.sort((a, b) => b.usagePerDay - a.usagePerDay);

    return NextResponse.json({ items: velocity });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch usage velocity:", error);
    return NextResponse.json({ error: "Failed to fetch usage velocity" }, { status: 500 });
  }
}
