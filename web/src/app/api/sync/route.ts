import { NextResponse } from "next/server";
import { fetchChannelMessages } from "@/lib/discord";
import { fetchTranscript } from "@/lib/scraper/transcript";
import { parseTranscriptHtml } from "@/lib/scraper/parser";
import { analyzeTranscript } from "@/lib/ai/categorize";
import { getExistingCategories, ticketExists, upsertTicket } from "@/lib/db/queries";

export const maxDuration = 60;

/**
 * Parse the Discord message content to extract participant info.
 * Format: "39 - @Chief kETH - chiefketh.#0"
 * Returns array of { name, count } for each participant.
 */
function parseMessageParticipants(content: string): { name: string; count: number }[] {
  const lines = content.split("\n");
  const participants: { name: string; count: number }[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s*-\s*@(.+?)\s*-/);
    if (match) {
      participants.push({ name: match[2].trim(), count: parseInt(match[1], 10) });
    }
  }
  return participants;
}

export async function POST() {
  try {
    const messages = await fetchChannelMessages(50);
    let processed = 0;
    let skipped = 0;
    let noTranscript = 0;

    for (const message of messages) {
      if (await ticketExists(message.id)) { skipped++; continue; }

      // Parse participant info from the Discord message content
      const participants = parseMessageParticipants(message.content);
      const nonBotParticipants = participants.filter(
        (p) => !p.name.toLowerCase().includes("across support")
      );

      // Skip if the only participant is the support bot
      if (participants.length > 0 && nonBotParticipants.length === 0) {
        skipped++;
        continue;
      }

      // Fetch transcript
      const transcript = await fetchTranscript(message);
      if (!transcript) { noTranscript++; continue; }

      // Parse HTML
      const parsed = parseTranscriptHtml(transcript.html);

      // Override parser counts with Discord message data if available
      if (participants.length > 0) {
        parsed.participantCount = participants.length;
        parsed.messageCount = participants.reduce((sum, p) => sum + p.count, 0);
      }

      // AI analysis
      const categories = await getExistingCategories();
      const analysis = await analyzeTranscript(parsed.rawText, categories);

      // Store
      await upsertTicket({
        discordMessageId: message.id,
        transcriptUrl: transcript.url,
        parsed,
        analysis,
        discordPostedAt: message.timestamp,
      });

      processed++;
    }

    return NextResponse.json({ processed, skipped, noTranscript });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
