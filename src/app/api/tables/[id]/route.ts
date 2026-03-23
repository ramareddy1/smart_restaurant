import { NextRequest, NextResponse } from "next/server";
import { getTable, updateTable, deleteTable } from "@/services/table.service";
import { requireUser, AuthError } from "@/lib/auth";
import { updateTableSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;
    const table = await getTable(id);
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    return NextResponse.json(table);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to fetch table:", error);
    return NextResponse.json({ error: "Failed to fetch table" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER", "SERVER");
    const { id } = await params;
    const body = await request.json();
    const validated = updateTableSchema.parse(body);
    const table = await updateTable(id, validated);
    return NextResponse.json(table);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to update table:", error);
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER");
    const { id } = await params;
    await deleteTable(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to delete table:", error);
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
