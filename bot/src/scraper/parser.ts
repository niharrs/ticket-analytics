import * as cheerio from "cheerio";

export interface ParsedTranscript {
  rawText: string;
  messageCount: number;
  participantCount: number;
  openedAt: string | null;
  closedAt: string | null;
}

/**
 * Parse a Ticket Tool (or similar) transcript HTML into structured data.
 * Handles common transcript HTML formats.
 */
export function parseTranscriptHtml(html: string): ParsedTranscript {
  const $ = cheerio.load(html);

  // Remove script/style tags
  $("script, style, noscript").remove();

  // Try to extract messages from common transcript formats
  const messages: { author: string; content: string; timestamp: string }[] = [];
  const participants = new Set<string>();

  // Format 1: Ticket Tool uses .chatlog__message-group or similar
  $(".chatlog__message-group, .message-group, .message, .chat-message").each((_, el) => {
    const $el = $(el);
    const author =
      $el.find(".chatlog__author-name, .author-name, .username, .message-author").first().text().trim() ||
      $el.attr("data-author") ||
      "";
    const content =
      $el.find(".chatlog__content, .message-content, .content, .message-text").first().text().trim() ||
      $el.find(".chatlog__markdown, .markdown").first().text().trim() ||
      "";
    const timestamp =
      $el.find(".chatlog__timestamp, .timestamp, .message-timestamp").first().text().trim() ||
      $el.attr("data-timestamp") ||
      "";

    if (author) participants.add(author);
    if (content) {
      messages.push({ author, content, timestamp });
    }
  });

  // Fallback: If no structured messages found, extract all visible text
  let rawText: string;
  if (messages.length > 0) {
    rawText = messages
      .map((m) => `${m.author}${m.timestamp ? ` [${m.timestamp}]` : ""}: ${m.content}`)
      .join("\n");
  } else {
    // Fallback: just get all text content
    rawText = $("body").text().replace(/\s+/g, " ").trim();

    // Try to count participants from any username-like elements
    $("[class*='author'], [class*='user'], [class*='name']").each((_, el) => {
      const name = $(el).text().trim();
      if (name && name.length < 50) participants.add(name);
    });
  }

  // Extract timestamps for opened/closed
  const timestamps = extractTimestamps($);

  return {
    rawText: rawText.slice(0, 50_000), // Cap at 50k chars
    messageCount: messages.length || estimateMessageCount(rawText),
    participantCount: Math.max(participants.size, 1),
    openedAt: timestamps.first,
    closedAt: timestamps.last,
  };
}

function extractTimestamps($: cheerio.CheerioAPI): { first: string | null; last: string | null } {
  const timestamps: string[] = [];

  $(".chatlog__timestamp, .timestamp, [class*='timestamp'], time").each((_, el) => {
    const text = $(el).text().trim();
    const datetime = $(el).attr("datetime");
    if (datetime) {
      timestamps.push(datetime);
    } else if (text) {
      timestamps.push(text);
    }
  });

  if (timestamps.length === 0) return { first: null, last: null };

  // Try to parse dates
  const parsed = timestamps
    .map((t) => {
      const d = new Date(t);
      return isNaN(d.getTime()) ? null : d.toISOString();
    })
    .filter(Boolean) as string[];

  return {
    first: parsed[0] || null,
    last: parsed.length > 1 ? parsed[parsed.length - 1] : null,
  };
}

function estimateMessageCount(text: string): number {
  // Rough estimate based on line breaks or sentence boundaries
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0);
  return Math.max(lines.length, 1);
}
