import { eq } from "drizzle-orm";
import { db } from "../db";
import { transactions, users } from "../db/schema";
import { getCachedUser, cacheUser, logger } from "../services";
import { rwClient, DRY_RUN } from "./twitter";

async function getOrCreateUserSimple(twitterHandle: string) {
  let user = getCachedUser(twitterHandle);
  if (!user) {
    user = await db.query.users.findFirst({
      where: eq(users.twitter_handle, twitterHandle),
    });

    if (!user) {
      const newUser = await db
        .insert(users)
        .values({ twitter_handle: twitterHandle })
        .returning();
      user = newUser[0];
    }
    cacheUser(twitterHandle, user);
  }
  return user;
}

export async function handleTransactionCommand(validTweet: any, command: any) {
  try {
    const sender = await getOrCreateUserSimple(validTweet.author_id);
    const recipient = await getOrCreateUserSimple(command.recipient);

    if (!sender?.id || !recipient?.id) {
      throw new Error("Failed to create or retrieve user records");
    }

    await db.insert(transactions).values({
      sender_id: sender.id,
      receiver_id: recipient.id,
      amount: String(command.amount),
      token: command.currency!,
    });

    const reply = `✅ Transaction of ${command.amount} ${command.currency} from @${validTweet.author_id} to @${command.recipient} recorded.`;

    if (!DRY_RUN) {
      await rwClient.v2.reply(reply, validTweet.id);
    } else {
      logger.info("DRY RUN - Would send reply", { message: reply });
    }

    logger.info("Transaction processed successfully", {
      tweetId: validTweet.id,
      amount: command.amount,
      currency: command.currency,
      sender: validTweet.author_id,
      recipient: command.recipient,
    });
  } catch (error) {
    logger.error("Failed to process transaction", error as Error, {
      tweetId: validTweet.id,
    });

    const errReply = `❌ Failed to process transaction. Please try again later.`;
    if (!DRY_RUN) await rwClient.v2.reply(errReply, validTweet.id);
  }
}
