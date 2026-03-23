import { NextRequest, NextResponse } from "next/server";
import { getOrderBill } from "@/services/order.service";
import { requireUser, AuthError } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;
    const bill = await getOrderBill(id);
    if (!bill) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(bill);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to get bill:", error);
    return NextResponse.json({ error: "Failed to get bill" }, { status: 500 });
  }
}
