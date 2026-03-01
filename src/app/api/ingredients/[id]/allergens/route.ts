import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  getIngredientAllergens,
  setIngredientAllergens,
} from "@/services/allergen.service";
import { updateIngredientAllergensSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "HEAD_CHEF", "KITCHEN_MANAGER");
    const { id } = await params;
    const allergens = await getIngredientAllergens(id);
    return NextResponse.json(allergens);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch ingredient allergens:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredient allergens" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const { id } = await params;
    const body = await request.json();
    const { allergenIds } = updateIngredientAllergensSchema.parse(body);
    const allergens = await setIngredientAllergens(id, allergenIds);
    return NextResponse.json(allergens);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to update ingredient allergens:", error);
    return NextResponse.json(
      { error: "Failed to update ingredient allergens" },
      { status: 500 }
    );
  }
}
