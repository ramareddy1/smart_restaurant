import { NextRequest, NextResponse } from "next/server";
import { listAlerts } from "@/services/alert.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listAlerts({
      type: searchParams.get("type") ?? undefined,
      severity: searchParams.get("severity") ?? undefined,
      unreadOnly: searchParams.get("unreadOnly") === "true",
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 50),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
