import { NextRequest, NextResponse } from "next/server";
import { updateTableStatus } from "@/services/table.service";
import { requireUser, AuthError } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireUser("OWNER", "KITCHEN_MANAGER", "SERVER", "HOST");
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const table = await updateTableStatus(id, status);
    return NextResponse.json(table);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update table status:", error);
    return NextResponse.json({ error: "Failed to update table status" }, { status: 500 });
  }
}
