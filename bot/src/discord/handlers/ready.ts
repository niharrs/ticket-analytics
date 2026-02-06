import { Client } from "discord.js";
import { config } from "../../config.js";

export function handleReady(client: Client): void {
  client.on("ready", () => {
    console.log(`Bot logged in as ${client.user?.tag}`);

    const channel = client.channels.cache.get(config.discord.channelId);
    if (channel) {
      console.log(`Watching channel: #${("name" in channel ? channel.name : config.discord.channelId)}`);
    } else {
      console.warn(`Channel ${config.discord.channelId} not found in cache — will listen for messages anyway`);
    }
  });
}
