import { NextRequest, NextResponse } from "next/server";
import { markAlertRead, markAlertDismissed } from "@/services/alert.service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.isRead) {
      await markAlertRead(id);
    }
    if (body.isDismissed) {
      await markAlertDismissed(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
