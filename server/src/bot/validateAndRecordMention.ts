import { db } from "../db";
import { mentions } from "../db/schema";
import { eq } from "drizzle-orm";
import { validateTweet, logger } from "../services";
import { TweetV2 } from "twitter-api-v2";

export async function validateAndRecordMention(tweet: TweetV2) {
  const validation = validateTweet(tweet);
  if (!validation.success) {
    logger.error("Invalid tweet data", undefined, {
      tweetId: tweet.id,
      errors: validation.error.issues,
    });
    return null;
  }

  const validTweet = validation.data;

  const existing = await db.query.mentions.findFirst({
    where: eq(mentions.tweet_id, validTweet.id),
  });

  if (existing) {
    logger.debug("Mention already processed", { tweetId: validTweet.id });
    return null;
  }

  await db.insert(mentions).values({
    tweet_id: validTweet.id,
    author_username: validTweet.author_id,
    text: validTweet.text,
  });

  return validTweet;
}
