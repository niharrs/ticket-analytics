import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // This endpoint is a placeholder for triggering backfill from the dashboard.
  // In practice, backfill is run via the bot CLI: `npm run backfill` in the bot/ directory.
  // A full implementation would use a job queue or call the bot's backfill endpoint.

  return NextResponse.json({
    message:
      "Backfill should be triggered via the bot CLI. Run: cd bot && npm run backfill [days]",
  });
}
