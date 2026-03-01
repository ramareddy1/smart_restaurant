import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listAllergens } from "@/services/allergen.service";

export async function GET() {
  try {
    await requireUser("OWNER", "HEAD_CHEF", "KITCHEN_MANAGER");
    const allergens = await listAllergens();
    return NextResponse.json(allergens);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { status: number; message: string };
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Failed to fetch allergens:", error);
    return NextResponse.json(
      { error: "Failed to fetch allergens" },
      { status: 500 }
    );
  }
}
