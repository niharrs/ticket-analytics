import { createServerClient } from "../supabase/server";
import type { AiAnalysis } from "../ai/categorize";
import type { ParsedTranscript } from "../scraper/parser";

export async function getExistingCategories() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description")
    .order("name");
  if (error) throw error;
  return data;
}

export async function ticketExists(discordMessageId: string): Promise<boolean> {
  const supabase = createServerClient();
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
  discordPostedAt: string;
}) {
  const supabase = createServerClient();
  const { discordMessageId, transcriptUrl, parsed, analysis, discordPostedAt } = params;

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
        discord_posted_at: discordPostedAt,
        processed_at: new Date().toISOString(),
      },
      { onConflict: "discord_message_id" }
    )
    .select("id")
    .single();

  if (ticketError) throw ticketError;
  const ticketId = ticket.id;

  // Handle new category
  if (analysis.newCategory) {
    await supabase
      .from("categories")
      .upsert(
        { name: analysis.newCategory.name, description: analysis.newCategory.description, auto_created: true },
        { onConflict: "name" }
      );
  }

  // Link categories
  const categories = await getExistingCategories();
  const categoryIds = analysis.categories
    .map((name) => categories.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id)
    .filter(Boolean) as string[];

  if (categoryIds.length > 0) {
    await supabase.from("ticket_categories").delete().eq("ticket_id", ticketId);
    await supabase
      .from("ticket_categories")
      .insert(categoryIds.map((cid) => ({ ticket_id: ticketId, category_id: cid })));
  }

  // Insert insights
  if (analysis.insights.length > 0) {
    await supabase.from("insights").delete().eq("ticket_id", ticketId);
    await supabase.from("insights").insert(
      analysis.insights.map((i) => ({
        ticket_id: ticketId,
        insight_text: i.text,
        insight_type: i.type,
      }))
    );
  }

  return ticketId;
}
