import { config } from "./config.js";
import { createDiscordClient } from "./discord/client.js";
import { handleReady } from "./discord/handlers/ready.js";
import { handleMessageCreate } from "./discord/handlers/messageCreate.js";
import { ensureSheetHeaders } from "./sheets/sync.js";

async function main() {
  console.log("Starting Ticket Analytics Bot...");

  // Initialize Google Sheet headers if configured
  await ensureSheetHeaders();

  // Create and configure Discord client
  const client = createDiscordClient();
  handleReady(client);
  handleMessageCreate(client);

  // Login
  await client.login(config.discord.token);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  process.exit(0);
});
