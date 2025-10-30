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

export const getTransferById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  const transactionId = req.params.id;
  // Reconstruct unsigned transaction using stored metadata when possible.
  // If the transaction is already confirmed/failed, return the details with
  // `unsignedTransaction: null` so callers can handle already-processed txs.

  const transaction = await getTransactionById(transactionId);

  if (!transaction) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: "Transaction not found",
    });
  }

  try {
    const sender = transaction.sender_id
      ? await findUserById(transaction.sender_id)
      : null;
    const receiver = transaction.receiver_id
      ? await findUserById(transaction.receiver_id)
      : null;

    const baseResponse: any = {
      transactionId: transaction.id,
      status: transaction.status,
      txHash: transaction.tx_hash || null,
      amount: transaction.amount,
      token: transaction.token || "HBAR",
      note: transaction.note || null,
      created_at: transaction.created_at,
      counterparty: null,
    };

    // Only the original sender may fetch the unsigned transaction to sign
    if (transaction.sender_id !== req.user.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Unauthorized to view this transaction",
      });
    }

    // attach counterparty info for the UI: if requester is sender, counterparty is receiver and vice-versa
    try {
      const counterpartyUser =
        transaction.sender_id === req.user.userId ? receiver : sender;

      baseResponse.counterparty = counterpartyUser
        ? {
            id: counterpartyUser.id,
            twitter_handle: counterpartyUser.twitter_handle,
            name: counterpartyUser.name,
            profile_image_url: counterpartyUser.profile_image_url,
          }
        : null;
    } catch (err) {
      baseResponse.counterparty = null;
    }

    // If transaction is pending and both parties have wallet addresses,
    // attempt to build unsigned transaction. Otherwise return null for it.
    if (transaction.status === "pending") {
      if (!sender || !sender.wallet_address) {
        // sender missing wallet -> cannot build unsigned transaction
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            ...baseResponse,
            unsignedTransaction: null,
            message:
              "Sender wallet not connected; connect wallet to sign the transaction.",
          },
        });
      }

      if (!receiver || !receiver.wallet_address) {
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            ...baseResponse,
            unsignedTransaction: null,
            message:
              "Receiver wallet not available; cannot construct unsigned transaction.",
          },
        });
      }

      const amountNum = Number(transaction.amount);
      if (Number.isNaN(amountNum)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "Invalid transaction amount stored on server",
        });
      }

      const unsignedTransaction = await createUnsignedTransaction({
        senderAccountId: sender.wallet_address,
        receiverAccountId: receiver.wallet_address,
        amount: amountNum,
        token: transaction.token || "HBAR",
        memo: transaction.note || undefined,
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          ...baseResponse,
          unsignedTransaction,
        },
      });
    }

    // Not pending: already processed (confirmed/failed) - return details with null unsignedTransaction
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...baseResponse,
        unsignedTransaction: null,
      },
    });
  } catch (error) {
    logger.error("Failed to build unsigned transaction", error as Error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to construct unsigned transaction",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
