import { NextResponse } from "next/server";
import { getServerDashboard } from "@/services/server-dashboard.service";
import { requireUser, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const dashboard = await getServerDashboard();
    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to fetch server dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch server dashboard" }, { status: 500 });
  }
}
