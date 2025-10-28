import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, pending_tips, transactions } from "../db/schema";
import { logger } from "./logger.service";

export const findUserById = async (id: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user || null;
  } catch (error) {
    logger.error(
      `Error finding user by id`,
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};

export const findUserByTwitterId = async (twitterId: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.twitter_id, String(twitterId)),
    });
    return user || null;
  } catch (error) {
    logger.error(
      `Error finding user by twitter_id`,
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};

export const findUserByTwitterHandle = async (handle: string) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.twitter_handle, handle),
    });
    return user || null;
  } catch (error) {
    logger.error(
      `Error finding user by twitter_handle`,
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};

interface UpsertUserArgs {
  twitterId: string;
  twitterHandle: string;
  name?: string | null;
  profileImageUrl?: string | null;
  description?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number | null;
}

export const upsertUserFromTwitter = async (args: UpsertUserArgs) => {
  const {
    twitterId,
    twitterHandle,
    name,
    profileImageUrl,
    description,
    accessToken,
    refreshToken,
    expiresIn,
  } = args;

  try {
    // Calculate token expiry
    const tokenExpiresAt =
      typeof expiresIn === "number" && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000)
        : null;

    // Check if user exists by twitter_id
    let user = await findUserByTwitterId(twitterId);

    if (user) {
      // Update existing user
      await db
        .update(users)
        .set({
          twitter_handle: twitterHandle,
          name: name ?? user.name,
          profile_image_url: profileImageUrl ?? user.profile_image_url,
          description: description ?? user.description,
          access_token: accessToken ?? user.access_token,
          refresh_token: refreshToken ?? user.refresh_token,
          token_expires_at: tokenExpiresAt ?? user.token_expires_at,
        })
        .where(eq(users.id, user.id));

      // Fetch updated user
      user = await findUserById(user.id);

      logger.info("User updated successfully", {
        userId: user?.id,
        twitterId,
        twitterHandle,
      });
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          twitter_id: twitterId,
          twitter_handle: twitterHandle,
          name: name ?? null,
          profile_image_url: profileImageUrl ?? null,
          description: description ?? null,
          access_token: accessToken ?? null,
          refresh_token: refreshToken ?? null,
          token_expires_at: tokenExpiresAt,
        })
        .returning();

      user = newUser;

      logger.info("New user created", {
        userId: user.id,
        twitterId,
        twitterHandle,
      });
    }

    return user;
  } catch (error) {
    logger.error(
      "Failed to upsert user",
      error instanceof Error ? error : new Error(String(error)),
      { twitterId, twitterHandle },
    );
    throw error;
  }
};

export const reconcilePendingTipsForHandle = async (
  twitterHandle: string,
  receiverId: string,
) => {
  try {
    const pendings = await db.query.pending_tips.findMany({
      where: eq(pending_tips.receiver_twitter, twitterHandle),
    });

    if (!pendings || pendings.length === 0) {
      logger.debug("No pending tips to reconcile", { twitterHandle });
      return 0;
    }

    logger.info("Reconciling pending tips", {
      twitterHandle,
      count: pendings.length,
    });

    let reconciledCount = 0;

    // Process each pending tip
    for (const pending of pendings) {
      try {
        // Create transaction
        await db.insert(transactions).values({
          sender_id: pending.sender_id,
          receiver_id: receiverId,
          token: pending.token,
          amount: pending.amount,
          status: "confirmed",
        });

        await db
          .update(pending_tips)
          .set({
            status: "confirmed",
            receiver_id: receiverId,
            reconciled_at: new Date(),
          })
          .where(eq(pending_tips.id, pending.id));

        reconciledCount++;

        logger.debug("Pending tip reconciled", {
          pendingId: pending.id,
          amount: pending.amount,
          token: pending.token,
        });
      } catch (error) {
        logger.error(
          "Failed to reconcile individual pending tip",
          error instanceof Error ? error : new Error(String(error)),
          { pendingId: pending.id },
        );
      }
    }

    logger.info("Pending tips reconciliation completed", {
      twitterHandle,
      total: pendings.length,
      reconciled: reconciledCount,
    });

    return reconciledCount;
  } catch (error) {
    logger.error(
      "Failed to reconcile pending tips",
      error instanceof Error ? error : new Error(String(error)),
      { twitterHandle, receiverId },
    );
    throw error;
  }
};
