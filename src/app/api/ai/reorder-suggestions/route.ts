import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { analyzeWithLLM } from "@/ai/llm-client";
import { REORDER_SUGGESTIONS_PROMPT } from "@/ai/prompts";

// Simple in-memory cache (10-minute cooldown)
const COOLDOWN_MS = 10 * 60 * 1000;
let lastRunTime = 0;
let cachedResult: string | null = null;

export async function POST() {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER");

    const now = Date.now();
    if (now - lastRunTime < COOLDOWN_MS && cachedResult) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastRunTime)) / 1000);
      return NextResponse.json({
        analysis: cachedResult,
        cached: true,
        message: `Returning cached suggestions. New analysis available in ${remaining}s.`,
      });
    }

    const days = 30;
    const since = new Date(Date.now() - days * 86400000);

    // Get usage transactions for velocity calculation
    const usageTransactions = await prisma.transaction.findMany({
      where: { type: "USAGE", createdAt: { gte: since } },
      select: { ingredientId: true, quantity: true },
    });

    const usageMap: Record<string, number> = {};
    for (const t of usageTransactions) {
      usageMap[t.ingredientId] = (usageMap[t.ingredientId] ?? 0) + t.quantity;
    }

    // Get all ingredients with supplier info
    const ingredients = await prisma.ingredient.findMany({
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    // Build context for AI
    let context = `=== INGREDIENT STOCK & USAGE VELOCITY (last ${days} days) ===\n`;
    context += `Format: Name | Current Stock | Par Level | Unit | Cost/Unit | Usage/Day | Days Left | Supplier\n\n`;

    for (const ing of ingredients) {
      const totalUsage = usageMap[ing.id] ?? 0;
      const usagePerDay = totalUsage / days;
      const daysLeft = usagePerDay > 0 ? ing.currentStock / usagePerDay : null;
      const status =
        ing.currentStock < ing.parLevel
          ? "⚠ BELOW PAR"
          : daysLeft !== null && daysLeft < 7
          ? "⚡ LOW DAYS"
          : "✓ OK";

      context += `- ${ing.name}: stock=${ing.currentStock} ${ing.unit}, par=${ing.parLevel}, `;
      context += `cost=$${ing.costPerUnit}/${ing.unit}, usage=${usagePerDay.toFixed(1)}/day, `;
      context += `daysLeft=${daysLeft !== null ? daysLeft.toFixed(1) : "∞"}, `;
      context += `supplier=${ing.supplier?.name ?? "none"} [${status}]\n`;
    }

    // Get pending POs to avoid double-ordering
    const pendingPOs = await prisma.purchaseOrder.findMany({
      where: { status: { in: ["DRAFT", "SUBMITTED"] } },
      include: {
        items: { include: { ingredient: { select: { name: true } } } },
        supplier: { select: { name: true } },
      },
    });

    if (pendingPOs.length > 0) {
      context += `\n=== PENDING PURCHASE ORDERS ===\n`;
      for (const po of pendingPOs) {
        context += `- ${po.orderNumber} (${po.status}) from ${po.supplier.name}:\n`;
        for (const item of po.items) {
          context += `  • ${item.ingredient.name}: ${item.quantityOrdered} units @ $${item.unitCost}\n`;
        }
      }
    }

    const analysis = await analyzeWithLLM(
      REORDER_SUGGESTIONS_PROMPT,
      `Please analyze the following inventory data and generate smart reorder suggestions:\n\n${context}`
    );

    lastRunTime = Date.now();
    cachedResult = analysis;

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("AI reorder suggestions failed:", error);
    return NextResponse.json(
      { error: "AI reorder suggestions failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
