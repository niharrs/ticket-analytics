import Anthropic from "@anthropic-ai/sdk";
import { buildCategorizationPrompt } from "./prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface AiAnalysis {
  categories: string[];
  newCategory: { name: string; description: string } | null;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  sentiment: "positive" | "neutral" | "negative" | "frustrated";
  insights: { text: string; type: string }[];
}

export async function analyzeTranscript(
  transcript: string,
  existingCategories: { name: string; description: string | null }[]
): Promise<AiAnalysis> {
  const prompt = buildCategorizationPrompt(transcript, existingCategories);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    categories: parsed.categories || [],
    newCategory: parsed.new_category || null,
    summary: parsed.summary || "No summary available",
    severity: parsed.severity || "medium",
    resolved: parsed.resolved ?? false,
    sentiment: parsed.sentiment || "neutral",
    insights: (parsed.insights || []).map((i: { text: string; type: string }) => ({
      text: i.text,
      type: i.type || "general",
    })),
  };
}
