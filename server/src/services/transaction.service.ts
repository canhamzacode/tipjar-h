import { db } from "../db";
import { transactions } from "../db/schema";
import { eq, or, desc } from "drizzle-orm";
import { findUserById } from "./user.service";
import { logger } from "./logger.service";

export const getUserTransactions = async (userId: string) => {
  try {
    const txs = await db.query.transactions.findMany({
      where: or(
        eq(transactions.sender_id, userId),
        eq(transactions.receiver_id, userId),
      ),
      orderBy: [desc(transactions.created_at)],
    });

    // gather unique counterparty ids
    const counterpartyIds = Array.from(
      new Set(
        txs
          .map((t) => (t.sender_id === userId ? t.receiver_id : t.sender_id))
          .filter(Boolean),
      ),
    );

    const counterpartyMap = new Map<string, any>();
    await Promise.all(
      counterpartyIds.map(async (id) => {
        if (!id) return;
        const u = await findUserById(id);
        if (u) counterpartyMap.set(id, u);
      }),
    );

    const results = txs.map((t) => {
      const direction = t.sender_id === userId ? "sent" : "received";
      const counterpartyId =
        t.sender_id === userId ? t.receiver_id : t.sender_id;
      const counterparty = counterpartyId
        ? counterpartyMap.get(counterpartyId) || null
        : null;
      return {
        id: t.id,
        direction,
        amount: t.amount,
        token: t.token,
        tx_hash: t.tx_hash,
        status: t.status,
        created_at: t.created_at,
        note: t.note,
        counterparty: counterparty
          ? {
              id: counterparty.id,
              twitter_handle: counterparty.twitter_handle,
              name: counterparty.name,
              profile_image_url: counterparty.profile_image_url,
            }
          : null,
      };
    });

    return results;
  } catch (error) {
    logger.error(
      "Error fetching user transactions",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};
