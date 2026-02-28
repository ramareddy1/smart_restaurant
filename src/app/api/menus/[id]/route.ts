import { NextRequest, NextResponse } from "next/server";
import { getMenu, updateMenu, deleteMenu } from "@/services/menu.service";
import { updateMenuSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menu = await getMenu(id);
    if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(menu);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateMenuSchema.parse(body);
    const menu = await updateMenu(id, validated);
    return NextResponse.json(menu);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteMenu(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 });
  }
}
