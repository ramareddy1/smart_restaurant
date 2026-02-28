import { NextRequest, NextResponse } from "next/server";
import { listMenuItems, createMenuItem } from "@/services/menu-item.service";
import { createMenuItemSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listMenuItems({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createMenuItemSchema.parse(body);
    const item = await createMenuItem(validated);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
