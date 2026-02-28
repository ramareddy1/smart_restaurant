import { NextRequest, NextResponse } from "next/server";
import { listIngredients, createIngredient } from "@/services/ingredient.service";
import { createIngredientSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listIngredients({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      lowStockOnly: searchParams.get("lowStock") === "true",
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch ingredients:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createIngredientSchema.parse(body);

    const ingredient = await createIngredient({
      name: validated.name,
      category: validated.category,
      unit: validated.unit,
      currentStock: validated.currentStock ?? 0,
      parLevel: validated.parLevel,
      costPerUnit: validated.costPerUnit,
      expirationDate: validated.expirationDate
        ? new Date(validated.expirationDate)
        : null,
      supplierId: validated.supplierId,
    });

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create ingredient:", error);
    return NextResponse.json(
      { error: "Failed to create ingredient" },
      { status: 500 }
    );
  }
}
