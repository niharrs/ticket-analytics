import { supabase } from "./supabase.js";
import type { AiAnalysis } from "../ai/categorize.js";
import type { ParsedTranscript } from "../scraper/parser.js";

export async function getExistingCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description")
    .order("name");
  if (error) throw error;
  return data;
}

export async function ticketExists(discordMessageId: string): Promise<boolean> {
  const { data } = await supabase
    .from("tickets")
    .select("id")
    .eq("discord_message_id", discordMessageId)
    .maybeSingle();
  return !!data;
}

export async function upsertTicket(params: {
  discordMessageId: string;
  transcriptUrl: string | null;
  parsed: ParsedTranscript;
  analysis: AiAnalysis;
  discordPostedAt: Date;
}) {
  const { discordMessageId, transcriptUrl, parsed, analysis, discordPostedAt } = params;

  // 1. Insert/update the ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .upsert(
      {
        discord_message_id: discordMessageId,
        transcript_url: transcriptUrl,
        transcript_raw_text: parsed.rawText,
        summary: analysis.summary,
        severity: analysis.severity,
        resolved: analysis.resolved,
        sentiment: analysis.sentiment,
        participant_count: parsed.participantCount,
        message_count: parsed.messageCount,
        ticket_opened_at: parsed.openedAt,
        ticket_closed_at: parsed.closedAt,
        discord_posted_at: discordPostedAt.toISOString(),
        processed_at: new Date().toISOString(),
      },
      { onConflict: "discord_message_id" }
    )
    .select("id")
    .single();

  if (ticketError) throw ticketError;
  const ticketId = ticket.id;

  // 2. Handle new category if suggested
  if (analysis.newCategory) {
    const { error: catError } = await supabase
      .from("categories")
      .upsert(
        {
          name: analysis.newCategory.name,
          description: analysis.newCategory.description,
          auto_created: true,
        },
        { onConflict: "name" }
      );
    if (catError) console.warn("Failed to create new category:", catError.message);
  }

  // 3. Link categories
  const categories = await getExistingCategories();
  const categoryIds = analysis.categories
    .map((name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
    .filter(Boolean) as string[];

  if (categoryIds.length > 0) {
    // Clear existing links and re-insert
    await supabase.from("ticket_categories").delete().eq("ticket_id", ticketId);
    const { error: linkError } = await supabase
      .from("ticket_categories")
      .insert(categoryIds.map((cid) => ({ ticket_id: ticketId, category_id: cid })));
    if (linkError) console.warn("Failed to link categories:", linkError.message);
  }

  // 4. Insert insights
  if (analysis.insights.length > 0) {
    // Clear existing insights for this ticket and re-insert
    await supabase.from("insights").delete().eq("ticket_id", ticketId);
    const { error: insightError } = await supabase.from("insights").insert(
      analysis.insights.map((i) => ({
        ticket_id: ticketId,
        insight_text: i.text,
        insight_type: i.type,
      }))
    );
    if (insightError) console.warn("Failed to insert insights:", insightError.message);
  }

  return ticketId;
}
