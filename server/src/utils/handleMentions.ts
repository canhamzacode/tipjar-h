import { TweetV2 } from "twitter-api-v2";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { mentions, transactions, users } from "../db/schema";
import { parseCommand } from "./parser";
import { rwClient } from "./twitter";

export const handleMentions = async (tweet: TweetV2) => {
  if (!tweet || !tweet.author_id) return;

  const existing = await db.query.mentions.findFirst({
    where: eq(mentions.tweet_id, tweet.id),
  });

  if (existing) return;

  await db.insert(mentions).values({
    tweet_id: tweet.id,
    author_username: tweet.author_id,
    text: tweet.text,
  });

  const command = parseCommand(tweet.text);

  if (command.type === "send" && command.recipient) {
    const sender = await db
      .insert(users)
      .values({ twitter_handle: tweet.author_id })
      .onConflictDoNothing()
      .returning();

    const recipient = await db
      .insert(users)
      .values({ twitter_handle: command.recipient })
      .onConflictDoNothing()
      .returning();

    await db.insert(transactions).values({
      sender_id: sender[0]?.id,
      receiver_id: recipient[0]?.id,
      amount: String(command.amount),
      token: command.currency!,
    });

    await rwClient.v2.reply(
      `✅ Transaction of ${command.amount} ${command.currency} from @${tweet.author_id} to @${command.recipient} recorded.`,
      tweet.id,
    );
  } else {
    await rwClient.v2.reply(
      `❌ Could not understand your command. Try: "send 5 HBAR @username"`,
      tweet.id,
    );
  }

  await db
    .update(mentions)
    .set({ processed: 1 })
    .where(eq(mentions.tweet_id, tweet.id));
};
