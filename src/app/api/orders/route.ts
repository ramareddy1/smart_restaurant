import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder } from "@/services/order.service";
import { requireUser, AuthError } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const result = await listOrders({
      status: searchParams.get("status") ?? undefined,
      tableId: searchParams.get("tableId") ?? undefined,
      serverId: searchParams.get("serverId") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser("OWNER", "SERVER");
    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    const order = await createOrder({
      ...validated,
      serverId: user.id,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
