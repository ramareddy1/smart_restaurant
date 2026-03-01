import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeWithLLM } from "@/ai/llm-client";
import { RECIPE_COST_OPTIMIZER_PROMPT } from "@/ai/prompts";
import { computeRecipeCost } from "@/services/recipe.service";
import { prisma } from "@/lib/db";

// Simple in-memory cache keyed by recipeId (10-minute cooldown)
const COOLDOWN_MS = 10 * 60 * 1000;
const cache = new Map<string, { time: number; result: string }>();

export async function POST(request: NextRequest) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");

    const body = await request.json();
    const recipeId = body.recipeId as string;

    if (!recipeId) {
      return NextResponse.json(
        { error: "recipeId is required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const cached = cache.get(recipeId);
    if (cached && now - cached.time < COOLDOWN_MS) {
      const remaining = Math.ceil(
        (COOLDOWN_MS - (now - cached.time)) / 1000
      );
      return NextResponse.json({
        analysis: cached.result,
        cached: true,
        message: `Returning cached analysis. New analysis available in ${remaining}s.`,
      });
    }

    const costData = await computeRecipeCost(recipeId);
    if (!costData) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Get menu item price if linked
    const menuItem = await prisma.menuItem.findFirst({
      where: { recipeId },
      select: { name: true, price: true },
    });

    // Build context
    let context = `=== RECIPE COST BREAKDOWN ===\n`;
    context += `Recipe: ${costData.recipeName}\n`;
    context += `Yield: ${costData.yieldQuantity} ${costData.yieldUnit}\n`;
    context += `Total recipe cost: $${costData.totalCost.toFixed(2)}\n`;
    context += `Cost per serving: $${costData.costPerServing.toFixed(2)}\n`;

    if (menuItem) {
      const foodCostPct =
        menuItem.price > 0
          ? (costData.costPerServing / menuItem.price) * 100
          : 0;
      context += `\nMenu item: ${menuItem.name}\n`;
      context += `Selling price: $${menuItem.price.toFixed(2)}\n`;
      context += `Food cost %: ${foodCostPct.toFixed(1)}%\n`;
      context += `Profit per serving: $${(menuItem.price - costData.costPerServing).toFixed(2)}\n`;
    }

    context += `\n--- Ingredient Breakdown ---\n`;
    context += `Format: Ingredient | Qty | Unit | Cost/Unit | Line Cost | % of Total\n\n`;

    for (const li of costData.lineItems) {
      const pctOfTotal =
        costData.totalCost > 0
          ? ((li.lineCost / costData.totalCost) * 100).toFixed(1)
          : "0";
      context += `- ${li.ingredientName}: ${li.quantity} ${li.unit} @ $${li.costPerUnit}/${li.unit} = $${li.lineCost.toFixed(2)} (${pctOfTotal}%)\n`;
    }

    const analysis = await analyzeWithLLM(
      RECIPE_COST_OPTIMIZER_PROMPT,
      `Please analyze the following recipe cost breakdown and suggest optimizations:\n\n${context}`
    );

    cache.set(recipeId, { time: Date.now(), result: analysis });

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("AI recipe cost optimizer failed:", error);
    return NextResponse.json(
      { error: "AI recipe cost optimizer failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
