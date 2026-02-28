import { NextResponse } from "next/server";
import { runFullAnalysis } from "@/ai/analyze";

// Simple in-memory rate limiting for AI analysis (5-minute cooldown)
const AI_COOLDOWN_MS = 5 * 60 * 1000;
let lastAnalysisTime = 0;
let cachedAnalysis: string | null = null;

export async function POST() {
  try {
    const now = Date.now();
    const timeSinceLastRun = now - lastAnalysisTime;

    // Return cached result if within cooldown period
    if (timeSinceLastRun < AI_COOLDOWN_MS && cachedAnalysis) {
      const remainingSeconds = Math.ceil(
        (AI_COOLDOWN_MS - timeSinceLastRun) / 1000
      );
      return NextResponse.json({
        analysis: cachedAnalysis,
        cached: true,
        message: `Returning cached analysis. New analysis available in ${remainingSeconds}s.`,
      });
    }

    const analysis = await runFullAnalysis();

    // Cache the result
    lastAnalysisTime = Date.now();
    cachedAnalysis = analysis;

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI analysis failed:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
