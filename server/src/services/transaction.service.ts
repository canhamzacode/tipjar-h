import { db } from "../db";
import { transactions } from "../db/schema";
import { eq, or, desc } from "drizzle-orm";
import { findUserById } from "./user.service";
import { createUnsignedTransaction } from "./hedera.service";
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

    const results = await Promise.all(
      txs.map(async (t) => {
        const direction = t.sender_id === userId ? "sent" : "received";
        const counterpartyId =
          t.sender_id === userId ? t.receiver_id : t.sender_id;
        const counterparty = counterpartyId
          ? counterpartyMap.get(counterpartyId) || null
          : null;

        const base: any = {
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

        // If this is a 'sent' pending transaction, attempt to generate unsignedTransaction
        if (direction === "sent" && t.status === "pending") {
          try {
            const sender = t.sender_id ? await findUserById(t.sender_id) : null;
            const receiver = t.receiver_id
              ? await findUserById(t.receiver_id)
              : null;

            if (
              sender &&
              sender.wallet_address &&
              receiver &&
              receiver.wallet_address
            ) {
              const amountNum = Number(t.amount);
              if (!Number.isNaN(amountNum)) {
                const unsigned = await createUnsignedTransaction({
                  senderAccountId: sender.wallet_address,
                  receiverAccountId: receiver.wallet_address,
                  amount: amountNum,
                  token: t.token || "HBAR",
                  memo: t.note || undefined,
                });

                base.unsignedTransaction = unsigned;
              } else {
                base.unsignedTransaction = null;
              }
            } else {
              base.unsignedTransaction = null;
            }
          } catch (err) {
            logger.warn(
              "Failed to generate unsignedTransaction for listing",
              err as Error,
            );
            base.unsignedTransaction = null;
          }
        } else {
          base.unsignedTransaction = null;
        }

        return base;
      }),
    );

    return results;
  } catch (error) {
    logger.error(
      "Error fetching user transactions",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};
