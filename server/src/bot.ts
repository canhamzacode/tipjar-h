// Import bot functionality from bot/index.ts
// This file exists to make the import "./bot" work
// The bot/index.ts file has side effects (starts cron job) when imported

import "./bot/index";

// Export a default function for compatibility
export default function startBot() {
  console.log("Bot started via side-effect import");
}
