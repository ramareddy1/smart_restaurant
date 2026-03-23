import { NextRequest, NextResponse } from "next/server";
import { updateOrderItemStatus } from "@/services/order.service";
import { requireUser, AuthError } from "@/lib/auth";
import { updateOrderItemStatusSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER", "HEAD_CHEF", "SERVER");
    const { id } = await params;
    const body = await request.json();
    const validated = updateOrderItemStatusSchema.parse(body);
    const item = await updateOrderItemStatus(id, validated.status);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to update item status:", error);
    return NextResponse.json({ error: "Failed to update item status" }, { status: 500 });
  }
}
