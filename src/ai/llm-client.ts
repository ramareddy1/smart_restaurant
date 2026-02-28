import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/env";

let _anthropic: Anthropic | undefined;

function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: getAnthropicApiKey() });
  }
  return _anthropic;
}

export async function analyzeWithLLM(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "No analysis generated.";
}
