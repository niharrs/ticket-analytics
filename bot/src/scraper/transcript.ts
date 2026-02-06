import { Message, Attachment } from "discord.js";

const URL_REGEX = /https?:\/\/[^\s<>]+/g;

export interface TranscriptSource {
  url: string;
  html: string;
  source: "attachment" | "url";
}

/**
 * Extract transcript HTML from a Discord message.
 * Priority: 1) HTML attachment, 2) URL in message content
 */
export async function fetchTranscript(message: Message): Promise<TranscriptSource | null> {
  // 1. Check for HTML file attachments
  const htmlAttachment = message.attachments.find(
    (a: Attachment) => a.name?.endsWith(".html") || a.contentType?.includes("text/html")
  );

  if (htmlAttachment) {
    console.log(`  Found HTML attachment: ${htmlAttachment.name}`);
    const html = await fetchWithRetry(htmlAttachment.url);
    if (html) {
      return { url: htmlAttachment.url, html, source: "attachment" };
    }
  }

  // 2. Extract URLs from message content
  const urls = message.content.match(URL_REGEX) || [];
  for (const url of urls) {
    // Skip non-transcript URLs
    if (!looksLikeTranscript(url)) continue;

    console.log(`  Trying transcript URL: ${url}`);
    const html = await fetchWithRetry(url);
    if (html && html.includes("<")) {
      return { url, html, source: "url" };
    }
  }

  // 3. Check embeds for URLs
  for (const embed of message.embeds) {
    const embedUrl = embed.url;
    if (embedUrl && looksLikeTranscript(embedUrl)) {
      console.log(`  Trying embed URL: ${embedUrl}`);
      const html = await fetchWithRetry(embedUrl);
      if (html && html.includes("<")) {
        return { url: embedUrl, html, source: "url" };
      }
    }
  }

  return null;
}

function looksLikeTranscript(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("transcript") ||
    lower.includes("ticket") ||
    lower.endsWith(".html") ||
    lower.includes("tickettool") ||
    lower.includes("cdn.discordapp.com")
  );
}

async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (resp.ok) return await resp.text();
      console.warn(`  Fetch ${url} returned ${resp.status}`);
    } catch (err) {
      console.warn(`  Fetch attempt ${i + 1} failed for ${url}:`, (err as Error).message);
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return null;
}
