import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const params = request.nextUrl.searchParams;

  const category = params.get("category");
  const severity = params.get("severity");
  const resolved = params.get("resolved");
  const days = params.get("days");

  let query = supabase
    .from("tickets")
    .select("*, ticket_categories(category_id, categories(name))")
    .order("discord_posted_at", { ascending: false })
    .limit(100);

  if (severity) {
    query = query.eq("severity", severity);
  }

  if (resolved) {
    query = query.eq("resolved", resolved === "true");
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days, 10));
    query = query.gte("discord_posted_at", since.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to flatten categories
  let tickets = (data || []).map((t) => {
    const categories = (
      t.ticket_categories as { category_id: string; categories: { name: string } | null }[]
    )
      .map((tc) => tc.categories)
      .filter(Boolean);
    const { ticket_categories: _, ...rest } = t;
    return { ...rest, categories };
  });

  // Client-side category filter (since it's a join)
  if (category) {
    tickets = tickets.filter((t) =>
      t.categories.some(
        (c: { name: string } | null) => c?.name.toLowerCase() === category.toLowerCase()
      )
    );
  }

  return NextResponse.json({ tickets });
}
