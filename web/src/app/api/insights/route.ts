import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const params = request.nextUrl.searchParams;
  const type = params.get("type");

  let query = supabase
    .from("insights")
    .select("id, insight_text, insight_type, created_at, ticket_id, tickets(summary)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (type) {
    query = query.eq("insight_type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const insights = (data || []).map((i) => ({
    id: i.id,
    insight_text: i.insight_text,
    insight_type: i.insight_type,
    created_at: i.created_at,
    ticket_summary: (i.tickets as unknown as { summary: string } | null)?.summary || undefined,
  }));

  return NextResponse.json({ insights });
}
