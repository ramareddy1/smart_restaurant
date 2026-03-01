import { NextRequest, NextResponse } from "next/server";
import { createReceiving } from "@/services/receiving.service";
import { requireUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser("OWNER", "KITCHEN_MANAGER");
    const { id } = await params;
    const body = await request.json();

    if (!body.items?.length) {
      return NextResponse.json(
        { error: "At least one item must be received" },
        { status: 400 }
      );
    }

    const receiving = await createReceiving({
      purchaseOrderId: id,
      receivedById: user.id,
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json(receiving, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const status = error.message.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to create receiving:", error);
    return NextResponse.json({ error: "Failed to record receiving" }, { status: 500 });
  }
}
