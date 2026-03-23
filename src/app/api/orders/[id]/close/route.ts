import { NextRequest, NextResponse } from "next/server";
import { closeOrder } from "@/services/order.service";
import { requireUser, AuthError } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER", "SERVER");
    const { id } = await params;
    const order = await closeOrder(id);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to close order:", error);
    return NextResponse.json({ error: "Failed to close order" }, { status: 500 });
  }
}
