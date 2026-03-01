import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMenuItemAllergens } from "@/services/allergen.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const allergens = await getMenuItemAllergens(id);
    return NextResponse.json(allergens);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch menu item allergens:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item allergens" },
      { status: 500 }
    );
  }
}
