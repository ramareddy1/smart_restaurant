import { NextRequest, NextResponse } from "next/server";
import {
  getIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/services/ingredient.service";
import { updateIngredientSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ingredient = await getIngredient(id);
    if (!ingredient) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("Failed to fetch ingredient:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredient" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateIngredientSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.category !== undefined)
      updateData.category = validated.category;
    if (validated.unit !== undefined) updateData.unit = validated.unit;
    if (validated.currentStock !== undefined)
      updateData.currentStock = validated.currentStock;
    if (validated.parLevel !== undefined)
      updateData.parLevel = validated.parLevel;
    if (validated.costPerUnit !== undefined)
      updateData.costPerUnit = validated.costPerUnit;
    if (validated.expirationDate !== undefined)
      updateData.expirationDate = validated.expirationDate
        ? new Date(validated.expirationDate)
        : null;
    if (validated.supplierId !== undefined)
      updateData.supplierId = validated.supplierId;

    const ingredient = await updateIngredient(id, updateData);
    return NextResponse.json(ingredient);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update ingredient:", error);
    return NextResponse.json(
      { error: "Failed to update ingredient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteIngredient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete ingredient:", error);
    return NextResponse.json(
      { error: "Failed to delete ingredient" },
      { status: 500 }
    );
  }
}
