export function getDiscordMessageUrl(messageId: string): string | null {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
  const channelId = process.env.NEXT_PUBLIC_DISCORD_CHANNEL_ID;
  if (!guildId || !channelId) return null;
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
