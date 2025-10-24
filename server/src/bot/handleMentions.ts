import { TweetV2 } from "twitter-api-v2";
import { db } from "../db";
import { mentions } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../services";
import { validateAndRecordMention } from "./validateAndRecordMention";
import { processCommand } from "./processCommand";

export const handleMentions = async (tweet: TweetV2): Promise<void> => {
  try {
    const validTweet = await validateAndRecordMention(tweet);
    if (!validTweet) return;

    await processCommand(validTweet);

    await db
      .update(mentions)
      .set({ processed: 1 })
      .where(eq(mentions.tweet_id, validTweet.id));
  } catch (error) {
    logger.error("Failed to handle mention", error as Error, {
      tweetId: tweet.id,
      authorId: tweet.author_id,
    });
  }
};
