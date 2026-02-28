import { NextResponse } from "next/server";
import { runFullAnalysis } from "@/ai/analyze";

export async function POST() {
  try {
    const analysis = await runFullAnalysis();
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI analysis failed:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
