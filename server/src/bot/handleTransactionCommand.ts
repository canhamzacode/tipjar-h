import { eq } from "drizzle-orm";
import { db } from "../db";
import { pending_tips, transactions, users } from "../db/schema";
import {
  getCachedUser,
  cacheUser,
  logger,
  findUserByTwitterHandle,
  processTransferRequest,
} from "../services";
import { rwClient, DRY_RUN } from "../utils/twitter";
import { Command } from "./parser";

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

export async function handleTransactionCommand(
  validTweet: {
    id: string;
    text: string;
    author_id: string;
  },
  command: Command,
) {
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

    if (!command.recipient) {
      const replyMessage = `❌ Please mention the recipient for the tip (e.g. @username).`;
      if (!DRY_RUN) {
        await rwClient.v2.reply(replyMessage, validTweet.id);
      } else {
        logger.info("DRY RUN - Would send missing recipient reply", {
          message: replyMessage,
        });
      }

      logger.warn("Transaction attempted without a recipient", {
        tweetId: validTweet.id,
        authorId: validTweet.author_id,
      });
      return;
    }

    // Use shared transfer service to create either a pending tip or a pending transaction
    const transferResult = await processTransferRequest({
      senderId: sender.id,
      receiverHandle: command.recipient,
      amount: Number(command.amount),
      token: command.currency,
      note: command.note,
    });

    if (transferResult.type === "pending") {
      const pendingReply = `✅ Tip of ${command.amount} ${command.currency} to @${command.recipient} saved! They'll receive it when they link their account. View your tips: ${process.env.APP_URL || "https://tipjar.app"}/dashboard`;

      if (!DRY_RUN) {
        await rwClient.v2.reply(pendingReply, validTweet.id);
      } else {
        logger.info("DRY RUN - Would send pending tip reply", {
          message: pendingReply,
        });
      }

      logger.info("Pending tip created via bot", {
        tweetId: validTweet.id,
        sender: sender.twitter_handle,
        recipient: command.recipient,
        amount: command.amount,
        currency: command.currency,
        pendingTipId: transferResult.pendingTipId,
      });

      return;
    }

    // Direct transfer created (pending on-chain signature). Reply with activity link so sender can complete signing in dashboard.
    const activityUrl = `${process.env.APP_URL || "https://tipjar.app"}/activity/${transferResult.transactionId}`;
    const reply = `✅ Tip of ${command.amount} ${command.currency} to @${command.recipient} created. To complete the transfer, sign it here: ${activityUrl}`;

    if (!DRY_RUN) {
      await rwClient.v2.reply(reply, validTweet.id);
    } else {
      logger.info("DRY RUN - Would send reply", { message: reply });
    }

    logger.info("Transaction created (awaiting signature)", {
      tweetId: validTweet.id,
      amount: command.amount,
      currency: command.currency,
      sender: sender.twitter_handle,
      recipient: command.recipient,
      transactionId: transferResult.transactionId,
    });
  } catch (error) {
    logger.error("Failed to process transaction", error as Error, {
      tweetId: validTweet.id,
    });

    const errReply = `❌ Failed to process transaction. Please try again later.`;
    if (!DRY_RUN) await rwClient.v2.reply(errReply, validTweet.id);
  }
}
