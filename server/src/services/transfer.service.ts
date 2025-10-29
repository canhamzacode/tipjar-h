import { db } from "../db";
import { transactions, pending_tips, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger.service";

export interface TransferRequest {
  senderId: string;
  receiverHandle: string;
  amount: number;
  token?: string;
  note?: string;
}

export interface ReceiverValidationResult {
  type: "direct" | "pending";
  receiverId?: string;
  walletAddress?: string;
}

export interface TransferResult {
  type: "direct" | "pending";
  transactionId?: string;
  pendingTipId?: string;
  receiverWalletAddress?: string;
}

export async function validateReceiver(
  receiverHandle: string,
): Promise<ReceiverValidationResult> {
  logger.debug("Validating receiver", { receiverHandle });

  const receiver = await db
    .select()
    .from(users)
    .where(eq(users.twitter_handle, receiverHandle))
    .limit(1);

  if (receiver.length === 0) {
    logger.info("Receiver not found in system", { receiverHandle });
    return { type: "pending" };
  }

  const receiverUser = receiver[0];

  if (!receiverUser.wallet_address) {
    logger.info("Receiver exists but no wallet connected", {
      receiverHandle,
      receiverId: receiverUser.id,
    });
    return {
      type: "pending",
      receiverId: receiverUser.id,
    };
  }

  logger.info("Receiver has wallet, direct transfer possible", {
    receiverHandle,
    receiverId: receiverUser.id,
    walletAddress: receiverUser.wallet_address,
  });

  return {
    type: "direct",
    receiverId: receiverUser.id,
    walletAddress: receiverUser.wallet_address,
  };
}

export async function createPendingTip(
  transferRequest: TransferRequest,
): Promise<string> {
  logger.info("Creating pending tip", transferRequest);

  const receiverValidation = await validateReceiver(
    transferRequest.receiverHandle,
  );

  const [pendingTip] = await db
    .insert(pending_tips)
    .values({
      sender_id: transferRequest.senderId,
      receiver_id: receiverValidation.receiverId || null,
      receiver_twitter: transferRequest.receiverHandle,
      amount: transferRequest.amount.toString(),
      token: transferRequest.token || "HBAR",
      // store optional note (nullable)
      note: transferRequest.note ?? null,
      status: "pending",
    })
    .returning();

  logger.info("Pending tip created", {
    pendingTipId: pendingTip.id,
    receiverHandle: transferRequest.receiverHandle,
  });

  return pendingTip.id;
}

export async function createDirectTransaction(
  transferRequest: TransferRequest,
  receiverId: string,
): Promise<string> {
  logger.info("Creating direct transaction", {
    ...transferRequest,
    receiverId,
  });

  const [transaction] = await db
    .insert(transactions)
    .values({
      sender_id: transferRequest.senderId,
      receiver_id: receiverId,
      token: transferRequest.token || "HBAR",
      amount: transferRequest.amount.toString(),
      // store optional note (nullable)
      note: transferRequest.note ?? null,
      status: "pending",
    })
    .returning();

  logger.info("Direct transaction created", {
    transactionId: transaction.id,
  });

  return transaction.id;
}

export async function processTransferRequest(
  transferRequest: TransferRequest,
): Promise<TransferResult> {
  logger.info("Processing transfer request", transferRequest);

  const receiverValidation = await validateReceiver(
    transferRequest.receiverHandle,
  );

  if (receiverValidation.type === "pending") {
    // TODO: Amount should be stored somewhere to make it easy to disburse to the user when they sign up.
    const pendingTipId = await createPendingTip(transferRequest);

    return {
      type: "pending",
      pendingTipId,
    };
  } else {
    const transactionId = await createDirectTransaction(
      transferRequest,
      receiverValidation.receiverId!,
    );

    return {
      type: "direct",
      transactionId,
      receiverWalletAddress: receiverValidation.walletAddress,
    };
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: "confirmed" | "failed",
  txHash?: string,
): Promise<void> {
  logger.info("Updating transaction status", { transactionId, status, txHash });

  await db
    .update(transactions)
    .set({
      status,
      tx_hash: txHash || null,
    })
    .where(eq(transactions.id, transactionId));

  logger.info("Transaction status updated", { transactionId, status });
}

/**
 * Gets transaction by ID
 */
export async function getTransactionById(transactionId: string) {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  return transaction || null;
}
