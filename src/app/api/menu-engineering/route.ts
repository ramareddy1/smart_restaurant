import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMenuEngineeringData } from "@/services/menu-engineering.service";

export async function GET() {
  try {
    await requireUser("OWNER", "HEAD_CHEF");
    const data = await getMenuEngineeringData();
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch menu engineering data:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu engineering data" },
      { status: 500 }
    );
  }
}
