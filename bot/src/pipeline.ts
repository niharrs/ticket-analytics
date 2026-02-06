import { Message } from "discord.js";
import { fetchTranscript } from "./scraper/transcript.js";
import { parseTranscriptHtml } from "./scraper/parser.js";
import { analyzeTranscript } from "./ai/categorize.js";
import { getExistingCategories, ticketExists, upsertTicket } from "./db/queries.js";
import { syncTicketToSheet } from "./sheets/sync.js";

/**
 * Full processing pipeline for a single ticket message.
 */
export async function processTicket(message: Message): Promise<void> {
  const messageId = message.id;

  // Skip if already processed
  if (await ticketExists(messageId)) {
    console.log(`  Ticket ${messageId} already processed, skipping`);
    return;
  }

  // 1. Fetch transcript
  console.log(`  [1/4] Fetching transcript...`);
  const transcript = await fetchTranscript(message);
  if (!transcript) {
    console.log(`  No transcript found in message ${messageId}, skipping`);
    return;
  }

  // 2. Parse HTML
  console.log(`  [2/4] Parsing transcript HTML...`);
  const parsed = parseTranscriptHtml(transcript.html);
  console.log(`  Parsed: ${parsed.messageCount} messages, ${parsed.participantCount} participants`);

  // 3. AI analysis
  console.log(`  [3/4] Analyzing with Claude...`);
  const categories = await getExistingCategories();
  const analysis = await analyzeTranscript(parsed.rawText, categories);
  console.log(`  Categories: ${analysis.categories.join(", ")} | Severity: ${analysis.severity} | Resolved: ${analysis.resolved}`);

  // 4. Store in Supabase
  console.log(`  [4/4] Storing in database...`);
  const ticketId = await upsertTicket({
    discordMessageId: messageId,
    transcriptUrl: transcript.url,
    parsed,
    analysis,
    discordPostedAt: message.createdAt,
  });
  console.log(`  Stored ticket: ${ticketId}`);

  // 5. Sync to Google Sheet (non-blocking)
  syncTicketToSheet(ticketId).catch((err) =>
    console.error("Sheet sync error:", err)
  );

  console.log(`  Done processing ticket ${messageId}`);
}
