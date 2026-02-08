export interface ParsedTranscript {
  rawText: string;
  messageCount: number;
  participantCount: number;
  authorMessageCounts: Record<string, number>;
  openedAt: string | null;
  closedAt: string | null;
}

interface TicketToolMessage {
  content: string;
  user_id: string;
  username: string;
  nick?: string;
  bot?: boolean;
  created: number;
  edited?: number | null;
  attachments?: unknown[];
}

/**
 * Parse a Ticket Tool transcript HTML file.
 * The HTML contains base64-encoded JSON data (not rendered HTML).
 */
export function parseTranscriptHtml(html: string): ParsedTranscript {
  // Extract the base64 messages variable from the script
  const messagesMatch = html.match(/let\s+messages\s*=\s*"([^"]+)"/);
  if (messagesMatch) {
    return parseTicketToolFormat(messagesMatch[1]);
  }

  // Fallback: try plain text extraction
  return fallbackParse(html);
}

function parseTicketToolFormat(base64Data: string): ParsedTranscript {
  const json = Buffer.from(base64Data, "base64").toString("utf-8");
  const messages: TicketToolMessage[] = JSON.parse(json);

  const participants = new Set<string>();
  const authorMessageCounts: Record<string, number> = {};
  const textParts: string[] = [];
  const timestamps: number[] = [];

  for (const msg of messages) {
    const author = msg.nick || msg.username || "Unknown";
    participants.add(author);
    authorMessageCounts[author] = (authorMessageCounts[author] || 0) + 1;

    if (msg.content) {
      textParts.push(`${author}: ${msg.content}`);
    }

    if (msg.created) {
      timestamps.push(msg.created);
    }
  }

  timestamps.sort((a, b) => a - b);

  return {
    rawText: textParts.join("\n").slice(0, 50_000),
    messageCount: messages.length,
    participantCount: participants.size,
    authorMessageCounts,
    openedAt: timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : null,
    closedAt: timestamps.length > 1 ? new Date(timestamps[timestamps.length - 1]).toISOString() : null,
  };
}

function fallbackParse(html: string): ParsedTranscript {
  // Strip HTML tags and get text
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0);

  return {
    rawText: text.slice(0, 50_000),
    messageCount: Math.max(lines.length, 1),
    participantCount: 1,
    authorMessageCounts: {},
    openedAt: null,
    closedAt: null,
  };
}
