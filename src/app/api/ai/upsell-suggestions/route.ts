import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { analyzeWithLLM } from "@/ai/llm-client";
import { UPSELL_SUGGESTIONS_PROMPT } from "@/ai/prompts";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await requireUser("OWNER", "SERVER");

    const body = await request.json();
    const { orderItems, menuItems: providedMenu } = body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: "orderItems array is required" },
        { status: 400 }
      );
    }

    // Get all active menu items for context
    const allMenuItems =
      providedMenu ??
      (await prisma.menuItem.findMany({
        where: { isActive: true },
        select: { name: true, price: true, category: true, description: true },
      }));

    // Build the user message
    const currentItems = orderItems
      .map(
        (item: { name: string; quantity: number }) =>
          `- ${item.quantity}x ${item.name}`
      )
      .join("\n");

    const menuList = allMenuItems
      .map(
        (item: {
          name: string;
          price: number;
          category: string | null;
          description: string | null;
        }) =>
          `- ${item.name} ($${item.price.toFixed(2)}) [${item.category ?? "Uncategorized"}]${item.description ? ` — ${item.description}` : ""}`
      )
      .join("\n");

    const userMessage = `Current order items:\n${currentItems}\n\nAvailable menu items:\n${menuList}\n\nSuggest complementary additions for this order.`;

    const result = await analyzeWithLLM(UPSELL_SUGGESTIONS_PROMPT, userMessage);

    // Try to parse as JSON
    try {
      const suggestions = JSON.parse(result);
      return NextResponse.json({ suggestions });
    } catch {
      // If LLM didn't return valid JSON, return raw text
      return NextResponse.json({ suggestions: [], raw: result });
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("AI upsell suggestions failed:", error);
    return NextResponse.json(
      { error: "AI upsell suggestions failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
