import { analyzeWithLLM } from "./llm-client";
import { RESTAURANT_ANALYST_SYSTEM_PROMPT } from "./prompts";
import { buildAnalysisContext } from "./data-summarizer";
import { prisma } from "@/lib/db";

export async function runFullAnalysis(): Promise<string> {
  const context = await buildAnalysisContext();

  const analysis = await analyzeWithLLM(
    RESTAURANT_ANALYST_SYSTEM_PROMPT,
    `Please analyze the following restaurant operations data and provide actionable recommendations:\n\n${context}`
  );

  // Store as AI_RECOMMENDATION alert
  await prisma.alert.create({
    data: {
      type: "AI_RECOMMENDATION",
      severity: "INFO",
      title: "AI Analysis Report",
      message: analysis,
      isRead: false,
      isDismissed: false,
    },
  });

  return analysis;
}
