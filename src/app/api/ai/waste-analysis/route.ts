import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { analyzeWithLLM } from "@/ai/llm-client";
import { WASTE_ANALYSIS_PROMPT } from "@/ai/prompts";

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
        message: `Returning cached analysis. New analysis available in ${remaining}s.`,
      });
    }

    const days = 30;
    const since = new Date(Date.now() - days * 86400000);

    // Get waste transactions with details
    const wasteTransactions = await prisma.transaction.findMany({
      where: { type: "WASTE", createdAt: { gte: since } },
      include: {
        ingredient: { select: { name: true, unit: true, costPerUnit: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (wasteTransactions.length === 0) {
      return NextResponse.json({
        analysis:
          "No waste transactions found in the last 30 days. Start logging waste with reason codes to get AI-powered waste pattern analysis and reduction recommendations.",
      });
    }

    // Build context
    let context = `=== WASTE TRANSACTIONS (last ${days} days) ===\n`;
    context += `Total waste events: ${wasteTransactions.length}\n\n`;

    // Summary by reason
    const byReason: Record<string, { count: number; cost: number; items: string[] }> = {};
    const byIngredient: Record<string, { count: number; cost: number; reasons: string[] }> = {};
    const byDay: Record<string, { count: number; cost: number }> = {};

    for (const tx of wasteTransactions) {
      const reason = tx.wasteReason ?? "OTHER";
      const cost = tx.totalCost ?? 0;
      const ingredientName = tx.ingredient.name;
      const dayKey = tx.createdAt.toISOString().split("T")[0];

      // By reason
      if (!byReason[reason]) byReason[reason] = { count: 0, cost: 0, items: [] };
      byReason[reason].count++;
      byReason[reason].cost += cost;
      if (!byReason[reason].items.includes(ingredientName)) {
        byReason[reason].items.push(ingredientName);
      }

      // By ingredient
      if (!byIngredient[ingredientName])
        byIngredient[ingredientName] = { count: 0, cost: 0, reasons: [] };
      byIngredient[ingredientName].count++;
      byIngredient[ingredientName].cost += cost;
      if (!byIngredient[ingredientName].reasons.includes(reason)) {
        byIngredient[ingredientName].reasons.push(reason);
      }

      // By day
      if (!byDay[dayKey]) byDay[dayKey] = { count: 0, cost: 0 };
      byDay[dayKey].count++;
      byDay[dayKey].cost += cost;
    }

    const totalWasteCost = wasteTransactions.reduce(
      (sum, tx) => sum + (tx.totalCost ?? 0),
      0
    );

    context += `Total waste cost: $${totalWasteCost.toFixed(2)}\n`;
    context += `Average per day: $${(totalWasteCost / days).toFixed(2)}\n\n`;

    context += `--- By Reason ---\n`;
    for (const [reason, data] of Object.entries(byReason).sort(
      (a, b) => b[1].cost - a[1].cost
    )) {
      context += `${reason}: ${data.count} events, $${data.cost.toFixed(2)} (${Math.round(
        (data.cost / totalWasteCost) * 100
      )}%)\n`;
      context += `  Items: ${data.items.join(", ")}\n`;
    }

    context += `\n--- Top Wasted Ingredients ---\n`;
    const sortedIngredients = Object.entries(byIngredient).sort(
      (a, b) => b[1].cost - a[1].cost
    );
    for (const [name, data] of sortedIngredients.slice(0, 15)) {
      context += `${name}: ${data.count} events, $${data.cost.toFixed(2)}, reasons: ${data.reasons.join(", ")}\n`;
    }

    context += `\n--- Daily Waste Pattern ---\n`;
    const sortedDays = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [day, data] of sortedDays) {
      const dayOfWeek = new Date(day).toLocaleDateString("en-US", { weekday: "short" });
      context += `${day} (${dayOfWeek}): ${data.count} events, $${data.cost.toFixed(2)}\n`;
    }

    // Recent waste detail (last 20 entries)
    context += `\n--- Recent Waste Detail (last 20) ---\n`;
    for (const tx of wasteTransactions.slice(0, 20)) {
      context += `${tx.createdAt.toISOString().split("T")[0]} | ${tx.ingredient.name} | ${tx.quantity} ${tx.ingredient.unit} | $${(tx.totalCost ?? 0).toFixed(2)} | ${tx.wasteReason ?? "OTHER"} | ${tx.notes ?? ""}\n`;
    }

    const analysis = await analyzeWithLLM(
      WASTE_ANALYSIS_PROMPT,
      `Please analyze the following waste data and provide actionable recommendations to reduce food waste:\n\n${context}`
    );

    lastRunTime = Date.now();
    cachedResult = analysis;

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("AI waste analysis failed:", error);
    return NextResponse.json(
      { error: "AI waste analysis failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
