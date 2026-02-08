const DISCORD_API = "https://discord.com/api/v10";

interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  content_type?: string;
}

export interface DiscordMessage {
  id: string;
  content: string;
  attachments: DiscordAttachment[];
  embeds: { url?: string }[];
  timestamp: string;
  author: { id: string; username: string; bot?: boolean };
}

/**
 * Fetch recent messages from a Discord channel using the REST API.
 */
export async function fetchChannelMessages(
  limit = 50,
  before?: string
): Promise<DiscordMessage[]> {
  const token = process.env.DISCORD_TOKEN!;
  const channelId = process.env.TIX_TRANSCRIPTS_CHANNEL_ID!;

  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);

  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages?${params}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Discord API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
