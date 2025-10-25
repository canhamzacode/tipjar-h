import { db } from "../db";
import { bot_state } from "../db/schema";
import { eq } from "drizzle-orm";
import { handleMentions } from "./handleMentions";
import { rwClient, BOT_USERNAME } from "../utils/twitter";
import { twitterRateLimiter } from "./rateLimiter";
import { logger } from "../services";

export { BOT_USERNAME };

export const pollMentions = async (): Promise<void> => {
  try {
    if (!(await twitterRateLimiter.checkLimit())) {
      logger.warn("Skipping poll due to rate limit");
      return;
    }

    logger.info("Starting mention polling");

    const me = await rwClient.v2.me();
    if (!me.data?.id) {
      throw new Error("Failed to get bot user information");
    }

    logger.info("Bot authenticated", {
      username: me.data.username,
      id: me.data.id,
    });

    const state = await db.query.bot_state.findFirst({
      where: eq(bot_state.id, "tipjarbot"),
    });

    const sinceId = state?.last_mention_id ?? undefined;
    logger.debug("Fetching mentions", { sinceId });

    const mentions = await rwClient.v2.userMentionTimeline(me.data.id, {
      since_id: sinceId,
      max_results: 10,
      "tweet.fields": ["author_id", "created_at", "public_metrics"],
    });

    if (!mentions.data.data?.length) {
      logger.info("No new mentions found");
      return;
    }

    logger.info("Found new mentions", {
      count: mentions.data.data.length,
      sinceId,
    });

    const processingPromises = mentions.data.data
      .reverse()
      .map(async (tweet, index) => {
        await new Promise((resolve) => setTimeout(resolve, index * 100));

        logger.debug("Processing mention", {
          tweetId: tweet.id,
          author: tweet.author_id,
          text: tweet.text?.substring(0, 100) + "...",
        });

        await handleMentions(tweet);
      });

    await Promise.allSettled(processingPromises);

    const latestId = mentions.data.data[0].id;
    await updateBotState(latestId);

    logger.info("Mention polling completed successfully", {
      processed: mentions.data.data.length,
      latestId,
    });
  } catch (error) {
    logger.error("Failed to poll mentions", error as Error, {
      rateLimiterStatus: twitterRateLimiter.getStatus(),
    });
  }
};

const updateBotState = async (latestId: string): Promise<void> => {
  try {
    await db
      .insert(bot_state)
      .values({
        id: "tipjarbot",
        last_mention_id: latestId,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: bot_state.id,
        set: {
          last_mention_id: latestId,
          updated_at: new Date(),
        },
      });

    logger.debug("Bot state updated", { latestId });
  } catch (error) {
    logger.error("Failed to update bot state", error as Error, { latestId });
    throw error;
  }
};
