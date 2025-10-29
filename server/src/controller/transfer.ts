import { Request, Response } from "express";
import { HTTP_STATUS } from "../lib";
import {
  findUserById,
  logger,
  processTransferRequest,
  createUnsignedTransaction,
  getTransactionById,
  updateTransactionStatus,
  submitSignedTransaction,
} from "../services";

export const initiateTransfer = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  const { receiverHandle, amount, token, note } = req.body;

  const sender = await findUserById(req.user.userId);
  if (!sender) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: "Sender not found",
    });
  }

  if (!sender.wallet_address) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: "Please connect your wallet first",
    });
  }

  const transferResult = await processTransferRequest({
    senderId: sender.id,
    receiverHandle,
    amount,
    token,
    note,
  });

  // Case 1: Receiver doesn't have wallet - create pending tip
  if (transferResult.type === "pending") {
    logger.info("Transfer created as pending tip", {
      pendingTipId: transferResult.pendingTipId,
      receiverHandle,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      type: "pending",
      data: {
        pendingTipId: transferResult.pendingTipId,
        message: `Tip created for @${receiverHandle}. They will be notified to connect their wallet.`,
      },
    });
  }

  // include note in memo but truncate to avoid exceeding memo size limits
  const memoNote = note
    ? note.length > 80
      ? `${note.slice(0, 77)}...`
      : note
    : "";

  const unsignedTransaction = await createUnsignedTransaction({
    senderAccountId: sender.wallet_address,
    receiverAccountId: transferResult.receiverWalletAddress!,
    amount,
    token: token || "HBAR",
    memo: `TipJar: @${sender.name} → @${receiverHandle}${memoNote ? ` — ${memoNote}` : ""}`,
  });

  logger.info("Direct transfer initiated - awaiting signature", {
    transactionId: transferResult.transactionId,
    sender: sender.wallet_address,
    receiver: transferResult.receiverWalletAddress,
    amount,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    type: "direct",
    data: {
      transactionId: transferResult.transactionId,
      ...unsignedTransaction,
    },
  });
};

export const completeTransfer = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  const { transactionId, signedTransactionBytes } = req.body;

  if (!transactionId || !signedTransactionBytes) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message:
        "Missing required fields: transactionId and signedTransactionBytes",
    });
  }

  const transaction = await getTransactionById(transactionId);

  if (!transaction) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: "Transaction not found",
    });
  }

  if (transaction.sender_id !== req.user.userId) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: "Unauthorized to complete this transaction",
    });
  }

  if (transaction.status !== "pending") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: `Transaction is not pending (current status: ${transaction.status})`,
    });
  }

  try {
    const txHash = await submitSignedTransaction(
      signedTransactionBytes,
      transactionId,
    );

    await updateTransactionStatus(transactionId, "confirmed", txHash);

    logger.info("Transfer completed successfully", {
      transactionId,
      txHash,
      sender: transaction.sender_id,
      receiver: transaction.receiver_id,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        transactionId,
        txHash,
        status: "confirmed",
        explorerUrl: `https://hashscan.io/testnet/transaction/${txHash}`,
      },
    });
  } catch (error) {
    logger.error("Failed to submit transaction to Hedera", error as Error);

    await updateTransactionStatus(transactionId, "failed");

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to submit transaction to Hedera network",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const tokenTransfer = initiateTransfer;
