import { NextRequest, NextResponse } from "next/server";
import { addOrderItems } from "@/services/order.service";
import { requireUser, AuthError } from "@/lib/auth";
import { addOrderItemsSchema } from "@/lib/validators";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER", "SERVER");
    const { id } = await params;
    const body = await request.json();
    const validated = addOrderItemsSchema.parse(body);
    const order = await addOrderItems(id, validated.items);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to add order items:", error);
    return NextResponse.json({ error: "Failed to add order items" }, { status: 500 });
  }
}
