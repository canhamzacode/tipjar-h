import cron from "node-cron";
import { logger } from "../services";
import { BOT_USERNAME } from "../utils/twitter";
import { pollMentions } from "./pool";

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "*/15 * * * *"; // every 15 min

logger.info(
  `Starting Twitter bot for @${BOT_USERNAME} with schedule: ${CRON_SCHEDULE}`,
);

const job = cron.schedule(
  CRON_SCHEDULE,
  async () => {
    try {
      logger.debug("Polling mentions...");
      await pollMentions();
      logger.debug("Poll complete.");
    } catch (error) {
      logger.error(
        "Polling failed",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  },
  {
    scheduled: true,
    timezone: process.env.TZ || "UTC",
  },
);

// Graceful shutdown (only when running standalone)
// Check if this file is being run directly vs imported
const isMainModule =
  process.argv[1]?.endsWith("bot.ts") || process.argv[1]?.endsWith("bot.js");

if (isMainModule) {
  process.on("SIGINT", () => {
    logger.info("Shutting down Twitter bot...");
    job.stop();
    process.exit(0);
  });
}

logger.info("Cron job started successfully.");
