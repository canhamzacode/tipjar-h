import { TweetV2 } from "twitter-api-v2";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { mentions, transactions, users } from "../db/schema";
import { parseCommand } from "./parser";
import { rwClient, DRY_RUN } from "./twitter";
import { validateTweet } from "./validation";
import { logger } from "./logger";
import { getCachedUser, cacheUser } from "./cache";

// Helper function to get or create user with caching (no transactions)
const getOrCreateUserSimple = async (twitterHandle: string) => {
  // Check cache first
  let userResult = getCachedUser(twitterHandle);
  
  if (!userResult) {
    // Check database
    userResult = await db.query.users.findFirst({
      where: eq(users.twitter_handle, twitterHandle)
    });
    
    if (!userResult) {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({ twitter_handle: twitterHandle })
        .returning();
      userResult = newUser[0];
    }
    
    // Cache the result
    if (userResult) {
      cacheUser(twitterHandle, userResult);
    }
  }
  
  return userResult;
};

// Legacy function for transaction-based approach (kept for reference)
const getOrCreateUser = async (tx: any, twitterHandle: string) => {
  // Check cache first
  let userResult = getCachedUser(twitterHandle);
  
  if (!userResult) {
    // Check database
    userResult = await tx.query.users.findFirst({
      where: eq(users.twitter_handle, twitterHandle)
    });
    
    if (!userResult) {
      // Create new user
      const newUser = await tx
        .insert(users)
        .values({ twitter_handle: twitterHandle })
        .returning();
      userResult = newUser[0];
    }
    
    // Cache the result
    if (userResult) {
      cacheUser(twitterHandle, userResult);
    }
  }
  
  return userResult;
};

export const handleMentions = async (tweet: TweetV2): Promise<void> => {
  try {
    // Validate tweet data
    const tweetValidation = validateTweet(tweet);
    if (!tweetValidation.success) {
      logger.error('Invalid tweet data received', undefined, { 
        tweetId: tweet.id,
        errors: tweetValidation.error.issues 
      });
      return;
    }

    const validTweet = tweetValidation.data;
    logger.info('Processing mention', { 
      tweetId: validTweet.id, 
      author: validTweet.author_id 
    });

    // Check for duplicate processing
    const existing = await db.query.mentions.findFirst({
      where: eq(mentions.tweet_id, validTweet.id),
    });

    if (existing) {
      logger.debug('Mention already processed', { tweetId: validTweet.id });
      return;
    }

    // Insert mention record first
    await db.insert(mentions).values({
      tweet_id: validTweet.id,
      author_username: validTweet.author_id,
      text: validTweet.text,
    });

    const command = parseCommand(validTweet.text);
    logger.debug('Parsed command', { command, tweetId: validTweet.id });

    if (command.type === "send" && command.recipient && command.amount) {
      try {
        // Get or create sender with caching
        const senderResult = await getOrCreateUserSimple(validTweet.author_id);
        
        // Get or create recipient with caching
        const recipientResult = await getOrCreateUserSimple(command.recipient);

        // Ensure we have valid user IDs
        if (!senderResult?.id || !recipientResult?.id) {
          throw new Error('Failed to create or retrieve user records');
        }

        // Create transaction record
        await db.insert(transactions).values({
          sender_id: senderResult.id,
          receiver_id: recipientResult.id,
          amount: String(command.amount),
          token: command.currency!,
        });

        // Send success reply
        const replyMessage = `✅ Transaction of ${command.amount} ${command.currency} from @${validTweet.author_id} to @${command.recipient} recorded.`;
        
        if (!DRY_RUN) {
          await rwClient.v2.reply(replyMessage, validTweet.id);
        } else {
          logger.info('DRY RUN - Would send reply', { message: replyMessage });
        }

        logger.info('Transaction processed successfully', {
          tweetId: validTweet.id,
          amount: command.amount,
          currency: command.currency,
          sender: validTweet.author_id,
          recipient: command.recipient
        });

      } catch (error) {
        logger.error('Failed to process transaction', error as Error, { 
          tweetId: validTweet.id 
        });
        
        // Send error reply
        const errorMessage = `❌ Failed to process transaction. Please try again later.`;
        if (!DRY_RUN) {
          await rwClient.v2.reply(errorMessage, validTweet.id);
        } else {
          logger.info('DRY RUN - Would send error reply', { message: errorMessage });
        }
        // Don't re-throw - continue processing
      }
    } else {
      // Send help message for invalid commands
      const helpMessage = command.error 
        ? `❌ ${command.error}. Try: "send 5 HBAR @username"`
        : `❌ Could not understand your command. Try: "send 5 HBAR @username"`;
      
      if (!DRY_RUN) {
        await rwClient.v2.reply(helpMessage, validTweet.id);
      } else {
        logger.info('DRY RUN - Would send help reply', { message: helpMessage });
      }

      logger.info('Sent help message for invalid command', { 
        tweetId: validTweet.id,
        error: command.error 
      });
    }

    // Mark as processed
    await db
      .update(mentions)
      .set({ processed: 1 })
      .where(eq(mentions.tweet_id, validTweet.id));

  } catch (error) {
    logger.error('Failed to handle mention', error as Error, { 
      tweetId: tweet.id,
      authorId: tweet.author_id 
    });
    // Don't re-throw - we want to continue processing other mentions
  }
};
