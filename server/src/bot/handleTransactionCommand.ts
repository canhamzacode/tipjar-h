import { eq } from "drizzle-orm";
import { db } from "../db";
import { pending_tips, transactions, users } from "../db/schema";
import {
  getCachedUser,
  cacheUser,
  logger,
  findUserByTwitterHandle,
} from "../services";
import { rwClient, DRY_RUN } from "../utils/twitter";

async function getOrCreateUserSimple(twitterHandle: string) {
  let user = getCachedUser(twitterHandle);
  if (!user) {
    user = await findUserByTwitterHandle(twitterHandle);

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
    // Sender must be authenticated (have twitter_id set)
    const sender = await findUserByTwitterHandle(validTweet.author_id);

    if (!sender || !sender.twitter_id || !sender.access_token) {
      const replyMessage = `❌ You must link your Twitter account first to send tips. Visit our app to authenticate: ${process.env.APP_URL || "https://tipjar.app"}/auth`;

      if (!DRY_RUN) {
        await rwClient.v2.reply(replyMessage, validTweet.id);
      } else {
        logger.info("DRY RUN - Would send authentication required reply", {
          message: replyMessage,
        });
      }

      logger.warn("Transaction attempted by unauthenticated user", {
        tweetId: validTweet.id,
        authorId: validTweet.author_id,
      });
      return;
    }

    // Check if recipient exists
    let recipient = await findUserByTwitterHandle(command.recipient);

    if (!recipient) {
      // Recipient not registered - create pending tip
      logger.info("Recipient not registered, creating pending tip", {
        recipient: command.recipient,
        amount: command.amount,
        currency: command.currency,
      });

      await db.insert(pending_tips).values({
        sender_id: sender.id,
        receiver_twitter: command.recipient,
        amount: String(command.amount),
        token: command.currency!,
      });

      const pendingReply = `✅ Tip of ${command.amount} ${command.currency} to @${command.recipient} saved! They'll receive it when they link their account.`;

      if (!DRY_RUN) {
        await rwClient.v2.reply(pendingReply, validTweet.id);
      } else {
        logger.info("DRY RUN - Would send pending tip reply", {
          message: pendingReply,
        });
      }

      logger.info("Pending tip created", {
        tweetId: validTweet.id,
        sender: sender.twitter_handle,
        recipient: command.recipient,
        amount: command.amount,
        currency: command.currency,
      });
      return;
    }

    // Both users exist - create transaction
    await db.insert(transactions).values({
      sender_id: sender.id,
      receiver_id: recipient.id,
      amount: String(command.amount),
      token: command.currency!,
      status: "confirmed",
    });

    const reply = `✅ Transaction of ${command.amount} ${command.currency} from @${sender.twitter_handle} to @${recipient.twitter_handle} recorded.`;

    if (!DRY_RUN) {
      await rwClient.v2.reply(reply, validTweet.id);
    } else {
      logger.info("DRY RUN - Would send reply", { message: reply });
    }

    logger.info("Transaction processed successfully", {
      tweetId: validTweet.id,
      amount: command.amount,
      currency: command.currency,
      sender: sender.twitter_handle,
      recipient: recipient.twitter_handle,
    });
  } catch (error) {
    logger.error("Failed to process transaction", error as Error, {
      tweetId: validTweet.id,
    });

    const errReply = `❌ Failed to process transaction. Please try again later.`;
    if (!DRY_RUN) await rwClient.v2.reply(errReply, validTweet.id);
  }
}
