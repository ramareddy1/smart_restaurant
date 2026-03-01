import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeWithLLM } from "@/ai/llm-client";
import { MENU_ENGINEERING_PROMPT } from "@/ai/prompts";
import { getMenuEngineeringData } from "@/services/menu-engineering.service";

// Simple in-memory cache (10-minute cooldown)
const COOLDOWN_MS = 10 * 60 * 1000;
let lastRunTime = 0;
let cachedResult: string | null = null;

export async function POST() {
  try {
    await requireUser("OWNER", "HEAD_CHEF");

    const now = Date.now();
    if (now - lastRunTime < COOLDOWN_MS && cachedResult) {
      const remaining = Math.ceil(
        (COOLDOWN_MS - (now - lastRunTime)) / 1000
      );
      return NextResponse.json({
        analysis: cachedResult,
        cached: true,
        message: `Returning cached analysis. New analysis available in ${remaining}s.`,
      });
    }

    const data = await getMenuEngineeringData();

    if (data.length === 0) {
      return NextResponse.json({
        analysis:
          "No active menu items with recipes found. Add recipes to your menu items to get AI-powered menu engineering analysis.",
      });
    }

    // Build context
    let context = `=== MENU ENGINEERING DATA ===\n`;
    context += `Total active menu items with cost data: ${data.length}\n\n`;

    // Summary stats
    const avgFoodCost =
      data.reduce((sum, d) => sum + d.foodCostPct, 0) / data.length;
    const totalRevenuePotential = data.reduce((sum, d) => sum + d.price, 0);
    const totalCost = data.reduce((sum, d) => sum + d.recipeCost, 0);

    context += `Average food cost %: ${avgFoodCost.toFixed(1)}%\n`;
    context += `Total menu revenue potential (1 each): $${totalRevenuePotential.toFixed(2)}\n`;
    context += `Total recipe cost (1 each): $${totalCost.toFixed(2)}\n\n`;

    // Classification summary
    const byCat: Record<string, number> = {};
    for (const item of data) {
      byCat[item.classification] = (byCat[item.classification] ?? 0) + 1;
    }
    context += `Classification distribution:\n`;
    for (const [cat, count] of Object.entries(byCat)) {
      context += `  ${cat}: ${count} items\n`;
    }

    // Item details
    context += `\n--- Item Details ---\n`;
    context += `Format: Name | Price | Recipe Cost | Food Cost % | Profit Margin | Category | Classification\n\n`;

    for (const item of data) {
      context += `- ${item.name}: $${item.price.toFixed(2)} | cost=$${item.recipeCost.toFixed(2)} | food_cost=${item.foodCostPct}% | margin=$${item.profitMargin.toFixed(2)} | cat=${item.category ?? "none"} | [${item.classification}]\n`;
    }

    const analysis = await analyzeWithLLM(
      MENU_ENGINEERING_PROMPT,
      `Please analyze the following menu engineering data and provide recommendations:\n\n${context}`
    );

    lastRunTime = Date.now();
    cachedResult = analysis;

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("AI menu engineering analysis failed:", error);
    return NextResponse.json(
      { error: "AI menu engineering analysis failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
