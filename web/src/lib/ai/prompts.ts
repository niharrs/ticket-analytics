export function buildCategorizationPrompt(
  transcript: string,
  existingCategories: { name: string; description: string | null }[]
): string {
  const categoryList = existingCategories
    .map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`)
    .join("\n");

  return `You are analyzing a support ticket transcript. Categorize it, summarize it, and extract insights.

## Existing Categories
${categoryList}

## Instructions
1. Assign 1-2 categories from the list above. If none fit well, suggest a NEW category name (keep it short, 2-4 words).
2. Write a 1-2 sentence summary of the issue.
3. Rate severity: low, medium, high, or critical.
4. Determine if the issue was resolved in the transcript.
5. Rate user sentiment: positive, neutral, negative, or frustrated.
6. Extract product insights (feature requests, pain points, UX issues, bug reports).

## Response Format
Respond with ONLY valid JSON, no markdown fences:
{
  "categories": ["Category Name 1", "Category Name 2"],
  "new_category": null,
  "summary": "Brief summary of the ticket",
  "severity": "low|medium|high|critical",
  "resolved": true|false,
  "sentiment": "positive|neutral|negative|frustrated",
  "insights": [
    {
      "text": "Description of the insight",
      "type": "feature_request|pain_point|ux_issue|bug_report|general"
    }
  ]
}

If suggesting a new category, set "new_category" to {"name": "Category Name", "description": "Brief description"} and include it in "categories" too.

## Transcript
${transcript.slice(0, 30_000)}`;
}
