import "dotenv/config";

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

export const config = {
  discord: {
    token: required("DISCORD_TOKEN"),
    guildId: required("DISCORD_GUILD_ID"),
    channelId: required("TIX_TRANSCRIPTS_CHANNEL_ID"),
  },
  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY"),
  },
  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  },
  google: {
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "",
    sheetId: process.env.GOOGLE_SHEET_ID || "",
  },
} as const;
