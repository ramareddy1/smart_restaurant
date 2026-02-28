import { NextResponse } from "next/server";
import { runRuleEngine } from "@/ai/rule-engine";

export async function POST() {
  try {
    const created = await runRuleEngine();
    return NextResponse.json({ created, message: `${created} new alerts generated` });
  } catch (error) {
    console.error("Rule engine failed:", error);
    return NextResponse.json(
      { error: "Failed to run rule checks" },
      { status: 500 }
    );
  }
}
