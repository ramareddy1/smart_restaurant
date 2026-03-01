import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { computeRecipeCost } from "@/services/recipe.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "HEAD_CHEF", "KITCHEN_MANAGER");
    const { id } = await params;
    const cost = await computeRecipeCost(id);
    if (!cost) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(cost);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to compute recipe cost:", error);
    return NextResponse.json(
      { error: "Failed to compute recipe cost" },
      { status: 500 }
    );
  }
}
