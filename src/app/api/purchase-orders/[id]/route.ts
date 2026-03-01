import { NextRequest, NextResponse } from "next/server";
import {
  getPurchaseOrder,
  updatePurchaseOrder,
  submitPurchaseOrder,
  cancelPurchaseOrder,
} from "@/services/purchase-order.service";
import { requireUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER");
    const { id } = await params;
    const po = await getPurchaseOrder(id);

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json(po);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch purchase order:", error);
    return NextResponse.json({ error: "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER");
    const { id } = await params;
    const body = await request.json();

    // Handle status transitions via action field
    if (body.action === "submit") {
      const po = await submitPurchaseOrder(id);
      return NextResponse.json(po);
    }

    if (body.action === "cancel") {
      const po = await cancelPurchaseOrder(id);
      return NextResponse.json(po);
    }

    // Regular update (items, notes, etc.)
    const po = await updatePurchaseOrder(id, body);
    return NextResponse.json(po);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to update purchase order:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
