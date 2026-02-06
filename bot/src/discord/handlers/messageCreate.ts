import { Client, Message } from "discord.js";
import { config } from "../../config.js";
import { processTicket } from "../../pipeline.js";

export function handleMessageCreate(client: Client): void {
  client.on("messageCreate", async (message: Message) => {
    // Only process messages in the target channel
    if (message.channelId !== config.discord.channelId) return;
    // Ignore bot messages
    if (message.author.bot) return;

    console.log(`New message in #tix-transcripts from ${message.author.tag}: ${message.id}`);

    try {
      await processTicket(message);
    } catch (err) {
      console.error(`Failed to process message ${message.id}:`, err);
    }
  });
}
