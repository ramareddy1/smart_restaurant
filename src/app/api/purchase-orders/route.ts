import { NextRequest, NextResponse } from "next/server";
import {
  listPurchaseOrders,
  createPurchaseOrder,
  getLowStockIngredients,
} from "@/services/purchase-order.service";
import { requireUser } from "@/lib/auth";
import type { PurchaseOrderStatus } from "@generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser("OWNER", "KITCHEN_MANAGER");
    const { searchParams } = new URL(request.url);

    // Special endpoint: ?lowStock=true returns ingredients below par level
    if (searchParams.get("lowStock") === "true") {
      const supplierId = searchParams.get("supplierId") ?? undefined;
      const items = await getLowStockIngredients(supplierId);
      return NextResponse.json({ items });
    }

    const result = await listPurchaseOrders({
      supplierId: searchParams.get("supplierId") ?? undefined,
      status: (searchParams.get("status") as PurchaseOrderStatus) ?? undefined,
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 25),
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch purchase orders:", error);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser("OWNER", "KITCHEN_MANAGER");
    const body = await request.json();

    if (!body.supplierId || !body.items?.length) {
      return NextResponse.json(
        { error: "Supplier and at least one item are required" },
        { status: 400 }
      );
    }

    const po = await createPurchaseOrder({
      supplierId: body.supplierId,
      expectedDate: body.expectedDate,
      notes: body.notes,
      createdById: user.id,
      items: body.items,
    });

    return NextResponse.json(po, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to create purchase order:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
