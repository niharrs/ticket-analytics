import { NextResponse } from "next/server";

// Backfill is handled by the sync endpoint now.
// Use POST /api/sync to pull latest tickets from Discord.
export async function POST() {
  return NextResponse.json({ message: "Use /api/sync instead" }, { status: 301 });
}
