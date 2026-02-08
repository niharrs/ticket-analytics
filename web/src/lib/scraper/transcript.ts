const URL_REGEX = /https?:\/\/[^\s<>]+/g;

export interface TranscriptSource {
  url: string;
  html: string;
}

interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  content_type?: string;
}

interface DiscordMessage {
  id: string;
  content: string;
  attachments: DiscordAttachment[];
  embeds: { url?: string }[];
  timestamp: string;
  author: { id: string; username: string; bot?: boolean };
}

/**
 * Extract and fetch transcript HTML from a Discord REST API message object.
 */
export async function fetchTranscript(message: DiscordMessage): Promise<TranscriptSource | null> {
  // 1. Check for HTML file attachments
  const htmlAttachment = message.attachments.find(
    (a) => a.filename?.endsWith(".html") || a.content_type?.includes("text/html")
  );

  if (htmlAttachment) {
    const html = await fetchWithRetry(htmlAttachment.url);
    if (html) {
      return { url: htmlAttachment.url, html };
    }
  }

  // 2. Extract URLs from message content
  const urls = message.content.match(URL_REGEX) || [];
  for (const url of urls) {
    if (!looksLikeTranscript(url)) continue;
    const html = await fetchWithRetry(url);
    if (html && html.includes("<")) {
      return { url, html };
    }
  }

  // 3. Check embeds
  for (const embed of message.embeds) {
    if (embed.url && looksLikeTranscript(embed.url)) {
      const html = await fetchWithRetry(embed.url);
      if (html && html.includes("<")) {
        return { url: embed.url, html };
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
    } catch {
      // retry
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return null;
}
