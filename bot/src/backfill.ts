import "dotenv/config";
import { config } from "./config.js";
import { createDiscordClient } from "./discord/client.js";
import { processTicket } from "./pipeline.js";
import {
  Client,
  TextChannel,
  Collection,
  Message,
  ChannelType,
} from "discord.js";

const BATCH_SIZE = 100;
const DELAY_BETWEEN_TICKETS_MS = 2000; // Rate limit protection

async function backfill(daysBack = 90) {
  const client = createDiscordClient();

  await new Promise<void>((resolve) => {
    client.once("ready", () => {
      console.log(`Bot ready as ${client.user?.tag}`);
      resolve();
    });
    client.login(config.discord.token);
  });

  const channel = await client.channels.fetch(config.discord.channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.error("Channel not found or not a text channel");
    process.exit(1);
  }

  const textChannel = channel as TextChannel;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  console.log(`Backfilling messages from #${textChannel.name} since ${cutoff.toISOString()}`);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let lastMessageId: string | undefined;
  let done = false;

  while (!done) {
    const options: { limit: number; before?: string } = { limit: BATCH_SIZE };
    if (lastMessageId) options.before = lastMessageId;

    const messages: Collection<string, Message> = await textChannel.messages.fetch(options);

    if (messages.size === 0) {
      done = true;
      break;
    }

    for (const [, message] of messages) {
      // Stop if we've gone past the cutoff
      if (message.createdAt < cutoff) {
        done = true;
        break;
      }

      lastMessageId = message.id;

      if (message.author.bot) continue;

      try {
        console.log(`\nProcessing message ${message.id} from ${message.createdAt.toISOString()}`);
        await processTicket(message);
        totalProcessed++;
      } catch (err) {
        console.error(`Error processing ${message.id}:`, err);
        totalErrors++;
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_TICKETS_MS));
    }

    console.log(`\nBatch complete. Processed: ${totalProcessed}, Errors: ${totalErrors}`);
  }

  console.log(`\nBackfill complete!`);
  console.log(`  Processed: ${totalProcessed}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log(`  Errors: ${totalErrors}`);

  client.destroy();
  process.exit(0);
}

// Parse CLI args for days
const days = parseInt(process.argv[2] || "90", 10);
backfill(days);
