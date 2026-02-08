import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const params = request.nextUrl.searchParams;
  const type = params.get("type");

  let query = supabase
    .from("insights")
    .select("id, insight_text, insight_type, created_at, ticket_id, tickets(summary, severity, resolved, transcript_url, discord_message_id, discord_posted_at, ticket_categories(category_id, categories(name)))")
    .order("created_at", { ascending: false })
    .limit(200);

  if (type) {
    query = query.eq("insight_type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const insights = (data || []).map((i) => {
    const ticket = i.tickets as unknown as {
      summary: string;
      severity: string;
      resolved: boolean;
      transcript_url: string;
      discord_message_id: string;
      discord_posted_at: string;
      ticket_categories: { category_id: string; categories: { name: string } | null }[];
    } | null;

    const categories = (ticket?.ticket_categories || [])
      .map((tc) => tc.categories?.name)
      .filter(Boolean) as string[];

    return {
      id: i.id,
      insight_text: i.insight_text,
      insight_type: i.insight_type,
      created_at: i.created_at,
      ticket: ticket ? {
        summary: ticket.summary,
        severity: ticket.severity,
        resolved: ticket.resolved,
        transcript_url: ticket.transcript_url,
        discord_message_id: ticket.discord_message_id,
        discord_posted_at: ticket.discord_posted_at,
        categories,
      } : undefined,
    };
  });

  return NextResponse.json({ insights });
}
